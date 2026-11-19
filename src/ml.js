// Motor ML: delega la categoría a un microservicio Python (TF-IDF + Regresión Logística).
// El servicio solo predice categoría; prioridad y respuesta se resuelven con las reglas existentes.
const { norm } = require('./security');
const { priorityFor, RESPONSES } = require('./traditional');
const { CATEGORIES } = require('./schema');
const { ProviderError } = require('./generative');

const URL_BASE = () => process.env.ML_SERVICE_URL || 'http://localhost:8000';
const MIN_CONFIDENCE = 0.5; // por debajo, se manda a revisión humana

async function isAvailable() {
  try {
    const r = await fetch(`${URL_BASE()}/health`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch { return false; }
}

async function analyzeMl(message) {
  let data;
  try {
    const res = await fetch(`${URL_BASE()}/predict`, {
      method: 'POST',
      signal: AbortSignal.timeout(Number(process.env.ML_TIMEOUT_MS) || 5000),
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new ProviderError(`El servicio ML respondió con HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    throw new ProviderError('No se pudo contactar el servicio ML');
  }
  if (!CATEGORIES.includes(data.category) || typeof data.confidence !== 'number') {
    throw new ProviderError('El servicio ML devolvió un formato inválido');
  }
  const priority = priorityFor(data.category, norm(message));
  return {
    category: data.category,
    priority,
    response: RESPONSES[data.category],
    requiresHumanReview: data.category === 'SECURITY' || priority === 'CRITICAL' || data.confidence < MIN_CONFIDENCE,
    mode: 'ml',
  };
}

module.exports = { analyzeMl, isAvailable };
