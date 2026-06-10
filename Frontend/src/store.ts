import { create } from 'zustand';
import {
  User, Classroom, Material, Exam, Question, ExamSubmission,
  Assignment, AssignmentSubmission, Notice, Notification, Toast
} from './types';
import { api } from './api';

const COLORS = ['#0F8B8D', '#EC9A29', '#A8201A', '#143642'];
const generateId = () => Math.random().toString(36).substring(2, 9).toUpperCase();

interface AppState {
  currentUser: User | null;
  classrooms: Classroom[];
  materials: Material[];
  exams: Exam[];
  examSubmissions: ExamSubmission[];
  assignments: Assignment[];
  assignmentSubmissions: AssignmentSubmission[];
  notices: Notice[];
  notifications: Notification[];
  toasts: Toast[];
  examHistory: any[];
  memberExamHistory: any[];
  assignmentSubmissionsList: any[];
  classroomMembers: any[];
  myScores: any | null;
  

  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;

  initAuth: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<string | null>;
  verifyOtp: (otp: string, tempToken: string) => Promise<string | null>;
  resetPassword: (newPassword: string, verifiedToken: string) => Promise<boolean>;

  createClassroom: (name: string, subject: string, description: string) => Promise<Classroom>;
  editClassroom: (classId: string, name: string, subject: string) => Promise<boolean>;
  regenerateRoomKey: (classId: string) => Promise<void>;
  joinClassroom: (roomKey: string) => Promise<boolean>;
  leaveClassroom: (classId: string) => Promise<void>;
  deleteClassroom: (classId: string) => Promise<void>;

  fetchMaterials: (classId: string) => Promise<void>;
  uploadMaterial: (classId: string, file: File, title: string, description?: string) => Promise<void>;
  deleteMaterial: (classId: string, materialId: string) => Promise<void>;
  downloadMaterial: (classId: string, materialId: string, fileName: string) => Promise<void>;

  fetchExams: (classId: string) => Promise<void>;
  fetchExamDetail: (classId: string, examId: string) => Promise<Exam | null>;
  fetchCreatorExamHistory: (classId: string) => Promise<void>;
  fetchMemberExamHistory: (classId: string) => Promise<void>;
  createExam: (classId: string, exam: Omit<Exam, 'id' | 'submissionsCount'>) => Promise<void>;
  submitExam: (classId: string, examId: string, answers: Record<string, string | number>) => Promise<void>;
  // deleteExam: (examId: string) => void;
  deleteExam: (classId: string, examId: string) => Promise<void>;
  fetchMyExamResult: (classId: string, examId: string) => Promise<any>;


  fetchAssignments: (classId: string) => Promise<void>;
  createAssignment: (classId: string, assignment: Omit<Assignment, 'id' | 'submissionsCount'>, file: File) => Promise<void>;
  submitAssignment: (classId: string, assignmentId: string, file: File) => Promise<void>;
  fetchAssignmentSubmissions: (classId: string, assignmentId: string) => Promise<void>;
  gradeAssignmentSubmission: (classId: string, assignmentId: string, submissionId: string, marks: number) => Promise<boolean>;
  getMyAssignmentSubmission: (classId: string, assignmentId: string) => Promise<any>;
  // deleteAssignment: (assignmentId: string) => void;
  deleteAssignment: (classId: string, assignmentId: string) => Promise<void>;


