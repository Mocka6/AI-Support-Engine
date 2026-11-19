# AI Support Engine
   ## Integrantes
  Janeth Cabrera Arguelles
  Concepcion Guadalupe Paniagua Gonzalez
  Jarumi Guadalupe Flores Osorio

   **Universidad Tecnológica de Tehuacán.** Reto práctico: AI Support Engine.

   ## Estado del avance (entrega 2)
   - Motor tradicional y API funcionando y probados (85% en los casos de referencia).
   - Motor generativo probado con modelo real (46 % en categoría+prioridad, 92 % solo categoría).
   - Nuevo: tercer motor `ml` (TF-IDF + Regresión Logística) en un microservicio Python.

Clasificador de solicitudes de soporte (ACCESS / BUG / FEATURE / SECURITY + prioridad) con tres motores que comparten el mismo contrato de respuesta:

- **traditional**: reglas ponderadas por palabras clave (sin IA generativa).
- **ml**: TF-IDF + Regresión Logística (scikit-learn) en un microservicio Python/FastAPI; Node lo consume por HTTP.
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
| `src/ml.js` | Cliente del microservicio ML (categoría) + prioridad por reglas |
| `ml_service/` | Microservicio Python: dataset, entrenamiento y API `/predict` |
| `test/compare.js` | Pruebas comparativas con clasificación de referencia |

## Microservicio ML (Python)

```bash
cd ml_service
pip install -r requirements.txt
python generate_dataset.py   # crea tickets.csv (200 registros: message,category)
python train.py              # entrena, imprime classification_report y guarda model.joblib
python -m uvicorn app:app --port 8000   # dejar corriendo
```

Luego, en otra terminal, `npm start` y usar `"mode": "ml"`. `npm run compare` incluye el modo ml si el servicio está activo.

- `POST /predict` devuelve `{"category": "...", "confidence": 0.93}`; `GET /health`.
- El modelo solo predice la **categoría**; prioridad y respuesta salen de las reglas del motor tradicional.
- Confianza < 0.5, SECURITY o prioridad CRITICAL activan `requiresHumanReview: true`. Si el servicio no responde, la API devuelve 502.
- `tickets.csv` es **sintético** (generado con plantillas): el 100 % del `classification_report` no refleja desempeño real.

## Seguridad
- La clave solo se lee de variables de entorno; los errores al cliente nunca incluyen headers ni claves.
- El texto del usuario va delimitado en `<solicitud>` y el prompt lo trata como datos.
- Todo SECURITY o intento de inyección se fuerza a `requiresHumanReview: true` en código, aunque el modelo diga lo contrario. Un SECURITY nunca queda en LOW.
- Salida del modelo validada (categoría, prioridad, tipos); si falla, se reintenta una vez y luego se devuelve 502.

## Resultados
Se ejecutaron 13 casos (normales, ambiguos y adversarios) contra una clasificación de referencia definida antes de correr los motores. Evidencias de ejecución en la carpeta `evidencias/`.


## Conclusión técnica

El tradicional y el ML lograron 85 % de aciertos en categoría y prioridad (11 de 13); el generativo, 46 % (6 de 13), aunque en categoría sola alcanzó 92 % frente a 85 %. Las reglas fallaron en mensajes ambiguos porque no hallan palabras clave; el ML resolvió dos de los tres, pero falló ante la inyección, que clasificó como FEATURE, y en "Ayuda, no sirve". Su 100 % interno no refleja desempeño real, pues el dataset es sintético. El generativo entiende mejor el contexto, pero tiende a subir la prioridad y, ante la inyección, la bajó de HIGH a MEDIUM. Ninguno fue perfecto: el tradicional igualó al ML sin necesitar datos de entrenamiento. Lo ideal es un híbrido: ML o LLM para la categoría, reglas para prioridad y seguridad, y revisión humana cuando la confianza sea baja.