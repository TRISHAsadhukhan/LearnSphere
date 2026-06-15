import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Copy, RotateCw, Trash2, LogOut, Check, X, Menu,
  FileText, ClipboardList, Megaphone, Users, Award, BookOpen, Settings
} from 'lucide-react';
import { useAppStore } from '../store';
import AppNavbar from '../components/AppNavbar';

// Subviews
import MaterialsSection from './classroom/MaterialsSection';
import ExamsSection from './classroom/ExamsSection';
import AssignmentsSection from './classroom/AssignmentsSection';
import NoticesSection from './classroom/NoticesSection';
import ManageMembersSection from './classroom/ManageMembersSection';
import MyScoresSection from './classroom/MyScoresSection';

export default function ClassroomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const currentUser = useAppStore(state => state.currentUser);
  const classrooms = useAppStore(state => state.classrooms);
  const classroom = React.useMemo(() => classrooms.find(c => c.id === id), [classrooms, id]);
  const regenerateKey = useAppStore(state => state.regenerateRoomKey);
  const deleteClassroom = useAppStore(state => state.deleteClassroom);
  const leaveClassroom = useAppStore(state => state.leaveClassroom);
  const addToast = useAppStore(state => state.addToast);

  const isTeacher = classroom ? classroom.creatorId === currentUser?.id : false;

  const [activeView, setActiveView] = useState<'materials' | 'exams' | 'assignments' | 'notices' | 'members' | 'scores'>('materials');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile toggler

  // Warning Modals States
  const [keyRegenConfirm, setKeyRegenConfirm] = useState(false);
  const [dangerModalMode, setDangerModalMode] = useState<'none' | 'delete' | 'leave'>('none');
  const [deleteInputName, setDeleteInputName] = useState('');


  const fetchMaterials = useAppStore(state => state.fetchMaterials);
  const fetchExams = useAppStore(state => state.fetchExams);
  const fetchAssignments = useAppStore(state => state.fetchAssignments);
  const fetchNotices = useAppStore(state => state.fetchNotices);
  const fetchClassroomMembers = useAppStore(state => state.fetchClassroomMembers);
  const fetchMyScores = useAppStore(state => state.fetchMyScores);
  const fetchMemberExamHistory = useAppStore(state => state.fetchMemberExamHistory);

  useEffect(() => {
    if (classroom) {
      fetchMaterials(classroom.id);
      fetchExams(classroom.id);
      fetchAssignments(classroom.id);
      fetchNotices(classroom.id);
      fetchClassroomMembers(classroom.id);
      fetchMyScores(classroom.id);
      if (!isTeacher) fetchMemberExamHistory(classroom.id);
    }
  }, [classroom, isTeacher, fetchMaterials, fetchExams, fetchAssignments, fetchNotices, fetchClassroomMembers, fetchMyScores, fetchMemberExamHistory]);

  // Fallback check
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!classroom) {
      addToast('Classroom not found or you do not have permission to view it.', 'error');
      navigate('/dashboard');
    }
  }, [classroom, currentUser, navigate]);

  if (!classroom) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(classroom.roomKey);
    addToast('Room Key copied to your clipboard!', 'success');
  };

  const handleRegenKeyConfirm = async () => {
    await regenerateKey(classroom.id);
    setKeyRegenConfirm(false);
  };

  const handleClassroomDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteInputName.trim() !== classroom.name) {
      addToast('Classroom name characters do not match spelling spelling exactly.', 'warning');
      return;
    }

    deleteClassroom(classroom.id);
    addToast(`Classroom "${classroom.name}" deleted permanently.`, 'error');
    setDangerModalMode('none');
    setDeleteInputName('');
    navigate('/dashboard');
  };

  const handleLeaveClassSubmit = () => {
    leaveClassroom(classroom.id);
    addToast('You parted ways with this classroom.', 'info');
    setDangerModalMode('none');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-brand-light/35 pt-16 flex font-sans" id="classroom-panel-viewport">

      {/* 1. Global NavBar (Search disabled since we are inside detailed classroom space) */}
      <AppNavbar showSearch={false} />

      {/* Mobile Drawer trigger Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-4 left-4 z-40 bg-[#143642] text-white p-3.5 rounded-xl block md:hidden hover:scale-105 active:scale-95 shadow-xl transition-all cursor-pointer border border-[#0F8B8D]/30"
        aria-label="Open navigation sidebar"
      >
        <Menu className="w-5.5 h-5.5" />
      </button>

      {/* 2. Collapsible Left Sidebar Layout in matching Cosmic palette colors */}
      <aside
        className={`fixed inset-y-0 left-0 md:sticky md:top-16 z-30 w-72 bg-[#143642] border-r border-[#0F8B8D]/15 h-[calc(100vh-64px)] flex flex-col justify-between select-none transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        id="classroom-aside-navigation-sidebar"
      >
        <div className="space-y-6 flex-1 flex flex-col overflow-y-auto p-5 text-left text-white" id="sidebar-scrollable-contents">

          {/* Header Back button */}
          <div className="flex justify-between items-center pb-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 group select-none cursor-pointer"
            >
              <ArrowLeft className="w-4.5 h-4.5 group-hover:-translate-x-1 transition-transform stroke-3" />
              Back Dashboard
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-white/10 rounded block md:hidden text-white"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Classroom general stats profiles details card */}
          <div className="space-y-2 border-b border-white/10 pb-5" id="classroom-general-card-left">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: classroom.color }}
              />
              <span className="text-[10px] text-white/50 font-black uppercase tracking-wider leading-none">Class details room</span>
            </div>

            <h1 className="font-display font-black text-xl text-white uppercase tracking-wide leading-tight truncate">
              {classroom.name}
            </h1>
            <p className="text-xs text-[#0F8B8D] font-extrabold pb-1 font-sans truncate">{classroom.subject}</p>

            <div className="flex items-center gap-1 text-[11px] font-bold text-white/65 uppercase select-none">
              <Users className="w-4 h-4 text-white/50" />
              {/* {classroom.membersCount} active subscribers */}
            </div>
          </div>

          {/* SECURE KEY CONTAINERS (Gives classroom key copy & regen handles) */}
          {isTeacher && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3" id="room-key-sidebar-widget">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-white/55">
                <span>Secure Room Code Key</span>
                <span className="bg-[#0F8B8D] text-white font-extrabold uppercase px-1.5 py-0.5 rounded text-[8px]">ACTIVE</span>
              </div>

              {/* Visual key text */}
              <div className="flex items-center justify-between bg-black/25 rounded-xl border border-white/5 p-2.5">
                <span className="font-mono font-black text-[#EC9A29] text-base tracking-widest pl-1 leading-none">
                  {classroom.roomKey}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={handleCopyKey}
                    className="p-1.5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Copy room Code Key to your Clipboard"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setKeyRegenConfirm(true)}
                    className="p-1.5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors"
                    title="Regenerate dynamic Room Key for secure privacy"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SIDEBAR NAVIGATION TRIGGER NAVIGATION BUTTONS LIST */}
          <nav className="space-y-1.5 pt-2" id="sidebar-navigation-anchors">
            {[
              { id: 'materials', label: 'Class Materials', icon: FileText },
              { id: 'exams', label: 'MCQ Exam Papers', icon: ClipboardList },
              { id: 'assignments', label: 'Assignments', icon: FileText },
              { id: 'notices', label: 'Annoucements', icon: Megaphone }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveView(item.id as any); setSidebarOpen(false); }}
                  className={`w-full rounded-xl px-4 py-3 text-xs font-bold flex items-center gap-3 transition-colors text-left cursor-pointer ${isActive
                      ? 'bg-[#0F8B8D] text-white shadow-md'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  id={`nav-item-${item.id}`}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  {item.label}
                </button>
              );
            })}

            {/* Special Instructor panel selection link */}
            {isTeacher && (
              <button
                onClick={() => { setActiveView('members'); setSidebarOpen(false); }}
                className={`w-full rounded-xl px-4 py-3 text-xs font-bold flex items-center gap-3 transition-colors text-left cursor-pointer ${activeView === 'members'
                    ? 'bg-[#0F8B8D] text-white shadow-md'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                id="nav-item-members"
              >
                <Users className="w-4.5 h-4.5 shrink-0" />
                Manage Members Roster
              </button>
            )}

            {/* Special Student average evaluation grade ledger link */}
            {!isTeacher && (
              <button
                onClick={() => { setActiveView('scores'); setSidebarOpen(false); }}
                className={`w-full rounded-xl px-4 py-3 text-xs font-bold flex items-center gap-3 transition-colors text-left cursor-pointer ${activeView === 'scores'
                    ? 'bg-[#0F8B8D] text-white shadow-md'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                id="nav-item-scores"
              >
                <Award className="w-4.5 h-4.5 shrink-0" />
                My Scores Ledger
              </button>
            )}
          </nav>

        </div>

        {/* BOTTOM DANGER DANGER ZONE OVERLAYS */}
        <div className="p-5 border-t border-white/5" id="sidebar-footer-danger-zone">
          {isTeacher ? (
            <button
              onClick={() => setDangerModalMode('delete')}
              className="w-full text-left rounded-xl px-4 py-3 text-xs font-bold text-[#A8201A] hover:bg-[#A8201A]/10 transition-colors flex items-center gap-3 cursor-pointer"
            >
              <Trash2 className="w-4.5 h-4.5 shrink-0" />
              Delete Classroom Room
            </button>
          ) : (
            <button
              onClick={() => setDangerModalMode('leave')}
              className="w-full text-left rounded-xl px-4 py-3 text-xs font-bold text-[#A8201A] hover:bg-[#A8201A]/10 transition-colors flex items-center gap-3 cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0 animate-pulse" />
              Leave classroom
            </button>
          )}
        </div>

      </aside>

      {/* 3. Main Workspace Display Board (Scrollable Content frame) */}
      <main className="flex-1 p-6 md:p-8 min-w-0" id="classroom-main-workspace-section">
        <div className="max-w-5xl mx-auto" id="workspace-container">

          {/* Sub view conditional mapping renders */}
          {/* Sub view conditional mapping renders */}
          {activeView === 'materials' && <MaterialsSection classId={classroom.id} />}
          {activeView === 'exams' && <ExamsSection classId={classroom.id} isCreator={isTeacher} />}
          {activeView === 'assignments' && <AssignmentsSection classId={classroom.id} isCreator={isTeacher} />}
          {activeView === 'notices' && <NoticesSection classId={classroom.id} isCreator={isTeacher}/>}
          {activeView === 'members' && isTeacher && <ManageMembersSection classId={classroom.id} />}
          {activeView === 'scores' && !isTeacher && <MyScoresSection classId={classroom.id} />}

        </div>
      </main>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 4. KEY REGENERATE CONFIRMATION DIALOG MODAL */}
      {/* ──────────────────────────────────────────────────────── */}
      {keyRegenConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="regen-modal-overlay">
          <div className="fixed inset-0 bg-[#143642]/65 backdrop-blur-xs" onClick={() => setKeyRegenConfirm(false)} />
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm relative z-10 text-center space-y-4 font-sans">
            <div className="w-14 h-14 bg-[#EC9A29]/15 rounded-full flex items-center justify-center text-[#EC9A29] mx-auto mb-1">
              <RotateCw className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-lg text-brand-dark">Regenerate classroom Key?</h3>
            <p className="text-xs text-brand-dark/70 font-semibold leading-relaxed">
              Are you sure? Once the key is updated, students with old key credentials will be locked out and cannot join unless re-invited.
            </p>
            <div className="flex gap-2.5 mt-4 w-full">
              <button
                onClick={() => setKeyRegenConfirm(false)}
                className="flex-1 rounded-xl border py-2.5 text-xs font-bold text-brand-dark hover:bg-gray-50 uppercase tracking-wide"
              >
                Go Back
              </button>
              <button
                onClick={handleRegenKeyConfirm}
                className="flex-1 rounded-xl bg-[#EC9A29] hover:bg-[#d6851b] text-[#143642] py-2.5 text-xs font-black uppercase tracking-wide shadow-md"
              >
                Confirm regen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 5. CLASS DELETION STRICT SAFETY WORDING CHECK MODAL */}
      {/* ──────────────────────────────────────────────────────── */}
      {dangerModalMode === 'delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans" id="delete-class-modal-overlay">
          <div className="fixed inset-0 bg-[#143642]/65 backdrop-blur-sm" onClick={() => setDangerModalMode('none')} />
          <form
            onSubmit={handleClassroomDeleteSubmit}
            className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 text-center space-y-5"
            id="delete-strict-safety-form"
          >
            <div className="w-14 h-14 bg-[#A8201A]/10 rounded-full flex items-center justify-center text-[#A8201A] mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 text-center select-none">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#A8201A] bg-red-100 px-2.5 py-1 rounded-full">IMMEDIATE DESTRUCTION ACCESS</span>
              <h3 className="font-display font-black text-brand-dark text-lg pt-1">Delete Classroom Permanently?</h3>
              <p className="text-xs text-brand-dark/70 leading-relaxed">
                This operation is entirely irreversible. You will delete all worksheets, homework grades, announcement bulletins, and remove all student registries.
              </p>
            </div>

            {/* Input typed safety spelling match code */}
            <div className="space-y-2 text-left relative">
              <label className="block text-[10px] font-black uppercase tracking-wider text-brand-dark mr-0.5 ml-1">
                Type <span className="font-bold underline text-[#143642] select-all cursor-pointer">"{classroom.name}"</span> exact to verify:
              </label>
              <input
                type="text"
                required
                value={deleteInputName}
                onChange={(e) => setDeleteInputName(e.target.value)}
                placeholder={classroom.name}
                className="w-full rounded-xl border border-gray-300 p-3.5 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#A8201A]/30 text-[#A8201A]"
              />
            </div>

            <div className="flex gap-2.5 mt-4 w-full pt-1">
              <button
                type="button"
                onClick={() => { setDangerModalMode('none'); setDeleteInputName(''); }}
                className="flex-1 rounded-xl border py-3 text-xs font-bold text-brand-dark hover:bg-gray-50 uppercase tracking-wide"
              >
                Cancel Deletion
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#A8201A] text-white py-3 text-xs font-black uppercase tracking-wide hover:bg-red-700 shadow-md transition-shadow"
              >
                DESTROY CLASS ✓
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 6. LEAVE CLASSROOM WARNING MODAL */}
      {/* ──────────────────────────────────────────────────────── */}
      {dangerModalMode === 'leave' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans" id="leave-classroom-modal">
          <div className="fixed inset-0 bg-[#143642]/65 backdrop-blur-xs" onClick={() => setDangerModalMode('none')} />
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm relative z-10 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-[#A8201A] mx-auto mb-1">
              <LogOut className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-lg text-brand-dark">Leave Classroom?</h3>
            <p className="text-xs text-brand-dark/70 font-semibold leading-relaxed">
              Are you sure you want to exit this learning space? You will lose access to all scoring logs, submitted assessments documents, and notices in this classroom immediately.
            </p>
            <div className="flex gap-2.5 mt-4 w-full">
              <button
                onClick={() => setDangerModalMode('none')}
                className="flex-1 rounded-xl border py-2.5 text-xs font-bold text-brand-dark hover:bg-gray-50 uppercase tracking-wide"
              >
                Keep Access
              </button>
              <button
                onClick={handleLeaveClass}
                className="flex-1 rounded-xl bg-[#A8201A] text-white py-2.5 text-xs font-bold hover:bg-red-700 uppercase tracking-wide shadow-md"
              >
                Confirm Exit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  function handleLeaveClass() {
    handleLeaveClassSubmit();
  }
}
