// ---------------------------------------------------------------------------
// Curriculum loader. In a static export there is no server, so the flat JSON
// files under public/data are imported directly for build-time static param
// generation and read at runtime, mirroring the architecture spec's
// "Static JSON Delivery" data layer.
//
// Hierarchy: Class -> Unit (midterm) -> Exam -> Question
// ---------------------------------------------------------------------------

import type { Catalog, CourseClass, Exam, Unit, LessonSet, Lesson } from './types';

import classesJson from '../../public/data/classes.json';
import exam1 from '../../public/data/exams/practice-exam-1.json';
import exam2 from '../../public/data/exams/practice-exam-2.json';
import exam3 from '../../public/data/exams/practice-exam-3.json';
import exam4 from '../../public/data/exams/practice-exam-4.json';
import lessonsCs180M1 from '../../public/data/lessons/cs180-midterm-1.json';
import lessonsCs180M2 from '../../public/data/lessons/cs180-midterm-2.json';

// Build-time registry: maps exam slug -> Exam object.
const EXAM_REGISTRY: Record<string, Exam> = {
  [exam1.slug]: exam1 as Exam,
  [exam2.slug]: exam2 as Exam,
  [exam3.slug]: exam3 as Exam,
  [exam4.slug]: exam4 as Exam,
};

// Build-time registry: maps a "<classSlug>-<unitSlug>" key -> LessonSet.
const LESSON_REGISTRY: Record<string, LessonSet> = {
  [lessonsCs180M1.slug]: lessonsCs180M1 as LessonSet,
  [lessonsCs180M2.slug]: lessonsCs180M2 as LessonSet,
};

/** Registry key for a unit's lesson set. */
function lessonSetKey(classSlug: string, unitSlug: string): string {
  return `${classSlug}-${unitSlug}`;
}

export function getCatalog(): Catalog {
  return classesJson as Catalog;
}

export function getAllClasses(): CourseClass[] {
  return getCatalog().classes;
}

export function getClass(slug: string): CourseClass | undefined {
  return getCatalog().classes.find((c) => c.slug === slug);
}

export function getUnit(classSlug: string, unitSlug: string): Unit | undefined {
  return getClass(classSlug)?.units.find((u) => u.slug === unitSlug);
}

export function getExam(slug: string): Exam | undefined {
  return EXAM_REGISTRY[slug];
}

export function getAllExams(): Exam[] {
  return Object.values(EXAM_REGISTRY);
}

/** How many playable (populated) exams a unit has. */
export function unitExamCount(unit: Unit): number {
  return unit.examSlugs.filter((s) => EXAM_REGISTRY[s]).length;
}

/** How many playable exams a whole class has (across its units). */
export function classExamCount(course: CourseClass): number {
  return course.units.reduce((n, u) => n + unitExamCount(u), 0);
}

/** All (classSlug, unitSlug) pairs for static route generation. */
export function getClassUnitPairs(): { classSlug: string; unitSlug: string }[] {
  const pairs: { classSlug: string; unitSlug: string }[] = [];
  for (const c of getCatalog().classes) {
    for (const u of c.units) {
      pairs.push({ classSlug: c.slug, unitSlug: u.slug });
    }
  }
  return pairs;
}

/** All (classSlug, unitSlug, examSlug) triples that resolve to a real exam. */
export function getClassUnitExamTriples(): {
  classSlug: string;
  unitSlug: string;
  examSlug: string;
}[] {
  const triples: { classSlug: string; unitSlug: string; examSlug: string }[] = [];
  for (const c of getCatalog().classes) {
    for (const u of c.units) {
      for (const examSlug of u.examSlugs) {
        if (EXAM_REGISTRY[examSlug]) {
          triples.push({ classSlug: c.slug, unitSlug: u.slug, examSlug });
        }
      }
    }
  }
  return triples;
}


// ---- Lessons ---------------------------------------------------------------

/** The lesson set attached to a unit, if any. */
export function getLessonSet(classSlug: string, unitSlug: string): LessonSet | undefined {
  return LESSON_REGISTRY[lessonSetKey(classSlug, unitSlug)];
}

/** A single lesson within a unit's lesson set. */
export function getLesson(
  classSlug: string,
  unitSlug: string,
  lessonId: string,
): Lesson | undefined {
  return getLessonSet(classSlug, unitSlug)?.lessons.find((l) => l.id === lessonId);
}

/** How many lessons a unit has (0 if none). */
export function unitLessonCount(classSlug: string, unitSlug: string): number {
  return getLessonSet(classSlug, unitSlug)?.lessons.length ?? 0;
}

/** All (classSlug, unitSlug, lessonId) triples for static route generation. */
export function getClassUnitLessonTriples(): {
  classSlug: string;
  unitSlug: string;
  lessonId: string;
}[] {
  const triples: { classSlug: string; unitSlug: string; lessonId: string }[] = [];
  for (const c of getCatalog().classes) {
    for (const u of c.units) {
      const set = getLessonSet(c.slug, u.slug);
      if (!set) continue;
      for (const lesson of set.lessons) {
        triples.push({ classSlug: c.slug, unitSlug: u.slug, lessonId: lesson.id });
      }
    }
  }
  return triples;
}
