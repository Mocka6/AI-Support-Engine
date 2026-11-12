// Heurística de prompt injection / intentos de manipulación. Solo SEÑALA; no decide la clasificación.
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const INJECTION = [
  /ignora\w*\s+(todas\s+)?(las\s+)?(instrucciones|reglas)/,
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/,
  /olvida\w*\s+(todo|las\s+instrucciones)/,
  /(^|\W)system\s*:/,
  /eres\s+un\s+asistente\s+sin/,
  /clasifica\w*\s+(esto|esta|este)\b.*\bcomo\b/,
  /devuelve\s+(category|priority|categoria|prioridad)/,
  /(category|priority)\s*["']?\s*[:=]/,
  /respond[ea]?\s+(solo|unicamente)\s+con/,
  /prompt\s+(del\s+sistema|de\s+sistema)/,
];

function looksLikeInjection(message) {
  const t = norm(message);
  return INJECTION.some((re) => re.test(t));
}

module.exports = { norm, looksLikeInjection };
