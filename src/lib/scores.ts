// ---------------------------------------------------------------------------
// Score / grade persistence to localStorage.
//
// Unlike drafts (sessionStorage, purged when the tab closes), a learner's
// score for a question is meant to persist across sessions so they can track
// progress over time. We store only the learner's own grade outcome for a
// question — no code, no tokens, no PII (security spec Storage Segmentation).
//
// For each question we keep the BEST attempt seen so far: the attempt whose
// fraction of passed grader cases is highest. From the passed-case fraction we
// derive proportional points earned against the question's point value.
// ---------------------------------------------------------------------------

const PREFIX = 'boiler-cs:score:';
/** Bumped if the stored shape changes, so stale entries can be ignored. */
const VERSION = 1;

/** A single question's best recorded grade. */
export interface QuestionScore {
  v: number;
  /** Grader cases passed in the best attempt. */
  passed: number;
  /** Total grader cases in that attempt. */
  total: number;
  /** Point value of the question. */
  points: number;
  /** Points earned = round(points * passed / total). */
  earned: number;
  /** Epoch millis of when this best score was recorded. */
  updatedAt: number;
}

function keyFor(examSlug: string, questionId: string): string {
  return `${PREFIX}${examSlug}:${questionId}`;
}

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Points earned for a passed/total/points triple (proportional, rounded). */
export function earnedPoints(passed: number, total: number, points: number): number {
  if (total <= 0) return 0;
  return Math.round((points * passed) / total);
}

/** Read the stored best score for one question (or null if none/invalid). */
export function loadScore(examSlug: string, questionId: string): QuestionScore | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(keyFor(examSlug, questionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuestionScore;
    if (!parsed || parsed.v !== VERSION || typeof parsed.total !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Record a grade attempt. Keeps whichever attempt has the higher passed
 * fraction (ties broken by the newer attempt). Returns the stored (best) score.
 */
export function recordScore(
  examSlug: string,
  questionId: string,
  passed: number,
  total: number,
  points: number,
): QuestionScore {
  const next: QuestionScore = {
    v: VERSION,
    passed,
    total,
    points,
    earned: earnedPoints(passed, total, points),
    updatedAt: Date.now(),
  };

  const s = storage();
  if (!s) return next;

  const prev = loadScore(examSlug, questionId);
  const prevFrac = prev && prev.total > 0 ? prev.passed / prev.total : -1;
  const nextFrac = total > 0 ? passed / total : -1;
  const best = nextFrac >= prevFrac ? next : prev!;

  try {
    s.setItem(keyFor(examSlug, questionId), JSON.stringify(best));
  } catch {
    // best-effort; storage may be full or disabled.
  }
  return best;
}

/** Remove the stored score for one question. */
export function clearScore(examSlug: string, questionId: string): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(keyFor(examSlug, questionId));
  } catch {
    // ignore
  }
}

export interface ExamProgress {
  /** Questions with a recorded score. */
  attempted: number;
  /** Questions fully passed (passed === total, total > 0). */
  completed: number;
  /** Sum of earned points across attempted questions. */
  earned: number;
  /** Sum of point values across the provided questions. */
  possible: number;
  /** Per-question lookup by questionId. */
  byQuestion: Record<string, QuestionScore>;
}

/** Aggregate stored scores for a set of questions in one exam. */
export function loadExamProgress(
  examSlug: string,
  questions: { id: string; points: number }[],
): ExamProgress {
  const byQuestion: Record<string, QuestionScore> = {};
  let attempted = 0;
  let completed = 0;
  let earned = 0;
  let possible = 0;

  for (const q of questions) {
    possible += q.points;
    const sc = loadScore(examSlug, q.id);
    if (!sc) continue;
    byQuestion[q.id] = sc;
    attempted += 1;
    earned += sc.earned;
    if (sc.total > 0 && sc.passed === sc.total) completed += 1;
  }

  return { attempted, completed, earned, possible, byQuestion };
}

/** Map a percentage (0–100) to a conventional letter grade. */
export function letterGrade(percent: number): string {
  if (percent >= 90) return 'A';
  if (percent >= 80) return 'B';
  if (percent >= 70) return 'C';
  if (percent >= 60) return 'D';
  return 'F';
}
