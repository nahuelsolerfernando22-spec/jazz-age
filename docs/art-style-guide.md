# Guía de Arte — El Cuervo Dorado

Canon visual para todo asset generado por IA. Referencia obligatoria: `src/assets/jade-portrait-happy.webp` (anfitrionas) y `src/assets/reglas-hero.jpg` (escenarios/cabeceras).

## 1. Movimiento
**Art-Decó Noir 1928** — óleo semi-realista, pincelada visible, iluminación cinematográfica cálida. Nunca cel-shading plano, nunca cómic vectorial, nunca "anime moderno".

## 2. Paleta fija
| Rol | Hex | Uso |
|---|---|---|
| Caoba oxblood | `#3a1a12` → `#5c2018` | Paredes, madera, sombras profundas |
| Negro salón | `#0b0705` | Fondo neutro, viñeteado |
| Latón cálido | `#c9a84c` | Filetes, marcos, tipografía dorada |
| Latón claro | `#f0d78c` | Highlights metálicos, reflejos |
| Verde banquero | `#1e4a3a` | Lámparas, paño de mesa, acento frío |
| Rojo terciopelo | `#7a1e1e` | Cortinas, tapizados, acentos dramáticos |
| Marfil papel | `#ecebe6` | Piel iluminada, cartas, tipografía clara |
| Humo | `#8a7a6a` translúcido | Ambiente, atmósfera, cigarros |

Prohibido: neones, magentas saturados, azules eléctricos, verdes lima, degradados pastel.

## 3. Materiales
- **Madera**: caoba veteada, barniz brillante, reflejos cálidos.
- **Metal**: latón envejecido con highlights suaves — nunca cromo espejo, nunca oro plástico.
- **Tela**: terciopelo con pliegues definidos, seda con brillo satinado.
- **Vidrio**: cristal ámbar o verde botella, reflejos puntuales de lámpara.
- **Papel/cartas**: tinta oscura sobre marfil crema; monograma "CD" dorado al reverso.

## 4. Iluminación
Fuente cálida principal (lámpara de banquero verde o sconce art-decó de latón) desde ~45°. Sombras densas y suaves, nunca duras. Viñeteado sutil. Humo volumétrico leve. Nunca luz cenital plana ni flash frontal.

## 5. Composición
- **Anfitrionas**: encuadre torso/busto, mirada al espectador, fondo art-decó desenfocado (papel tapiz geométrico + medallón dorado). Vertical.
- **Cabeceras de sección**: horizontal 1536×640, escena del salón con protagonista objetual (ruleta, libro, gramófono…), profundidad de campo marcada, zona inferior limpia para tipografía.
- **Tiles de juego**: cuadrado, un objeto icónico centrado sobre paño verde o caoba, marco dorado implícito.
- **Iconografía**: monocromo latón sobre fondo oscuro, trazo grueso, simetría art-decó.

## 6. Tipografía sobre arte
- Títulos: **Bebas Neue**, tracking `0.1em`, color `#c9a84c`.
- Sobretítulos: uppercase, tracking `0.3em`, color `#ecebe6/45`.
- Siempre con degradado inferior `from-[#0b1512] via-[#0b1512]/40 to-transparent` para asegurar contraste.

## 7. Prompt base (IA)
Incluir siempre:
> "1928 art-deco noir salon, semi-realistic oil painting, warm cinematic lighting from a green banker's lamp, mahogany oxblood walls with brass art-deco filigree, painterly brushwork, soft depth of field, cigar smoke haze"

Evitar: "vector", "flat", "anime", "3d render", "cartoon", "cyberpunk", "neon".

## 8. Flujo de aprobación
1. Generar **3 variantes** en canon.
2. Usuario elige una → se ancla como asset definitivo (sin sufijo `-vN`).
3. Se eliminan las descartadas del repo.
4. Nunca reintroducir estilos ya rechazados (ver `mem://index.md`).
