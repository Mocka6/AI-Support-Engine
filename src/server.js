require('./env');
const http = require('http');
const { validateRequest } = require('./schema');
const { analyze } = require('./analyze');
const { ProviderError } = require('./generative');

const MAX_BODY = 10 * 1024;
const send = (res, code, obj) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('Payload demasiado grande'), { status: 413 })); req.destroy(); }
      else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/api/analyze') return send(res, 404, { error: 'Ruta no encontrada. Usa POST /api/analyze' });
  try {
    let body;
    try { body = JSON.parse(await readBody(req)); } catch (e) {
      if (e.status) throw e;
      return send(res, 400, { error: 'JSON inválido' });
    }
    const errors = validateRequest(body);
    if (errors.length) return send(res, 400, { error: 'Solicitud inválida', details: errors });
    return send(res, 200, await analyze(body.message.trim(), body.mode));
  } catch (err) {
    if (err.status === 413) return send(res, 413, { error: err.message });
    if (err instanceof ProviderError) return send(res, 502, { error: 'El motor generativo no está disponible', detail: err.message });
    console.error('Error interno:', err.message); // nunca se loguean headers ni claves
    return send(res, 500, { error: 'Error interno del servidor' });
  }
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`AI Support Engine escuchando en http://localhost:${port}`));
}
module.exports = server;
