import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  User, Check, Mail, ArrowLeft, GraduationCap, Award, Lock, X
} from 'lucide-react';
import { useAppStore } from '../store';
import AppNavbar from '../components/AppNavbar';

export default function ProfilePage() {
  const navigate = useNavigate();
  const currentUser = useAppStore(state => state.currentUser);
  const classrooms = useAppStore(state => state.classrooms);
  
  // Zustand mutation functions
  const addToast = useAppStore(state => state.addToast);

  // Form states initialized safely from currentUser settings
  const profileName = currentUser?.name || 'Rahul Sharma';
  const profileEmail = currentUser?.email || 'rahul@learnsphere.com';


  const changePassword = useAppStore(state => state.changePassword);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password validation match signup
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const passwordStrength = () => {
    if (!password) return { label: 'Empty', color: 'bg-gray-100', width: 'w-0' };
    let score = 0;
    if (hasMinLength) score += 1;
    if (hasUppercase) score += 1;
    if (hasNumber) score += 1;

    if (score <= 1) return { label: 'Weak', color: 'bg-[#A8201A]', width: 'w-1/3' };
    if (score === 2) return { label: 'Medium', color: 'bg-[#EC9A29]', width: 'w-2/3' };
    return { label: 'Strong', color: 'bg-[#0F8B8D]', width: 'w-full' };
  };

  const strength = passwordStrength();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasMinLength || !hasUppercase || !hasNumber) {
      addToast('Password must meet all requirements.', 'warning');
      return;
    }
    if (!password || password !== confirmPassword) {
      addToast('Passwords do not match or are empty.', 'error');
      return;
    }
    const success = await changePassword(password);
    if (success) {
      setPassword('');
      setConfirmPassword('');
    }
  };

  const myClassesCount = classrooms.filter(c => 
    currentUser?.role === 'teacher' 
      ? (currentUser.createdClasses.includes(c.id) || c.creatorId === currentUser.id)
      : currentUser?.joinedClasses.includes(c.id)
  ).length;

  return (
    <div className="min-h-screen bg-brand-light/35 pt-20 pb-16 px-4 md:px-8 text-left font-sans" id="profile-root">
      
      {/* 1. Navbar */}
      <AppNavbar showSearch={false} />

      <div className="max-w-2xl mx-auto space-y-6 mt-4" id="profile-content-wrapper">
        
        {/* Back Link */}
        <button
          onClick={() => navigate('/dashboard')}
          className="text-brand-dark/60 hover:text-brand-dark text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 group select-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform stroke-3" />
          Back Dashboard
        </button>

        {/* PROFILE HEADER PANEL */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-2xl shadow-md border border-gray-150 p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6 select-none"
          id="profile-header-panel-card"
        >
          <div className="w-18 h-18 rounded-full bg-[#0F8B8D] text-white font-black text-2xl flex items-center justify-center shadow-lg">
            {profileName ? profileName[0].toUpperCase() : 'U'}
          </div>

          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="font-display font-black text-xl text-brand-dark uppercase tracking-wide leading-none">{profileName}</h2>
              <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-[#0F8B8D]/15 text-[#0F8B8D]">
                Verified
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono italic leading-none">{profileEmail}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1.5 text-[10px] text-brand-dark/65 font-black uppercase tracking-wider">
              <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4 text-[#0F8B8D]" /> {myClassesCount} Classrooms active</span>
              <span className="flex items-center gap-1"><Award className="w-4 h-4 text-[#EC9A29]" /> Verified account status</span>
            </div>
          </div>
        </motion.div>

        {/* DETAILED UPDATE PROFILE FORM */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-md border border-gray-150 overflow-hidden"
          id="profile-form-container-card"
        >
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 select-none">
            <span className="text-[9px] bg-brand-primary/10 text-brand-primary font-black uppercase tracking-widest px-2.5 py-1 rounded-full">Personal verification account settings</span>
            <h3 className="font-display font-black text-base text-brand-dark uppercase tracking-wide pt-1">Account parameters</h3>
          </div>

          <div className="p-6 md:p-8 space-y-6 text-left" id="profile-detailed-settings-form">
            
            <div className="space-y-4">
              
              {/* Full Name field */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark mb-1.5 uppercase tracking-wide ml-0.5">
                  Full Name / Username (Immutable)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    readOnly
                    value={profileName}
                    className="w-full rounded-xl border border-gray-250 p-3 pl-11 text-xs bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>

              {/* Email credentials field */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark mb-1.5 uppercase tracking-wide ml-0.5">
                  Primary School Email Address (Immutable)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    readOnly
                    value={profileEmail}
                    className="w-full rounded-xl border border-gray-250 p-3 pl-11 text-xs bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>

              {/* Role selection is automatically handled per classroom */}

            </div>

            {/* Profile bottom save trigger action buttons */}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-6" id="profile-controls-buttons">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-xl border py-3 px-6 text-xs font-bold text-brand-dark hover:bg-gray-50 uppercase tracking-wide select-none"
              >
                Go Back
              </button>
            </div>

          </div>
        </motion.div>

        {/* CHANGE PASSWORD FORM */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-md border border-gray-150 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 select-none">
            <span className="text-[9px] bg-brand-primary/10 text-brand-primary font-black uppercase tracking-widest px-2.5 py-1 rounded-full">Security settings</span>
            <h3 className="font-display font-black text-base text-brand-dark uppercase tracking-wide pt-1">Change Password</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="p-6 md:p-8 space-y-6 text-left">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-dark mb-1.5 uppercase tracking-wide ml-0.5">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-gray-250 p-3 pl-11 text-xs focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none focus:border-[#0F8B8D]"
                  />
                </div>
                {/* LIVE PASSWORD STRENGTH DISPLAY METER */}
                {password && (
                  <div className="mt-2.5 space-y-1.5" id="pstrength-meter">
                    <div className="flex justify-between items-center text-[10px] font-bold text-brand-dark">
                      <span>Password Strength:</span>
                      <span className="uppercase tracking-wide font-black">{strength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[10px] text-brand-dark/70 font-semibold">
                      <span className="flex items-center gap-1">
                        {hasMinLength ? <Check className="w-3 h-3 text-[#0F8B8D]" /> : <X className="w-3 h-3 text-[#A8201A]" />}
                        Min. 8 characters
                      </span>
                      <span className="flex items-center gap-1">
                        {hasUppercase ? <Check className="w-3 h-3 text-[#0F8B8D]" /> : <X className="w-3 h-3 text-[#A8201A]" />}
                        At least 1 uppercase
                      </span>
                      <span className="flex items-center gap-1 col-span-2">
                        {hasNumber ? <Check className="w-3 h-3 text-[#0F8B8D]" /> : <X className="w-3 h-3 text-[#A8201A]" />}
                        At least 1 number digit
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-dark mb-1.5 uppercase tracking-wide ml-0.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-xl border border-gray-250 p-3 pl-11 text-xs focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none focus:border-[#0F8B8D]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
              <button
                type="submit"
                disabled={!hasMinLength || !hasUppercase || !hasNumber || password !== confirmPassword}
                className={`rounded-xl py-3 px-6 text-xs font-bold transition-all shadow-md flex items-center gap-2 select-none uppercase tracking-wide ${
                  !hasMinLength || !hasUppercase || !hasNumber || password !== confirmPassword || !password
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-[#0F8B8D] hover:bg-[#0a7173] text-white hover:scale-101 active:scale-99'
                }`}
              >
                <Lock className="w-4 h-4" /> Update Password
              </button>
            </div>
          </form>
        </motion.div>

      </div>
    </div>
  );
}
