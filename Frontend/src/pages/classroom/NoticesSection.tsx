import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { Notice } from '../../types';
import { 
  Megaphone, Calendar, FileText, Download, Trash2, 
  ThumbsUp, ThumbsDown, CircleUser, Sparkles 
} from 'lucide-react';
import dayjs from 'dayjs';

interface NoticesSectionProps {
  classId: string;
  isCreator: boolean;  // FIX: accept from ClassroomPage instead of guessing from role
}

export default function NoticesSection({ classId, isCreator }: NoticesSectionProps) {
  const currentUser = useAppStore(state => state.currentUser);
  const rawNotices = useAppStore(state => state.notices);
  const notices = React.useMemo(() => rawNotices.filter(n => n.classId === classId), [rawNotices, classId]);
  const postNotice = useAppStore(state => state.postNotice);
  const deleteNotice = useAppStore(state => state.deleteNotice);
  const toggleNoticeReaction = useAppStore(state => state.toggleNoticeReaction);
  const addToast = useAppStore(state => state.addToast);

  // Notices Creation state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [noticeBody, setNoticeBody] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeBody.trim()) {
      addToast('Please input announcement content description text.', 'warning');
      return;
    }

    // FIX: postNotice only takes (classId, content) — 2 args
    postNotice(classId, noticeBody);

    addToast('Notice published onto board successfully!', 'success');
    setNoticeBody('');
    setIsCreateOpen(false);
  };

  const handleLike = (noticeId: string) => {
    toggleNoticeReaction(noticeId, 'like', classId);
  };

  const handleDislike = (noticeId: string) => {
    toggleNoticeReaction(noticeId, 'dislike', classId);
  };

  const sortedNotices = [...notices].sort((a, b) => dayjs(b.timestamp).diff(dayjs(a.timestamp)));

  return (
    <div className="space-y-6 text-left" id="notices-section-container">
      
      {/* Notices Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4" id="notices-header-block">
        <div className="space-y-1 select-none">
          <h2 className="font-serif font-bold text-2xl text-brand-dark flex items-center gap-2">
            📢 Public Bulletin Board
          </h2>
          <p className="text-xs text-brand-dark/65 font-semibold uppercase tracking-wider">
            Check recent updates, syllabus alerts, timelines, or leave reactions.
          </p>
        </div>
        {/* FIX: use isCreator prop — not role string */}
        {isCreator && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#0F8B8D] text-white hover:bg-[#0a7173] font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer"
          >
            + New Announcement
          </button>
        )}
      </div>

      {/* Notices Lists */}
      {sortedNotices.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl shadow-sm border border-gray-150" id="notices-empty-layout">
          <div className="w-16 h-16 bg-brand-light/30 flex items-center justify-center rounded-full mx-auto text-brand-dark/40 mb-4">
            <Megaphone className="w-8 h-8 font-thin" />
          </div>
          <h4 className="font-display font-bold text-brand-dark text-base mb-1">
            No Bulletins Published
          </h4>
          <p className="text-xs text-brand-dark/60 font-sans max-w-xs mx-auto leading-relaxed font-semibold">
            {isCreator 
              ? 'Publish important details or syllabus updates to make sure students stay refreshed.' 
              : 'Secure tranquility! No urgent notices are currently published on this board.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6" id="notices-bulletin-stack">
          {sortedNotices.map((not) => {
            const hasLiked    = currentUser ? not.likes.includes(currentUser.id)    : false;
            const hasDisliked = currentUser ? not.dislikes.includes(currentUser.id) : false;

            return (
              <div 
                key={not.id}
                className="bg-white rounded-2xl shadow-md border border-gray-150 overflow-hidden relative text-left transition-all"
                id={`notice-card-${not.id}`}
              >
                <div className="p-6 md:p-8 space-y-4">
                  <div className="flex items-center gap-3 select-none">
                    <div className="w-9 h-9 rounded-full bg-[#143642] text-white font-extrabold text-xs flex items-center justify-center">
                      {(not.creatorName || 'R')[0]}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-dark leading-tight flex items-center gap-1.5">
                        {not.creatorName} 
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          not.creatorRole === 'teacher' ? 'bg-[#EC9A29]/15 text-[#EC9A29]' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {not.creatorRole}
                        </span>
                      </h4>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                        ⏰ {dayjs(not.timestamp).format('MMM DD, YYYY · h:mm A')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-brand-dark/80 whitespace-pre-line leading-relaxed font-sans font-medium">
                      {not.content}
                    </p>
                  </div>

                  {not.attachedFileName && (
                    <div className="inline-flex items-center gap-2 bg-[#0F8B8D]/5 border border-[#0F8B8D]/15 p-2.5 rounded-xl text-xs font-semibold text-brand-dark leading-none">
                      <FileText className="w-4 h-4 text-brand-primary" />
                      <span className="truncate max-w-[170px] font-bold">{not.attachedFileName}</span>
                      <button 
                        onClick={() => addToast(`Downloading: ${not.attachedFileName}`, 'info')}
                        className="p-1 hover:bg-white rounded-md text-brand-primary cursor-pointer"
                        title="Download notice attachment"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-4 flex justify-between items-center select-none" id={`notice-actions-row-${not.id}`}>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleLike(not.id)}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-all p-1 hover:scale-105 active:scale-95 cursor-pointer ${
                          hasLiked ? 'text-brand-primary scale-102' : 'text-gray-400 hover:text-brand-primary'
                        }`}
                        title="Count as helpful announcement"
                      >
                        <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-[#0F8B8D]' : ''}`} />
                        <span>{not.likes.length}</span>
                      </button>

                      <button
                        onClick={() => handleDislike(not.id)}
                        className={`flex items-center gap-1.5 text-xs font-semibold transition-all p-1 hover:scale-105 active:scale-95 cursor-pointer ${
                          hasDisliked ? 'text-[#A8201A] scale-102 font-bold' : 'text-gray-400 hover:text-[#A8201A]'
                        }`}
                        title="Request clarifications"
                      >
                        <ThumbsDown className={`w-4 h-4 ${hasDisliked ? 'fill-[#A8201A]' : ''}`} />
                        <span>{not.dislikes.length}</span>
                      </button>
                    </div>

                    {/* FIX: use isCreator prop — not role string */}
                    {isCreator && (
                      <button
                        onClick={() => {
                          deleteNotice(not.id);
                          addToast('Announcement notice removed successfully.', 'error');
                        }}
                        className="text-xs font-bold text-[#A8201A] hover:bg-red-50 px-3 py-1.5 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE OVERLAY */}
      {isCreateOpen && isCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans" id="create-notice-overlay-frame">
          <div className="fixed inset-0 bg-[#143642]/65 backdrop-blur-xs" onClick={() => setIsCreateOpen(false)} />
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden flex flex-col">
            
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center select-none">
              <span className="flex items-center gap-2 text-xs font-black text-brand-dark uppercase tracking-wider">
                <Megaphone className="w-4 h-4 text-brand-primary" />
                Post Announcement Bulletins
              </span>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-gray-650 p-1 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-brand-dark mb-1.5 uppercase tracking-wide">
                  Bulletin Notice Body *
                </label>
                <textarea
                  required
                  rows={4}
                  value={noticeBody}
                  onChange={(e) => setNoticeBody(e.target.value)}
                  placeholder="Type updates regarding tomorrow's schedule, homework deadlines or syllabus revisions..."
                  className="w-full rounded-xl border border-gray-300 p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f8b8d]/20 text-brand-dark"
                />
              </div>

              <div className="flex gap-2.5 pt-3 justify-end w-full">
                <button 
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border py-2.5 px-5 text-xs font-bold text-brand-dark hover:bg-gray-50 uppercase tracking-wide"
                >
                  Close
                </button>
                <button 
                  type="submit"
                  className="rounded-xl bg-[#0F8B8D] text-white py-2.5 px-6 text-xs font-black uppercase tracking-wide hover:bg-[#0a7173] shadow-md transition-shadow cursor-pointer"
                >
                  Publish Announcement Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}