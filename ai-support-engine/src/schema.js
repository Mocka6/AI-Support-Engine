// Contrato único de respuesta para ambos motores + validaciones.
const CATEGORIES = ['ACCESS', 'BUG', 'FEATURE', 'SECURITY'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const MODES = ['traditional', 'generative'];
const MAX_LEN = 2000;

function validateRequest(body) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) return ['El cuerpo debe ser un objeto JSON'];
  if (typeof body.message !== 'string' || !body.message.trim()) errors.push('"message" es obligatorio y debe ser texto no vacío');
  else if (body.message.length > MAX_LEN) errors.push(`"message" excede ${MAX_LEN} caracteres`);
  if (!MODES.includes(body.mode)) errors.push(`"mode" debe ser uno de: ${MODES.join(', ')}`);
  return errors;
}

// Valida lo que devuelve el modelo (o cualquier motor). Retorna lista de errores.
function validateResult(r) {
  const e = [];
  if (!r || typeof r !== 'object') return ['La salida no es un objeto'];
  if (!CATEGORIES.includes(r.category)) e.push('category inválida');
  if (!PRIORITIES.includes(r.priority)) e.push('priority inválida');
  if (typeof r.response !== 'string' || r.response.trim().length < 10 || r.response.length > 1200) e.push('response inválida');
  if (typeof r.requiresHumanReview !== 'boolean') e.push('requiresHumanReview debe ser booleano');
  return e;
}

module.exports = { CATEGORIES, PRIORITIES, MODES, MAX_LEN, validateRequest, validateResult };
