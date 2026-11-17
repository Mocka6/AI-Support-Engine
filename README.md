# AI Support Engine
   ## Integrantes
  Janeth Cabrera Arguelles
  Concepcion Guadalupe Paniagua Gonzalez
  Jarumi Guadalupe Flores Osorio

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
Se ejecutaron 13 casos (normales, ambiguos y adversarios) contra una clasificación de referencia definida antes de correr los motores. Evidencias de ejecución en la carpeta `evidencias/`.


## Conclusión técnica
El motor tradicional obtuvo 85 % de aciertos en categoría y prioridad (11 de 13), frente a 46 % del generativo (6 de 13); en categoría sola, el generativo logró 92 % contra 85 %. Ambos cumplieron el formato en el 100 % de los casos. El tradicional fue más preciso porque sus reglas fijan la prioridad de forma determinista y es reproducible; falló en los casos ambiguos, donde no reconoce frases fuera de sus palabras clave. El generativo entendió mejor el contexto y resolvió algunos casos ambiguos, pero tendió a subir la prioridad y, ante la inyección, bajó la prioridad de HIGH a MEDIUM, aunque mantuvo SECURITY y la revisión humana que el código fuerza. Para este problema, el tradicional funcionó mejor en conjunto; lo ideal es combinarlos: el generativo para categoría y respuesta, y reglas para prioridad y seguridad.
