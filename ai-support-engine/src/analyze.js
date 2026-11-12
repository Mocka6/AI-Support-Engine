// Punto único: elige motor y aplica reglas de seguridad INDEPENDIENTES del modelo.
const { analyzeTraditional } = require('./traditional');
const { analyzeGenerative } = require('./generative');
const { looksLikeInjection } = require('./security');

async function analyze(message, mode) {
  const result = mode === 'generative' ? await analyzeGenerative(message) : analyzeTraditional(message);
  // Red de seguridad: aunque el modelo diga false, estos casos van a revisión humana.
  if (result.category === 'SECURITY' || looksLikeInjection(message)) result.requiresHumanReview = true;
  if (result.category === 'SECURITY' && result.priority === 'LOW') result.priority = 'MEDIUM'; // un incidente nunca es LOW
  return result;
}

module.exports = { analyze };
