# AI Support Engine
   ## Integrantes
  Janteh Cabrera Arguelles
  Concepcion Guadalupe Paniagua Gonzalez
  Jarumi Guadaluoe Flores Oosorio

   **Universidad Tecnológica de Tehuacán.** Reto práctico: AI Support Engine.

   ## Estado del avance (entrega 1)
   - Motor tradicional y API funcionando y probados (85% en los casos de referencia).
   - Motor generativo implementado; pruebas con modelo real pendientes para la entrega 2.
   - Pendiente: evidencias completas, tabla comparativa final y conclusión técnica.

Clasificador de solicitudes de soporte (ACCESS / BUG / FEATURE / SECURITY + prioridad) con dos motores que comparten el mismo contrato de respuesta:

- **traditional**: reglas ponderadas por palabras clave (sin IA generativa).
- **generative**: LLM real (Anthropic API u Ollama local) que devuelve JSON, validado antes de responder.

## Requisitos
Node.js 18+ (sin dependencias npm).

## Configuración
```bash
cp .env.example .env
# Opción A (API): edita ANTHROPIC_API_KEY en .env
# Opción B (local): PROVIDER=ollama, y ten corriendo `ollama run llama3.1`
```
`.env` está en `.gitignore`: nunca subas tu clave.

## Ejecutar
```bash
npm start          # API en http://localhost:3000
npm run compare    # 13 casos comparativos -> consola + results.md
```

## Uso
```bash
curl -X POST localhost:3000/api/analyze -H 'content-type: application/json' \
  -d '{"message":"No puedo iniciar sesión","mode":"generative"}'
```
Respuesta:
```json
{"category":"ACCESS","priority":"MEDIUM","response":"...","requiresHumanReview":false,"mode":"generative"}
```
Errores: `400` solicitud inválida · `413` payload > 10 KB · `502` proveedor caído/formato inválido · `500` interno.

## Arquitectura
| Archivo | Rol |
|---|---|
| `src/server.js` | HTTP, validación de entrada, manejo de errores |
| `src/analyze.js` | Selecciona motor y aplica reglas de seguridad independientes del modelo |
| `src/traditional.js` | Motor de reglas |
| `src/generative.js` | Cliente LLM, timeout, validación de JSON, 1 reintento |
| `src/schema.js` | Contrato y validadores |
| `src/security.js` | Detección heurística de prompt injection |
| `test/compare.js` | Pruebas comparativas con clasificación de referencia |

## Seguridad
- La clave solo se lee de variables de entorno; los errores al cliente nunca incluyen headers ni claves.
- El texto del usuario va delimitado en `<solicitud>` y el prompt lo trata como datos.
- Todo SECURITY o intento de inyección se fuerza a `requiresHumanReview: true` en código, aunque el modelo diga lo contrario. Un SECURITY nunca queda en LOW.
- Salida del modelo validada (categoría, prioridad, tipos); si falla, se reintenta una vez y luego se devuelve 502.

## Resultados
Ver `results.md` (generado por `npm run compare`). Pega aquí la tabla y tu conclusión (máx. 150 palabras).
