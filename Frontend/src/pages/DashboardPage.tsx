import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Users, Calendar, Sparkles, BookOpen, Crown, User, 
  ArrowRight, FolderOpen, DoorOpen, LogIn, PlusSquare 
} from 'lucide-react';
import { useAppStore } from '../store';
import AppNavbar from '../components/AppNavbar';
import Skeleton from '../components/Skeleton';
import dayjs from 'dayjs';

export default function DashboardPage() {
  const navigate = useNavigate();
  const currentUser = useAppStore(state => state.currentUser);
  const classrooms = useAppStore(state => state.classrooms);
  const exams = useAppStore(state => state.exams);
  const createClassroom = useAppStore(state => state.createClassroom);
  const joinClassroom = useAppStore(state => state.joinClassroom);
  const addToast = useAppStore(state => state.addToast);

  const [activeTab, setActiveTab] = useState<'my' | 'joined'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal triggers
  const [fabModalOpen, setFabModalOpen] = useState(false);
  const [modalFlow, setModalFlow] = useState<'options' | 'create' | 'join'>('options');

  // Creation form states
  const [className, setClassName] = useState('');
  const [classSubject, setClassSubject] = useState('');
  const [classDesc, setClassDesc] = useState('');
  
  // Joining form state
  const [roomKeyValue, setRoomKeyValue] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // Loading simulation to show the beautiful skeleton state
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Compute greeting dynamically by hours
  const getGreeting = () => {
    const hours = dayjs().hour();
    let name = currentUser?.name ? currentUser.name.split(' ')[0] : 'Rahul';
    if (hours < 12) return `Good morning, ${name} 👋`;
    if (hours < 18) return `Good afternoon, ${name} 👋`;
    return `Good evening, ${name} 👋`;
  };

  const getMyClasses = () => {
    if (!currentUser) return [];
    return classrooms.filter(c => currentUser.createdClasses.includes(c.id) || c.creatorId === currentUser.id);
  };

  const getJoinedClasses = () => {
    if (!currentUser) return [];
    return classrooms.filter(c => currentUser.joinedClasses.includes(c.id));
  };

  const activeClasses = activeTab === 'my' ? getMyClasses() : getJoinedClasses();
  
  const filteredClasses = activeClasses.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMyClasses = getMyClasses().length;
  const totalJoinedClasses = getJoinedClasses().length;

  // Handle class creation submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !classSubject.trim()) {
      addToast('Class Name and Subject are required.', 'warning');
      return;
    }

    try {
      const created = await createClassroom(className, classSubject, classDesc);
      addToast(`Classroom created successfully! Key: ${created.roomKey}`, 'success');
      
      // Reset form & state
      setClassName('');
      setClassSubject('');
      setClassDesc('');
      setFabModalOpen(false);
      setModalFlow('options');
      setActiveTab('my');
    } catch (err) {}
  };

  // Handle class join submit
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    if (roomKeyValue.trim().length !== 6) {
      setJoinError('Please enter a valid 6-character room key.');
      return;
    }

    try {
      const success = await joinClassroom(roomKeyValue.trim());
      if (success) {
        addToast('Classroom joined successfully!', 'success');
        setRoomKeyValue('');
        setJoinError(null);
        setFabModalOpen(false);
        setModalFlow('options');
        setActiveTab('joined');
      } else {
        setJoinError('Invalid room key. Check and try again.');
      }
    } catch (err) {
      setJoinError('An error occurred while joining.');
    }
  };

  // Counts of ongoing live tests
  const ongoingExamsCount = exams.filter(ex => {
    const now = dayjs();
    return now.isAfter(dayjs(ex.startTime)) && now.isBefore(dayjs(ex.endTime));
  }).length;

  return (
    <div className="min-h-screen bg-brand-light/35 pt-20 pb-16 px-4 md:px-8 text-left font-sans" id="dashboard-root">
      
      {/* Dynamic Navbar */}
      <AppNavbar 
        showSearch={true} 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
      />

      <div className="max-w-7xl mx-auto space-y-8 mt-4" id="dashboard-content-wrapper">
        
        {/* Welcome Banner Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative bg-gradient-to-r from-[#143642] to-[#0F8B8D] rounded-2xl shadow-xl overflow-hidden p-6 md:p-8 text-white select-none"
          id="dashboard-gradient-welcome-banner"
        >
          {/* Subtle decoration vector shapes */}
          <div className="absolute top-0 right-0 w-80 h-full bg-[radial-gradient(#ffffff0a_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-white/5 filter blur-2xl" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <h1 className="font-display font-black text-2xl md:text-3xl tracking-tight">
                {getGreeting()}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-brand-light/95 font-semibold">
                <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md">
                  📅 {dayjs().format('dddd, DD MMMM YYYY')}
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md">
                  🔒 Secure Session
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-white/10 p-3 rounded-xl border border-white/5 max-w-sm">
              <Sparkles className="w-5 h-5 text-[#EC9A29] shrink-0" />
              <p className="text-xs text-brand-light/95 leading-relaxed font-sans font-medium">
                You have <strong className="text-[#EC9A29]">{totalMyClasses + totalJoinedClasses}</strong> classrooms active. 
                {ongoingExamsCount > 0 ? (
                  <span> There is <strong className="text-[#EC9A29]">{ongoingExamsCount} live exam</strong> ongoing right now!</span>
                ) : (
                  <span> No exams are live at this micro-moment.</span>
                )}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab section bar in underline style */}
        <div className="flex justify-between items-center border-b border-gray-200 pb-px" id="dashboard-tabs-bar">
          <div className="flex gap-6" id="dashboard-tabs">
            <button
              onClick={() => setActiveTab('my')}
              className={`font-display font-black text-sm pb-3.5 tracking-wide flex items-center gap-2 relative transition-colors ${
                activeTab === 'my' ? 'text-brand-dark' : 'text-brand-dark/50 hover:text-brand-dark'
              }`}
            >
              <Crown className="w-4 h-4" />
              My Classes (Teaching)
              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                activeTab === 'my' ? 'bg-[#0F8B8D]/15 text-[#0F8B8D]' : 'bg-gray-100 text-gray-400'
              }`}>
                {totalMyClasses}
              </span>
              {activeTab === 'my' && (
                <motion.div layoutId="dashboardUnderline" className="absolute bottom-0 inset-x-0 h-0.5 bg-[#0F8B8D]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('joined')}
              className={`font-display font-black text-sm pb-3.5 tracking-wide flex items-center gap-2 relative transition-colors ${
                activeTab === 'joined' ? 'text-brand-dark' : 'text-brand-dark/50 hover:text-brand-dark'
              }`}
            >
              <User className="w-4 h-4" />
              Joined Classes (Learning)
              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                activeTab === 'joined' ? 'bg-[#0F8B8D]/15 text-[#0F8B8D]' : 'bg-gray-100 text-gray-400'
              }`}>
                {totalJoinedClasses}
              </span>
              {activeTab === 'joined' && (
                <motion.div layoutId="dashboardUnderline" className="absolute bottom-0 inset-x-0 h-0.5 bg-[#0F8B8D]" />
              )}
            </button>
          </div>
        </div>

        {/* CLASSROOM CONSOLIDATED LIST OR SKELETON LOADING */}
        <div id="classroom-list-viewport">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="skeleton-grid">
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          ) : filteredClasses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl shadow-sm border border-brand-light/35"
              id="classroom-empty-state"
            >
              <div className="w-20 h-20 bg-brand-light/20 flex items-center justify-center text-brand-primary rounded-full mb-6">
                <BookOpen className="w-10 h-10" />
              </div>
              <h3 className="font-display font-bold text-lg text-brand-dark mb-1">
                No Classrooms Found
              </h3>
              <p className="text-sm text-brand-dark/60 font-sans max-w-sm mb-6 leading-relaxed">
                {activeTab === 'my' 
                  ? "You haven't created any classrooms yet! Start setting up a brand-new space to teach." 
                  : "Enter a unique classroom room key shared by your teaching instructor to join."}
              </p>
              <button
                onClick={() => {
                  setFabModalOpen(true);
                  setModalFlow(activeTab === 'my' ? 'create' : 'join');
                }}
                className="bg-[#0F8B8D] text-white hover:bg-[#0a7173] font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md hover:scale-101"
              >
                {activeTab === 'my' ? '+ Create Classroom' : '🔑 Join Classroom'}
              </button>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              id="classroom-cards-grid"
            >
              <AnimatePresence mode="popLayout">
                {filteredClasses.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.35, delay: index * 0.05 }}
                    onClick={() => navigate(`/classroom/${item.id}`)}
                    className="group flex flex-col justify-between bg-white rounded-2xl shadow-md overflow-hidden border border-gray-150 cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative h-72 text-left"
                    id={`class-card-${item.id}`}
                  >
                    {/* Color Accent Bar */}
                    <div 
                      className="h-[5px] w-full" 
                      style={{ backgroundColor: item.color }} 
                    />

                    {/* Card Content body */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="font-display font-black text-lg text-brand-dark uppercase tracking-wide leading-tight group-hover:text-[#0F8B8D] transition-colors truncate">
                            {item.name}
                          </h3>
                          <span className="shrink-0">
                            {activeTab === 'my' ? (
                              <Crown className="w-4 h-4 text-[#EC9A29]" />
                            ) : (
                              <User className="w-4 h-4 text-brand-primary" />
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-[#0F8B8D] font-bold italic leading-tight">
                          {item.subject}
                        </p>
                        <p className="text-xs text-brand-dark/70 font-sans line-clamp-3 pt-3 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Divider and stats block */}
                      <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between text-[11px] text-brand-dark/65 font-bold uppercase tracking-wider select-none">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          {item.membersCount} members
                        </span>
                        <span>
                          Created: {dayjs(item.createdAt).format('MMMM YYYY')}
                        </span>
                      </div>
                    </div>

                    {/* Bottom hover sliding panel indicator */}
                    <div 
                      className="bg-[#143642] text-white py-3 px-6 h-12 border-t border-white/5 flex items-center justify-between pointer-events-none transition-all touch-auto uppercase tracking-wider text-[11px] font-bold"
                      id={`card-bottom-bar-${item.id}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#0F8B8D] animate-ping" />
                        Explore Room
                      </span>
                      <span className="text-[#0F8B8D] group-hover:translate-x-1.5 transition-transform font-black">
                        Open →
                      </span>
                    </div>

                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

      </div>

      {/* FIXED ACTION FLOATING BUTTON '+' */}
      <button
        onClick={() => { setFabModalOpen(true); setModalFlow('options'); }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#0F8B8D] hover:bg-[#0a7173] text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl z-30 cursor-pointer group"
        id="dashboard-fab-trigger"
        aria-label="Create or join class"
      >
        <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
        <span className="absolute bottom-16 right-0 bg-brand-dark text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-md">
          Create or Join Class
        </span>
      </button>

      {/* DYNAMIC TWO FLOW ACTION MODAL */}
      <AnimatePresence>
        {fabModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="fab-modal-overlay">
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#143642]/65 backdrop-blur-sm"
            />

            {/* Modal Card body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-10 text-left"
              id="fab-modal-card"
            >
              
              {/* Close Button */}
              <button
                onClick={() => setFabModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="Close modal dialog"
              >
                <Plus className="w-5 h-5 rotate-45 text-gray-400" />
              </button>

              {/* FLOW SWITCH STATE RENDERS */}
              <div className="p-6 md:p-8" id="modal-flows-viewport">
                
                {/* FLOW A - CHOICE OPTIONS SELECTOR */}
                {modalFlow === 'options' && (
                  <div className="space-y-6" id="modal-options-panel">
                    <div className="text-center md:text-left space-y-1">
                      <h3 className="font-display font-bold text-xl text-brand-dark">
                        What would you like to do?
                      </h3>
                      <p className="text-xs text-brand-dark/60 font-semibold uppercase tracking-wider">
                        Set up a private teaching space or join as a learner.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <button
                        onClick={() => setModalFlow('create')}
                        className="border-2 border-transparent hover:border-[#0F8B8D]/20 bg-brand-light/35 hover:bg-[#0F8B8D]/5 p-6 rounded-2xl flex flex-col items-center text-center group transition-all"
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#0F8B8D]/15 text-[#0F8B8D] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform font-semibold">
                          <PlusSquare className="w-6 h-6" />
                        </div>
                        <span className="font-display font-bold text-sm text-brand-dark mb-1">Create Classroom</span>
                        <span className="text-[11px] text-brand-dark/60 font-sans leading-relaxed">Setup class lists & timers, host homework</span>
                      </button>

                      <button
                        onClick={() => setModalFlow('join')}
                        className="border-2 border-transparent hover:border-[#EC9A29]/20 bg-brand-light/35 hover:bg-[#EC9A29]/5 p-6 rounded-2xl flex flex-col items-center text-center group transition-all"
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#EC9A29]/15 text-[#EC9A29] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                          <LogIn className="w-6 h-6" />
                        </div>
                        <span className="font-display font-bold text-sm text-brand-dark mb-1 font-sans">Join Classroom</span>
                        <span className="text-[11px] text-brand-dark/60 font-sans leading-relaxed">Enter secure code from instructor to join</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* FLOW B - CREATE CLASSROOM FORM */}
                {modalFlow === 'create' && (
                  <form onSubmit={handleCreateSubmit} className="space-y-5" id="create-classroom-form-block">
                    <div className="space-y-1 border-b border-gray-100 pb-3">
                      <h3 className="font-display font-bold text-lg text-brand-dark">
                        Create a New Classroom
                      </h3>
                      <p className="text-xs text-brand-dark/60 font-semibold select-none">
                        Setup the subject details and options for your students.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-brand-dark mb-1.5 uppercase tracking-wide">
                          Class Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={className}
                          onChange={(e) => setClassName(e.target.value)}
                          placeholder="e.g. Mathematics 10A"
                          className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-[#0F8B8D] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-brand-dark mb-1.5 uppercase tracking-wide">
                          Subject Topic *
                        </label>
                        <input
                          type="text"
                          required
                          value={classSubject}
                          onChange={(e) => setClassSubject(e.target.value)}
                          placeholder="e.g. Limits, Matrices & Calculus"
                          className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-[#0F8B8D] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-brand-dark mb-1.5 uppercase tracking-wide">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={classDesc}
                          onChange={(e) => setClassDesc(e.target.value)}
                          placeholder="Describe the topics and outline guidelines for the classroom..."
                          className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-[#0F8B8D] focus:outline-none resize-none font-sans"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3" id="create-modal-actions-buttons">
                      <button
                        type="button"
                        onClick={() => setModalFlow('options')}
                        className="flex-1 rounded-xl border border-gray-200 py-3 text-xs font-bold text-brand-dark hover:bg-gray-50 transition-colors uppercase tracking-wide"
                      >
                        ← Back Options
                      </button>
                      <button
                        type="submit"
                        className="flex-1 rounded-xl bg-[#0F8B8D] hover:bg-[#0a7173] text-white py-3 text-xs font-bold transition-colors uppercase tracking-wide shadow-md"
                      >
                        Create Classroom
                      </button>
                    </div>
                  </form>
                )}

                {/* FLOW C - JOIN CLASSROOM FORM */}
                {modalFlow === 'join' && (
                  <form onSubmit={handleJoinSubmit} className="space-y-6" id="join-classroom-form-block">
                    <div className="space-y-1 border-b border-gray-100 pb-3">
                      <h3 className="font-display font-bold text-lg text-brand-dark">
                        Join Classroom
                      </h3>
                      <p className="text-xs text-brand-dark/60 font-semibold select-none">
                        Input the unique secure 6-character room key shared by your teacher.
                      </p>
                    </div>

                    {joinError && (
                      <div className="bg-[#A8201A]/10 border border-[#A8201A] text-[#A8201A] p-3 rounded-xl flex items-start gap-2 text-xs font-bold" id="join-classroom-error">
                        <span>⚠️ {joinError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-brand-dark mb-2.5 uppercase tracking-wide text-center">
                        Enter Room Code Key
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={roomKeyValue}
                        onChange={(e) => {
                          setRoomKeyValue(e.target.value.toUpperCase());
                          setJoinError(null);
                        }}
                        placeholder="AAAAAA"
                        className="w-full rounded-xl border border-gray-355 p-4 text-center font-mono font-black text-xl tracking-widest text-[#143642] focus:border-[#EC9A29] focus:ring-2 focus:ring-[#EC9A29]/20 focus:outline-none uppercase"
                      />
                    </div>

                    <div className="flex gap-3 pt-3" id="join-modal-actions-buttons">
                      <button
                        type="button"
                        onClick={() => setModalFlow('options')}
                        className="flex-1 rounded-xl border border-gray-200 py-3 text-xs font-bold text-brand-dark hover:bg-gray-50 transition-colors uppercase tracking-wide"
                      >
                        ← Back Options
                      </button>
                      <button
                        type="submit"
                        className="flex-1 rounded-xl bg-[#EC9A29] hover:bg-[#d6851b] text-[#143642] font-bold py-3 text-xs transition-colors uppercase tracking-wide shadow-md"
                      >
                        Join Class Space
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
