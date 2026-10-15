import { notFound } from 'next/navigation';
import { getClassUnitExamTriples, getClass, getUnit, getExam } from '@/lib/curriculum';
import QuestionWorkspace from '@/components/QuestionWorkspace';

export function generateStaticParams() {
  const params: {
    classSlug: string;
    unitSlug: string;
    examSlug: string;
    questionId: string;
  }[] = [];
  for (const t of getClassUnitExamTriples()) {
    const exam = getExam(t.examSlug);
    if (!exam) continue;
    for (const q of exam.questions) {
      params.push({
        classSlug: t.classSlug,
        unitSlug: t.unitSlug,
        examSlug: t.examSlug,
        questionId: q.id,
      });
    }
  }
  return params;
}

export default function QuestionPage({
  params,
}: {
  params: { classSlug: string; unitSlug: string; examSlug: string; questionId: string };
}) {
  const course = getClass(params.classSlug);
  const unit = getUnit(params.classSlug, params.unitSlug);
  const exam = getExam(params.examSlug);
  if (!course || !unit || !exam) notFound();

  const index = exam.questions.findIndex((q) => q.id === params.questionId);
  if (index === -1) notFound();
  const question = exam.questions[index];

  const base = `/classes/${course.slug}/${unit.slug}/${exam.slug}`;
  const prev = index > 0 ? `${base}/${exam.questions[index - 1].id}` : null;
  const next =
    index < exam.questions.length - 1 ? `${base}/${exam.questions[index + 1].id}` : null;

  return (
    <QuestionWorkspace
      classSlug={course.slug}
      classTitle={course.courseNumber}
      unitSlug={unit.slug}
      unitTitle={unit.title}
      examSlug={exam.slug}
      examTitle={exam.title}
      language={course.language}
      question={question}
      prevHref={prev}
      nextHref={next}
    />
  );
}
