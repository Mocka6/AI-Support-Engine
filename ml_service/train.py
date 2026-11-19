"""Entrena el clasificador TF-IDF + Regresión Logística y guarda model.joblib."""
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

data = pd.read_csv("tickets.csv", encoding="utf-8-sig")

X_train, X_test, y_train, y_test = train_test_split(
    data["message"],
    data["category"],
    test_size=0.2,
    stratify=data["category"],
    random_state=42,
)

model = Pipeline([
    ("vectorizer", TfidfVectorizer(ngram_range=(1, 2))),
    ("classifier", LogisticRegression(max_iter=1000)),
])

model.fit(X_train, y_train)

predictions = model.predict(X_test)
print(classification_report(y_test, predictions))

print(model.predict(["Alguien entró a mi cuenta sin autorización"]))

joblib.dump(model, "model.joblib")
print("Modelo guardado en model.joblib")
