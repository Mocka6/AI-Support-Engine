// Carga mínima de .env (sin dependencias). Nunca sobrescribe variables ya definidas.
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', '.env');
if (fs.existsSync(file)) {
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#') && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
