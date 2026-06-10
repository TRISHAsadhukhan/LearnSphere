import React from 'react';
import { useAppStore } from '../../store';
import { Award, FileText, Info, ListCollapse, Sparkles } from 'lucide-react';
import dayjs from 'dayjs';

interface MyScoresSectionProps {
  classId: string;
}

export default function MyScoresSection({ classId }: MyScoresSectionProps) {
  const currentUser = useAppStore(state => state.currentUser);
  const myScores = useAppStore(state => state.myScores);

  // Compute calculated metrics
  const gradedExams = React.useMemo(() => {
    if (!myScores || !myScores.exam_scores) return [];
    return myScores.exam_scores.map((ex: any) => ({
      id: String(ex.exam_id),
      title: ex.title,
      totalMarks: ex.total || 10,
      score: ex.score,
      percent: ex.score !== null && ex.total ? Math.round((ex.score / ex.total) * 100) : null,
      submitted: ex.attempted
    }));
  }, [myScores]);

  const gradedHws = React.useMemo(() => {
    if (!myScores || !myScores.assignment_scores) return [];
    return myScores.assignment_scores.map((hw: any) => ({
      id: String(hw.assignment_id),
      title: hw.title,
      totalMarks: 20, // default or standard
      score: hw.marks,
      percent: hw.marks !== null ? Math.round((hw.marks / 20) * 100) : null,
      submitted: hw.submitted,
      graded: hw.marks !== null
    }));
  }, [myScores]);

  const scoredExamsList = gradedExams.filter(g => g.percent !== null);
  const scoredHwsList = gradedHws.filter(g => g.percent !== null);

  const totalExamScoreWeighted = scoredExamsList.reduce((sum, g) => sum + (g.percent || 0), 0);
  const avgExamScore = scoredExamsList.length > 0 ? Math.round(totalExamScoreWeighted / scoredExamsList.length) : 0;

  const totalHwScoreWeighted = scoredHwsList.reduce((sum, g) => sum + (g.percent || 0), 0);
  const avgHwScore = scoredHwsList.length > 0 ? Math.round(totalHwScoreWeighted / scoredHwsList.length) : 0;

  const grandProgressPercent = scoredExamsList.length > 0 || scoredHwsList.length > 0 
    ? Math.round((avgExamScore + avgHwScore) / 2) 
    : 0;

  // Let's get Grade letter rating from calculated statistics
  const getGradeRatingSymbol = (percent: number) => {
    if (percent >= 95) return { r: 'A+', c: 'text-emerald-500 border-emerald-500 bg-emerald-50', note: 'Secure Outstanding' };
    if (percent >= 90) return { r: 'A', c: 'text-emerald-500 border-emerald-500 bg-emerald-50', note: 'Highly Competent' };
    if (percent >= 80) return { r: 'B+', c: 'text-[#0F8B8D] border-[#0F8B8D] bg-[#0F8B8D]/5', note: 'Standard Commendable' };
    if (percent >= 70) return { r: 'B', c: 'text-[#0F8B8D] border-[#0F8B8D] bg-[#0F8B8D]/5', note: 'Satisfactory standard' };
    if (percent >= 60) return { r: 'C', c: 'text-[#EC9A29] border-[#EC9A29] bg-[#EC9A29]/5', note: 'Requires effort revision' };
    return { r: 'D', c: 'text-red-500 border-red-500 bg-red-50', note: 'Review guidelines' };
  };

  const currentGrade = getGradeRatingSymbol(grandProgressPercent);

  return (
    <div className="space-y-6 text-left" id="my-scores-section-container">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4" id="scores-header-block">
        <div className="space-y-1 select-none">
          <h2 className="font-serif font-bold text-2xl text-brand-dark flex items-center gap-2">
            🏆 Personal Grade Booklet
          </h2>
          <p className="text-xs text-brand-dark/65 font-semibold uppercase tracking-wider">
            Monitor scores metrics summaries, exam questionnaires tallies, and grading sheets.
          </p>
        </div>
      </div>

      {/* RATING RADIAL OVERVIEWS GRID cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="scores-analytical-grid">
        
        {/* Total grade symbol display */}
        <div className="bg-white rounded-2xl border border-gray-155 p-6 flex items-center justify-between shadow-sm select-none" id="ov-grade">
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest leading-none">Class letter Grade Coefficient</p>
            <h3 className="text-xl font-display font-black text-brand-dark">Grade Achievement</h3>
            <p className="text-[11px] font-semibold text-gray-400 italic">{currentGrade.note}</p>
          </div>
          <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-display font-black text-lg ${currentGrade.c}`}>
            {grandProgressPercent > 0 ? currentGrade.r : 'N/A'}
          </div>
        </div>

        {/* Exams Average visual Progress bar */}
        <div className="bg-white rounded-2xl border border-gray-155 p-6 space-y-3.5 shadow-sm" id="ov-exams">
          <div className="flex items-center justify-between select-none font-sans">
            <span className="flex items-center gap-1 text-xs font-bold text-brand-dark/80"><Award className="w-4.5 h-4.5 text-[#EC9A29] shrink-0" /> Examinations average</span>
            <span className="text-xs font-extrabold font-mono text-brand-primary">{avgExamScore}% Accuracy</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${avgExamScore}%` }} />
          </div>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black leading-none select-none">
            Scale includes {scoredExamsList.length} graded MCQ sheets
          </p>
        </div>

        {/* HW Average progress bar */}
        <div className="bg-white rounded-2xl border border-gray-155 p-6 space-y-3.5 shadow-sm" id="ov-hws">
          <div className="flex items-center justify-between select-none font-sans">
            <span className="flex items-center gap-1 text-xs font-bold text-brand-dark/80"><FileText className="w-4.5 h-4.5 text-brand-primary shrink-0" /> Homework project average</span>
            <span className="text-xs font-extrabold font-mono text-brand-primary">{avgHwScore}% Progress</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${avgHwScore}%` }} />
          </div>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black leading-none select-none">
            Scale includes {scoredHwsList.length} evaluated PDF submissions
          </p>
        </div>

      </div>

      {/* TWO BLOCK TALLIED REPORTS LISTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2" id="scores-grade-logs-row">
        
        {/* EXAMS GRADING BULLETINS */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4 shadow-sm" id="scores-exams-reports">
          <h4 className="font-display font-bold text-brand-dark text-sm border-b border-gray-100 pb-2.5 uppercase tracking-wide flex items-center gap-2 select-none">
            📋 Examination Responses (Details)
          </h4>

          {gradedExams.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400 font-semibold select-none">No active exams logged in scorecard.</div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1" id="scrolling-scored-exams">
              {gradedExams.map((ex) => (
                <div key={ex.id} className="border border-gray-100 rounded-xl p-3.5 bg-gray-50 flex items-center justify-between text-xs">
                  <div className="space-y-1 pr-4 min-w-0">
                    <p className="font-bold text-brand-dark truncate leading-tight select-all">{ex.title}</p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase font-sans">Max Score cap: {ex.totalMarks} Marks</p>
                  </div>

                  <div className="shrink-0 text-right select-none">
                    {ex.submitted ? (
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-brand-primary block">{ex.score} / {ex.totalMarks}</span>
                        <span className="text-[9px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-black uppercase tracking-wider">{ex.percent}% Correct</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-red-500 font-bold bg-stretch uppercase tracking-wide">Not attempted</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HOMEWORKS GRADING BULLETINS */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4 shadow-sm" id="scores-homework-reports">
          <h4 className="font-display font-bold text-brand-dark text-sm border-b border-gray-100 pb-2.5 uppercase tracking-wide flex items-center gap-2 select-none">
            📁 Home submission Papers (Details)
          </h4>

          {gradedHws.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400 font-semibold select-none">No active homework sheets published.</div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1" id="scrolling-scored-hws">
              {gradedHws.map((hw) => (
                <div key={hw.id} className="border border-gray-100 rounded-xl p-3.5 bg-gray-50 flex items-center justify-between text-xs">
                  <div className="space-y-1 pr-4 min-w-0">
                    <p className="font-bold text-brand-dark truncate leading-tight select-all">{hw.title}</p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase font-sans">Points scaling: {hw.totalMarks} Points</p>
                  </div>

                  <div className="shrink-0 text-right select-none">
                    {hw.submitted ? (
                      hw.graded ? (
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-brand-primary block">{hw.score} / {hw.totalMarks}</span>
                          <span className="text-[9px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-black uppercase tracking-wider">{hw.percent}%</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#EC9A29] font-black bg-[#EC9A29]/10 px-2 py-1 rounded-full uppercase tracking-wider">Pending Grade</span>
                      )
                    ) : (
                      <span className="text-[10px] text-red-500 font-bold bg-stretch uppercase tracking-wide">Not Submitted</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
