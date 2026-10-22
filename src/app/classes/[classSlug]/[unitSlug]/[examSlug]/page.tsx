import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClassUnitExamTriples, getClass, getUnit, getExam } from '@/lib/curriculum';
import Icon from '@/components/Icon';
import ExamScoreboard, { QuestionScorePill } from '@/components/ExamScoreboard';

export function generateStaticParams() {
  return getClassUnitExamTriples().map((t) => ({
    classSlug: t.classSlug,
    unitSlug: t.unitSlug,
    examSlug: t.examSlug,
  }));
}

export default function ExamPage({
  params,
}: {
  params: { classSlug: string; unitSlug: string; examSlug: string };
}) {
  const course = getClass(params.classSlug);
  const unit = getUnit(params.classSlug, params.unitSlug);
  const exam = getExam(params.examSlug);
  if (!course || !unit || !exam) notFound();

  const base = `/classes/${course.slug}/${unit.slug}/${exam.slug}`;

  return (
    <div className="container page">
      <nav className="crumbs">
        <Link href="/">Courses</Link>
        <Icon name="chevronRight" size={13} />
        <Link href={`/classes/${course.slug}`}>{course.courseNumber}</Link>
        <Icon name="chevronRight" size={13} />
        <Link href={`/classes/${course.slug}/${unit.slug}`}>{unit.title}</Link>
        <Icon name="chevronRight" size={13} />
        <span>{exam.title}</span>
      </nav>

      <header className="page-head">
        <h1 className="page-title">
          {exam.title}
          {exam.subtitle ? <span className="muted"> — {exam.subtitle}</span> : null}
        </h1>
        <div className="meta-row">
          <span className="meta">
            <Icon name="clock" size={14} /> {exam.timeLimitMinutes} minutes
          </span>
          <span className="meta">{exam.totalPoints} points</span>
          <span className="meta">{exam.questions.length} questions</span>
        </div>
        <p className="muted page-lede" style={{ maxWidth: '48rem' }}>
          {exam.description}
        </p>
      </header>

      <ExamScoreboard
        examSlug={exam.slug}
        questions={exam.questions.map((q) => ({ id: q.id, points: q.points }))}
      />

      <ol className="question-list">
        {exam.questions.map((q) => (
          <li key={q.id}>
            <Link href={`${base}/${q.id}`} className="question-row">
              <span className="question-row__num">{String(q.order).padStart(2, '0')}</span>
              <div className="question-row__body">
                <span className="question-row__theme">{q.theme}</span>
                <span className="question-row__title">{q.title}</span>
              </div>
              <QuestionScorePill examSlug={exam.slug} questionId={q.id} points={q.points} />
              <span className="meta">{q.points} pts</span>
              <Icon name="chevronRight" size={16} className="question-row__chev" />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
