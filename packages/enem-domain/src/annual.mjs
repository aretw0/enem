const DATE = /^\d{4}-\d{2}-\d{2}$/;

function utcDate(value) {
  if (!DATE.test(value ?? '')) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

export function validateAnnualData(model, { asOf = new Date(), sourceIds = new Set() } = {}) {
  const errors = [];
  const today = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()));
  if (!Number.isInteger(model?.edition)) errors.push('edition deve ser um inteiro');
  else if (model.edition !== today.getUTCFullYear()) {
    errors.push(`edição ${model.edition} não corresponde ao ano corrente ${today.getUTCFullYear()}`);
  }
  const verified = utcDate(model?.verified);
  const reviewDue = utcDate(model?.reviewDue);
  if (!verified) errors.push('verified inválido');
  if (!reviewDue) errors.push('reviewDue inválido');
  if (verified && verified > today) errors.push('verified está no futuro');
  if (verified && reviewDue && reviewDue < verified) errors.push('reviewDue é anterior a verified');
  if (reviewDue && today > reviewDue) errors.push(`dados anuais vencidos desde ${model.reviewDue}`);
  if (!Array.isArray(model?.regularApplicationDates) || model.regularApplicationDates.length !== 2 ||
      model.regularApplicationDates.some((date) => !utcDate(date))) {
    errors.push('regularApplicationDates deve conter duas datas válidas');
  }
  if (!Array.isArray(model?.officialSourceIds) || !model.officialSourceIds.length) {
    errors.push('officialSourceIds vazio');
  } else {
    for (const sourceId of model.officialSourceIds) {
      if (!sourceIds.has(sourceId)) errors.push(`fonte anual desconhecida: ${sourceId}`);
    }
  }
  return errors;
}
