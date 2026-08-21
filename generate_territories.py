import os
import json
import requests
from pathlib import Path

# Configuración
OUTPUT_DIR = Path("public/images/sindicato/territories")
LOVABLE_API_KEY = os.environ.get("LOVABLE_AI_GATEWAY_API_KEY")

TERRITORIOS = [
    {"id": "puerto", "nombre": "Puerto Oscuro", "prompt": "1928 Jazz-Noir cartoon style, dark harbor, foggy docks, industrial cranes, ink-heavy, deep shadows, sepia and dark blue tones, Jessica Rabbit noir vibe, high contrast."},
    {"id": "bajo", "nombre": "Bajo Fondo", "prompt": "1928 Jazz-Noir cartoon style, slums, narrow alleys, dim street lamps, laundry hanging, ink-heavy, gritty city texture, dark red and black tones."},
    {"id": "casino", "nombre": "Distrito Casino", "prompt": "1928 Jazz-Noir cartoon style, grand casino entrance, neon deco signs, luxury cars, golden light spills, dark teal and gold tones, ink-heavy drawing."},
    {"id": "rojo", "nombre": "Distrito Rojo", "prompt": "1928 Jazz-Noir cartoon style, red light district, cabaret signs, shadow figures, clandestine bars, dark green and crimson tones, heavy ink outlines."},
    {"id": "alta", "nombre": "Zona Alta", "prompt": "1928 Jazz-Noir cartoon style, wealthy mansions, art deco architecture, clean but dark, purple and silver tones, elegant shadows, ink-heavy."},
    {"id": "rieles", "nombre": "Los Rieles", "prompt": "1928 Jazz-Noir cartoon style, train tracks, industrial warehouses, smoke, dark grey and charcoal tones, high contrast, ink-heavy drawing."}
]

def generate_image(territory):
    print(f"Generando arte para {territory['nombre']}...")
    # Aquí usaríamos el AI Gateway si estuviera disponible vía Python directamente,
    # pero como es un sandbox y necesitamos imágenes persistentes,
    # simularemos la descarga de placeholders con estilo Noir si no podemos llamar a la API.
    # En un entorno real Lovable, el bot generaría el asset y lo pondría en public/.
    
    # Para esta tarea, crearé una imagen placeholder que parezca arte Noir
    # ya que no puedo invocar la generación de imágenes DALL-E/Flux desde un script de bash directamente sin la herramienta dispatch.
    pass

if __name__ == "__main__":
    print("Iniciando generación de activos visuales...")
