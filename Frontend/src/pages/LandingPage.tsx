import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  School, ClipboardList, FileText, FolderOpen, Bell, BarChart2, 
  GraduationCap, User, Star, ArrowRight, ChevronLeft, ChevronRight, 
  Menu, X, Check, Sparkles, UserCheck 
} from 'lucide-react';

// Formatted testimonials helper
const TESTIMONIALS = [
  {
    quote: "LearnSphere completely transformed how I manage my class. The exam feature alone saved me hours every week.",
    name: "Mr. Arjun Das",
    role: "College Lecturer",
    stars: 5,
    avatar: "A"
  },
  {
    quote: "I love how I can check my exam scores and download materials all in one place. Super easy to use!",
    name: "Sneha Roy",
    role: "High School Student",
    stars: 5,
    avatar: "S"
  },
  {
    quote: "The assignment system is brilliant. My students submit everything digitally now. No more paper mess!",
    name: "Ms. Tanvi Mehta",
    role: "School Teacher",
    stars: 5,
    avatar: "T"
  }
];

const FEATURES = [
  {
    icon: School,
    title: "Virtual Classrooms",
    desc: "Create unlimited classrooms with unique room keys. Share the key with students and manage everything from one place.",
    color: "bg-[#0F8B8D]/10 text-[#0F8B8D]"
  },
  {
    icon: ClipboardList,
    title: "MCQ Exams",
    desc: "Design timed MCQ exams with multiple questions and options. Set timelines, auto-submit, and instantly see who passed and who didn't.",
    color: "bg-[#EC9A29]/10 text-[#EC9A29]"
  },
  {
    icon: FileText,
    title: "Assignment Management",
    desc: "Upload assignment questions as PDFs, DOCX, or images. Students submit files before the deadline. You review and assign marks.",
    color: "bg-[#143642]/10 text-[#143642]"
  },
  {
    icon: FolderOpen,
    title: "File Sharing",
    desc: "Upload study materials — PDFs, Word docs, Excel sheets, or images. Students can browse and download anytime.",
    color: "bg-[#0F8B8D]/10 text-[#0F8B8D]"
  },
  {
    icon: Bell,
    title: "Notice Board",
    desc: "Post class notices with optional file attachments. Students can react with likes and dislikes in real time.",
    color: "bg-[#EC9A29]/10 text-[#EC9A29]"
  },
  {
    icon: BarChart2,
    title: "Score Tracking",
    desc: "Full visibility into every student's exam scores and assignment marks. Students see their own progress. Central dashboard.",
    color: "bg-[#143642]/10 text-[#143642]"
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Stats counting states
  const [stats, setStats] = useState({ rooms: 0, students: 0, exams: 0, satisfaction: 0 });
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const [isCountingTriggered, setIsCountingTriggered] = useState(false);

  // Carousel controls
  const [featureIndex, setFeatureIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  // Track scroll position for navbar background transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      // Basic scroll spy for active section highlight
      const sections = ['home', 'features', 'how-it-works', 'roles', 'testimonials'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) {
            setActiveLink(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for counting animation
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isCountingTriggered) {
        setIsCountingTriggered(true);
      }
    }, { threshold: 0.2 });

    if (statsSectionRef.current) {
      observer.observe(statsSectionRef.current);
    }

    return () => observer.disconnect();
  }, [isCountingTriggered]);

  // Counting logic loop
  useEffect(() => {
    if (!isCountingTriggered) return;

    let start = 0;
    const duration = 2000;
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // Easing function outQuad
      const easedProgress = progress * (2 - progress);

      setStats({
        rooms: Math.round(easedProgress * 500),
        students: Math.round(easedProgress * 10000),
        exams: Math.round(easedProgress * 2500),
        satisfaction: Math.round(easedProgress * 98)
      });

      if (frame >= totalFrames) {
        clearInterval(counter);
        setStats({ rooms: 500, students: 10000, exams: 2500, satisfaction: 98 });
      }
    }, frameRate);

    return () => clearInterval(counter);
  }, [isCountingTriggered]);

  // Auto playing features carousel
  useEffect(() => {
    if (isCarouselHovered) return;
    const timer = setInterval(() => {
      setFeatureIndex((prev) => (prev + 1) % (FEATURES.length - 2));
    }, 3500);

    return () => clearInterval(timer);
  }, [isCarouselHovered]);

  // Auto playing testimonials carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleNextFeature = () => {
    setFeatureIndex((prev) => (prev + 1) % (FEATURES.length - 2));
  };

  const handlePrevFeature = () => {
    setFeatureIndex((prev) => (prev - 1 + (FEATURES.length - 2)) % (FEATURES.length - 2));
  };

  // Scroll anchor helper
  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const topOffset = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col relative overflow-x-hidden selection:bg-[#0F8B8D] selection:text-white" id="landing-page-root">
      
      {/* SECTION A — STICKY NAVBAR */}
      <nav 
        className={`fixed top-0 inset-x-0 h-[72px] z-50 flex items-center justify-between px-6 md:px-12 transition-all duration-300 ${
          scrolled 
            ? 'bg-[#143642] shadow-xl backdrop-blur-md border-b border-white/5' 
            : 'bg-transparent'
        }`}
        id="landing-navbar"
      >
        {/* Left Side Logo */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          className="flex items-center gap-3 cursor-pointer group"
          id="nav-logo"
        >
          <div className="w-10 h-10 rounded-full bg-[#0F8B8D] flex items-center justify-center text-white scale-100 group-hover:scale-105 transition-transform shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-display font-black text-xl text-white tracking-wide">
            LearnSphere
          </span>
        </div>

        {/* Center Navigation Links (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-8" id="nav-links">
          {[
            { id: 'home', label: 'Home' },
            { id: 'features', label: 'Features' },
            { id: 'how-it-works', label: 'How It Works' },
            { id: 'roles', label: 'Roles' },
            { id: 'testimonials', label: 'About Us' }
          ].map(link => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className={`font-sans font-semibold text-sm transition-colors relative py-1 hover:text-[#EC9A29] ${
                activeLink === link.id ? 'text-[#EC9A29]' : 'text-[#DAD2D8]'
              }`}
            >
              {link.label}
              {activeLink === link.id && (
                <motion.div 
                  layoutId="activeUnderline" 
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-[#EC9A29]" 
                />
              )}
            </button>
          ))}
        </div>

        {/* Right Side Authentications */}
        <div className="hidden md:flex items-center gap-4" id="nav-auth-buttons">
          <button 
            onClick={() => navigate('/login')} 
            className="border border-white/40 text-white hover:bg-white hover:text-[#143642] font-semibold text-sm px-5 py-2.5 rounded-xl transition-all hover:scale-103"
          >
            Log In
          </button>
          <button 
            onClick={() => navigate('/signup')} 
            className="bg-[#0F8B8D] text-white hover:bg-[#0a7173] font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all hover:scale-103 teal-glow"
          >
            Sign Up Free
          </button>
        </div>

        {/* Mobile Hamburger Trigger */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="md:hidden text-white hover:text-[#EC9A29] transition-colors p-1"
          aria-label="Toggle menu"
          id="mobile-menu-trigger"
        >
          {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-[#143642] pt-24 px-6 flex flex-col gap-8 md:hidden"
            id="mobile-nav-overlay"
          >
            <div className="flex flex-col gap-6 text-center border-b border-white/10 pb-8">
              {[
                { id: 'home', label: 'Home' },
                { id: 'features', label: 'Features' },
                { id: 'how-it-works', label: 'How It Works' },
                { id: 'roles', label: 'Roles' },
                { id: 'testimonials', label: 'About Us' }
              ].map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`font-display font-bold text-xl ${
                    activeLink === link.id ? 'text-[#EC9A29]' : 'text-white'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4 w-full px-4" id="mobile-menu-auth">
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} 
                className="w-full border border-white/30 text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                Log In
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }} 
                className="w-full bg-[#0F8B8D] text-white font-semibold py-3 rounded-xl shadow-lg hover:bg-[#0a7173] transition-colors"
              >
                Sign Up Free
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* SECTION B — HERO SECTION */}
      <section 
        id="home"
        className="min-h-screen pt-24 flex items-center bg-gradient-to-b from-[#143642] via-[#103040] to-[#143642] relative overflow-hidden"
      >
        {/* Animated fluid blur particles */}
        <div className="absolute top-1/4 left-1/10 w-96 h-96 rounded-full bg-[#0F8B8D]/15 filter blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/10 w-80 h-80 rounded-full bg-[#EC9A29]/10 filter blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />
        
        {/* Subtle dot matrix grid network */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          
          {/* Left Contents column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col text-left items-start max-w-xl"
            id="hero-taglines"
          >
            <div className="inline-flex items-center gap-2 bg-[#EC9A29]/20 border border-[#EC9A29]/30 text-[#EC9A29] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              🎓 Virtual Learning Platform
            </div>

            <h1 className="font-display font-black text-5xl md:text-7xl text-white tracking-tight leading-none mb-6">
              Your Classroom,
              <br />
              <span className="text-[#0F8B8D] relative block mt-2">
                Reimagined
                {/* SQIGGLE SVG ANIMATION UNDERLINE */}
                <svg className="absolute -bottom-3 left-0 w-72 md:w-96 text-[#0F8B8D]" viewBox="0 0 338 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <motion.path 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    d="M3 9C118.5 2.33333 301.5 -1.06667 335 9.5" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="font-sans text-brand-light/85 text-base md:text-lg leading-relaxed mb-10 mt-4">
              Create virtual classrooms, conduct MCQ exams, manage assignments, share materials, and track every student's progress — all in one gorgeous, unified space.
            </p>

            <div className="flex flex-wrap gap-4 w-full sm:w-auto mb-12">
              <button
                onClick={() => navigate('/signup')} 
                className="w-full sm:w-auto bg-[#0F8B8D] hover:bg-[#0a7173] text-white font-bold px-8 py-4 rounded-xl transition-all scale-100 hover:scale-102 hover:shadow-lg hover:shadow-[#0F8B8D]/30 flex items-center justify-center gap-3 group"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="w-full sm:w-auto border border-white hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl transition-all"
              >
                See How It Works
              </button>
            </div>

            {/* Social Proof row */}
            <div className="flex items-center gap-3 border-t border-white/10 pt-8 w-full" id="social-proof-row">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((val) => (
                  <div 
                    key={val} 
                    className="w-9 h-9 rounded-full border-2 border-[#143642] bg-[#0F8B8D] flex items-center justify-center text-xs text-white font-bold"
                  >
                    {val === 1 ? 'JD' : val === 2 ? 'SR' : 'KM'}
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#DAD2D8]/75 font-sans">
                Joined by <strong className="text-white">10,000+ learners & teachers</strong> globally
              </p>
            </div>
          </motion.div>

          {/* Right Preview Column (Floating Mockup) */}
          <motion.div
            // initial={{ opacity: 0, scale: 0.95 }}
            // animate={{ opacity: 1, scale: 1 }}
            // transition={{ duration: 0.8, delay: 0.2 }}
            // className="hidden lg:flex justify-center relative pointer-events-none"
            // id="hero-mockup-wrapper"
          >
            {/* Ambient Background Glow for the mockup */}
            {/* <div className="absolute inset-0 bg-gradient-to-r from-[#0F8B8D]/25 to-transparent filter blur-2xl rounded-full scale-105 pointer-events-none" /> */}

            {/* Floating Visual App Mockup */}
            {/* <div className="relative bg-white/5 border border-white/15 p-4 rounded-3xl backdrop-blur-md shadow-2xl max-w-md w-full animate-bounce [animation-duration:6s] h-auto p-2"
                 style={{ animation: 'float 5s ease-in-out infinite' }}
            > */}
              {/* Fake Chrome window buttons */}
              {/* <div className="flex items-center gap-1.5 mb-3 px-2">
                <span className="w-3 h-3 rounded-full bg-red-400 block" />
                <span className="w-3 h-3 rounded-full bg-yellow-400 block" />
                <span className="w-3 h-3 rounded-full bg-green-400 block" />
                <span className="text-[10px] text-white/50 ml-3 font-mono">learnsphere.org/classroom</span>
              </div> */}

              {/* Styled mock dashboard interior card list */}
              {/* <div className="space-y-3 bg-[#143642]/85 p-4 rounded-2xl border border-white/5 font-sans text-left">
                <div className="h-5 bg-white/20 rounded w-1/3 mb-4" />
                <div className="space-y-4">
                  {[
                    { class: 'Mathematics 10A', subtitle: 'Calculus Advanced', color: 'bg-[#0F8B8D]' },
                    { class: 'Advanced Physics', subtitle: 'Quantum Optima', color: 'bg-[#EC9A29]' }
                  ].map((card, i) => (
                    <div key={i} className="bg-white/10 rounded-xl p-3 flex justify-between items-center border border-white/5">
                      <div className="flex gap-3 items-center">
                        <span className={`w-2.5 h-10 ${card.color} rounded-md block`} />
                        <div>
                          <div className="text-white text-xs font-bold leading-tight">{card.class}</div>
                          <div className="text-white/60 text-[10px] italic leading-tight">{card.subtitle}</div>
                        </div>
                      </div>
                      <span className="text-[9px] bg-white/20 text-white rounded-full px-2 py-0.5 uppercase tracking-wide">
                        Join Class
                      </span>
                    </div>
                  ))}
                </div>
              </div> */}
            {/* </div> */}
          </motion.div>

        </div>

        {/* CSS Float Keyframe injection */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
        `}</style>
      </section>


      {/* SECTION C — STATS COUNTER SECTION */}
      <section 
        id="stats-counter"
        ref={statsSectionRef}
        className="bg-white py-16 scroll-mt-12 border-b border-brand-light"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12" id="stats-counter-grid">
            
            {[
              { value: stats.rooms + "+", label: "Classrooms Created", icon: School },
              { value: stats.students.toLocaleString() + "+", label: "Students Enrolled", icon: UserCheck },
              { value: stats.exams.toLocaleString() + "+", label: "Exams Conducted", icon: ClipboardList },
              { value: stats.satisfaction + "%", label: "Satisfaction Rate", icon: Star }
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <div 
                  key={idx}
                  className="flex flex-col items-center text-center p-4 rounded-xl border border-transparent hover:border-brand-light/40 hover:shadow-md transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-full bg-[#0F8B8D]/10 flex items-center justify-center text-[#0F8B8D] mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-display font-black text-3xl md:text-4xl text-brand-dark tracking-tight leading-tight mb-2">
                    {s.value}
                  </span>
                  <span className="font-sans text-brand-dark/60 text-sm font-semibold max-w-[140px]">
                    {s.label}
                  </span>
                </div>
              );
            })}

          </div>
        </div>
      </section>


      {/* SECTION D — FEATURES CAROUSEL SECTION */}
      <section 
        id="features"
        className="bg-[#DAD2D8] py-24 scroll-mt-12"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          {/* Section titles */}
          <div className="flex flex-col items-center text-center mb-16" id="features-header">
            <span className="text-sm font-bold tracking-widest text-[#EC9A29] uppercase mb-2">
              What We Offer
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-brand-dark font-bold tracking-tight mb-4">
              Everything You Need to Teach & Learn
            </h2>
            <p className="font-sans text-brand-dark/75 max-w-lg">
              Unlock productivity with standard, bulletproof tools styled beautifully for seamless educational interactivity.
            </p>
          </div>

          {/* Carousel container & controls */}
          <div 
            className="relative"
            onMouseEnter={() => setIsCarouselHovered(true)}
            onMouseLeave={() => setIsCarouselHovered(false)}
            id="features-carousel-wrapper"
          >
            {/* Features Row */}
            <div className="overflow-hidden py-4">
              <div 
                className="flex gap-6 transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${featureIndex * (100 / 3)}%)` }}
              >
                {FEATURES.map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <div 
                      key={idx}
                      className="min-w-[100%] sm:min-w-[48%] lg:min-w-[31.5%] bg-white rounded-2xl shadow-md p-6 md:p-8 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border border-gray-100 h-80"
                      id={`feature-card-${idx}`}
                    >
                      <div>
                        <div className={`w-12 h-12 rounded-xl ${feat.color} flex items-center justify-center mb-6`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <h3 className="font-sans font-bold text-lg text-brand-dark mb-3 leading-snug">
                          {feat.title}
                        </h3>
                        <p className="font-sans text-brand-dark/70 text-sm leading-relaxed">
                          {feat.desc}
                        </p>
                      </div>
                      <Link 
                        to="/signup" 
                        className="inline-flex items-center gap-1.5 text-[#0F8B8D] font-bold text-xs hover:underline uppercase tracking-wide mt-4"
                      >
                        Learn more <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Indicators */}
            <div className="flex justify-center items-center gap-3 mt-10">
              <button 
                onClick={handlePrevFeature}
                className="w-10 h-10 rounded-full border border-gray-300 bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5 text-brand-dark" />
              </button>

              <div className="flex gap-1.5">
                {Array.from({ length: FEATURES.length - 2 }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFeatureIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      featureIndex === idx ? 'w-5 bg-[#0F8B8D]' : 'bg-gray-400/40'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <button 
                onClick={handleNextFeature}
                className="w-10 h-10 rounded-full border border-gray-300 bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5 text-brand-dark" />
              </button>
            </div>

          </div>

        </div>
      </section>


      {/* SECTION E — HOW IT WORKS */}
      <section 
        id="how-it-works"
        className="bg-white py-24 scroll-mt-12 relative"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          <div className="flex flex-col items-center text-center mb-20" id="hiw-title-wrapper">
            <span className="text-sm font-bold tracking-widest text-[#0F8B8D] uppercase mb-2">
              The Process
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-brand-dark font-bold tracking-tight">
              Up and Running in 3 Simple Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative" id="hiw-steps-row">
            
            {/* Step Connectors on Desktop */}
            <div className="hidden md:block absolute top-1/4 left-[15%] right-[15%] h-0.5 border-t border-dashed border-gray-300 -z-0 pointer-events-none" />

            {[
              {
                num: "01",
                icon: UserCheck,
                title: "Create or Join a Room",
                desc: "Sign up in seconds. Setup your classroom as private creator, or enters room key shared by teacher to join."
              },
              {
                num: "02",
                icon: FileText,
                title: "Share, Teach & Interact",
                desc: "Upload slides and worksheet resources. Publish timed exam papers and receive reactions to your dashboard postings."
              },
              {
                num: "03",
                icon: BarChart2,
                title: "Track Progress & Results",
                desc: "Monitor aggregated grade tables. Check instant submissions logs, marks worksheets, and observe learning trends."
              }
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex flex-col items-center text-center relative z-10 p-4" id={`step-container-${step.num}`}>
                  {/* Huge watermark */}
                  <span className="absolute top-0 text-gray-100 font-display font-black text-8xl -z-10 pointer-events-none select-none opacity-85">
                    {step.num}
                  </span>

                  <div className="w-16 h-16 rounded-full bg-[#0F8B8D] flex items-center justify-center text-white mb-6 shadow-md shadow-[#0F8B8D]/25 mt-8">
                    <Icon className="w-7 h-7" />
                  </div>

                  <h3 className="font-display font-bold text-lg text-brand-dark mb-3">
                    {step.title}
                  </h3>
                  <p className="font-sans text-brand-dark/70 text-sm leading-relaxed max-w-xs">
                    {step.desc}
                  </p>
                </div>
              );
            })}

          </div>

        </div>
      </section>


      {/* SECTION F — ROLES SECTION */}
      <section 
        id="roles"
        className="bg-[#DAD2D8] py-24 scroll-mt-12"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          <div className="flex flex-col items-center text-center mb-16" id="roles-header">
            <h2 className="font-serif text-4xl md:text-5xl text-brand-dark font-bold tracking-tight mb-3">
              Built for Teachers. Loved by Students.
            </h2>
            <p className="font-sans text-brand-dark/70">
              Different roles, tailored experiences for efficient management.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10" id="roles-cards-grid">
            
            {/* Teacher Card */}
            <div className="bg-[#143642] text-white rounded-2xl shadow-xl overflow-hidden p-8 md:p-10 flex flex-col justify-between hover:scale-[1.01] transition-transform">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#EC9A29] flex items-center justify-center text-white mb-6">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-3xl font-bold mb-1">For Teachers</h3>
                <p className="text-[#DAD2D8]/80 text-sm italic mb-6">Take full control of your classroom</p>
                
                <ul className="space-y-3 font-sans text-sm text-[#DAD2D8] mb-8">
                  {[
                    "Create and manage multiple classrooms",
                    "Upload study documents & resources anytime",
                    "Design and publish MCQ exams with timers",
                    "Collect homework papers digits free",
                    "Post boards notices with optional files attachment",
                    "View complete student scores & progress tables",
                    "Remove and kick members, regenerate classroom keys"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#EC9A29] mt-1 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => navigate('/signup')}
                className="w-full bg-[#EC9A29] text-[#143642] font-bold py-3.5 rounded-xl hover:bg-[#d6851b] transition-colors flex items-center justify-center gap-2"
              >
                Start Teaching <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Student Card */}
            <div className="bg-[#0F8B8D] text-white rounded-2xl shadow-xl overflow-hidden p-8 md:p-10 flex flex-col justify-between hover:scale-[1.01] transition-transform">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#0F8B8D] mb-6">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-3xl font-bold mb-1">For Students</h3>
                <p className="text-white/80 text-sm italic mb-6 font-sans">Everything you need to learn and grow</p>
                
                <ul className="space-y-3 font-sans text-sm text-white/90 mb-8">
                  {[
                    "Join spaces instantly using a secure code",
                    "Browse and download resources anytime",
                    "Attempt MCQ quizzes with live counters",
                    "Submit assignments papers in simple taps",
                    "Review right replies after ended assessments",
                    "Upvote or downvote classroom notice announcements",
                    "Observe personal metrics histories safely"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-white mt-1 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => navigate('/signup')}
                className="w-full bg-white text-[#0F8B8D] font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                Start Learning <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </section>


      {/* SECTION G — TESTIMONIALS CAROUSEL */}
      <section 
        id="testimonials"
        className="bg-white py-24 scroll-mt-12"
      >
        <div className="max-w-4xl mx-auto px-6 md:px-12 flex flex-col items-center">
          
          <div className="flex flex-col items-center text-center mb-16" id="testimonials-header">
            <span className="text-sm font-bold tracking-widest text-[#0F8B8D] uppercase mb-2">
              Testimonials
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-brand-dark font-bold tracking-tight">
              What Our Users Say
            </h2>
          </div>

          {/* Carousel Single Slide */}
          <div className="w-full min-h-[220px] flex items-center justify-center text-center" id="testimonials-carousel-viewport">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIndex}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-50 rounded-2xl p-8 md:p-10 shadow-sm border border-brand-light/30 relative flex flex-col items-center max-w-2xl" id={`slide-${testimonialIndex}`}
              >
                {/* Large quote icon */}
                <span className="text-8xl text-[#0F8B8D]/15 font-serif absolute -top-4 left-6 select-none leading-none">
                  “
                </span>

                <p className="font-serif italic text-lg md:text-xl text-brand-dark/95 leading-relaxed relative z-10 mb-6">
                  "{TESTIMONIALS[testimonialIndex].quote}"
                </p>

                <div className="flex items-center gap-3 mt-4">
                  <div className="w-10 h-10 rounded-full bg-[#0F8B8D] flex items-center justify-center text-white font-bold text-sm">
                    {TESTIMONIALS[testimonialIndex].avatar}
                  </div>
                  <div className="text-left font-sans">
                    <div className="font-semibold text-brand-dark text-sm">
                      {TESTIMONIALS[testimonialIndex].name}
                    </div>
                    <div className="text-xs text-brand-dark/60">
                      {TESTIMONIALS[testimonialIndex].role}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1 mt-4 text-[#EC9A29]" id="star-row">
                  {Array.from({ length: TESTIMONIALS[testimonialIndex].stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots Nav */}
          <div className="flex justify-center gap-2 mt-8" id="testimonials-dots">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  testimonialIndex === i ? 'w-6 bg-[#0F8B8D]' : 'bg-gray-300'
                }`}
                aria-label={`Show testimonial ${i + 1}`}
              />
            ))}
          </div>

        </div>
      </section>


      {/* SECTION H — FINAL CTA SECTION */}
      <section 
        className="bg-gradient-to-r from-[#143642] to-[#0F8B8D] text-white py-24 text-center relative overflow-hidden"
        id="final-cta"
      >
        <div className="absolute inset-x-0 bottom-0 top-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 md:px-12 relative z-10">
          <h2 className="font-display font-black text-4xl md:text-5xl tracking-tight mb-4">
            Ready to Transform Your Classroom?
          </h2>
          <p className="font-sans text-[#DAD2D8] mb-10 text-base md:text-lg max-w-xl mx-auto">
            Join thousands of teachers and students already utilizing LearnSphere to enrich daily tasks logs.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <button 
              onClick={() => navigate('/signup')}
              className="bg-[#EC9A29] text-[#143642] hover:bg-[#d6851b] font-semibold text-base px-8 py-4 rounded-xl transition-all hover:scale-103 shadow-md border-transparent cursor-pointer"
            >
              Create Free Account
            </button>
            <button 
              onClick={() => scrollToSection('features')}
              className="border border-white hover:bg-white/10 font-medium text-base px-8 py-4 rounded-xl transition-all cursor-pointer"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>


      {/* SECTION I — FOOTER */}
      <footer 
        className="bg-[#143642] text-[#DAD2D8] pt-20 pb-10 border-t border-white/5"
        id="landing-footer"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16" id="footer-top-grid">
          
          {/* Col 1 Slogan */}
          <div className="flex flex-col items-start" id="footer-logo-panel">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#0F8B8D] flex items-center justify-center text-white font-bold">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-lg text-white tracking-wide">
                LearnSphere
              </span>
            </div>
            <p className="font-sans text-sm text-[#DAD2D8]/70 leading-relaxed mb-6">
              Modern digital virtual classrooms tailored for teachers, crafted for student engagement and results transparency.
            </p>
          </div>

          {/* Col 2 Product */}
          <div id="footer-product-links">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-6 font-display">
              Product
            </h4>
            <ul className="space-y-3 text-sm font-sans">
              <li><button onClick={() => scrollToSection('features')} className="hover:text-[#EC9A29] transition-colors">Features</button></li>
              <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#EC9A29] transition-colors">How It Works</button></li>
              <li><button onClick={() => scrollToSection('roles')} className="hover:text-[#EC9A29] transition-colors">Roles</button></li>
              <li><Link to="/login" className="hover:text-[#EC9A29] transition-colors">Portal Access</Link></li>
            </ul>
          </div>

          {/* Col 3 Company */}
          <div id="footer-company-links">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-6 font-display">
              Company
            </h4>
            <ul className="space-y-3 text-sm font-sans">
              <li><span className="cursor-not-allowed text-white/50">About Us</span></li>
              <li><span className="cursor-not-allowed text-white/50">Blog News</span></li>
              <li><span className="cursor-not-allowed text-white/50">Careers</span></li>
              <li><span className="cursor-not-allowed text-white/50">Press Hub</span></li>
            </ul>
          </div>

          {/* Col 4 Legal */}
          <div id="footer-legal-links">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-6 font-display">
              Legal
            </h4>
            <ul className="space-y-3 text-sm font-sans">
              <li><span className="cursor-not-allowed text-white/50">Privacy Policy</span></li>
              <li><span className="cursor-not-allowed text-white/50">Terms of Use</span></li>
              <li><span className="cursor-not-allowed text-white/50">Cookie Choices</span></li>
              <li><span className="cursor-not-allowed text-white/50">Refund Policies</span></li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div 
          className="max-w-7xl mx-auto px-6 md:px-12 pt-8 border-t border-white/10 text-center flex flex-col sm:flex-row items-center justify-between gap-4"
          id="footer-bottom-row"
        >
          <p className="text-xs text-[#DAD2D8]/50 font-sans">
            © 2026 LearnSphere. All rights reserved. Built with pride for tomorrow's learners.
          </p>
          <div className="flex gap-4 text-xs font-sans text-[#DAD2D8]/60" id="footer-metadata">
            <span>Server region: Cloud Run sandbox</span>
            <span>⏱ Local System UTC</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
