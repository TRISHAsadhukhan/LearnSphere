import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { Exam, Question, ExamSubmission } from '../../types';
import { 
  ClipboardList, Plus, Calendar, Clock, ArrowLeft, Check, X, 
  ChevronLeft, ChevronRight, BarChart2, Award, Info, Trash2, Edit, AlertCircle 
} from 'lucide-react';
import dayjs from 'dayjs';

interface ExamsSectionProps {
  classId: string;
  isCreator : boolean
}

export default function ExamsSection({ classId, isCreator }: ExamsSectionProps ){
  const currentUser = useAppStore(state => state.currentUser);
  const rawExams = useAppStore(state => state.exams);
  const exams = React.useMemo(() => rawExams.filter(e => e.classId === classId), [rawExams, classId]);
  const examSubmissions = useAppStore(state => state.examSubmissions);
  const deleteExam = useAppStore(state => state.deleteExam);
  const createExam = useAppStore(state => state.createExam);
  const submitExam = useAppStore(state => state.submitExam);
  const fetchExamDetail = useAppStore(state => state.fetchExamDetail);
  const addToast = useAppStore(state => state.addToast);
  const fetchMyExamResult = useAppStore(state => state.fetchMyExamResult);
  const fetchExamResults = useAppStore(state => state.fetchExamResults);
  const examHistory = useAppStore(state => state.examHistory);

  const isTeacher = isCreator;

  // Navigation sub-view routers
  const [currentView, setCurrentView] = useState<'list' | 'attempt' | 'review' | 'results'>('list');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // Multi-step exam creation form states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [examTitle, setExamTitle] = useState('');
  const [examDesc, setExamDesc] = useState('');
  const [examStart, setExamStart] = useState('');
  const [examEnd, setExamEnd] = useState('');
  const [examQuestions, setExamQuestions] = useState<Omit<Question, 'id'>[]>([
    { text: '', options: ['', '', '', ''], correctOption: 0, marks: 1 }
  ]);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  // Active student attempt parameters
  const [attemptAnswers, setAttemptAnswers] = useState<Record<string, number | string>>({});
  const [attemptIdx, setAttemptIdx] = useState(0);
  const [attemptTimeRemaining, setAttemptTimeRemaining] = useState(300); // seconds
  const [submitDialogConfirm, setSubmitDialogConfirm] = useState(false);

  // Sorting results dashboards
  const [resultsSortBy, setResultsSortBy] = useState<'name' | 'score' | 'time'>('score');
  const [resultsSearch, setResultsSearch] = useState('');
  const [detailedMemberSub, setDetailedMemberSub] = useState<ExamSubmission | null>(null);

  // Exam list calculations & helpers
  const getExamStatus = (exam: Exam): 'upcoming' | 'live' | 'ended' => {
    const now = dayjs();
    const start = dayjs(exam.startTime);
    const end = dayjs(exam.endTime);
    if (now.isBefore(start)) return 'upcoming';
    if (now.isAfter(end)) return 'ended';
    return 'live';
  };

  const memberHistory = useAppStore(state => state.memberExamHistory);

  const getMySubmission = (examId: string) => {
    const sub = examSubmissions.find(sub => String(sub.examId) === String(examId) && String(sub.studentId) === String(currentUser?.id));
    if (sub) return sub;

    const hist = memberHistory.find(h => String(h.exam_id) === String(examId));
    if (hist && hist.attempted) {
      return {
        id: 'hist_' + examId,
        examId,
        studentId: currentUser?.id || '',
        studentName: currentUser?.name || '',
        studentEmail: currentUser?.email || '',
        answers: {} as any,
        score: hist.score || 0,
        percentage: hist.total ? Math.round(((hist.score || 0) / hist.total) * 100) : 0,
        submittedAt: new Date().toISOString(),
      };
    }
    return undefined;
  };

  // Counting down active exam timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentView === 'attempt' && attemptTimeRemaining > 0) {
      timer = setTimeout(() => {
        setAttemptTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (currentView === 'attempt' && attemptTimeRemaining === 0) {
      handleFinalExamSubmit(true);
    }
    return () => clearTimeout(timer);
  }, [currentView, attemptTimeRemaining]);

  // Handle active exam triggering
  const handleStartExamAttempt = async (exam: Exam) => {
    const success = await fetchExamDetail(classId, exam.id);
    if (!success) return;
    setSelectedExamId(exam.id);
    setAttemptAnswers({});
    setAttemptIdx(0);
    setAttemptTimeRemaining(1800); // 30 minutes static quiz mock
    setCurrentView('attempt');
  };

 const handleFinalExamSubmit = async (isAuto = false) => {
    if (!selectedExamId) return;
    try {
    await submitExam(classId, selectedExamId, attemptAnswers as Record<string, string>);
      setSubmitDialogConfirm(false);
      setCurrentView('list');
      setSelectedExamId(null);
    } catch {
      addToast('Submission failed. Please try again.', 'error');
    }
  };

  // Exam creation triggers
  const addQuestionBlock = () => {
    setExamQuestions([
      ...examQuestions,
      { text: '', options: ['', '', '', ''], correctOption: 0, marks: 1 }
    ]);
  };

  const removeQuestionBlock = (index: number) => {
    if (examQuestions.length === 1) return;
    setExamQuestions(examQuestions.filter((_, i) => i !== index));
  };

  const updateQuestionOption = (qIdx: number, oIdx: number, val: string) => {
    const updated = [...examQuestions];
    updated[qIdx].options[oIdx] = val;
    setExamQuestions(updated);
  };

  const updateQuestionText = (qIdx: number, val: string) => {
    const updated = [...examQuestions];
    updated[qIdx].text = val;
    setExamQuestions(updated);
  };

  const updateQuestionAnswer = (qIdx: number, optIdx: number) => {
    const updated = [...examQuestions];
    updated[qIdx].correctOption = optIdx;
    setExamQuestions(updated);
  };

  const updateQuestionMarks = (qIdx: number, marks: any) => {
    // Marks logic unused since backend requires 1 pt per question, keeping for schema compatibility.
  };

  const handlePublishExam = () => {
    setTimelineError(null);
    // Validate timelines
    const now = dayjs();
    const start = dayjs(examStart);
    const end = dayjs(examEnd);
    
    if (start.isBefore(now.subtract(5, 'minute'))) {
      setTimelineError('Starting date and time cannot be in the past.');
      return;
    }
    if (start.isAfter(now.add(3, 'day').endOf('day'))) {
      setTimelineError('Starting date cannot be more than 3 days from current time.');
      return;
    }
    if (end.isBefore(start) || end.isSame(start)) {
      setTimelineError('Ending date and time cannot be before or same as starting date and time.');
      return;
    }
    if (end.isAfter(start.add(1, 'week').endOf('day'))) {
      setTimelineError('Ending date cannot exceed 1 week from starting date.');
      return;
    }

    // Validation on questions
    const invalidQ = examQuestions.some(q => !q.text.trim() || q.options.some(o => !o.trim()));
    if (invalidQ) {
      setTimelineError('Please input question prompt text and options.');
      return;
    }

    const totalCalculatedMarks = examQuestions.length;

    const questionsWithId = examQuestions.map((q, idx) => ({
      ...q,
      id: 'Q_' + idx + '_' + Math.random().toString(36).substring(2, 5).toUpperCase()
    }));

    createExam(classId, {
      classId,
      title: examTitle,
      description: examDesc,
      startTime: new Date(examStart).toISOString(),
      endTime: new Date(examEnd).toISOString(),
      questions: questionsWithId,
      totalMarks: totalCalculatedMarks
    });


    
    // Reset state
    setExamTitle('');
    setExamDesc('');
    setExamStart('');
    setExamEnd('');
    setExamQuestions([{ text: '', options: ['', '', '', ''], correctOption: 0, marks: 1 }]);
    setTimelineError(null);
    setCreateStep(1);
    setIsCreateOpen(false);
  };

  // Results views list computation
  const getExamSubmissionsSorted = (examId: string) => {
    const subs = examSubmissions.filter(sub => sub.examId === examId);
    
    // sorting logic
    return subs.filter(s => s.studentName.toLowerCase().includes(resultsSearch.toLowerCase())).sort((a, b) => {
      if (resultsSortBy === 'name') return a.studentName.localeCompare(b.studentName);
      if (resultsSortBy === 'score') return b.score - a.score;
      if (resultsSortBy === 'time') return dayjs(b.submittedAt).diff(dayjs(a.submittedAt));
      return 0;
    });
  };

  const formatTimerSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const selectedExam = exams.find(e => e.id === selectedExamId);

  return (
    <div className="space-y-6 text-left" id="exams-section-container">
      
      {/* ──────────────────────────────────────────────────────── */}
      {/* A. LIST OF EXAMS VIEW */}
      {/* ──────────────────────────────────────────────────────── */}
      {currentView === 'list' && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4" id="exams-list-header">
            <div className="space-y-1">
              <h2 className="font-serif font-bold text-2xl text-brand-dark flex items-center gap-2">
                📝 Exam Questionnaires
              </h2>
              <p className="text-xs text-brand-dark/65 font-semibold uppercase tracking-wider">
                Create or attempt timed multiple choice evaluations.
              </p>
            </div>
            {isTeacher && (
              <button
                onClick={() => { setIsCreateOpen(true); setCreateStep(1); setTimelineError(null); }}
                className="bg-[#0F8B8D] text-white hover:bg-[#0a7173] font-bold px-5 py-2.5 rounded-xl text-xs transition-transform hover:scale-[1.01] flex items-center gap-2"
              >
                + Create Exam Paper
              </button>
            )}
          </div>

          {/* Cards Grid */}
          {exams.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl shadow-sm border border-gray-150" id="exams-empty-layout">
              <div className="w-16 h-16 bg-brand-light/30 flex items-center justify-center rounded-full mx-auto text-brand-dark/40 mb-4">
                <ClipboardList className="w-8 h-8 font-thin" />
              </div>
              <h4 className="font-display font-bold text-brand-dark text-base mb-1">
                No Exams Created Yet
              </h4>
              <p className="text-xs text-brand-dark/60 font-sans max-w-xs mx-auto leading-relaxed">
                {isTeacher 
                  ? 'Design a beautiful multi-question quiz complete with correct answer tracking and automatic evaluations scoring coefficients.' 
                  : 'Great news! No pending timed assessments published right now.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="exams-grid-cards">
              {exams.map(exam => {
                const status = getExamStatus(exam);
                const sub = getMySubmission(exam.id);

                let statusBadge = 'bg-[#EC9A29]/15 text-[#EC9A29]';
                let statusLabel = '🟡 Upcoming';
                let accentBorder = 'border-t-4 border-[#EC9A29]';

                if (status === 'live') {
                  statusBadge = 'bg-[#0F8B8D]/15 text-[#0F8B8D]';
                  statusLabel = '🟢 Live Active';
                  accentBorder = 'border-t-4 border-[#0F8B8D]';
                } else if (status === 'ended') {
                  statusBadge = 'bg-gray-100 text-gray-500';
                  statusLabel = '⬜ Ended';
                  accentBorder = 'border-t-4 border-gray-400';
                }

                return (
                  <div 
                    key={exam.id}
                    className={`bg-white rounded-2xl shadow-md overflow-hidden border border-gray-150 flex flex-col justify-between ${accentBorder}`}
                    id={`exam-card-${exam.id}`}
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${statusBadge}`}>
                          {statusLabel}
                        </span>
                        <span className="text-xs font-bold text-brand-dark/60 flex items-center gap-1 font-mono">
                          ⭐ {exam.totalMarks} Marks
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-display font-black text-brand-dark text-base uppercase tracking-wide leading-snug">
                          {exam.title}
                        </h3>
                        <p className="text-xs text-brand-dark/70 line-clamp-2">
                          {exam.description}
                        </p>
                      </div>

                      <div className="border-t border-gray-50 pt-3 flex flex-col gap-2.5 text-xs text-brand-dark/75 font-semibold leading-relaxed">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" /> Start: {dayjs(exam.startTime).format('MMM DD, YYYY - h:mm A')}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" /> Close: {dayjs(exam.endTime).format('MMM DD, YYYY - h:mm A')}</span>
                      </div>
                    </div>

                    {/* Action footer dependent on role */}
                    <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-100">
                      <div>
                        {isTeacher ? (() => {
                          const hist = examHistory.find(h => String(h.exam_id) === String(exam.id));
                          const count = hist ? hist.attempted : 0;
                          return (
                          <span className="text-xs font-bold text-brand-dark/65 flex items-center gap-1 select-none">
                            {/* 👤 {count} submissions */}
                          </span>
                          );
                        })() : sub ? (
                          <span className="text-xs font-bold text-[#0F8B8D] flex items-center gap-1 select-none">
                            ✓ Submitted ({sub.score}/{exam.totalMarks} Marks)
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-brand-dark/50 select-none">Not attempted</span>
                        )}
                      </div>

                      <div id={`exam-actions-footer-${exam.id}`}>
                        {isTeacher ? (
                          <div className="flex gap-2">
                            <button
                              onClick={async () => { 
                                await fetchExamResults(classId, exam.id);
                                setSelectedExamId(exam.id); 
                                setCurrentView('results'); 
                              }}
                              className="bg-[#0F8B8D] hover:bg-[#0a7173] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                            >
                              Results Dashboard
                            </button>
                            <button
                              onClick={() => { deleteExam(classId, exam.id); addToast('Exam removed.', 'error'); }}
                              className="p-2 hover:bg-red-50 text-[#A8201A] rounded-xl transition-colors border border-gray-200"
                              title="Delete Exam"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          // Student actions
                          <>
                            {status === 'upcoming' && (
                              <span className="text-xs font-bold text-gray-400">Locked</span>
                            )}
                            {status === 'live' && !sub && (
                              <button
                                onClick={() => handleStartExamAttempt(exam)}
                                className="bg-[#0F8B8D] hover:bg-[#0a7173] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md animate-pulse shrink-0"
                              >
                                Start Exam →
                              </button>
                            )}
                            {status === 'live' && sub && (
                              <span className="text-xs font-bold text-gray-400">Finished</span>
                            )}
                           {status === 'ended' && sub && (
                                <button
                                  onClick={async () => { 
                                    const [detail, result] = await Promise.all([
                                      fetchExamDetail(classId, exam.id),
                                      fetchMyExamResult(classId, exam.id),   // ✅ fetch real score
                                    ]);
                                    if (detail) {
                                      setSelectedExamId(exam.id); 
                                      setCurrentView('review'); 
                                    }
                                  }}
                                  className="bg-[#143642] hover:bg-[#204958] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                                >
                                  Review Answers
                                </button>
                              )}
                            {status === 'ended' && !sub && (
                              <span className="text-xs font-bold text-[#A8201A]">Missed Exam</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* B. ACTIVE STUDENT EXAM ATTEMPTING VIEW (FULL SCREEN LIKE) */}
      {/* ──────────────────────────────────────────────────────── */}
      {currentView === 'attempt' && selectedExam && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-150 relative space-y-6 text-left" id="active-test-taking-container">
          
          {/* Top banner clock & info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5" id="test-top">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#0F8B8D] bg-[#0F8B8D]/15 px-2.5 py-1 rounded-full">
                📝 Timed MCQ Paper In Progress
              </span>
              <h2 className="font-display font-black text-xl text-brand-dark uppercase tracking-wide">
                {selectedExam.title}
              </h2>
            </div>

            {/* Styled Countdown block */}
            <div className={`rounded-xl px-5 py-3 text-white flex items-center gap-2.5 font-mono shadow-md ${
              attemptTimeRemaining < 120 ? 'bg-[#A8201A] animate-pulse font-black' : 'bg-[#143642]'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="text-sm">⏱ {formatTimerSeconds(attemptTimeRemaining)} REMAINING</span>
            </div>
          </div>

          {/* Exam Progress Tracker Bar */}
          <div className="space-y-1.5 select-none" id="test-paper-prog">
            <div className="flex justify-between items-center text-xs font-bold text-brand-dark">
              <span>Question {attemptIdx + 1} of {selectedExam.questions.length}</span>
              <span>{Math.round(((attemptIdx + 1) / selectedExam.questions.length) * 100)}% COMPLETE</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-primary transition-all duration-300" 
                style={{ width: `${((attemptIdx + 1) / selectedExam.questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Active Question Panel */}
          <div className="bg-gray-50 border border-gray-155 rounded-2xl p-6" id="test-active-question-card">
            <div className="flex gap-3.5 mb-4">
              <span className="w-7 h-7 rounded-full bg-[#0F8B8D]/15 text-[#0F8B8D] text-xs font-extrabold flex items-center justify-center shrink-0">
                Q{attemptIdx + 1}
              </span>
              <h3 className="font-sans font-bold text-brand-dark text-base pt-0.5 leading-relaxed">
                {selectedExam.questions[attemptIdx].text}
              </h3>
            </div>

            {/* Answer Options Multi layout list */}
            <div className="space-y-3 pl-10">
              {selectedExam.questions[attemptIdx].options.map((option, idx) => {
                const qId = selectedExam.questions[attemptIdx].id;
                const isSelected = attemptAnswers[qId] === ['A','B','C','D'][idx];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAttemptAnswers({ ...attemptAnswers, [qId]: ['A','B','C','D'][idx] })}
                    className={`w-full rounded-xl p-4 text-sm font-semibold transition-all border flex items-center justify-between text-left ${
                      isSelected 
                        ? 'bg-[#0F8B8D] text-white border-[#0F8B8D] shadow-md' 
                        : 'bg-white border-gray-250 text-brand-dark hover:bg-[#0F8B8D]/5'
                    }`}
                  >
                    <span>{['A', 'B', 'C', 'D'][idx]}. {option}</span>
                    {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Page Index Pagination blocks */}
          <div className="flex flex-wrap justify-center gap-2 select-none" id="test-pagination-bubbles">
            {selectedExam.questions.map((q, idx) => {
              const isAnswered = attemptAnswers[q.id] !== undefined;
              const isCurrent = attemptIdx === idx;

              let bubStyle = 'border-gray-200 text-brand-dark bg-white hover:bg-gray-50';
              if (isAnswered) bubStyle = 'bg-[#0F8B8D] border-[#0F8B8D] text-white';
              if (isCurrent) bubStyle = 'ring-2 ring-brand-primary border-[#0F8B8D] text-brand-primary bg-white';

              return (
                <button
                  key={idx}
                  onClick={() => setAttemptIdx(idx)}
                  className={`w-10 h-10 rounded-full border text-xs font-black transition-all ${bubStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Bottom navigation selectors */}
          <div className="flex justify-between items-center border-t border-gray-100 pt-5 pr-1" id="test-nav-foot">
            <button
              onClick={() => attemptIdx > 0 && setAttemptIdx(attemptIdx - 1)}
              disabled={attemptIdx === 0}
              className={`px-5 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-colors ${
                attemptIdx === 0 
                  ? 'text-gray-300 border-gray-100 cursor-not-allowed shadow-none' 
                  : 'text-brand-dark border-gray-200 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {attemptIdx < selectedExam.questions.length - 1 ? (
              <button
                onClick={() => setAttemptIdx(attemptIdx + 1)}
                className="bg-[#0F8B8D] hover:bg-[#0a7173] text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setSubmitDialogConfirm(true)}
                className="bg-[#0F8B8D] hover:bg-[#0a7173] text-white font-black px-6 py-2.5 rounded-xl text-xs animate-bounce"
              >
                Submit Exam Paper
              </button>
            )}
          </div>

          {/* Inline Submit Confirmation Portal inside attempt */}
          {submitDialogConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-[#143642]/65 backdrop-blur-sm" />
              <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm relative z-10 text-center">
                <div className="w-14 h-14 bg-[#0F8B8D]/20 rounded-full flex items-center justify-center text-[#0F8B8D] mx-auto mb-4">
                  <ClipboardList className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-lg text-brand-dark">Are you sure?</h3>
                <p className="text-xs text-brand-dark/70 font-semibold uppercase mt-1">
                  You answered {Object.keys(attemptAnswers).length} of {selectedExam.questions.length} questions.
                </p>
                <p className="text-xs text-brand-dark/60 mt-3 font-sans">
                  Once submitted, answers are permanently logged on the secure school panel and cannot be reuploaded.
                </p>
                
                <div className="flex gap-2.5 mt-6 w-full">
                  <button 
                    onClick={() => setSubmitDialogConfirm(false)}
                    className="flex-1 rounded-xl border py-2.5 text-xs font-bold text-brand-dark hover:bg-gray-50 uppercase tracking-wide"
                  >
                    Go Back
                  </button>
                  <button 
                    onClick={() => handleFinalExamSubmit(false)}
                    className="flex-1 rounded-xl bg-[#0F8B8D] text-white py-2.5 text-xs font-bold hover:bg-[#0a7173] uppercase tracking-wide"
                  >
                    Submit Anyway
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* C. STUDENT ENDED EXAM DETAILED REVIEW SHEET */}
      {/* ──────────────────────────────────────────────────────── */}
      {currentView === 'review' && selectedExam && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-150 space-y-6 text-left" id="ended-exam-review-panel">
          <button
            onClick={() => { setCurrentView('list'); setSelectedExamId(null); }}
            className="text-xs text-brand-primary hover:underline font-bold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Exam Dashboard
          </button>

          {/* Score details card */}
          {(() => {
            const mySub = getMySubmission(selectedExam.id);
            if (!mySub) return null;
            return (
              <div className="bg-gray-50 rounded-2xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 select-none border-brand-light">
                <div className="space-y-2">
                  <div className="inline-flex py-1 px-3 rounded-full bg-[#0F8B8D]/15 text-[#0F8B8D] text-[10px] font-black uppercase tracking-wider">
                    🎉 Evaluation Scorecard
                  </div>
                  <h3 className="font-display font-black text-xl text-brand-dark uppercase tracking-wide">
                    {selectedExam.title}
                  </h3>
                  <p className="text-xs font-sans text-brand-dark/65 font-medium">
                    Attempt logged at: {dayjs(mySub.submittedAt).format('MMM DD, YYYY - h:mm A')}
                  </p>
                </div>

                <div className="text-center bg-white border border-gray-150 p-4 rounded-xl min-w-44 flex flex-col items-center">
                  <Award className="w-8 h-8 text-[#EC9A29] mb-1 shrink-0" />
                  <span className="text-2xl font-display font-black text-brand-dark">{mySub.score} / {selectedExam.totalMarks}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Marks Card</span>
                  <span className="text-xs font-black text-[#0F8B8D] mt-1">Accuracy: {mySub.percentage}%</span>
                </div>
              </div>
            );
          })()}

          {/* List of answers reviewing sheets */}
          <div className="space-y-4 pt-4" id="ended-review-answers-scrolling-cards">
            <h4 className="font-display font-bold text-brand-dark text-base uppercase border-b border-gray-100 pb-2">
              Question Summary Check (Read-Only)
            </h4>

            {selectedExam.questions.map((q, qIdx) => {
              const mySub = getMySubmission(selectedExam.id);
              const chosen = mySub?.answers[q.id];
              const isCorrect = chosen === q.correctOption;

              return (
                <div key={q.id} className="border border-gray-155 rounded-xl p-5 bg-gray-50/50 space-y-3 text-left">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#143642]/10 text-brand-dark text-xs font-black flex items-center justify-center shrink-0">
                        {qIdx + 1}
                      </span>
                      <p className="font-sans font-bold text-brand-dark text-sm leading-relaxed">{q.text}</p>
                    </div>
                    {/* Tick / Cross indicator */}
                    <span className="shrink-0">
                      {isCorrect ? (
                        <span className="text-[#0F8B8D] bg-[#0F8B8D]/15 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Correct</span>
                      ) : (
                        <span className="text-[#A8201A] bg-[#A8201A]/15 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Incorrect</span>
                      )}
                    </span>
                  </div>

                  {/* Options readout */}
                  <div className="space-y-2 pl-8">
                    {q.options.map((opt, oIdx) => {
                      let style = 'bg-white border-gray-150 text-brand-dark';
                      
                      // if correct answer
                      if (oIdx === q.correctOption) {
                        style = 'bg-[#0F8B8D]/10 border-[#0F8B8D] text-brand-primary border-2 font-bold';
                      }
                      // if chosen but wrong
                      if (chosen === oIdx && !isCorrect) {
                        style = 'bg-[#A8201A]/10 border-[#A8201A] text-[#A8201A] border-2';
                      }

                      return (
                        <div key={oIdx} className={`rounded-lg p-3 text-xs border ${style}`}>
                          <span>{['A', 'B', 'C', 'D'][oIdx]}. {opt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* D. TEACHER EXAM SUBMISSIONS RESULTS TABLE VIEW */}
      {/* ──────────────────────────────────────────────────────── */}
      {currentView === 'results' && selectedExam && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-150 space-y-6 text-left" id="results-table-panel-root">
          
          <button
            onClick={() => { setCurrentView('list'); setSelectedExamId(null); }}
            className="text-xs text-brand-primary font-bold hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Exams
          </button>

          {/* Results Summary banner */}
          <div className="border-b border-gray-150 pb-5 space-y-1">
            <span className="text-[10px] text-brand-primary bg-[#0F8B8D]/15 font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
              📊 Class grading evaluation spreadsheet
            </span>
            <h2 className="font-display font-black text-2xl text-brand-dark uppercase tracking-wide pt-1">
              {selectedExam.title} — Results
            </h2>
          </div>

          {/* Dashboard filters row */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-2" id="results-dashboard-filters">
            <input
              type="text"
              value={resultsSearch}
              onChange={(e) => setResultsSearch(e.target.value)}
              placeholder="Search student results..."
              className="w-full md:max-w-xs border border-gray-250 p-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]"
            />
            <div className="flex items-center gap-2 text-xs font-bold text-brand-dark" id="results-sorter">
              <span>Sort result by:</span>
              <select
                value={resultsSortBy}
                onChange={(e) => setResultsSortBy(e.target.value as any)}
                className="border border-gray-200 p-2 rounded-xl focus:outline-none"
              >
                <option value="score">Highest Marks Score</option>
                <option value="name">Alphabetical</option>
                <option value="time">Submission Date</option>
              </select>
            </div>
          </div>

          {/* Submissions table */}
          {getExamSubmissionsSorted(selectedExam.id).length === 0 ? (
            <div className="p-12 text-center text-xs font-semibold text-gray-400">
              No matching submission records found.
            </div>
          ) : (
            <div className="overflow-x-auto" id="results-spreadtable-wrapper">
              <table className="w-full text-left font-sans text-sm border-collapse" id="results-table">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-brand-dark/70 font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Student Member Name</th>
                    <th className="py-4 px-4">Evaluation Marks</th>
                    <th className="py-4 px-4 text-center">Score Accuracy</th>
                    <th className="py-4 px-4 hidden sm:table-cell">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {getExamSubmissionsSorted(selectedExam.id).map((sub, idx) => (
                    <tr key={sub.id} className="hover:bg-brand-light/30 transition-colors" id={`results-row-${sub.id}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#143642] text-[#DAD2D8] font-bold text-xs flex items-center justify-center">
                            {sub.studentName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[#143642]">{sub.studentName}</div>
                            <div className="text-[10px] text-gray-400 font-mono leading-tight">{sub.studentEmail}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono font-black text-brand-dark text-xs">
                        {sub.score} / {selectedExam.totalMarks}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-1" id={`accuracy-${sub.id}`}>
                          <span className="text-xs font-extrabold text-brand-primary">{sub.percentage}%</span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-primary" style={{ width: `${sub.percentage}%` }} />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 hidden sm:table-cell text-xs text-brand-dark/70">
                        {dayjs(sub.submittedAt).format('MMM DD, YYYY · h:mm A')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}


      {/* ──────────────────────────────────────────────────────── */}
      {/* E. CREATE EXAM PAPER MULTI STEP MODAL OVERLAY */}
      {/* ──────────────────────────────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="create-exam-paper-modal">
          <div className="fixed inset-0 bg-[#143642]/65 backdrop-blur-sm" />
          <div className="bg-white rounded-2xl shadow-2xl relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col text-left font-sans" id="create-modal-container">
            
            {/* Modal Title bar */}
            <div className="p-6 border-b border-gray-150 flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#0F8B8D]">Interactive examination constructor</span>
                <h3 className="font-display font-black text-base text-brand-dark uppercase tracking-wide pt-0.5">Publish New MCQ Assessment Paper</h3>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 leading-none text-xl font-bold">×</button>
            </div>

            {/* Step header circles indicator */}
            <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-center gap-4 select-none" id="step-circles">
              {[
                { s: 1, label: 'Assessment Info' },
                { s: 2, label: 'Add Questions' },
                { s: 3, label: 'Verify Publish' }
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    createStep === step.s 
                      ? 'bg-[#0F8B8D] text-white' 
                      : createStep > step.s 
                      ? 'bg-[#143642] text-white' 
                      : 'border-2 border-gray-200 text-gray-400 bg-white'
                  }`}>
                    {step.s}
                  </span>
                  <span className={createStep === step.s ? 'text-brand-dark' : 'text-brand-dark/50'}>
                    {step.label}
                  </span>
                  {idx < 2 && <span className="text-gray-300">→</span>}
                </div>
              ))}
            </div>

            {/* Scrollable multi step form container */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 select-none pr-3" id="create-step-content">
              
              {/* STEP 1: ASSESSMENT INFO */}
              {createStep === 1 && (
                <div className="space-y-4" id="exam-details-section">
                  {timelineError && (
                    <div className="bg-[#A8201A]/10 border border-[#A8201A] text-[#A8201A] p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-bold" id="exam-timeline-error">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{timelineError}</span>
                    </div>
                  )}

                  <div className="space-y-1 bg-[#EC9A29]/10 border border-[#EC9A29]/30 p-4 rounded-xl mb-4 text-xs font-semibold text-brand-dark/95 leading-normal">
                    <p className="font-bold text-[#EC9A29] mb-1">📅 Timeline Rules & Requirements:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Start date must be from current time up to max 3 days in the future.</li>
                      <li>End date must be after start date and max 1 week from start date.</li>
                    </ul>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-brand-dark mb-1 ml-0.5 uppercase tracking-wide">Exam Paper Title *</label>
                    <input
                      type="text"
                      required
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      placeholder="e.g. Calculus Mid-term Examination"
                      className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-brand-dark mb-1 ml-0.5 uppercase tracking-wide">Instructions / Notes</label>
                    <textarea
                      rows={3}
                      value={examDesc}
                      onChange={(e) => setExamDesc(e.target.value)}
                      placeholder="e.g. Test carries 5 marks. Auto-submission will trigger when timer lapses..."
                      className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-brand-dark mb-1 ml-0.5 uppercase tracking-wide">Start Date & Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={examStart}
                        onChange={(e) => setExamStart(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-brand-dark mb-1 ml-0.5 uppercase tracking-wide">End Date & Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={examEnd}
                        onChange={(e) => setExamEnd(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: ADD MCQS QUESTIONS */}
              {createStep === 2 && (
                <div className="space-y-6" id="add-questions-section">
                  <div className="bg-brand-light/20 p-3.5 border rounded-xl select-none text-xs font-semibold leading-normal text-brand-dark">
                    Add standard multiple choice questions. Type prompt, specify options, and click on matching option radials to lock correct selections!
                  </div>

                  <div className="space-y-6">
                    {examQuestions.map((q, qIdx) => (
                      <div 
                        key={qIdx} 
                        className="border border-gray-255 rounded-xl p-5 bg-gray-50/50 space-y-4 relative text-left"
                      >
                        {/* Upper right delete question line */}
                        {examQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestionBlock(qIdx)}
                            className="absolute top-4 right-4 text-xs font-black text-[#A8201A] bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded transition-colors"
                          >
                            Delete Q{qIdx + 1}
                          </button>
                        )}

                        <div className="flex gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#0F8B8D] text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">
                            Q{qIdx + 1}
                          </span>
                          <span className="font-display font-bold text-sm text-brand-dark pt-0.5">MCQ Prompt Text *</span>
                        </div>

                        <textarea
                          rows={2}
                          required
                          value={q.text}
                          onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                          placeholder="What is sin(x) derivative?"
                          className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] resize-none bg-white font-sans"
                        />

                        {/* 4 Option boxes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = q.correctOption === oIdx;
                            return (
                              <div key={oIdx} className="flex items-center gap-2 relative">
                                <label className="text-[10px] uppercase font-bold text-gray-400 select-none">
                                  {['A', 'B', 'C', 'D'][oIdx]}:
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={opt}
                                  onChange={(e) => updateQuestionOption(qIdx, oIdx, e.target.value)}
                                  placeholder={`Option ${['A', 'B', 'C', 'D'][oIdx]}`}
                                  className={`flex-1 rounded-lg border p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F8B8D] bg-white ${
                                    isCorrect ? 'ring-1 ring-[#0F8B8D] bg-[#0F8B8D]/5 border-[#0F8B8D]' : 'border-gray-200'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => updateQuestionAnswer(qIdx, oIdx)}
                                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                    isCorrect ? 'bg-[#0F8B8D] border-[#0F8B8D]' : 'border-gray-300'
                                  }`}
                                  title="Mark as correct option answers"
                                >
                                  {isCorrect && <Check className="w-2.5 h-2.5 text-white stroke-3" />}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Marks control */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3 select-none text-[10px] text-brand-dark/65 font-bold uppercase tracking-wider pl-8">
                          <span>Correct choice answers: {['A', 'B', 'C', 'D'][q.correctOption]}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-brand-dark">Points:</span>
                            <span className="font-black text-xs">1</span>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>

                  {/* Add Block FAB banner */}
                  <button
                    type="button"
                    onClick={addQuestionBlock}
                    className="w-full border-2 border-dashed border-[#0F8B8D]/40 text-[#0F8B8D] bg-white hover:bg-[#0F8B8D]/5 font-bold p-3.5 rounded-xl text-xs transition-colors"
                  >
                    + Add A Question Block
                  </button>
                </div>
              )}

              {/* STEP 3: PREVIEW & PUBLISH */}
              {createStep === 3 && (
                <div className="space-y-6" id="preview-publish-section text-left">
                  <div className="bg-green-50 text-green-800 border border-green-200 p-4 rounded-xl flex items-start gap-2 text-xs font-semibold">
                    <Info className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
                    <span>Please preview and verify calculations before clicking publish onto feed card. Questions and marks coef weights are automatically tallied.</span>
                  </div>

                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3 leading-relaxed text-xs">
                    <h4 className="font-display font-black text-brand-dark text-sm border-b border-gray-200 pb-2 uppercase tracking-wide select-none">Exam Questionnaire parameters checklist:</h4>
                    <p className="font-semibold text-brand-dark">🏷 Exam Title: {examTitle}</p>
                    {examDesc && <p className="font-sans text-brand-dark/75">📝 Notes: {examDesc}</p>}
                    <p className="font-medium text-brand-dark/80 flex items-center gap-1"><Clock className="w-4 h-4 text-gray-400" /> Begins: {dayjs(examStart).format('MMM DD, YYYY · h:mm A')}</p>
                    <p className="font-medium text-brand-dark/80 flex items-center gap-1"><Clock className="w-4 h-4 text-gray-400" /> Closes: {dayjs(examEnd).format('MMM DD, YYYY · h:mm A')}</p>
                    <div className="pt-2 border-t border-gray-200 flex justify-between select-none text-[11px] font-black uppercase tracking-wider text-brand-primary">
                      <span>Total MCQs scale: {examQuestions.length} Questions</span>
                      <span>Total Marks weight: {examQuestions.reduce((sum, q) => sum + q.marks, 0)} Points</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Bottom buttons */}
            <div className="p-6 border-t border-gray-150 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (createStep === 1) setIsCreateOpen(false);
                  else setCreateStep(createStep - 1);
                }}
                className="rounded-xl border border-gray-200 px-5 py-3 text-xs font-bold text-brand-dark hover:bg-gray-50 transition-colors uppercase tracking-wide"
              >
                {createStep === 1 ? 'Cancel constructor' : '← Back Step'}
              </button>

              {createStep < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    setTimelineError(null);
                    // validation triggers
                    if (createStep === 1) {
                      if (!examTitle.trim() || !examStart || !examEnd) {
                        setTimelineError('Please input title and durations.');
                        return;
                      }

                      // Validate timelines
                      const now = dayjs();
                      const start = dayjs(examStart);
                      const end = dayjs(examEnd);
                      
                      if (start.isBefore(now.subtract(5, 'minute'))) {
                        setTimelineError('Starting date and time cannot be in the past.');
                        return;
                      }
                      if (start.isAfter(now.add(3, 'day').endOf('day'))) {
                        setTimelineError('Starting date cannot be more than 3 days from current time.');
                        return;
                      }
                      if (end.isBefore(start) || end.isSame(start)) {
                        setTimelineError('Ending date and time cannot be before or same as starting date and time.');
                        return;
                      }
                      if (end.isAfter(start.add(1, 'week').endOf('day'))) {
                        setTimelineError('Ending date cannot exceed 1 week from starting date.');
                        return;
                      }
                    }
                    if (createStep === 2) {
                      const invalid = examQuestions.some(q => !q.text.trim() || q.options.some(o => !o.trim()));
                      if (invalid) {
                        setTimelineError('Questions prompts option choices cannot reside blank.');
                        return;
                      }
                    }
                    setCreateStep(createStep + 1);
                  }}
                  className="rounded-xl bg-[#143642] hover:bg-[#204958] text-white px-6 py-3 text-xs font-bold transition-colors uppercase tracking-wide"
                >
                  Continue Step →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePublishExam}
                  className="rounded-xl bg-[#0F8B8D] hover:bg-[#0a7173] text-white px-6 py-3 text-xs font-black tracking-wide uppercase shadow-md animate-pulse"
                >
                  Publish Assessment Paper ✓
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
