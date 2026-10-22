import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllClasses, getClass, unitExamCount, unitLessonCount } from '@/lib/curriculum';
import Icon from '@/components/Icon';

export function generateStaticParams() {
  return getAllClasses().map((c) => ({ classSlug: c.slug }));
}

export default function ClassPage({ params }: { params: { classSlug: string } }) {
  const course = getClass(params.classSlug);
  if (!course) notFound();

  return (
    <div className="container page">
      <nav className="crumbs">
        <Link href="/">Courses</Link>
        <Icon name="chevronRight" size={13} />
        <span>{course.courseNumber}</span>
      </nav>

      <header className="page-head">
        <span className="plate">{course.courseNumber}</span>
        <h1 className="page-title">{course.title}</h1>
        <p className="muted page-lede" style={{ maxWidth: '48rem' }}>
          {course.description}
        </p>
      </header>

      {course.units.length === 0 ? (
        <div className="empty-state">
          <Icon name="lock" size={22} />
          <h3>Content in preparation</h3>
          <p className="muted">
            Practice material for {course.courseNumber} isn&rsquo;t available yet.
          </p>
        </div>
      ) : (
        <>
          <h2 className="section-head">
            <Icon name="list" size={18} /> Units
          </h2>
          <div className="card-grid">
            {course.units.map((unit) => {
              const count = unitExamCount(unit);
              const lessons = unitLessonCount(course.slug, unit.slug);
              const comingSoon = count === 0 && lessons === 0;
              const badges: string[] = [];
              if (lessons > 0) badges.push(`${lessons} lesson${lessons === 1 ? '' : 's'}`);
              if (count > 0) badges.push(`${count} exam${count === 1 ? '' : 's'}`);
              return (
                <article key={unit.slug} className={`card${comingSoon ? ' is-disabled' : ''}`}>
                  <div className="card-head">
                    <span className="card-icon" aria-hidden>
                      <Icon name="bookOpen" size={18} />
                    </span>
                    {comingSoon ? (
                      <span className="badge badge--muted">
                        <Icon name="lock" size={13} /> Coming soon
                      </span>
                    ) : (
                      <span className="badge">{badges.join(' · ')}</span>
                    )}
                  </div>
                  <h3 className="card-title">{unit.title}</h3>
                  <p className="muted card-desc">{unit.description}</p>
                  {comingSoon ? (
                    <span className="btn btn--sm is-disabled" aria-disabled>
                      Unavailable
                    </span>
                  ) : (
                    <Link
                      className="btn btn--primary btn--sm"
                      href={`/classes/${course.slug}/${unit.slug}`}
                    >
                      View unit <Icon name="arrowRight" size={15} />
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
