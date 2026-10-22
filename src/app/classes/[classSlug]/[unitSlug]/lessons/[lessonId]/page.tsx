import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getClassUnitLessonTriples,
  getClass,
  getUnit,
  getLessonSet,
} from '@/lib/curriculum';
import Icon from '@/components/Icon';
import LessonContent from '@/components/LessonContent';

export function generateStaticParams() {
  return getClassUnitLessonTriples();
}

export default function LessonPage({
  params,
}: {
  params: { classSlug: string; unitSlug: string; lessonId: string };
}) {
  const course = getClass(params.classSlug);
  const unit = getUnit(params.classSlug, params.unitSlug);
  const set = getLessonSet(params.classSlug, params.unitSlug);
  if (!course || !unit || !set) notFound();

  const index = set.lessons.findIndex((l) => l.id === params.lessonId);
  if (index === -1) notFound();
  const lesson = set.lessons[index];

  const base = `/classes/${course.slug}/${unit.slug}`;
  const prev = index > 0 ? set.lessons[index - 1] : null;
  const next = index < set.lessons.length - 1 ? set.lessons[index + 1] : null;

  return (
    <div className="container page">
      <nav className="crumbs">
        <Link href="/">Courses</Link>
        <Icon name="chevronRight" size={13} />
        <Link href={`/classes/${course.slug}`}>{course.courseNumber}</Link>
        <Icon name="chevronRight" size={13} />
        <Link href={base}>{unit.title}</Link>
        <Icon name="chevronRight" size={13} />
        <span>Lesson {lesson.order}</span>
      </nav>

      <header className="page-head">
        <span className="eyebrow" style={{ display: 'block' }}>
          Lesson {lesson.order} · {lesson.theme}
        </span>
        <h1 className="page-title">{lesson.title}</h1>
      </header>

      <article>
        <LessonContent body={lesson.body} language={course.language} />
      </article>

      <nav className="lesson-nav">
        {prev ? (
          <Link className="btn btn--ghost btn--sm" href={`${base}/lessons/${prev.id}`}>
            <Icon name="chevronLeft" size={15} /> Lesson {prev.order}
          </Link>
        ) : (
          <span className="btn btn--ghost btn--sm is-disabled" aria-disabled>
            <Icon name="chevronLeft" size={15} /> Prev
          </span>
        )}
        <Link className="btn btn--ghost btn--sm" href={base}>
          All lessons
        </Link>
        {next ? (
          <Link className="btn btn--primary btn--sm" href={`${base}/lessons/${next.id}`}>
            Lesson {next.order} <Icon name="chevronRight" size={15} />
          </Link>
        ) : (
          <span className="btn btn--ghost btn--sm is-disabled" aria-disabled>
            Next <Icon name="chevronRight" size={15} />
          </span>
        )}
      </nav>
    </div>
  );
}
