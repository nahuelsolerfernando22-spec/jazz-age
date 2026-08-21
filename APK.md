# Cuervo — Guía de build del APK

Juego 100% offline empaquetado con Capacitor. Todo el estado vive en el dispositivo, sin llamadas de red en runtime.

## Requisitos

- Node/Bun instalado
- JDK 17
- Android Studio (SDK 34, Platform Tools, `adb`)

## Build

```bash
bun install
bunx cap add android      # solo la primera vez
bun run apk:release
```

`apk:release` corre en orden:

1. `build:apk` → SPA estática, ofusca, precomprime y audita el bundle
2. `cap sync android` → copia `dist/client` al proyecto Android
3. Parche nativo: quita permiso `INTERNET`, fuerza portrait, aplica paleta noir, setea `versionCode`/`versionName`
4. Abre Android Studio

## Firmar APK

En Android Studio → **Build → Generate Signed App Bundle / APK…** → APK → variante **release**.
La primera vez creá un keystore (guardalo en un lugar seguro con la contraseña anotada).

Salida: `android/app/release/app-release.apk`.

## Instalar y verificar

```bash
adb install -r android/app/release/app-release.apk
adb shell svc wifi disable
adb shell svc data disable
```

Abrí la app, jugá una mesa, cerrala y volvela a abrir. El progreso debe persistir sin red.

## Capturar errores reales del APK en Android

### Verificar arranque frío y caliente

Con el teléfono conectado por USB y la depuración USB habilitada:

```bash
bun run apk:startup -- --install android/app/release/app-release.apk
```

La prueba instala el APK, fuerza un arranque en frío, manda la app al fondo y
valida un arranque en caliente. Falla si el proceso muere, la actividad inicial
no queda visible, aparece un crash/ANR/OOM o no se puede tomar la captura.

La evidencia queda en `reports/android-startup/<fecha>/`: capturas `cold.png` y
`warm.png`, logs de ambos arranques, memoria y `startup-report.json`.

Después de instalar el APK en el celular, corré esto desde la computadora con el teléfono conectado por USB y depuración USB activada:

```bash
bun run apk:logs
```

El script abre la app, apaga Wi-Fi/datos para probar modo offline y captura durante 4 minutos los logs importantes de Android/WebView/Capacitor. Mientras corre, probá especialmente **Slots** y **Mahjong**: girá varias veces, cambiá de sala, bloqueá/desbloqueá el celular y volvé al juego.

Salida del reporte:

```text
reports/android-apk/<fecha>/RESUMEN.md
reports/android-apk/<fecha>/logcat-filtrado.txt
reports/android-apk/<fecha>/meminfo-before.txt
reports/android-apk/<fecha>/meminfo-after.txt
```

Pasame primero `RESUMEN.md`. Si ahí aparece algo de memoria, WebView, assets o renderer, también pasame `logcat-filtrado.txt`.

Variantes útiles:

```bash
node scripts/apk-logcat.mjs --duration 600 --focus slots,mahjong --offline
node scripts/apk-logcat.mjs --keep-network
```

## Scripts útiles

- `bun run check:apk` → re-audita el bundle sin rebuild
- `bun run apk:logs` → captura logs reales del APK en un Android conectado
- `bun run check:coldstart` → mide arranque frío offline (<2.5s)
- `bun run shots:store` → genera 5 screenshots 1080×1920

## Notas

- No hay texto revelador en pantalla.
- No hay pedidos de red en runtime (verificado por `network-guard`).
- El HUD, música, misiones y logros funcionan sin backend.
