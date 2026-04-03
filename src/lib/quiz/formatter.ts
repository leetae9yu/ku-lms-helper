import type { QuizExtraction, QuizQuestion, QuizAnswer } from './types';

function questionTitle(question: QuizQuestion): string {
  return question.label ?? `문제 ${question.index}`;
}

function answerText(answer: QuizAnswer): string {
  return answer.text.length > 0 ? answer.text : answer.html ?? '';
}

function answerIndexesLabel(indexes: number[]): string {
  return indexes.length > 0 ? indexes.map((index) => `${index}번`).join(', ') : '정보 없음';
}

function explanationText(question: QuizQuestion): string | undefined {
  const answerComment = question.answers.find((answer) => answer.comment?.text)?.comment?.text;
  const comment = answerComment ?? question.questionComment?.text;
  return comment ? `해설: ${comment}` : undefined;
}

export function formatQuizAsTxt(quiz: QuizExtraction): string {
  const lines: string[] = [];

  lines.push(`퀴즈: ${quiz.meta.title ?? '제목 없음'}`);
  if (quiz.meta.score) lines.push(`점수: ${quiz.meta.score}`);
  if (quiz.meta.submittedAt) lines.push(`제출: ${quiz.meta.submittedAt}`);
  if (quiz.meta.duration) lines.push(`소요 시간: ${quiz.meta.duration}`);
  lines.push('');

  for (const question of quiz.questions) {
    lines.push(questionTitle(question));
    lines.push(question.text.length > 0 ? question.text : question.html ?? '');

    for (const answer of question.answers) {
      lines.push(`${answer.index}. ${answerText(answer)}`);
    }

    lines.push('');
    lines.push(`정답: ${answerIndexesLabel(question.correctAnswerIndexes)}`);

    const explanation = explanationText(question);
    if (explanation) lines.push(explanation);

    lines.push('');
  }

  return `${lines.join('\n').trim()}\n`;
}

export function formatQuizAsJson(quiz: QuizExtraction): string {
  return JSON.stringify(quiz, null, 2);
}
