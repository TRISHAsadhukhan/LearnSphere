import strict from "assert/strict";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000';

function getHeaders(isMultipart = false): HeadersInit {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function request(path: string, options: RequestInit = {}): Promise<any> {
  const isMultipart = options.body instanceof FormData;
  const headers = { ...getHeaders(isMultipart), ...options.headers };
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'API Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch (_) {}
    throw new Error(errorDetail);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch (_) {
    return null;
  }
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────
  register: async (name: string, email: string, password: string) => {
    return request('/user/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  login: async (email: string, password: string) => {
    const data = await request('/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data && data.Token) {
      localStorage.setItem('token', data.Token);
    }
    return data;
  },

  getCurrentUser: async () => {
    return request('/user/is_auth');
  },

  changePassword: async (newPassword: string) => {
    return request('/user/ch_pw', {
      method: 'PUT',
      body: JSON.stringify({ password: newPassword }),
    });
  },

  forgotPassword: async (email: string) => {
    return request('/user/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyOtp: async (otp: string, tempToken: string) => {
    return request('/user/verify-otp', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tempToken}` },
      body: JSON.stringify({ otp }),
    });
  },

  resetPassword: async (newPassword: string, verifiedToken: string) => {
    return request('/user/reset-password', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${verifiedToken}` },
      body: JSON.stringify({ password: newPassword }),
    });
  },

  // ── Classroom ─────────────────────────────────────────────────
  createClassroom: async (name: string, subject: string) => {
    return request('/classroom/create', {
      method: 'POST',
      body: JSON.stringify({ class_name: name, title: subject }),
    });
  },

  editClassroom: async (classId: string, name: string, subject: string) => {
    return request(`/classroom/edit/${parseInt(classId, 10)}`, {
      method: 'PUT',
      body: JSON.stringify({ class_name: name, title: subject }),
    });
  },

  getCreatedClassrooms: async () => {
    return request('/classroom/all_created_classes');
  },

  getJoinedClassrooms: async () => {
    return request('/classroom/member/all_joined_classes');
  },

  joinClassroom: async (roomKey: string) => {
    return request('/classroom/member/join', {
      method: 'POST',
      body: JSON.stringify({ room_key: roomKey }),
    });
  },

  leaveClassroom: async (classId: string) => {
    return request(`/classroom/member/leave/${parseInt(classId, 10)}`, {
      method: 'DELETE',
    });
  },

  deleteClassroom: async (classId: string) => {
    return request(`/classroom/delete/${parseInt(classId, 10)}`, {
      method: 'DELETE',
    });
  },
 
  regenerateRoomKey: async (classId: string) => {
  return request(`/classroom/regen-key/${parseInt(classId, 10)}`, {
    method: 'PATCH',
  });
},

  kickClassroomMember: async (classId: string, userId: string) => {
    return request(`/classroom/${parseInt(classId, 10)}/manage/members/${parseInt(userId, 10)}`, {
      method: 'DELETE',
    });
  },

  getMemberScores: async (classId: string, userId: string) => {
    return request(`/classroom/${parseInt(classId, 10)}/manage/members/${parseInt(userId, 10)}/scores`);
  },

  // ── Notices ───────────────────────────────────────────────────
  getNotices: async (classId: string) => {
    return request(`/notice/${parseInt(classId, 10)}/all_notices`);
  },

  createNotice: async (classId: string, content: string) => {
    return request(`/notice/${parseInt(classId, 10)}/create`, {
      method: 'POST',
      body: JSON.stringify({
        title: content.substring(0, 30) || 'Notice',
        description: content,
      }),
    });
  },

  deleteNotice: async (noticeId: string) => {
    return request(`/notice/delete/${parseInt(noticeId, 10)}`, {
      method: 'DELETE',
    });
  },

  reactToNotice: async (noticeId: string, reactionType: 'like' | 'dislike') => {
    return request(`/notice/${parseInt(noticeId, 10)}/reaction`, {
      method: 'POST',
      body: JSON.stringify({ reaction_type: reactionType }),
    });
  },

  editNotice: async (noticeId: string, content: string) => {
    return request(`/notice/edit/${parseInt(noticeId, 10)}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: content.substring(0, 30) || 'Notice',
        description: content,
      }),
    });
  },

  // ── Materials ─────────────────────────────────────────────────
  getMaterials: async (classId: string) => {
    // Returns { total, materials: [...] }
    return request(`/classroom/${parseInt(classId, 10)}/materials`);
  },

  uploadMaterial: async (classId: string, file: File, title: string, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (description) formData.append('description', description);
    return request(`/classroom/${parseInt(classId, 10)}/materials`, {
      method: 'POST',
      body: formData,
    });
  },

  deleteMaterial: async (classId: string, materialId: string | number) => {
    const id = typeof materialId === 'string' ? parseInt(materialId, 10) : materialId;
    if (isNaN(id)) throw new Error('Invalid material ID');
    return request(`/classroom/${parseInt(classId, 10)}/materials/${id}`, {
      method: 'DELETE',
    });
  },

  // Get fresh download URL for a single material
  getMaterialDownloadUrl: async (classId: string, materialId: string | number) => {
    const id = typeof materialId === 'string' ? parseInt(materialId, 10) : materialId;
    return request(`/classroom/${parseInt(classId, 10)}/materials/${id}`);
  },

  // ── Exams ─────────────────────────────────────────────────────
  getExams: async (classId: string) => {
    return request(`/classroom/${parseInt(classId, 10)}/exams`);
  },

  createExam: async (classId: string, examData: any) => {
    return request(`/classroom/${parseInt(classId, 10)}/exams`, {
      method: 'POST',
      body: JSON.stringify(examData),
    });
  },

  getExamDetail: async (classId: string, examId: string) => {
    return request(`/classroom/${parseInt(classId, 10)}/exams/${parseInt(examId, 10)}`);
  },

  submitExam: async (classId: string, examId: string, answers: any) => {
    return request(`/classroom/${parseInt(classId, 10)}/exams/${parseInt(examId, 10)}/submit`, {
      method: 'POST',
      body: JSON.stringify(answers),
    });
  },

  getMyExamResult: async (classId: string, examId: string) => {
    return request(`/classroom/${parseInt(classId, 10)}/exams/${parseInt(examId, 10)}/my-result`);
  },

  getExamResults: async (classId: string, examId: string) => {
    return request(`/classroom/${parseInt(classId, 10)}/exams/${parseInt(examId, 10)}/results`);
  },

  getCreatorExamHistory: async (classId: string) => {
    return request(`/classroom/${parseInt(classId, 10)}/exams/history`);
  },

  getMemberExamHistory: async (classId: string) => {
    return request(`/classroom/${parseInt(classId, 10)}/exams-history`);
  },

  // ── Assignments ───────────────────────────────────────────────
  getAssignments: async (classId: string) => {
    // Returns { total, assignments: [...] }
    return request(`/classroom/${parseInt(classId, 10)}/assignments`);
  },

  createAssignment: async (
    classId: string,
    file: File,
    title: string,
    description: string,
    startTime: string,
    endTime: string,
    total_marks: Number
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (description) formData.append('description', description);
    formData.append('start_time', startTime);
    formData.append('end_time', endTime);
    formData.append("total_marks",String(total_marks));
    return request(`/classroom/${parseInt(classId, 10)}/assignments`, {
      method: 'POST',
      body: formData,
    });
  },

  submitAssignment: async (classId: string, assignmentId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request(
      `/classroom/${parseInt(classId, 10)}/assignments/${parseInt(assignmentId, 10)}/submit`,
      { method: 'POST', body: formData },
    );
  },

  getMyAssignmentSubmission: async (classId: string, assignmentId: string) => {
    return request(
      `/classroom/${parseInt(classId, 10)}/assignments/${parseInt(assignmentId, 10)}/my-submission`,
    );
  },

  getAssignmentSubmissions: async (classId: string, assignmentId: string) => {
    return request(
      `/classroom/${parseInt(classId, 10)}/assignments/${parseInt(assignmentId, 10)}/submissions`,
    );
  },

  gradeSubmission: async (
    classId: string,
    assignmentId: string,
    submissionId: string,
    marks: number,
  ) => {
    return request(
      `/classroom/${parseInt(classId, 10)}/assignments/${parseInt(assignmentId, 10)}/submissions/${parseInt(submissionId, 10)}/marks`,
      { method: 'PATCH', body: JSON.stringify({ marks }) },
    );
  },

  // ── Manage ────────────────────────────────────────────────────
  getClassroomMembers: async (classId: string) => {
    return request(`/classroom/${parseInt(classId, 10)}/manage/members`);
  },

  kickClassroomMember: async (classId: string, userId: string) => {
    return request(
      `/classroom/${parseInt(classId, 10)}/manage/members/${parseInt(userId, 10)}`,
      { method: 'DELETE' },
    );
  },

  getMemberScores: async (classId: string, userId: string) => {
    return request(
      `/classroom/${parseInt(classId, 10)}/manage/members/${parseInt(userId, 10)}/scores`,
    );
  },

  getMyScores: async (classId: string) => {
    return request(`/classroom/${parseInt(classId, 10)}/my-scores`);
  },

  deleteExam: async (classId: string, examId: string) =>
  request(`/classroom/${parseInt(classId, 10)}/exams/${parseInt(examId, 10)}`, { method: 'DELETE' }),

deleteAssignment: async (classId: string, assignmentId: string) =>
  request(`/classroom/${parseInt(classId, 10)}/assignments/${parseInt(assignmentId, 10)}`, { method: 'DELETE' }),

downloadFileAsBlob: async (url: string, fileName: string): Promise<void> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Download failed');
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl; a.download = fileName;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
},
  
};


