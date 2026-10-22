import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClassUnitPairs, getClass, getUnit, getExam, getLessonSet } from '@/lib/curriculum';
import Icon from '@/components/Icon';

export function generateStaticParams() {
  return getClassUnitPairs();
}

export default function UnitPage({
  params,
}: {
  params: { classSlug: string; unitSlug: string };
}) {
  const course = getClass(params.classSlug);
  const unit = getUnit(params.classSlug, params.unitSlug);
  if (!course || !unit) notFound();

  const exams = unit.examSlugs
    .map((s) => getExam(s))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  const lessonSet = getLessonSet(params.classSlug, params.unitSlug);
  const base = `/classes/${course.slug}/${unit.slug}`;

  return (
    <div className="container page">
      <nav className="crumbs">
        <Link href="/">Courses</Link>
        <Icon name="chevronRight" size={13} />
        <Link href={`/classes/${course.slug}`}>{course.courseNumber}</Link>
        <Icon name="chevronRight" size={13} />
        <span>{unit.title}</span>
      </nav>

      <header className="page-head">
        <h1 className="page-title">{unit.title}</h1>
        <p className="muted page-lede" style={{ maxWidth: '48rem' }}>
          {unit.description}
        </p>
      </header>

      {lessonSet && lessonSet.lessons.length > 0 ? (
        <section className="unit-section">
          <h2 className="section-head">
            <Icon name="bookOpen" size={18} /> Interactive lessons
          </h2>
          <p className="muted" style={{ maxWidth: '48rem', marginTop: '-0.4rem' }}>
            {lessonSet.description}
          </p>
          <ol className="lesson-list">
            {lessonSet.lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link href={`${base}/lessons/${lesson.id}`} className="question-row">
                  <span className="question-row__num">
                    {String(lesson.order).padStart(2, '0')}
                  </span>
                  <div className="question-row__body">
                    <span className="question-row__theme">{lesson.theme}</span>
                    <span className="question-row__title">{lesson.title}</span>
                  </div>
                  <span className="meta">Lesson</span>
                  <Icon name="chevronRight" size={16} className="question-row__chev" />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {exams.length === 0 && (!lessonSet || lessonSet.lessons.length === 0) ? (
        <div className="empty-state">
          <Icon name="lock" size={22} />
          <h3>No content yet</h3>
          <p className="muted">Practice exams and lessons for this unit are being prepared.</p>
        </div>
      ) : exams.length === 0 ? null : (
        <>
          <h2 className="section-head">
            <Icon name="code" size={18} /> Practice exams
          </h2>
          <div className="card-grid">
            {exams.map((exam) => (
              <article key={exam.slug} className="card">
                <div className="card-head">
                  <span className="card-icon" aria-hidden>
                    <Icon name="code" size={18} />
                  </span>
                  <span className="meta">
                    <Icon name="clock" size={13} /> {exam.timeLimitMinutes} min
                  </span>
                  <span className="meta">{exam.totalPoints} pts</span>
                </div>
                <h3 className="card-title">
                  {exam.title}
                  {exam.subtitle ? <span className="muted"> — {exam.subtitle}</span> : null}
                </h3>
                <p className="muted card-desc">{exam.description}</p>
                <div className="card-foot">
                  <span className="badge">{exam.questions.length} questions</span>
                  <Link
                    className="btn btn--primary btn--sm"
                    href={`/classes/${course.slug}/${unit.slug}/${exam.slug}`}
                  >
                    Open exam <Icon name="arrowRight" size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
