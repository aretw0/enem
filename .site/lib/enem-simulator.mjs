function seedHash(seed) {
  let hash = 2166136261;
  for (const character of String(seed)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = seedHash(seed) || 0x9e3779b9;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function selectQuestions(questions, { seed, size }) {
  if (!Array.isArray(questions)) throw new TypeError('questions deve ser um array');
  if (!Number.isInteger(size) || size < 1) throw new RangeError('size deve ser um inteiro positivo');
  const random = seededRandom(seed);
  const shuffled = [...questions];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled.slice(0, Math.min(size, shuffled.length));
}

export function evaluateAttempt(questions, responses) {
  const items = questions.map((question) => {
    const response = responses?.[question.id] ?? {};
    const selected = response.answer ?? null;
    const confidence = ['low', 'medium', 'high'].includes(response.confidence) ? response.confidence : null;
    const correct = selected === question.answer;
    return {
      id: question.id,
      item: question.item,
      selected,
      answer: question.answer,
      confidence,
      correct,
      unanswered: selected === null,
      fragile: correct && confidence === 'low',
    };
  });
  return {
    items,
    total: items.length,
    correct: items.filter((item) => item.correct).length,
    incorrect: items.filter((item) => !item.correct && !item.unanswered).length,
    unanswered: items.filter((item) => item.unanswered).length,
    fragile: items.filter((item) => item.fragile).length,
  };
}
