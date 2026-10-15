import Link from 'next/link';
import { getAllClasses, classExamCount } from '@/lib/curriculum';
import Icon from '@/components/Icon';

export default function HomePage() {
  const classes = getAllClasses();

  return (
    <div className="container page">
      <header className="page-head">
        <p className="eyebrow">Purdue Computer Science</p>
        <h1 className="page-title">Purdue CS Practice &amp; Exam Archive</h1>
        <p className="muted page-lede">
          Browse courses, open a practice exam, and run or grade your Java directly in the
          browser.
        </p>
      </header>

      <h2 className="section-head">
        <Icon name="layers" size={18} /> Courses
      </h2>

      <div className="card-grid">
        {classes.map((c) => {
          const count = classExamCount(c);
          const comingSoon = count === 0;
          return (
            <article key={c.slug} className={`card${comingSoon ? ' is-disabled' : ''}`}>
              <div className="card-head">
                <span className="card-icon" aria-hidden>
                  <Icon name="book" size={18} />
                </span>
                <span className="plate">{c.courseNumber}</span>
                {comingSoon ? (
                  <span className="badge badge--muted">
                    <Icon name="lock" size={13} /> Coming soon
                  </span>
                ) : (
                  <span className="badge">
                    {count} exam{count === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <h3 className="card-title">{c.title}</h3>
              <p className="muted card-desc">{c.description}</p>
              {comingSoon ? (
                <span className="btn btn--sm is-disabled" aria-disabled>
                  Unavailable
                </span>
              ) : (
                <Link className="btn btn--primary btn--sm" href={`/classes/${c.slug}`}>
                  View course <Icon name="arrowRight" size={15} />
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
