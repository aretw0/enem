function finiteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${label} deve ser um número finito`);
  return number;
}

export function weightedAverage(scores, weights) {
  if (!Array.isArray(scores) || !Array.isArray(weights) || scores.length !== weights.length || scores.length === 0) {
    throw new TypeError('notas e pesos devem ter o mesmo tamanho não vazio');
  }
  const normalizedScores = scores.map((value, index) => finiteNumber(value, `nota ${index + 1}`));
  const normalizedWeights = weights.map((value, index) => finiteNumber(value, `peso ${index + 1}`));
  if (normalizedScores.some((score) => score < 0 || score > 1000)) throw new RangeError('notas devem ficar entre 0 e 1000');
  if (normalizedWeights.some((weight) => weight < 0)) throw new RangeError('pesos não podem ser negativos');
  const totalWeight = normalizedWeights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight <= 0) throw new RangeError('a soma dos pesos deve ser positiva');
  return normalizedScores.reduce((sum, score, index) => sum + score * normalizedWeights[index], 0) / totalWeight;
}

export function requiredScore({ target, scores, weights, missingIndex }) {
  const normalizedTarget = finiteNumber(target, 'meta');
  if (normalizedTarget < 0 || normalizedTarget > 1000) throw new RangeError('meta deve ficar entre 0 e 1000');
  if (!Number.isInteger(missingIndex) || missingIndex < 0 || missingIndex >= scores.length) throw new RangeError('área a descobrir inválida');
  const missingWeight = finiteNumber(weights[missingIndex], 'peso da área a descobrir');
  if (missingWeight <= 0) throw new RangeError('o peso da área a descobrir deve ser positivo');
  const knownScores = scores.map((score, index) => index === missingIndex ? 0 : finiteNumber(score, `nota ${index + 1}`));
  const normalizedWeights = weights.map((weight, index) => finiteNumber(weight, `peso ${index + 1}`));
  if (knownScores.some((score) => score < 0 || score > 1000)) throw new RangeError('notas devem ficar entre 0 e 1000');
  if (normalizedWeights.some((weight) => weight < 0)) throw new RangeError('pesos não podem ser negativos');
  const totalWeight = normalizedWeights.reduce((sum, weight) => sum + weight, 0);
  const knownContribution = knownScores.reduce((sum, score, index) => sum + score * normalizedWeights[index], 0);
  return (normalizedTarget * totalWeight - knownContribution) / missingWeight;
}
