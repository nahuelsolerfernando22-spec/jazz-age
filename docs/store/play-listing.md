# Ficha de Google Play — El Cuervo Dorado

Documento de referencia para publicar el APK/AAB. Todo el contenido está en español rioplatense,
que es el idioma principal de la app.

## Identidad

- **Nombre de la app:** El Cuervo Dorado
- **applicationId:** `studio.tibet.cuervodorado`
- **Categoría:** Juegos → Cartas
- **Etiquetas:** cartas, casino simulado, offline, truco, mahjong
- **Sitio / soporte:** completar antes de publicar (correo de contacto obligatorio)

## Textos

**Título (30 car. máx.)**

```
El Cuervo Dorado
```

**Descripción corta (80 car. máx.)**

```
Salón clandestino de 1928: naipes, dados y torneos. Sin conexión y sin dinero real.
```

**Descripción larga (4000 car. máx.)**

```
Detrás de una puerta sin cartel del puerto, en 1928, funciona El Cuervo Dorado: un salón
clandestino con naipes criollos, dados, mesas de casino y una clientela con memoria larga.

QUÉ VAS A ENCONTRAR
• Truco, Chinchón, Escoba de 15 y La Mano Muerta (solitario).
• Mesas de casino: Blackjack, Póker, Ruleta y Bagatelle.
• Mahjong y El Sindicato, un juego de conquista por sectores con rivales que piensan.
• Torneo del Cuervo: cuatro rondas de eliminación, cuadro de 16, premios por ronda y
  divisiones que suben con tu temporada.

CÓMO SE JUEGA
• Rivales con personalidad propia y dificultad que se adapta a cómo venís jugando.
• Fichas ficticias, vidas que se recuperan solas y objetivos diarios.
• Estética art déco dibujada a mano, con haptics y audio propio.

100% SIN CONEXIÓN
No necesita internet, no pide cuenta y no manda tus datos a ningún lado: todo queda guardado
en tu teléfono.

AVISO
Juego de casino simulado. Las fichas y apuestas son ficticias: no se puede depositar, ganar ni
retirar dinero real, y no hay compras dentro de la app. Jugar acá no predice resultados en
juegos de apuestas con dinero real. Recomendado para mayores de 18 años.
```

## Recursos gráficos requeridos

| Recurso | Tamaño | Estado |
| --- | --- | --- |
| Ícono de la tienda | 512×512 PNG | pendiente de exportar desde `mipmap-xxxhdpi/ic_launcher_foreground.png` sobre `#0B1512` |
| Gráfico destacado | 1024×500 PNG/JPG | pendiente |
| Capturas de teléfono | mín. 4, 1080×1920+ | usar portada, salón, torneo (cuadro) y una mesa en juego |

Ícono adaptativo: foreground escalado al 62 % del lienzo para que ninguna máscara
(circular, squircle) recorte el emblema; fondo sólido `#0B1512` y capa monochrome para
los temas dinámicos de Android 13+.

## Clasificación de contenido (cuestionario IARC)

- Juegos de azar simulados: **Sí** — hay mesas de casino con fichas ficticias.
- Apuestas con dinero real: **No**.
- Compras dentro de la app: **No**.
- Anuncios: **No** hay red publicitaria; los "anuncios" para recuperar vidas son una
  simulación local sin terceros ni tracking.
- Violencia, sexo, lenguaje, sustancias: **No**.
- Resultado esperado: PEGI 12 / ESRB Teen con la etiqueta de juegos de azar simulados.

## Seguridad de los datos (Data Safety)

- No se recopilan datos: sin cuentas, sin analítica remota, sin identificadores publicitarios.
- No se comparten datos con terceros.
- Todo el estado (progreso, fichas, ajustes) vive en el almacenamiento local del dispositivo y
  se borra al desinstalar.
- La app funciona sin permisos de red en tiempo de ejecución.
- Política de privacidad: publicar la ruta `/privacidad` en una URL accesible y enlazarla en la
  ficha (Play exige una URL pública, no basta con la pantalla interna).

## Versionado

- `android/app/build.gradle`: `versionCode` sube de a uno en cada envío; `versionName` sigue
  semver y debe coincidir con `APP_VERSION` en `src/routes/ajustes.tsx`.
- Verificación automática: `bun scripts/check-version.ts`.

## Checklist antes de enviar

- [ ] `bun run build` en verde y suite de tests completa.
- [ ] `bun run check:offline` sin hallazgos (la app no debe pedir red).
- [ ] `bun scripts/check-version.ts` en verde.
- [ ] AAB firmado con la clave de release (no la de debug).
- [ ] Capturas y gráfico destacado subidos.
- [ ] URL pública de la política de privacidad cargada en la ficha.
- [ ] Cuestionario de contenido respondido con "juegos de azar simulados: sí".
