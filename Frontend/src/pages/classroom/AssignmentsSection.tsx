import React, { useState } from 'react';
import { api } from '../../api';
import { useAppStore } from '../../store';
import { Assignment } from '../../types';
import { 
  FileText, Calendar, Clock, ArrowLeft, Trash2,
  Download, Paperclip, UploadCloud, X, AlertCircle, Save
} from 'lucide-react';
import dayjs from 'dayjs';
 
interface AssignmentsSectionProps {
  classId: string;
  isCreator: boolean;
}


export default function AssignmentsSection({ classId , isCreator  }: AssignmentsSectionProps) {
  
  const currentUser = useAppStore(state => state.currentUser);
  const rawAssignments = useAppStore(state => state.assignments);
  const assignments = React.useMemo(() => rawAssignments.filter(a => a.classId === classId), [rawAssignments, classId]);
  
  const assignmentSubmissionsList = useAppStore(s => s.assignmentSubmissionsList);

  // const gradeSubmission = useAppStore(state => state.gradeSubmission);
  const submitAssignment = useAppStore(state => state.submitAssignment);
  const createAssignment = useAppStore(state => state.createAssignment);
  const addToast = useAppStore(state => state.addToast);

  const fetchAssignmentSubmissions = useAppStore(s => s.fetchAssignmentSubmissions);
  const gradeAssignmentSubmission  = useAppStore(s => s.gradeAssignmentSubmission);
  const getMyAssignmentSubmission  = useAppStore(s => s.getMyAssignmentSubmission);
  const deleteAssignment  = useAppStore(s => s.deleteAssignment);

  // const isTeacher = currentUser?.role === 'teacher';

  // Navigation sub-view togglers
  const [currentView, setCurrentView] = useState<'list' | 'submissions'>('list');
  const [selectedAssignId, setSelectedAssignId] = useState<string | null>(null);

  // Submissions lists search & graded filter
  // const [subSearch, setSubSearch] = useState('');
  // const [subGradedFilter, setSubGradedFilter] = useState<'all' | 'graded' | 'pending'>('all');

  // Teacher Create form states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignStart, setAssignStart] = useState('');
  const [assignEnd, setAssignEnd] = useState('');
  const [assignTotalMarks, setAssignTotalMarks] = useState<number | string>(100);
  const [assignAttachedName, setAssignAttachedName] = useState('');
  const [assignFile, setAssignFile] = useState<File | null>(null);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  // Student upload forms state
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [homeworkName, setHomeworkName] = useState('');
  const [homeworkSize, setHomeworkSize] = useState('');
  const [submittingFile, setSubmittingFile] = useState<File | null>(null);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submitProgressing, setSubmitProgressing] = useState(false);
  const [submitConfirmDialog, setSubmitConfirmDialog] = useState(false);

  const [creating, setCreating] = useState(false);

  // Temporary scores typing states for spreadsheet inputs
  // const [marksState, setMarksState] = useState<Record<string, number>>({});

   // Member submit form
  // const [isSubmitOpen,    setIsSubmitOpen]    = useState(false);
  // const [submittingFile,  setSubmittingFile]  = useState<File | null>(null);
  const [submitting,      setSubmitting]      = useState(false);
  const [submitConfirm,   setSubmitConfirm]   = useState(false);
  const [mySubmissions,   setMySubmissions]   = useState<Record<string, any>>({});
 
  // Grading
  const [marksState, setMarksState] = useState<Record<number, number | string>>({});  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [subSearch,   setSubSearch]   = useState('');
  const [subFilter,   setSubFilter]   = useState<'all' | 'graded' | 'pending'>('all');

  const getStatus = (a: Assignment): 'upcoming' | 'active' | 'ended' => {
    const now = dayjs();
    if (now.isBefore(dayjs(a.startTime))) return 'upcoming';
    if (now.isAfter(dayjs(a.endTime)))    return 'ended';
    return 'active';
  };
 

  // const getMySubmission = (assignId: string) => {
  //   return submissions.find(s => s.assignmentId === assignId && s.studentId === currentUser?.id);
  // };

  const handleTeacherCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimelineError(null);

    if (!assignTitle.trim() || !assignStart || !assignEnd || !assignTotalMarks) {
      setTimelineError('Please input title, durations, and marks weight.');
      return;
    }

    if (assignAttachedName && !/\.(pdf|docx?|xlsx?|jpe?g|png|webp)$/i.test(assignAttachedName)) {
      setTimelineError('Invalid question file type. Upload doc, pdf, excel, or images only.');
      return;
    }

    // Validate timelines
    const now = dayjs();
    const start = dayjs(assignStart);
    const end = dayjs(assignEnd);
    
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

    if (!assignFile) {
      setTimelineError('Please select a worksheet file to upload.');
      return;
    }

    createAssignment(classId, {
      classId,
      title: assignTitle,
      description: assignDesc,
      startTime: new Date(assignStart).toISOString(),
      endTime: new Date(assignEnd).toISOString(),
      totalMarks: Number(assignTotalMarks) || 0,
      attachedFileName: assignAttachedName || 'undefined',
      attachedFileSize: assignAttachedName ? '1.5 MB' : undefined
    }, assignFile);

    addToast('Assignment task created successfully!', 'success');
    
    // reset
    setAssignTitle('');
    setAssignDesc('');
    setAssignStart('');
    setAssignEnd('');
    setAssignTotalMarks(0);
    setAssignAttachedName('');
    setAssignFile(null);
    setTimelineError(null);
    setIsCreateOpen(false);
  };

  // Student Homework submission operations
  // const handleStudentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     const file = e.target.files[0];
  //     if (file.size > 20 * 1024 * 1024) {
  //       addToast('File too large. Max 20MB allowed.', 'error');
  //       return;
  //     }
  //     setSubmittingFile(file);
  //     setHomeworkName(file.name);
  //     setHomeworkSize((file.size / (1024 * 1024)).toFixed(1) + ' MB');
  //   }
  // };

  // const triggerStudentSubmitSubmit = () => {
  //   if (!selectedAssignId || !homeworkName) return;
    
  //   setSubmitProgressing(true);
  //   setSubmitProgress(10);
    
  //   const interval = setInterval(() => {
  //     setSubmitProgress((prev) => {
  //       if (prev >= 100) {
  //         clearInterval(interval);
  //         setTimeout(() => {
  //           submitAssignment(classId, selectedAssignId, homeworkName, homeworkSize, submittingFile!);
  //           addToast('Assignment submitted successfully!', 'success');
  //           setSubmitProgressing(false);
  //           setSubmittingFile(null);
  //           setHomeworkName('');
  //           setHomeworkSize('');
  //           setIsSubmitOpen(false);
  //           setSubmitConfirmDialog(false);
  //         }, 300);
  //         return 100;
  //       }
  //       return prev + 20;
  //     });
  //   }, 120);
  // };

  // const getSubmissionsFiltered = (assignId: string) => {
  //   const list = submissions.filter(s => s.assignmentId === assignId);
  //   return list.filter(sub => {
  //     // search
  //     const matchesSearch = sub.studentName.toLowerCase().includes(subSearch.toLowerCase()) || 
  //                           sub.studentEmail.toLowerCase().includes(subSearch.toLowerCase());
  //     // graded
  //     if (subGradedFilter === 'graded') return matchesSearch && sub.graded;
  //     if (subGradedFilter === 'pending') return matchesSearch && !sub.graded;
  //     return matchesSearch;
  //   });
  // };

  // const selectAssign = assignments.find(a => a.id === selectedAssignId);


  // ── Creator: open submissions ─────────────────────────────────
  const openSubmissions = async (assignId: string) => {
    setSelectedAssignId(assignId);
    await fetchAssignmentSubmissions(classId, assignId);
    setCurrentView('submissions');
  };
 
  // ── Member: fetch my submission status ───────────────────────
  const loadMySubmission = async (assignId: string) => {
    if (mySubmissions[assignId] !== undefined) return;
    const res = await getMyAssignmentSubmission(classId, assignId);
    setMySubmissions(prev => ({ ...prev, [assignId]: res }));
  };
 
  React.useEffect(() => {
    if (!isCreator) {
      assignments.forEach(a => loadMySubmission(a.id));
    }
  }, [assignments.length, isCreator]);
 
  // ── Member: submit ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!submittingFile || !selectedAssignId) return;
    setSubmitting(true);
    try {
      await submitAssignment(classId, selectedAssignId, submittingFile);
      setMySubmissions(prev => ({ ...prev, [selectedAssignId]: { submitted: true } }));
      setIsSubmitOpen(false); setSubmitConfirm(false); setSubmittingFile(null);
    } catch { /* toast shown in store */ }
    finally { setSubmitting(false); }
  };
 

  // ── Download question file ────────────────────────────────────
  // FIX: Use blob to force download instead of browser tab preview
  const downloadFile = async (url: string | null | undefined, fileName: string) => {
    if (!url) { addToast('Download link not available', 'error'); return; }
    try {
      addToast('Downloading...', 'info');
      await api.downloadFileAsBlob(url, fileName);
    } catch { addToast('Download failed', 'error'); }
  };
 
  const downloadSubmission = async (url: string | null | undefined, fileName: string) => {
    if (!url) { addToast('Download link not available', 'error'); return; }
    try {
      addToast('Downloading...', 'info');
      await api.downloadFileAsBlob(url, fileName);
    } catch { addToast('Download failed', 'error'); }
  };
 
  const selectedAssign = assignments.find(a => a.id === selectedAssignId);
  const filteredSubs = assignmentSubmissionsList.filter(s => {
    const matchSearch = s.member_name?.toLowerCase().includes(subSearch.toLowerCase());
    if (subFilter === 'graded')  return matchSearch && s.marks != null;
    if (subFilter === 'pending') return matchSearch && s.marks == null;
    return matchSearch;
  });



  return (
    <div className="space-y-6 text-left" id="assignments-section-container">
      
      {/* ──────────────────────────────────────────────────────── */}
      {/* A. ASSIGNMENTS DASHBOARD LIST */}
      {/* ──────────────────────────────────────────────────────── */}
      {currentView === 'list' && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4" id="assign-list-header">
            <div className="space-y-1">
              <h2 className="font-serif font-bold text-2xl text-brand-dark flex items-center gap-2">
                📋 Project Assignments
              </h2>
              <p className="text-xs text-brand-dark/65 font-semibold uppercase tracking-wider">
                Upload homework papers, projects, or view grading marks.
              </p>
            </div>
            {isCreator  && (
              <button
                onClick={() => { setIsCreateOpen(true); setTimelineError(null); }}
                className="bg-[#0F8B8D] text-white hover:bg-[#0a7173] font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-transform hover:scale-[1.01]"
              >
                + Create Assignment
              </button>
            )}
          </div>

          {/* Cards list */}
          {assignments.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl shadow-sm border border-gray-150" id="assignments-empty-layout">
              <div className="w-16 h-16 bg-brand-light/30 flex items-center justify-center rounded-full mx-auto text-brand-dark/40 mb-4">
                <FileText className="w-8 h-8 font-thin" />
              </div>
              <h4 className="font-display font-bold text-brand-dark text-base mb-1">
                No Assignments Listed
              </h4>
              <p className="text-xs text-brand-dark/60 font-sans max-w-xs mx-auto leading-relaxed font-medium">
                {isCreator  
                  ? 'Publish homework tasks complete with attachments worksheets and deadline times.' 
                  : 'Great news! No homework sheets are pending here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="assignments-grid-row">
              {assignments.map(ass => {
                const status = getStatus(ass);
                const sub = mySubmissions[ass.id];

                console.log("ASSIGNMENT OBJECT", ass);

               console.log("assignment", ass.id);
                console.log("submission", mySubmissions[ass.id]);
                console.log(
                  "submission student",
                  mySubmissions[ass.id]?.studentId
                );
                console.log(
                  "current user",
                  currentUser?.id
                );

                let statusBadge = 'bg-[#EC9A29]/15 text-[#EC9A29]';
                let statusLabel = '🟡 Upcoming';
                let accentBorder = 'border-t-4 border-[#EC9A29]';

                if (status === 'active') {
                  statusBadge = 'bg-[#0F8B8D]/15 text-[#0F8B8D]';
                  statusLabel = '🟢 Active Current';
                  accentBorder = 'border-t-4 border-[#0F8B8D]';
                } else if (status === 'ended') {
                  statusBadge = 'bg-gray-100 text-gray-500';
                  statusLabel = '⬜ Closed';
                  accentBorder = 'border-t-4 border-gray-400';
                }

                return (
                  <div 
                    key={ass.id}
                    className={`bg-white rounded-2xl shadow-md overflow-hidden border border-gray-155 flex flex-col justify-between ${accentBorder}`}
                    id={`assign-card-${ass.id}`}
                  >
                    <div className="p-6 space-y-4">
                      
                      {/* Top labels */}
                      <div className="flex justify-between items-start gap-4">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${statusBadge}`}>
                          {statusLabel}
                        </span>
                        <span className="text-xs font-bold text-brand-dark/65 flex items-center gap-1.5 font-mono">
                          📊 Max Points: {ass.totalMarks}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-display font-black text-brand-dark text-base uppercase leading-snug">
                          {ass.title}
                        </h3>
                        <p className="text-xs text-brand-dark/70 font-sans line-clamp-2 leading-relaxed">
                          {ass.description}
                        </p>
                      </div>

                      {/* Attached material questions pdf if any */}
                      {ass.attachedFileName && (
                        <div className="inline-flex items-center gap-2 bg-[#143642]/5 border border-[#143642]/10 p-2.5 rounded-xl text-xs font-semibold text-brand-dark">
                          <Paperclip className="w-4 h-4 text-brand-primary" />
                          <span className="truncate max-w-[150px]">{ass.attachedFileName}</span>
                          <button
                                onClick={() =>
                                  downloadFile(
                                      ass.downloadUrl || '',
                                      ass.attachedFileName || 'worksheet'
                                    )
                                }
                              >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Duration timeline */}
                      <div className="pt-2 border-t border-gray-50 flex flex-col gap-2 text-xs text-brand-dark/75 font-semibold">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" /> Start: {dayjs(ass.startTime).format('MMM DD, YYYY · h:mm A')}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" /> Close: {dayjs(ass.endTime).format('MMM DD, YYYY · h:mm A')}</span>
                      </div>

                    </div>

                    {/* Bottom footer button bar */}
                    <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-between items-center">
                      <div>
                        {isCreator  ?                            
(
                          <span className="text-xs font-bold text-brand-dark/65 select-none">
                            
                            {/* 👤 {ass.submissionsCount} papers submitted */}
                          </span>
                        ) : sub?.submitted ? (
                          <div className="flex flex-col text-[#0F8B8D]">
                            <span className="text-xs font-bold flex items-center gap-1 select-none">✓ Submitted file</span>
                            <span className="text-[10px] truncate max-w-[120px] font-mono leading-tight">{sub?.submittedFileName}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-brand-dark/50 select-none">Pending submit</span>
                        )}
                      </div>

                      <div id={`assign-actions-footer-${ass.id}`}>
  {isCreator ? (
    <>
      <div className="flex gap-2">
      <button
  onClick={() => openSubmissions(ass.id)}
  className="bg-[#0F8B8D] hover:bg-[#0a7173] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
>
  Grade Papers
</button>

        <button
          onClick={() => setDeleteConfirmId(ass.id)}
          className="bg-[#A8201A] hover:bg-[#8a1b16] text-white text-xs font-bold px-3 py-2 rounded-xl"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {deleteConfirmId === ass.id && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={async () => {
              await deleteAssignment(classId, ass.id);
              setDeleteConfirmId(null);
            }}
            className="bg-[#A8201A] text-white text-xs px-3 py-1 rounded"
          >
            Confirm Delete
          </button>

          <button
            onClick={() => setDeleteConfirmId(null)}
            className="border text-xs px-3 py-1 rounded"
          >
            Cancel
          </button>
        </div>
      )}
    </>
  ) 
 : (
                          // Student submit controls
                          <>
                            {status === 'upcoming' && <span className="text-xs font-bold text-gray-400">Locked</span>}
                            {status === 'active' && (!sub || !sub?.submitted) && (                              <button
                                onClick={() => { setSelectedAssignId(ass.id); setIsSubmitOpen(true); }}
                                className="bg-[#0F8B8D] hover:bg-[#0a7173] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md animate-pulse shrink-0"
                              >
                                Submit Homework →
                              </button>
                            )}
                            {status === 'active' && sub?.submitted && (                             
                               <span className="text-xs font-bold text-gray-400 select-none">Submitted ✓</span>
                            )}
                            {status === 'ended' && sub && (
                              <div className="text-right">
                                {sub.marks !== null ? (
                                  <span className="text-xs font-bold text-brand-primary">
                                    Grade: {sub.marks} / {ass.totalMarks}
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-[#EC9A29]">
                                    Not Graded Yet
                                  </span>
                                )}
                              </div>
                            )}
                            {status === 'ended' && !sub && (
                              <span className="text-xs font-bold text-[#A8201A]">Missed deadline</span>
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
      {/* B. TEACHER GRADING WORKSPACE SPREADSHEEET TABLE */}
      {/* ──────────────────────────────────────────────────────── */}
      {currentView === 'submissions' && selectedAssign  && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-150 space-y-6 text-left" id="grading-spreadsheet-panel">
          
          <button
            onClick={() => { setCurrentView('list'); setSelectedAssignId(null); }}
            className="text-xs text-brand-primary font-bold hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Homework list
          </button>

          {/* Title Banner */}
          <div className="border-b border-gray-150 pb-5 space-y-1 select-none">
            <span className="text-[9px] bg-brand-primary/10 text-brand-primary font-black uppercase tracking-widest px-2.5 py-1 rounded-full">Homework grading spreadsheet matrix</span>
            <h2 className="font-display font-black text-2xl text-brand-dark uppercase tracking-wide pt-1">
              {selectedAssign .title} — Submissions
            </h2>
          </div>

          {/* Filters row */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-1" id="grading-dashboard-filters">
            <input
              type="text"
              value={subSearch}
              onChange={(e) => setSubSearch(e.target.value)}
              placeholder="Search member submission..."
              className="w-full sm:max-w-xs border p-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]"
            />
            <div className="flex gap-2.5 text-xs font-bold text-brand-dark items-center" id="grading-filter">
              <span>Status filter:</span>
              <div className="inline-flex border rounded-xl overflow-hidden bg-gray-50 border-gray-150">
                {(['all', 'graded', 'pending'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSubFilter(tab)}
                    className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${
                      subFilter === tab ? 'bg-[#143642] text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submissions data table */}
          {filteredSubs.length === 0 ? (
            <div className="p-12 text-center text-xs font-semibold text-gray-400">
              No homework paper submissions found matching criteria.
            </div>
          ) : (
            <div className="overflow-x-auto" id="grading-spreadtable-outer">
              <table className="w-full text-left font-sans text-sm border-collapse" id="grading-table">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-brand-dark/70 font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Member Subscriber</th>
                    <th className="py-4 px-4">Uploaded File</th>
                    <th className="py-4 px-4">Submission Date</th>
                    <th className="py-4 px-4 text-center">Score Marks</th>
                    <th className="py-4 px-6 text-right">Action Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredSubs.map((sub, idx) => {
                    const typedMark = marksState[sub.id] ?? String(sub.marks ?? '');
                    console.log("typedMark:", typedMark);
                    return (
                      <tr key={sub.id} className="hover:bg-brand-light/30 transition-colors" id={`grading-row-${sub.id}`}>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-dark text-white rounded-full font-bold text-xs flex items-center justify-center shrink-0 select-none">
                              {sub.member_name?.[0] || "?"}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-brand-dark">{sub.member_name}</div>
                              <div className="text-[9px] text-gray-400 font-mono leading-tight">  User ID: {sub.user_id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 font-mono font-bold text-xs text-brand-primary">
                          <div className="flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate max-w-[130px]" title={sub?.answer_file_name}>
                              {sub?.answer_file_name}
                            </span>
                           <button
                                    onClick={() =>
                                      downloadSubmission(
                                        sub.answer_download_url,
                                        sub?.answer_file_name
                                      )
                                    }
                                  >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-xs text-brand-dark/70">
                          {dayjs(sub.submitted_at).format('DD/MM/YYYY')}
                        </td>

                        <td className="py-4 px-4 text-center">
  {/* Marks numerical input block */}
  <div className="inline-flex items-center gap-1.5 justify-center w-full">
    <input
      type="number"
      min={0}
      max={selectedAssign.totalMarks}
      value={marksState[sub.id] ?? (sub.marks ?? '')} // 👈 Correctly tracks this student's input state
      onChange={(e) => {
        const val = e.target.value;
        // Updates the individual student score state dynamically
        setMarksState(prev => ({ ...prev, [sub.id]: val }));
      }}
      placeholder="0"
      className="w-16 rounded-xl border border-gray-200 p-2 text-xs text-center font-bold focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
    />
    <span className="text-xs text-gray-400 font-semibold font-mono">
      / {selectedAssign.totalMarks}
    </span>
  </div>
</td>

                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => {
                                        const mark = Number(typedMark || 0);

                                      if (mark < 0) {
                                        addToast("Marks cannot be negative", "error");
                                        return;
                                      }

                                      if (mark > selectedAssign.totalMarks) {
                                        addToast(
                                          `Maximum marks allowed is ${selectedAssign.totalMarks}`,
                                          "error"
                                        );
                                        return;
                                      }

                                      gradeAssignmentSubmission(
                                        classId,
                                        selectedAssign.id,
                                        String(sub.id),
                                        mark
                                      );
                              addToast(`Grade ${typedMark} saved for ${sub.member_name}`, 'success');
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 inline-flex ${
                              sub.graded && typedMark === sub.marks
                                ? 'bg-gray-100 text-gray-400 border cursor-not-allowed shadow-none'
                                : 'bg-[#0F8B8D] text-white hover:bg-[#0a7173] scale-100 active:scale-95'
                            }`}
                          >
                            <Save className="w-3.5 h-3.5" />
                            {sub.marks !== null && typedMark === sub.marks ? 'Saved ✓' : 'Save'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}


      {/* ──────────────────────────────────────────────────────── */}
      {/* C. TEACHER CREATE ASSIGNMENT POPUP MODAL */}
      {/* ──────────────────────────────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="create-assignment-modal">
          <div className="fixed inset-0 bg-[#143642]/65 backdrop-blur-sm" />
          <form 
            onSubmit={handleTeacherCreateSubmit}
            className="bg-white rounded-2xl shadow-xl relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-5 text-left font-sans" id="create-assign-form"
          >
            <div className="border-b border-gray-150 pb-3 flex justify-between items-center select-none">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#0F8B8D]">Interactive project constructor</span>
                <h3 className="font-display font-black text-brand-dark text-base uppercase tracking-wide">Publish Homework Assignment</h3>
              </div>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="text-gray-400 text-lg leading-none font-bold">×</button>
            </div>

            <div className="space-y-4">
              {timelineError && (
                <div className="bg-[#A8201A]/10 border border-[#A8201A] text-[#A8201A] p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-bold" id="assignment-timeline-error">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{timelineError}</span>
                </div>
              )}

              <div className="space-y-1 bg-[#EC9A29]/10 border border-[#EC9A29]/30 p-4 rounded-xl text-xs font-semibold text-brand-dark/95 leading-normal">
                <p className="font-bold text-[#EC9A29] mb-1">📅 Timeline Rules & Requirements:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Start date must be from current time up to max 3 days in the future.</li>
                  <li>End date must be after start date and max 1 week from start date.</li>
                </ul>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-dark mb-1 ml-0.5 uppercase tracking-wide">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="e.g. Vectors Trigonometry Homework"
                  className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-dark mb-1 ml-0.5 uppercase tracking-wide">Instructions / Guidelines</label>
                <textarea
                  rows={3}
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  placeholder="Download Worksheet and scan responses back onto pdf..."
                  className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pb-1">
                <div>
                  <label className="block text-[10px] font-bold text-brand-dark mb-1 ml-0.5 uppercase tracking-wide">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={assignStart}
                    onChange={(e) => setAssignStart(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-dark mb-1 ml-0.5 uppercase tracking-wide">End Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={assignEnd}
                    onChange={(e) => setAssignEnd(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[10px] font-bold text-brand-dark mb-1 ml-0.5 uppercase tracking-wide">Upload Worksheet (doc, pdf, excel, image) *</label>
                  <div className="relative border border-dashed border-gray-300 rounded-xl p-2 bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          if (!/\.(pdf|docx?|xlsx?|jpe?g|png|webp)$/i.test(file.name)) {
                            addToast('Invalid file format. Upload doc, pdf, excel, or images.', 'error');
                            return;
                          }
                          setAssignAttachedName(file.name);
                          setAssignFile(file);
                          addToast(`Worksheet selected: ${file.name}`, 'info');
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                    />
                    <span className="text-[10px] font-bold text-brand-primary truncate max-w-[150px]">
                      {assignAttachedName || "Select Worksheet file"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-dark mb-1 ml-0.5 uppercase tracking-wide">Total Score Marks</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    required
                    value={assignTotalMarks}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') setAssignTotalMarks('');
                      else {
                        const num = parseInt(val, 10);
                        setAssignTotalMarks(isNaN(num) ? '' : num);
                      }
                    }}
                    className="w-full rounded-xl border border-gray-200 p-3 text-xs text-center font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-4">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="flex-1 rounded-xl border py-3 text-xs font-bold text-brand-dark hover:bg-gray-50 uppercase tracking-wide"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#0F8B8D] text-white font-bold py-3 text-xs hover:bg-[#0a7173] uppercase tracking-wide shadow-md"
              >
                Publish Assignment
              </button>
            </div>
          </form>
        </div>
      )}


      {/* ──────────────────────────────────────────────────────── */}
      {/* D. STUDENT HOMEWORK FILE SUBMISSION POPUP MODAL */}
      {/* ──────────────────────────────────────────────────────── */}
      {isSubmitOpen && selectedAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="submit-homework-modal">
          <div className="fixed inset-0 bg-[#143642]/65 backdrop-blur-sm" />
          <div className="bg-white rounded-2xl shadow-xl relative z-10 w-full max-w-md p-6 md:p-8 space-y-5 text-left font-sans" id="submit-homework-card">
            
            <div className="border-b border-gray-150 pb-3 flex justify-between items-center select-none">
              <div className="space-y-1">
                <span className="text-[9px] bg-brand-primary/10 text-brand-primary font-black uppercase tracking-wider px-2.5 py-1 rounded-full">Secure submission gateway</span>
                <h3 className="font-display font-black text-brand-dark text-base uppercase tracking-wide">Submit Verification project</h3>
              </div>
              <button 
                type="button" 
                onClick={() => !submitProgressing && setIsSubmitOpen(false)} 
                className="text-gray-400 text-lg leading-none font-bold"
                disabled={submitProgressing}
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-brand-light/35 border border-brand-light px-4 py-3 rounded-xl flex items-start gap-1.5 text-xs text-brand-dark leading-relaxed font-semibold">
                <Clock className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                <span>Deadline Close reminder:<br /><strong>{dayjs(selectedAssign.endTime).format('MMM DD, YYYY · h:mm A')}</strong></span>
              </div>

              {/* Drag click box mock upload file selector */}
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-gray-50 flex flex-col items-center text-center justify-center relative cursor-pointer hover:bg-[#0F8B8D]/5 hover:border-brand-primary transition-all">
                <input
                  type="file"
                  required
                  onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  const file = e.target.files[0];

                                  setSubmittingFile(file);
                                  setHomeworkName(file.name);
                                  setHomeworkSize(
                                    (file.size / (1024 * 1024)).toFixed(2) + ' MB'
                                  );
                                }
                              }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  disabled={submitProgressing}
                />
                
                <UploadCloud className="w-8 h-8 text-brand-primary mb-2" />
                <p className="text-xs font-bold text-brand-dark">Click or Drag scanned PDF homework here</p>
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mt-1">PDF, DOCX, JPG — Max 20MB</p>
              </div>

              {homeworkName && (
                <div className="bg-brand-light/20 border p-3 rounded-xl flex items-center justify-between text-xs text-brand-dark font-medium select-none animate-fade-in">
                  <div className="flex items-center gap-1.5 min-w-0 pr-4">
                    <Paperclip className="w-4 h-4 shrink-0 text-brand-primary" />
                    <span className="truncate block font-semibold">{homeworkName}</span>
                    <span className="text-[10px] text-gray-400 font-mono font-bold">({homeworkSize})</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setHomeworkName(''); setHomeworkSize(''); setSubmittingFile(null); }}
                    className="p-1 hover:bg-gray-200 rounded text-[#A8201A]"
                    disabled={submitProgressing}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="bg-[#A8201A]/5 border border-[#A8201A]/20 p-3 rounded-xl flex items-center gap-2 text-[10px] font-bold text-[#A8201A] uppercase select-none tracking-wide">
                <span>⚠️ Note: Once submitted, you cannot reupload. Please verify document integrity.</span>
              </div>
            </div>

            {submitProgressing && (
              <div className="space-y-1.5" id="hw-progress">
                <div className="flex justify-between text-[10px] font-bold text-brand-dark">
                  <span>Uploading submission document...</span>
                  <span>{submitProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-primary transition-all duration-300" style={{ width: `${submitProgress}%` }} />
                </div>
              </div>
            )}

            <div className="flex gap-2.5 pt-2" id="student-submit-trigger-buttons">
              <button
                type="button"
                onClick={() => setIsSubmitOpen(false)}
                className="flex-1 rounded-xl border py-3 text-xs font-bold text-brand-dark hover:bg-gray-50 uppercase tracking-wide"
                disabled={submitProgressing}
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => setSubmitConfirmDialog(true)}
                disabled={submitProgressing || !homeworkName}
                className={`flex-1 rounded-xl py-3 text-xs font-bold text-white uppercase tracking-wide shadow-md ${
                  submitProgressing || !homeworkName
                    ? 'bg-gray-300 cursor-not-allowed shadow-none'
                    : 'bg-[#0F8B8D] hover:bg-[#0a7173]'
                }`}
              >
                Submit Project
              </button>
            </div>

          </div>

          {/* SECOND Student Submit Confirm Dial */}
          {submitConfirmDialog && (
            <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-[#143642]/65 backdrop-blur-sm" />
              <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm relative z-10 text-center space-y-4">
                <div className="w-14 h-14 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary mx-auto mb-1">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-lg text-brand-dark">Confirms Submission File?</h3>
                <p className="text-xs text-brand-dark/70 font-semibold leading-relaxed font-sans">
                  Are you 100% sure you want to submit <span className="font-bold underline text-[#143642]">{homeworkName}</span> as your final evaluation paper?
                </p>
                <div className="flex gap-2 mt-4 w-full">
                  <button 
                    onClick={() => setSubmitConfirmDialog(false)}
                    className="flex-1 rounded-xl border py-2 text-xs font-bold text-brand-dark hover:bg-gray-50"
                  >
                    Go Back
                  </button>
                  <button 
                    onClick={handleSubmit} disabled={submitting}
                    className="flex-1 rounded-xl bg-[#0F8B8D] text-white py-2 text-xs font-bold hover:bg-[#0a7173]"
                  >
                    {submitting ? 'Submitting...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
