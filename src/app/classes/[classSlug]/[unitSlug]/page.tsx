import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClassUnitPairs, getClass, getUnit, getExam } from '@/lib/curriculum';
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

      {exams.length === 0 ? (
        <div className="empty-state">
          <Icon name="lock" size={22} />
          <h3>No exams yet</h3>
          <p className="muted">Practice exams for this unit are being prepared.</p>
        </div>
      ) : (
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
