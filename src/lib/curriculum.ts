// ---------------------------------------------------------------------------
// Curriculum loader. In a static export there is no server, so the flat JSON
// files under public/data are imported directly for build-time static param
// generation and read at runtime, mirroring the architecture spec's
// "Static JSON Delivery" data layer.
//
// Hierarchy: Class -> Unit (midterm) -> Exam -> Question
// ---------------------------------------------------------------------------

import type { Catalog, CourseClass, Exam, Unit } from './types';

import classesJson from '../../public/data/classes.json';
import exam1 from '../../public/data/exams/practice-exam-1.json';
import exam2 from '../../public/data/exams/practice-exam-2.json';
import exam3 from '../../public/data/exams/practice-exam-3.json';
import exam4 from '../../public/data/exams/practice-exam-4.json';

// Build-time registry: maps exam slug -> Exam object.
const EXAM_REGISTRY: Record<string, Exam> = {
  [exam1.slug]: exam1 as Exam,
  [exam2.slug]: exam2 as Exam,
  [exam3.slug]: exam3 as Exam,
  [exam4.slug]: exam4 as Exam,
};

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
