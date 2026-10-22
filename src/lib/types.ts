// ---------------------------------------------------------------------------
// Domain types for the stateless curriculum.
// Everything here is loaded from static JSON (public/data/*.json) at runtime,
// mirroring the "Static JSON Delivery" data layer in the architecture spec.
// ---------------------------------------------------------------------------

/** A single test case description shown to the learner. */
export interface TestCase {
  /** e.g. "Test 1 [Visible] (Sample Run)" */
  name: string;
  /** Whether the learner can see this case's expectations up front. */
  visible: boolean;
  /** Human-readable description of what the case checks. */
  description: string;
}

/** A starter file the learner edits (one tab in the editor). */
export interface StarterFile {
  /** e.g. "FlightTicket.java" */
  filename: string;
  /** Initial editor contents (usually a stub to fill in). */
  contents: string;
}

/** A single coding challenge within an exam. */
export interface Question {
  /** Stable slug, unique within an exam. e.g. "q1-flight-ticket" */
  id: string;
  /** Display order within the exam. */
  order: number;
  /** e.g. "Flight Ticket" */
  title: string;
  /** Point value. */
  points: number;
  /** Short theme tag, e.g. "Aviation". */
  theme: string;
  /** Markdown prompt describing the task. */
  prompt: string;
  /** Optional sample run block (markdown/code). */
  sampleRun?: string;
  /** Expected output of the sample run. */
  expectedOutput?: string;
  /** Files the learner starts with / edits. */
  starterFiles: StarterFile[];
  /** The test cases (visible + hidden descriptions). */
  tests: TestCase[];
  /**
   * Optional tester harness: a Java driver (with its own `main`) that
   * exercises the learner's classes and prints results — used by the "Test"
   * button for questions whose own code has no `main` (e.g. a plain class or
   * interface). If present, the expected console output of running the tester
   * is `testerExpectedOutput`.
   */
  testerCode?: string;
  /** Expected console output when the tester harness is run. */
  testerExpectedOutput?: string;
  /**
   * Optional graded test cases. Each case is a snippet of Java statements that
   * exercise the learner's classes; it should throw (or call `check(...)`) on
   * failure. When present, the workspace shows a "Grade" button that compiles
   * the learner's code with a generated harness and reports per-case
   * PASS/FAIL. Hidden cases are run and counted but their logic isn't shown.
   */
  graderCases?: GraderCase[];
}

export interface GraderCase {
  /** Display name, e.g. "Lower row clamp". */
  name: string;
  /** Whether to hide the specifics from the learner (still run + counted). */
  hidden: boolean;
  /**
   * Java statements run inside a per-case method. Use the provided helpers:
   *   check(boolean cond, String msg)   — fail with msg if cond is false
   *   eq(Object a, Object b)            — assert equals
   *   eqD(double a, double b)           — assert double equality (1e-6)
   * Example: `FlightTicket t = new FlightTicket("A","B"); t.setSeatRow(0); eq(t.getSeatRow(), 1);`
   */
  body: string;
}

/** A full practice exam (a suite of questions). */
export interface Exam {
  /** Stable slug used in the route, e.g. "practice-exam-1". */
  slug: string;
  /** e.g. "Practice Exam 1" */
  title: string;
  /** Optional subtitle/flavor for a themed exam. */
  subtitle?: string;
  /** Minutes allowed. */
  timeLimitMinutes: number;
  /** Total points. */
  totalPoints: number;
  /** Short description for the catalog card. */
  description: string;
  /** The questions in order. */
  questions: Question[];
}

/** A unit within a class — e.g. a specific midterm — that groups exams. */
export interface Unit {
  /** Stable slug, unique within a class, e.g. "midterm-2". */
  slug: string;
  /** e.g. "Midterm 2" */
  title: string;
  /** Short description for the unit card. */
  description: string;
  /** The exams belonging to this unit (slugs resolved against the registry). */
  examSlugs: string[];
}

/** A Purdue CS course. */
export interface CourseClass {
  /** Stable slug used in the route, e.g. "cs180". */
  slug: string;
  /** Course number badge, e.g. "CS 18000". */
  courseNumber: string;
  /** e.g. "Problem Solving and Object-Oriented Programming" */
  title: string;
  /** Longer description for the class page. */
  description: string;
  /** Programming language of the exams (drives the runner). */
  language: 'java' | 'javascript';
  /** The units (midterms) within this class. */
  units: Unit[];
}

/** Top-level catalog shape (classes.json). */
export interface Catalog {
  classes: CourseClass[];
}

// ---------------------------------------------------------------------------
// Interactive lessons (guided, read-through tutorials that accompany a unit's
// practice exams). Authored as markdown and loaded from static JSON, mirroring
// the exam data layer. Hierarchy: Class -> Unit -> LessonSet -> Lesson.
// ---------------------------------------------------------------------------

/** A single interactive lesson within a unit. */
export interface Lesson {
  /** Stable slug used in the route, e.g. "lesson-1-primitive-types". */
  id: string;
  /** Display order within the lesson set. */
  order: number;
  /** e.g. "Primitive Types, Arithmetic, Casting & Overflow". */
  title: string;
  /** Short theme/topic tag for the card, e.g. "Foundations". */
  theme: string;
  /** Markdown body of the full lesson (all three stages). */
  body: string;
}

/** A set of lessons attached to one unit (midterm). */
export interface LessonSet {
  /** Stable slug used in the registry / route, e.g. "cs180-midterm-1". */
  slug: string;
  /** e.g. "Interactive Mastery Guide — Midterm 1". */
  title: string;
  /** Short description for the unit page section. */
  description: string;
  /** The lessons in order. */
  lessons: Lesson[];
}
