import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { User, Classroom, ExamSubmission, AssignmentSubmission } from '../../types';
import { 
  Users, Search, Award, FileText, Trash2, X, ArrowLeft, 
  Info, ShieldAlert, CircleUser, Sparkles, BookOpen 
} from 'lucide-react';
import dayjs from 'dayjs';

interface ManageMembersSectionProps {
  classId: string;
}

interface MockStudentDetail {
  id: string;
  name: string;
  email: string;
  role: 'student';
  avatarColor: string;
  enrollId: string;
  parentClassId: string;
  examAverage: number;
  hwAverage: number;
  progressPercent: number;
}

export default function ManageMembersSection({ classId }: ManageMembersSectionProps) {
  const currentUser = useAppStore(state => state.currentUser);
  const classroomMembers = useAppStore(state => state.classroomMembers);
  const kickClassroomMember = useAppStore(state => state.kickClassroomMember);
  const addToast = useAppStore(state => state.addToast);

  const isTeacher = currentUser?.role === 'teacher';

  const [memberSearch, setMemberSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentScores, setSelectedStudentScores] = useState<any | null>(null);
  
  // Kick popover confirmation state
  const [kickCandidate, setKickCandidate] = useState<any | null>(null);

  // Load scores for selected student
  React.useEffect(() => {
    if (selectedStudentId) {
      import('../../api').then(({ api }) => {
        api.getMemberScores(classId, selectedStudentId)
          .then(res => setSelectedStudentScores(res))
          .catch(() => setSelectedStudentScores(null));
      });
    } else {
      setSelectedStudentScores(null);
    }
  }, [selectedStudentId, classId]);

  const handleKickStudent = async (studentId: string) => {
    await kickClassroomMember(classId, studentId);
    setKickCandidate(null);
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
    }
  };

  const enrolledStudents = React.useMemo(() => {
    return classroomMembers.map((m: any) => ({
      id: String(m.user_id),
      name: m.name,
      email: m.email,
      role: 'student' as const,
      avatarColor: 'bg-[#0F8B8D]',
      enrollId: `LMS-${m.user_id}-22A`,
      parentClassId: classId,
      examAverage: 0,
      hwAverage: 0,
      progressPercent: 0
    }));
  }, [classroomMembers, classId]);

  const filteredStudents = enrolledStudents.filter(st => 
    st.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    st.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
    st.enrollId.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const selectedStudent = enrolledStudents.find(st => st.id === selectedStudentId);

  return (
    <div className="space-y-6 text-left relative" id="manage-members-section-container">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4" id="members-header-block">
        <div className="space-y-1 select-none">
          <h2 className="font-serif font-bold text-2xl text-brand-dark flex items-center gap-2">
            👥 Classroom Members Roster
          </h2>
          <p className="text-xs text-brand-dark/65 font-semibold uppercase tracking-wider">
            Review enrolled student accounts, monitor averages stats, or manage registrations.
          </p>
        </div>
      </div>

      {/* SEARCH/STATS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="members-search-panel">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            placeholder="Search roster by name, email, or credentials..."
            className="w-full border border-gray-250 p-3 pl-11 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]"
          />
        </div>

        <div className="bg-[#143642]/5 border border-[#143642]/10 p-3 rounded-xl flex items-center justify-between text-xs text-brand-dark select-none font-bold">
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-brand-primary" /> Active Enrolled:</span>
          <span>{enrolledStudents.length} Students</span>
        </div>
      </div>

      {/* CLASS STUDENTS TABLE ROW LIST */}
      <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm" id="members-table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-sm border-collapse" id="members-table">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-brand-dark/70 font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Student Enrollment Detail</th>
                <th className="py-4 px-4">Credential ID</th>
                <th className="py-4 px-4 text-center">Exam Average</th>
                <th className="py-4 px-4 text-center">HW Projects Average</th>
                <th className="py-4 px-6 text-right">Registry Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredStudents.map((st) => (
                <tr 
                  key={st.id} 
                  onClick={() => setSelectedStudentId(st.id)}
                  className="hover:bg-brand-light/30 transition-colors cursor-pointer group" 
                  id={`student-row-${st.id}`}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-8.5 h-8.5 ${st.avatarColor} text-white font-black text-xs flex items-center justify-center rounded-xl`}>
                        {st.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-brand-dark group-hover:text-brand-primary transition-colors">{st.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono tracking-wide leading-tight">{st.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4 font-mono font-bold text-xs text-brand-dark/70">
                    {st.enrollId}
                  </td>

                  <td className="py-4 px-4 text-center font-black text-xs font-mono text-brand-dark">
                    ⭐ {st.examAverage}%
                  </td>

                  <td className="py-4 px-4 text-center font-black text-xs font-mono text-brand-dark">
                    ✓ {st.hwAverage}%
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2" id={`student-controls-${st.id}`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudentId(st.id);
                        }}
                        className="text-xs text-brand-primary hover:underline font-bold"
                      >
                        Profile overview →
                      </button>

                      {isTeacher && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setKickCandidate(st);
                          }}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-brand-danger hover:text-red-700 transition-colors"
                          title="Kick user from classroom"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* POPUP SLIDING SIDEBAR DETAILED OVERVIEW */}
      {/* ──────────────────────────────────────────────────────── */}
      {selectedStudent && (
        <div className="fixed inset-y-0 right-0 z-50 flex" id="member-overview-sidebar-container">
          <div className="fixed inset-0 bg-[#143642]/65 backdrop-blur-xs" onClick={() => setSelectedStudentId(null)} />
          <div className="w-full max-w-md bg-white relative z-10 shadow-2xl h-full flex flex-col justify-between p-6 overflow-y-auto">
            <div className="space-y-6">
              
              {/* Top User title card */}
              <div className="flex justify-between items-start border-b border-gray-150 pb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 ${selectedStudent.avatarColor} text-white font-black text-sm flex items-center justify-center rounded-2xl shadow-md`}>
                    {selectedStudent.name[0]}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] bg-[#0F8B8D]/15 text-[#0F8B8D] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Enrolled Student</span>
                    <h3 className="font-display font-black text-brand-dark text-base uppercase tracking-wide leading-tight">{selectedStudent.name}</h3>
                    <p className="text-[10px] text-gray-400 font-mono italic leading-none">{selectedStudent.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStudentId(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Progress metrics sliders */}
              <div className="space-y-4" id="member-progress-bars">
                <h4 className="font-display font-bold text-xs text-brand-dark uppercase tracking-wider select-none">Enrollment Progress Performance:</h4>
                
                {(() => {
                  const examSc = selectedStudentScores?.exam_scores || [];
                  const hwSc = selectedStudentScores?.assignment_scores || [];

                  const validExams = examSc.filter((x: any) => x.score !== null);
                  const displayExamAvg = validExams.length > 0
                    ? Math.round((validExams.reduce((acc: number, cur: any) => acc + (cur.score / (cur.total || 1)), 0) / validExams.length) * 100)
                    : 0;

                  const displayHwAvg = hwSc.length > 0
                    ? Math.round((hwSc.filter((x: any) => x.submitted).length / hwSc.length) * 100)
                    : 0;
                  
                  const progressPct = Math.round((displayExamAvg + displayHwAvg) / 2);

                  return (
                    <>
                      {/* Total Average Card */}
                      <div className="bg-gray-50 border p-4 rounded-xl flex items-center justify-between border-brand-light">
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Weighted Accuracy Averages</p>
                          <p className="text-xl font-display font-black text-brand-dark">{progressPct}%</p>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-brand-primary/20 flex items-center justify-center font-black font-mono text-xs text-brand-primary">
                          {progressPct > 80 ? 'A' : progressPct > 60 ? 'B' : progressPct > 40 ? 'C' : 'F'}
                        </div>
                      </div>

                      <div className="space-y-3.5 pt-2">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold text-brand-dark/80">
                            <span className="flex items-center gap-1"><Award className="w-4 h-4 text-[#EC9A29]" /> Examination marks</span>
                            <span>{displayExamAvg}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-primary" style={{ width: `${displayExamAvg}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold text-brand-dark/80">
                            <span className="flex items-center gap-1"><FileText className="w-4 h-4 text-brand-primary" /> HW Submission Rate</span>
                            <span>{displayHwAvg}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-primary" style={{ width: `${displayHwAvg}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Activity feeds mockup lists */}
                      <div className="space-y-3 border-t border-gray-100 pt-5 text-xs text-left" id="student-activity-mockups-ledger">
                        <h4 className="font-display font-bold text-brand-dark selection:bg-brand-light uppercase tracking-wider">Recent Activity Ledger Logs:</h4>
                        <div className="rounded-xl border divide-y divide-gray-100 bg-gray-50/50 max-h-48 overflow-y-auto">
                          {examSc.map((e: any) => (
                            <div key={'e'+e.exam_id} className="p-3 flex justify-between items-center bg-white">
                              <div className="space-y-0.5">
                                <p className="font-bold text-brand-dark">Exam: {e.title}</p>
                                <p className="text-[10px] text-gray-400 font-medium">
                                  {e.attempted ? `Score: ${e.score !== null ? e.score : 'Pending'}/${e.total || '-'}` : 'Not attempted'}
                                </p>
                              </div>
                              <span className="text-[10px] text-gray-400 font-mono">{e.status}</span>
                            </div>
                          ))}
                          {hwSc.map((a: any) => (
                            <div key={'a'+a.assignment_id} className="p-3 flex justify-between items-center bg-white">
                              <div className="space-y-0.5">
                                <p className="font-bold text-brand-dark">HW: {a.title}</p>
                                <p className="text-[10px] text-gray-400 font-medium">
                                  {a.submitted ? (a.marks !== null ? `Marks: ${a.marks}` : 'Submitted, pending grade') : 'Missing'}
                                </p>
                              </div>
                              <span className="text-[10px] text-gray-400 font-mono">{a.status}</span>
                            </div>
                          ))}
                          {examSc.length === 0 && hwSc.length === 0 && (
                            <div className="p-4 text-center text-gray-400">No activity recorded.</div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

            </div>

            <button
              onClick={() => setSelectedStudentId(null)}
              className="w-full bg-[#143642] hover:bg-[#204958] text-white font-bold py-3.5 text-xs rounded-xl tracking-wider uppercase select-none mt-6"
            >
              Close Ledger Profile
            </button>
          </div>
        </div>
      )}

      {/* KICK OUT WARNING CONFIRMATION MODAL */}
      {kickCandidate && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4" id="kick-confirmation-modal">
          <div className="fixed inset-0 bg-[#143642]/65 backdrop-blur-sm" onClick={() => setKickCandidate(null)} />
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm relative z-10 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-[#A8201A] mx-auto mb-1">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-lg text-brand-dark">Expel Student Member?</h3>
            <p className="text-xs text-brand-dark/70 font-semibold leading-relaxed">
              Are you sure you want to expel <span className="font-bold text-brand-danger">{kickCandidate.name}</span> out of the classroom registry lists? They will lose secure workspace access immediately.
            </p>
            <div className="flex gap-2 mt-4 w-full">
              <button 
                onClick={() => setKickCandidate(null)}
                className="flex-1 rounded-xl border py-2 text-xs font-bold text-brand-dark hover:bg-gray-50 uppercase tracking-wide"
              >
                Go Back
              </button>
              <button 
                onClick={() => handleKickStudent(kickCandidate.id)}
                className="flex-1 rounded-xl bg-[#A8201A] text-white py-2 text-xs font-bold hover:bg-red-700 uppercase tracking-wide shadow-md"
              >
                Confirm Expel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
