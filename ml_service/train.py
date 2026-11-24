"""Paso 1: separar datos (160 entrenamiento / 40 prueba) y entrenar el modelo.
Paso 2: evaluar con los 40 de prueba y probar un mensaje nuevo.
Ejecutar desde la carpeta ml_service:  python train.py
Instalar antes:  python -m pip install --user pandas scikit-learn joblib
"""
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

data = pd.read_csv("tickets.csv", encoding="utf-8-sig")

# 80 % entrenamiento (160) / 20 % prueba (40), manteniendo la proporción de categorías
X_train, X_test, y_train, y_test = train_test_split(
    data["message"], data["category"], test_size=0.2,
    stratify=data["category"], random_state=42
)

model = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
    ("classifier", LogisticRegression(max_iter=1000))
])

model.fit(X_train, y_train)

print(f"Registros totales: {len(data)}")
print(f"Entrenamiento: {len(X_train)} | Prueba: {len(X_test)}")
print("Categorías en entrenamiento:\n", y_train.value_counts().to_string())
print("Modelo entrenado.")

# Guardamos el modelo y el conjunto de prueba para el siguiente paso (evaluación)
joblib.dump(model, "model.joblib")
pd.DataFrame({"message": X_test, "category": y_test}).to_csv(
    "test_split.csv", index=False, encoding="utf-8-sig"
)
print("Guardados: model.joblib y test_split.csv")

# ---------- Paso 2: evaluación ----------
predictions = model.predict(X_test)
print("\n=== Reporte de clasificación (40 registros de prueba) ===")
print(classification_report(y_test, predictions, zero_division=0))

print("=== Matriz de confusión (filas = real, columnas = predicho) ===")
print("Orden de clases:", list(model.classes_))
print(confusion_matrix(
    y_test, predictions, labels=model.classes_
))

# ---------- Prueba con un mensaje nuevo ----------
new_message = ["Encontré datos de otros clientes"]
category = model.predict(new_message)[0]
confidence = model.predict_proba(new_message).max()

print("\nMensaje:", new_message[0])
print("Categoría:", category)
print("Score aproximado:", round(confidence, 3))