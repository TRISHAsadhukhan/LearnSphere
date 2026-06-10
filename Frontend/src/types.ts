export interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  avatar?: string;
  joinedClasses: string[];
  createdClasses: string[];
}

export interface Classroom {
  id: string;
  name: string;
  subject: string;
  description: string;
  roomKey: string;
  creatorId: string;
  creatorName: string;
  creatorAvatarInitial: string;
  membersCount: number;
  createdAt: string;
  color: string;
}

export interface Material {
  id: string;
  classId: string;
  name: string;        // file_name (original filename)
  title?: string;      // display title
  type: string;        // file_type from backend
  uploadedBy: string;
  uploadedAt: string;
  size: string;
  downloadUrl?: string | null;  // presigned Supabase URL
}

export interface Question {
  id: string;
  text: string;
  options: string[];   // always 4
  correctOption: number; // -1 = not yet revealed, 0-3 = index
  marks: number;
}

export interface Exam {
  id: string;
  classId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  questions: Question[];
  totalMarks: number;
  submissionsCount: number;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  score: number;
  percentage: number;
  answers: Record<string, string>; // questionId -> 'A'|'B'|'C'|'D'
  submittedAt: string;
  status: 'attempted' | 'missed';
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  attachedFileName?: string;
  attachedFileSize?: string;
  downloadUrl?: string | null;
  submissionsCount: number;
  totalMarks: number;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submittedFileName?: string;
  submittedAt?: string;
  status: 'submitted' | 'not-submitted';
  marks?: number;
  graded: boolean;
  downloadUrl?: string | null;
}

export interface Notice {
  id: string;
  classId: string;
  creatorName: string;
  creatorRole: 'teacher' | 'student';
  creatorAvatar: string;
  timestamp: string;
  content: string;
  attachedFileName?: string;
  likes: string[];
  dislikes: string[];
}

export interface Notification {
  id: string;
  text: string;
  classId: string;
  className: string;
  timestamp: string;
  read: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}