  fetchNotices: (classId: string) => Promise<void>;
  postNotice: (classId: string, content: string) => Promise<void>;
  editNotice: (noticeId: string, content: string) => Promise<boolean>;
  deleteNotice: (noticeId: string) => Promise<void>;
  toggleNoticeReaction: (noticeId: string, reactionType: 'like' | 'dislike', classId: string) => Promise<void>;

  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  fetchClassroomMembers: (classId: string) => Promise<void>;
  kickClassroomMember: (classId: string, userId: string) => Promise<void>;
  fetchMyScores: (classId: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  classrooms: [],
  materials: [],
  exams: [],
  examSubmissions: [],
  assignments: [],
  assignmentSubmissions: [],
  notices: [],
  notifications: [],
  toasts: [],
  examHistory: [],
  memberExamHistory: [],
  assignmentSubmissionsList: [],
  classroomMembers: [],
  myScores: null,

  // ── Toast ──────────────────────────────────────────────────────
  addToast: (message, type = 'success') => {
    const id = generateId();
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4500);
  },
  removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),

  // ── Auth ───────────────────────────────────────────────────────
  initAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const userRes = await api.getCurrentUser();
      const [createdClasses, joinedClasses] = await Promise.all([
        api.getCreatedClassrooms(),
        api.getJoinedClassrooms(),
      ]);

      const createdIds = (createdClasses || []).map((c: any) => String(c.class_id));
      const joinedIds  = (joinedClasses  || []).map((c: any) => String(c.class_id));

      const cleanUser: User = {
        id: String(userRes.u_id),
        name: userRes.name,
        email: userRes.email,
        role: 'teacher',
        joinedClasses: joinedIds,
        createdClasses: createdIds,
      };

      const mappedClassrooms: Classroom[] = [
        ...(createdClasses || []).map((c: any, i: number) => ({
          id: String(c.class_id),
          name: c.class_name,
          subject: c.title,
          description: '',
          roomKey: c.room_key,
          creatorId: String(c.creator_id),
          creatorName: userRes.name,
          creatorAvatarInitial: userRes.name[0],
          membersCount: 1,
          createdAt: new Date().toISOString(),
          color: COLORS[i % COLORS.length],
        })),
        ...(joinedClasses || []).map((c: any, i: number) => ({
          id: String(c.class_id),
          name: c.class_name,
          subject: c.title,
          description: '',
          roomKey: c.room_key,
          creatorId: String(c.creator_id),
          creatorName: c.creator_name || 'Instructor',
          creatorAvatarInitial: (c.creator_name || 'I')[0],
          membersCount: 1,
          createdAt: new Date().toISOString(),
          color: COLORS[(i + 2) % COLORS.length],
        })),
      ];

      set({ currentUser: cleanUser, classrooms: mappedClassrooms });
      return true;
    } catch {
      localStorage.removeItem('token');
      return false;
    }
  },

  login: async (email, password) => {
    try {
      const data = await api.login(email, password);
      if (data?.Token) {
        await get().initAuth();
        return true;
      }
      return false;
    } catch (e: any) {
      get().addToast(e.message || 'Login failed', 'error');
      return false;
    }
  },

  signup: async (name, email, password) => {
    try {
      await api.register(name, email, password);
      await get().login(email, password);
    } catch (e: any) {
      get().addToast(e.message || 'Signup failed', 'error');
      throw e;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ currentUser: null, classrooms: [], notices: [], materials: [], exams: [], assignments: [] });
  },

  changePassword: async (newPassword) => {
    try {
      await api.changePassword(newPassword);
      get().addToast('Password changed successfully', 'success');
      return true;
    } catch (e: any) {
      get().addToast(e.message || 'Failed to change password', 'error');
      return false;
    }
  },

  forgotPassword: async (email) => {
    try {
      const res = await api.forgotPassword(email);
      get().addToast('OTP sent to your email', 'success');
      return res?.temp_token || null;
    } catch (e: any) {
      get().addToast(e.message || 'Failed to send OTP', 'error');
      return null;
    }
  },

  verifyOtp: async (otp, tempToken) => {
    try {
      const res = await api.verifyOtp(otp, tempToken);
      get().addToast('OTP verified', 'success');
      return res?.verified_token || null;
    } catch (e: any) {
      get().addToast(e.message || 'Invalid OTP', 'error');
      return null;
    }
  },

  resetPassword: async (newPassword, verifiedToken) => {
    try {
      await api.resetPassword(newPassword, verifiedToken);
      get().addToast('Password reset successfully', 'success');
      return true;
    } catch (e: any) {
      get().addToast(e.message || 'Reset failed', 'error');
      return false;
    }
  },

  // ── Classroom ──────────────────────────────────────────────────
  createClassroom: async (name, subject, description) => {
    try {
      const c = await api.createClassroom(name, subject);
      await get().initAuth();
      return {
        id: String(c.class_id), name: c.class_name, subject: c.title,
        description, roomKey: c.room_key, creatorId: String(c.creator_id),
        creatorName: get().currentUser?.name || 'You',
        creatorAvatarInitial: (get().currentUser?.name || 'Y')[0],
        membersCount: 1, createdAt: new Date().toISOString(), color: COLORS[0],
      };
    } catch (e: any) {
      get().addToast(e.message || 'Create classroom failed', 'error');
      throw e;
    }
  },

  editClassroom: async (classId, name, subject) => {
    try {
      await api.editClassroom(classId, name, subject);
      await get().initAuth();
      get().addToast('Classroom updated', 'success');
      return true;
    } catch (e: any) {
      get().addToast(e.message || 'Update failed', 'error');
      return false;
    }
  },

  regenerateRoomKey: async (classId) => {
    try {
      await api.regenerateRoomKey(classId);
      await get().initAuth();   // refresh so new key shows in sidebar instantly
      get().addToast('Room key regenerated successfully!', 'success');
    } catch (e: any) {
      get().addToast(e.message || 'Failed to regenerate room key', 'error');
    }
  },

  joinClassroom: async (roomKey) => {
    try {
      await api.joinClassroom(roomKey);
      await get().initAuth();
      return true;
    } catch (e: any) {
      get().addToast(e.message || 'Join failed', 'error');
      return false;
    }
  },

  leaveClassroom: async (classId) => {
    try {
      await api.leaveClassroom(classId);
      await get().initAuth();
    } catch (e: any) {
      get().addToast(e.message || 'Leave failed', 'error');
    }
  },

  deleteClassroom: async (classId) => {
    try {
      await api.deleteClassroom(classId);
      await get().initAuth();
    } catch (e: any) {
      get().addToast(e.message || 'Delete failed', 'error');
    }
  },

  // ── Materials ──────────────────────────────────────────────────
  fetchMaterials: async (classId) => {
    try {
      const res = await api.getMaterials(classId);
      const mats = res?.materials || [];
      const mapped: Material[] = mats.map((m: any) => ({
        id: String(m.id),
        classId,
        name: m.file_name,
        title: m.title,
        type: m.file_type || 'pdf',
        uploadedBy: m.uploader?.name || 'Instructor',
        uploadedAt: m.uploaded_at || new Date().toISOString(),
        size: m.file_size ? (m.file_size / (1024 * 1024)).toFixed(1) + ' MB' : '—',
        downloadUrl: m.download_url || null,
      }));
      set({ materials: mapped });
    } catch {
      set({ materials: [] });
    }
  },

  uploadMaterial: async (classId, file, title, description) => {
    try {
      await api.uploadMaterial(classId, file, title, description);
      await get().fetchMaterials(classId);
      get().addToast('Material uploaded successfully!', 'success');
    } catch (e: any) {
      get().addToast(e.message || 'Upload failed', 'error');
      throw e;
    }
  },

  deleteMaterial: async (classId, materialId) => {
    try {
      await api.deleteMaterial(classId, materialId);
      await get().fetchMaterials(classId);
      get().addToast('Material deleted', 'success');
    } catch (e: any) {
      get().addToast(e.message || 'Delete failed', 'error');
    }
  },

  downloadMaterial: async (classId, materialId, fileName) => {
  try {
    const res = await api.getMaterialDownloadUrl(classId, materialId);
    const url = res?.download_url;
    if (!url) throw new Error('No download URL');
    await api.downloadFileAsBlob(url, fileName);
  } catch (e: any) {
    get().addToast(e.message || 'Download failed', 'error');
  }
},

  // ── Exams ──────────────────────────────────────────────────────
  fetchExams: async (classId) => {
    try {
      const exams = await api.getExams(classId);
      const mapped = (exams || []).map((ex: any) => ({
        id: String(ex.id),
        classId,
        title: ex.title,
        description: ex.description || '',
        startTime: ex.start_time ? (ex.start_time.endsWith('Z') ? ex.start_time : ex.start_time + 'Z') : '',
        endTime: ex.end_time ? (ex.end_time.endsWith('Z') ? ex.end_time : ex.end_time + 'Z') : '',
        questions: [],
        totalMarks: ex.total_questions || 0,
        submissionsCount: 0,
      }));
      set({ exams: mapped });
    } catch {
      set({ exams: [] });
    }
  },

  fetchExamDetail: async (classId, examId) => {
    try {
      const ex = await api.getExamDetail(classId, examId);
      const mapped: Exam = {
        id: String(ex.id),
        classId,
        title: ex.title,
        description: ex.description || '',
        startTime: ex.start_time ? (ex.start_time.endsWith('Z') ? ex.start_time : ex.start_time + 'Z') : '',
        endTime: ex.end_time ? (ex.end_time.endsWith('Z') ? ex.end_time : ex.end_time + 'Z') : '',
        totalMarks: ex.total_questions || 0,
        submissionsCount: 0,
        questions: (ex.questions || []).map((q: any) => ({
          id: String(q.id),
          text: q.question_text,
          options: [q.option_a, q.option_b, q.option_c, q.option_d],
          correctOption: -1,
          marks: 1,
        })),
      };
      set(state => ({
        exams: state.exams.some(e => e.id === examId)
          ? state.exams.map(e => e.id === examId ? mapped : e)
          : [...state.exams, mapped],
      }));
      return mapped;
    } catch (e: any) {
      get().addToast(e.message || 'Failed to load exam', 'error');
      return null;
    }
  },

  fetchCreatorExamHistory: async (classId) => {
    try {
      const res = await api.getCreatorExamHistory(classId);
      set({ examHistory: res || [] });
    } catch {
      set({ examHistory: [] });
    }
  },

  fetchMemberExamHistory: async (classId) => {
    try {
      const res = await api.getMemberExamHistory(classId);
      set({ memberExamHistory: res || [] });
    } catch {
      set({ memberExamHistory: [] });
    }
  },

  createExam: async (classId, exam) => {
    try {
      const examData = {
        title: exam.title,
        description: exam.description,
        start_time: exam.startTime.replace('.000Z', '').replace('Z', ''),
        end_time: exam.endTime.replace('.000Z', '').replace('Z', ''),
        questions: exam.questions.map((q: Question) => ({
          question_text: q.text,
          option_a: q.options[0],
          option_b: q.options[1],
          option_c: q.options[2],
          option_d: q.options[3],
          correct_option: ['A', 'B', 'C', 'D'][q.correctOption],
        })),
      };
      await api.createExam(classId, examData);
      await get().fetchExams(classId);
      get().addToast('Exam created successfully!', 'success');
    } catch (e: any) {
      get().addToast(e.message || 'Create exam failed', 'error');
      throw e;
    }
  },

  deleteExam: async (classId, examId) => {
  try {
    await api.deleteExam(classId, examId);
    set(state => ({ exams: state.exams.filter(e => e.id !== examId) }));
    get().addToast('Exam deleted', 'success');
  } catch (e: any) { get().addToast(e.message || 'Delete exam failed', 'error'); }
},

 submitExam: async (classId, examId, answers) => {
  try {
    const body = {
      answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
        question_id: parseInt(questionId, 10),
        selected_option: selectedOption,
      })),
    };
      await api.submitExam(classId, examId, body);
      set(state => ({
        examSubmissions: [
          ...state.examSubmissions,
          {
            id: generateId(),
            examId,
            studentId: get().currentUser?.id || '',
            studentName: get().currentUser?.name || '',
            studentEmail: get().currentUser?.email || '',
            answers: answers as any,
            score: 0,
            percentage: 0,
            submittedAt: new Date().toISOString(),
          }
        ]
      }));
    } catch (e: any) {
      get().addToast(e.message || 'Submit exam failed', 'error');
      throw e;
    }
  },

  fetchMyExamResult: async (classId, examId) => {
    try {
      const res = await api.getMyExamResult(classId, examId);
      
      const answersMap: Record<string, number> = {};
      res.answers.forEach((ans: any) => {
        answersMap[String(ans.question_id)] = ['A', 'B', 'C', 'D'].indexOf(ans.selected_option);
      });

      set(state => {
        const existingIdx = state.examSubmissions.findIndex(s => s.examId === examId && s.studentId === state.currentUser?.id);
        const newSub = {
          id: String(res.attempt_id),
          examId,
          studentId: state.currentUser?.id || '',
          studentName: state.currentUser?.name || '',
          studentEmail: state.currentUser?.email || '',
          answers: answersMap as any,
          score: res.score || 0,
          percentage: res.total ? Math.round(((res.score || 0) / res.total) * 100) : 0,
          submittedAt: res.submitted_at,
        };
        const subs = [...state.examSubmissions];
        if (existingIdx !== -1) subs[existingIdx] = newSub;
        else subs.push(newSub);

        // Populate correctOption in exams list for review sheet
        const examsList = state.exams.map(e => {
          if (e.id === examId) {
            return {
              ...e,
              questions: e.questions.map(q => {
                const ansObj = res.answers.find((a: any) => String(a.question_id) === q.id);
                return {
                  ...q,
                  correctOption: ansObj ? ['A', 'B', 'C', 'D'].indexOf(ansObj.correct_option) : -1
                };
              })
            };
          }
          return e;
        });

        return { examSubmissions: subs, exams: examsList };
      });
      return res;
    } catch {
      return null;
    }
  },

  fetchExamResults: async (classId, examId) => {
    try {
      const res = await api.getExamResults(classId, examId);
      // res is ExamResultsSummaryDTO: { results: [{user_id, name, score, total, attempted...}] }
      set(state => {
        const subs = [...state.examSubmissions];
        res.results.forEach((r: any) => {
          if (!r.attempted) return;
          const idx = subs.findIndex(s => s.examId === examId && String(s.studentId) === String(r.user_id));
          const mapped = {
            id: generateId(),
            examId,
            studentId: String(r.user_id),
            studentName: r.name,
            studentEmail: '',
            answers: {},
            score: r.score,
            percentage: r.total ? Math.round((r.score / r.total) * 100) : 0,
            submittedAt: r.submitted_at,
          };
          if (idx !== -1) {
            subs[idx] = { ...subs[idx], score: r.score, percentage: mapped.percentage };
          } else {
            subs.push(mapped);
          }
        });
        return { examSubmissions: subs };
      });
    } catch {
      //
    }
  },




  
  // ── Assignments ────────────────────────────────────────────────
  fetchAssignments: async (classId) => {
    try {
      const res = await api.getAssignments(classId);
      const assigns = res?.assignments || [];
      const mapped = assigns.map((a: any) => ({
        id: String(a.id),
        classId,
        title: a.title,
        description: a.description || '',
        startTime: a.start_time ? (a.start_time.endsWith('Z') ? a.start_time : a.start_time + 'Z') : '',
        endTime: a.end_time ? (a.end_time.endsWith('Z') ? a.end_time : a.end_time + 'Z') : '',
        attachedFileName: a.question_file_name || '',
        downloadUrl: a.question_download_url || null,
        submissionsCount: 0,
        totalMarks: a.total_marks || 0,
      }));
      set({ assignments: mapped });
    } catch {
      set({ assignments: [] });
    }
  },

  createAssignment: async (classId, assignment, file) => {
    try {
      const startTime = assignment.startTime.replace('.000Z', '').replace('Z', '');
      const endTime = assignment.endTime.replace('.000Z', '').replace('Z', '');
      await api.createAssignment(
        classId, file, assignment.title,
        assignment.description, startTime, endTime, assignment.totalMarks
      );
      await get().fetchAssignments(classId);
      get().addToast('Assignment created successfully!', 'success');
    } catch (e: any) {
      get().addToast(e.message || 'Create assignment failed', 'error');
      throw e;
    }
  },

  deleteAssignment: async (classId, assignmentId) => {
  try {
    await api.deleteAssignment(classId, assignmentId);
    set(state => ({ assignments: state.assignments.filter(a => a.id !== assignmentId) }));
    get().addToast('Assignment deleted', 'success');
  } catch (e: any) { get().addToast(e.message || 'Delete assignment failed', 'error'); }
},

  submitAssignment: async (classId, assignmentId, file) => {
    try {
      await api.submitAssignment(classId, assignmentId, file);
      get().addToast('Assignment submitted successfully!', 'success');
    } catch (e: any) {
      get().addToast(e.message || 'Submit assignment failed', 'error');
      throw e;
    }
  },

 fetchAssignmentSubmissions: async (classId, assignmentId) => {
  try {
    const res = await api.getAssignmentSubmissions(classId, assignmentId);

    console.log("SUBMISSIONS RESPONSE:", res);

    set({
      assignmentSubmissionsList: res?.submissions || []
    });
  } catch (err) {
    console.error(err);
    set({ assignmentSubmissionsList: [] });
  }
},

  gradeAssignmentSubmission: async (classId, assignmentId, submissionId, marks) => {
    try {
      await api.gradeSubmission(classId, assignmentId, submissionId, marks);
      get().addToast('Marks saved!', 'success');
      await get().fetchAssignmentSubmissions(classId, assignmentId);
      return true;
    } catch (e: any) {
      get().addToast(e.message || 'Grading failed', 'error');
      return false;
    }
  },

  getMyAssignmentSubmission: async (classId, assignmentId) => {
    try {
      return await api.getMyAssignmentSubmission(classId, assignmentId);
    } catch {
      return null;
    }
  },

  // ── Notices ────────────────────────────────────────────────────
  fetchNotices: async (classId) => {
    try {
      const list = await api.getNotices(classId);
      const mapped: Notice[] = (list || []).map((n: any) => ({
        id: String(n.notice_id),
        classId: String(n.class_id),
        creatorName: n.creator_name || 'Instructor',
        creatorRole: 'teacher' as const,
        creatorAvatar: (n.creator_name || 'I')[0],
        timestamp: (n.created_at ? (n.created_at.endsWith('Z') ? n.created_at : n.created_at + 'Z') : new Date().toISOString()),
        content: n.description || n.title,
        likes:    Array(n.like_count    || 0).fill('like'),
        dislikes: Array(n.dislike_count || 0).fill('dislike'),
      }));
      set({ notices: mapped });
    } catch {
      set({ notices: [] });
    }
  },

  postNotice: async (classId, content) => {
    try {
      await api.createNotice(classId, content);
      await get().fetchNotices(classId);
      get().addToast('Notice posted!', 'success');
    } catch (e: any) {
      get().addToast(e.message || 'Post notice failed', 'error');
    }
  },

  editNotice: async (noticeId, content) => {
    try {
      await api.editNotice(noticeId, content);
      get().addToast('Notice updated', 'success');
      return true;
    } catch (e: any) {
      get().addToast(e.message || 'Update notice failed', 'error');
      return false;
    }
  },

  deleteNotice: async (noticeId) => {
    try {
      await api.deleteNotice(noticeId);
      set(state => ({ notices: state.notices.filter(n => n.id !== noticeId) }));
      get().addToast('Notice deleted', 'success');
    } catch (e: any) {
      get().addToast(e.message || 'Delete notice failed', 'error');
    }
  },

  toggleNoticeReaction: async (noticeId, reactionType, classId) => {
    try {
      await api.reactToNotice(noticeId, reactionType);
      await get().fetchNotices(classId);
    } catch (e: any) {
      get().addToast(e.message || 'Reaction failed', 'error');
    }
  },

  markNotificationAsRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  },

  clearAllNotifications: () => {
    set(state => ({ notifications: state.notifications.map(n => ({ ...n, read: true })) }));
  },

  // ── Manage ─────────────────────────────────────────────────────
  fetchClassroomMembers: async (classId) => {
    try {
      const res = await api.getClassroomMembers(classId);
      set({ classroomMembers: res?.members || [] });
    } catch {
      set({ classroomMembers: [] });
    }
  },

  kickClassroomMember: async (classId, userId) => {
    try {
      await api.kickClassroomMember(classId, userId);
      await get().fetchClassroomMembers(classId);
      get().addToast('Member removed', 'success');
    } catch (e: any) {
      get().addToast(e.message || 'Kick failed', 'error');
    }
  },

  fetchMyScores: async (classId) => {
    try {
      const res = await api.getMyScores(classId);
      set({ myScores: res });
    } catch {
      set({ myScores: null });
    }
  },
}));