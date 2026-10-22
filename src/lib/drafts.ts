// ---------------------------------------------------------------------------
// Draft persistence to sessionStorage.
//
// Per the architecture spec's "Data Persistence & Deletion Flow":
//  - Code auto-saves to sessionStorage (survives an accidental reload).
//  - sessionStorage is purged by the browser when the tab is closed.
//  - No sensitive data is ever stored (security spec Storage Segmentation):
//    only the user's own draft code for a question. No tokens, no PII.
// ---------------------------------------------------------------------------

const PREFIX = 'boiler-cs:draft:';

function keyFor(examSlug: string, questionId: string, filename: string): string {
  return `${PREFIX}${examSlug}:${questionId}:${filename}`;
}

export function saveDraft(
  examSlug: string,
  questionId: string,
  filename: string,
  contents: string,
): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(keyFor(examSlug, questionId, filename), contents);
  } catch {
    // Storage can throw in private mode or when full; drafts are best-effort.
  }
}

export function loadDraft(
  examSlug: string,
  questionId: string,
  filename: string,
): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(keyFor(examSlug, questionId, filename));
  } catch {
    return null;
  }
}

export function clearDraft(examSlug: string, questionId: string, filename: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(keyFor(examSlug, questionId, filename));
  } catch {
    // ignore
  }
}

/** Clear every draft for one question (all files). */
export function clearQuestionDrafts(
  examSlug: string,
  questionId: string,
  filenames: string[],
): void {
  filenames.forEach((f) => clearDraft(examSlug, questionId, f));
}

// ---------------------------------------------------------------------------
// User-created extra files.
//
// Beyond the starter files, a learner can add their own files (new tabs). We
// persist the *list* of those filenames (their contents use the same per-file
// draft storage above) so an accidental reload keeps the tabs too.
// ---------------------------------------------------------------------------

const FILES_PREFIX = 'boiler-cs:files:';

function filesKey(examSlug: string, questionId: string): string {
  return `${FILES_PREFIX}${examSlug}:${questionId}`;
}

export function loadAddedFiles(examSlug: string, questionId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(filesKey(examSlug, questionId));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveAddedFiles(
  examSlug: string,
  questionId: string,
  filenames: string[],
): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(filesKey(examSlug, questionId), JSON.stringify(filenames));
  } catch {
    // best-effort
  }
}

export function clearAddedFiles(examSlug: string, questionId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(filesKey(examSlug, questionId));
  } catch {
    // ignore
  }
}
