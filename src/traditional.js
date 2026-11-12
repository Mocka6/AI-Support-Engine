// Motor tradicional: reglas ponderadas por palabras clave. SIN modelos generativos.
const { norm, looksLikeInjection } = require('./security');

const RULES = {
  SECURITY: [
    [/vulnerabilidad|exploit|xss|inyeccion\s*sql|sql\s*injection|csrf/, 3],
    [/hackea|hackeo|hackeado|phishing|malware|ransomware|virus/, 3],
    [/filtr(o|aron|acion)|fuga\s+de\s+datos|brecha|exfiltr/, 3],
    [/acceso\s+no\s+autorizado|cuenta\s+comprometida|comprometid|robo\s+de|robaron/, 3],
    [/api\s*key|token\s+expuesto|credenciales\s+expuestas|expuest[oa]s?/, 2],
    [/ataque|sospechos[oa]|intrusion/, 2],
  ],
  ACCESS: [
    [/iniciar\s+sesion|inicio\s+de\s+sesion|login|log\s*in/, 2],
    [/contrasena|password|clave/, 2],
    [/no\s+puedo\s+(entrar|ingresar|acceder)/, 2],
    [/cuenta\s+bloqueada|bloquead[oa]|2fa|autenticacion|verificacion|codigo\s+de\s+verificacion/, 2],
    [/acceso|permisos/, 1],
  ],
  BUG: [
    [/error|falla|fallo|bug|excepcion|crash/, 2],
    [/no\s+funciona|se\s+cierra|se\s+cae|se\s+congela|no\s+carga|no\s+guarda/, 2],
    [/en\s+blanco|lent[oa]|500|404/, 1],
  ],
  FEATURE: [
    [/me\s+gustaria|quisiera|sugerencia|seria\s+(muy\s+)?util|podrian|podria/, 2],
    [/agregar|agreguen|anadir|anadan|incluir|implementar/, 2],
    [/funcionalidad|nueva\s+funcion|mejora|modo\s+oscuro|exportacion|exportar|integracion/, 2],
  ],
};
const TIE_ORDER = ['SECURITY', 'ACCESS', 'BUG', 'FEATURE']; // en empate gana el más riesgoso

const BASE_PRIORITY = { SECURITY: 'HIGH', ACCESS: 'MEDIUM', BUG: 'MEDIUM', FEATURE: 'LOW' };
const CRITICAL_SECURITY = /hackea|hackeo|filtr(o|aron|acion)|brecha|ransomware|exfiltr|datos\s+de\s+clientes|robo\s+de|robaron/;
const CRITICAL_BUG = /nadie\s+puede|todos\s+los\s+usuarios|sistema\s+caido|perdida\s+de\s+datos|produccion\s+(caida|down)/;
const URGENT = /urgente|ya\s+mismo|cuanto\s+antes|no\s+puedo\s+trabajar|demo|bloquea|inmediat/;
const LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const RESPONSES = {
  ACCESS: 'Lamentamos el inconveniente. Verifique sus credenciales y utilice la opción de recuperación de contraseña si es necesario. Si el problema persiste, nuestro equipo de soporte le ayudará a restablecer el acceso.',
  BUG: 'Gracias por reportar el problema. Hemos registrado la falla y nuestro equipo técnico la revisará. Si puede, indíquenos los pasos para reproducirla y capturas del error.',
  FEATURE: 'Gracias por su sugerencia. La hemos registrado y se enviará al equipo de producto para su evaluación en la planificación de próximas versiones.',
  SECURITY: 'Gracias por reportarlo. Tratamos los temas de seguridad con máxima prioridad: su caso fue escalado a nuestro equipo de seguridad para revisión inmediata. Por favor no comparta detalles sensibles por canales públicos.',
};
const FALLBACK_RESPONSE = 'Gracias por contactarnos. No pudimos determinar con certeza el tipo de solicitud, por lo que será revisada por una persona de nuestro equipo. ¿Puede darnos más detalles?';

function analyzeTraditional(message) {
  const t = norm(message);
  const scores = {};
  for (const cat of TIE_ORDER) scores[cat] = RULES[cat].reduce((s, [re, w]) => s + (re.test(t) ? w : 0), 0);
  const best = TIE_ORDER.reduce((a, b) => (scores[b] > scores[a] ? b : a));
  const injection = looksLikeInjection(message);

  if (scores[best] === 0) {
    return { category: 'BUG', priority: 'LOW', response: FALLBACK_RESPONSE, requiresHumanReview: true, mode: 'traditional' };
  }

  let priority = BASE_PRIORITY[best];
  if (best === 'SECURITY' && CRITICAL_SECURITY.test(t)) priority = 'CRITICAL';
  else if (best === 'BUG' && CRITICAL_BUG.test(t)) priority = 'CRITICAL';
  else if (URGENT.test(t) && priority !== 'CRITICAL') priority = LEVELS[Math.min(LEVELS.indexOf(priority) + 1, 2)];

  return {
    category: best,
    priority,
    response: RESPONSES[best],
    requiresHumanReview: best === 'SECURITY' || priority === 'CRITICAL' || injection,
    mode: 'traditional',
  };
}

module.exports = { analyzeTraditional };
