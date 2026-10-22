'use client';

import { useEffect, useState } from 'react';
import {
  loadExamProgress,
  clearScore,
  letterGrade,
  type ExamProgress,
} from '@/lib/scores';

interface QInfo {
  id: string;
  points: number;
}

interface Props {
  examSlug: string;
  questions: QInfo[];
}

/**
 * Exam-level grade summary. Scores live in localStorage (client only), so this
 * hydrates after mount. Shows total earned / possible, a percentage, and a
 * conventional letter grade, plus a reset for the whole exam's scores.
 */
export default function ExamScoreboard({ examSlug, questions }: Props) {
  const [progress, setProgress] = useState<ExamProgress | null>(null);

  useEffect(() => {
    setProgress(loadExamProgress(examSlug, questions));
    // Re-read when the tab regains focus (e.g. after grading on a question page).
    const onFocus = () => setProgress(loadExamProgress(examSlug, questions));
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examSlug]);

  if (!progress || progress.attempted === 0) {
    return (
      <div className="scoreboard scoreboard--empty">
        <span className="eyebrow" style={{ margin: 0 }}>
          Your grade
        </span>
        <p className="muted" style={{ margin: 0 }}>
          Not started yet — press <strong>◆ Grade</strong> on any question to record a score.
          Scores are saved locally in this browser.
        </p>
      </div>
    );
  }

  const percent =
    progress.possible > 0 ? Math.round((progress.earned / progress.possible) * 100) : 0;

  const handleReset = () => {
    for (const q of questions) clearScore(examSlug, q.id);
    setProgress(loadExamProgress(examSlug, questions));
  };

  return (
    <div className="scoreboard">
      <div className="scoreboard__main">
        <span className="eyebrow" style={{ margin: 0 }}>
          Your grade
        </span>
        <div className="scoreboard__score">
          <span className="scoreboard__grade">{letterGrade(percent)}</span>
          <span className="scoreboard__pts">
            {progress.earned}/{progress.possible} pts
            <span className="scoreboard__pct"> · {percent}%</span>
          </span>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          {progress.completed} of {questions.length} questions fully solved ·{' '}
          {progress.attempted} attempted
        </p>
      </div>
      <button type="button" className="btn btn--ghost btn--sm" onClick={handleReset}>
        Reset grade
      </button>
    </div>
  );
}

/** Small per-row status pill, hydrated from localStorage. */
export function QuestionScorePill({
  examSlug,
  questionId,
  points,
}: {
  examSlug: string;
  questionId: string;
  points: number;
}) {
  const [progress, setProgress] = useState<ExamProgress | null>(null);

  useEffect(() => {
    setProgress(loadExamProgress(examSlug, [{ id: questionId, points }]));
    const onFocus = () =>
      setProgress(loadExamProgress(examSlug, [{ id: questionId, points }]));
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examSlug, questionId]);

  const sc = progress?.byQuestion[questionId];
  if (!sc) return null;

  const solved = sc.total > 0 && sc.passed === sc.total;
  return (
    <span
      className={`tag score-badge ${solved ? 'score-badge--pass' : 'score-badge--partial'}`}
      title={`${sc.passed}/${sc.total} tests passed`}
    >
      {solved ? '✓ ' : ''}
      {sc.earned}/{sc.points}
    </span>
  );
}
