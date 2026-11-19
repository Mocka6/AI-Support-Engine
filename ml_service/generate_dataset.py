"""Genera tickets.csv con 200 registros (50 por categoría). Reproducible (seed fija)."""
import itertools
import random
import pandas as pd

random.seed(42)

PREFIJOS = ["", "Hola, ", "Buen día, ", "Urgente: "]

DATA = {
    "ACCESS": (
        ["No puedo iniciar sesión", "No me deja entrar a mi cuenta", "Olvidé mi contraseña",
         "Mi cuenta aparece bloqueada", "El código de verificación nunca llega",
         "Me sale credenciales incorrectas", "La autenticación en dos pasos falla",
         "No puedo ingresar al panel", "El enlace para restablecer la contraseña no funciona",
         "Me pide iniciar sesión una y otra vez"],
        ["", " desde la app móvil", " desde mi laptop", " desde ayer",
         " con mi correo de trabajo", " después de cambiar la contraseña",
         " en el navegador Chrome", " y necesito entrar hoy"],
    ),
    "BUG": (
        ["La aplicación se cierra sola", "Aparece un error 500 al guardar",
         "La página se queda en blanco", "El sistema se congela al cargar los reportes",
         "El botón de enviar no funciona", "La app va muy lenta",
         "Me sale un mensaje de error inesperado", "Los datos no se guardan",
         "La exportación falla a la mitad", "Las notificaciones no llegan"],
        ["", " al abrir el módulo de reportes", " desde la última actualización",
         " cada vez que lo intento", " en la versión web", " en el celular",
         " al adjuntar un archivo", " y perdí mi trabajo"],
    ),
    "FEATURE": (
        ["Me gustaría que agreguen modo oscuro", "Sería útil poder exportar a Excel",
         "Podrían añadir filtros por fecha", "Solicito una integración con Slack",
         "Propongo agregar un panel de estadísticas", "Quisiera poder personalizar el dashboard",
         "Sería genial tener una app para tablet", "Podrían implementar notificaciones por correo",
         "Necesitamos una opción para importar contactos", "Sugiero agregar soporte para varios idiomas"],
        ["", " en la próxima versión", " para nuestro equipo", " porque lo usamos a diario",
         " para ahorrar tiempo", " como mejora al producto", " si es posible", " para los reportes"],
    ),
    "SECURITY": (
        ["Alguien entró a mi cuenta sin autorización", "Encontré una vulnerabilidad en el formulario de login",
         "Recibí un correo de phishing con el logo de ustedes", "Creo que hackearon mi cuenta",
         "Se filtraron datos de clientes", "Detecté un intento de inyección SQL",
         "Hay un acceso sospechoso desde otro país", "Mi API key quedó expuesta en un repositorio público",
         "Sospecho que hay malware en el servidor", "Vi un ataque de fuerza bruta en los registros"],
        ["", " ayer por la noche", " y no fui yo", " en el sistema de producción",
         " hay que revisarlo cuanto antes", " según los registros de acceso",
         " desde una IP desconocida", " y temo que haya más afectados"],
    ),
}

rows = []
for categoria, (bases, contextos) in DATA.items():
    combos = [f"{p}{b}{c}." if not p.endswith(": ") else f"{p}{b}{c}."
              for p, b, c in itertools.product(PREFIJOS, bases, contextos)]
    combos = list(dict.fromkeys(combos))  # sin duplicados
    for msg in random.sample(combos, 50):
        rows.append({"message": msg, "category": categoria})

random.shuffle(rows)
df = pd.DataFrame(rows)
assert len(df) == 200 and df["message"].is_unique
# utf-8-sig para que Excel muestre bien los acentos
df.to_csv("tickets.csv", index=False, encoding="utf-8-sig")
print(df["category"].value_counts().to_string())
print("tickets.csv generado con", len(df), "registros")
