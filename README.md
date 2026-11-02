# GBA Play

Emulador de **Game Boy Advance** con mandos táctiles (cruceta, A, B, L, R, Start, Select), pensado para convertirse en una **APK de Android**. Código abierto (MIT).

Está hecho con HTML + JavaScript, [EmulatorJS](https://emulatorjs.org) (núcleo mGBA) y [Capacitor](https://capacitorjs.com) para empaquetarlo como app.

> ⚠️ **No incluye ningún juego.** Dentro de la app eliges tu propio archivo `.gba` (se guarda solo en tu móvil).

## Qué trae

- Mando táctil propio: cruceta con diagonales, A/B, L/R, Start/Select, multitáctil y vibración.
- Interfaz oscura y limpia, con iconos vectoriales (se ven nítidos en cualquier pantalla).
- Filtros de imagen para que se vea más suave/HD (botón ✨): *Suavizado 2x/4x*, *Píxel nítido* u *Original*.
  Son filtros de escalado: mejoran la nitidez, pero no redibujan los gráficos del juego.
- Recuerda el último juego (botón **Continuar**) y guarda partidas (menú del emulador).
- Botón **x4** (arriba): acelera el juego 4 veces; púlsalo otra vez para volver a velocidad normal.
- Pantalla completa y modo horizontal con mandos sobre la imagen.

## Probar en el navegador

```bash
npm install
npm run serve        # abre http://localhost:8080
```
Sin instalar nada: `?preview` al final de la URL muestra solo el diseño del mando.

## Crear la APK — Opción A: sin instalar nada (GitHub)

1. Crea un repositorio en GitHub y sube todo el contenido de esta carpeta.
2. Ve a **Actions → Build APK → Run workflow** (también se lanza solo en cada *push*).
3. Al terminar (≈5 min) descarga el artefacto **gba-play-apk** → contiene `app-debug.apk`.
4. Pásalo al móvil, ábrelo y acepta "instalar de orígenes desconocidos".

## Crear la APK — Opción B: en tu ordenador

Necesitas Node 18+, JDK 17 y Android Studio (SDK).

```bash
npm install
npx cap add android
npx capacitor-assets generate --android   # icono (usa resources/icon.png)
npx cap sync android
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```
O abre el proyecto con `npx cap open android` y usa *Build → Build APK*.

## Funcionar sin internet (opcional)

Por defecto el emulador se carga desde `cdn.emulatorjs.org` (necesita internet la primera vez). Para empaquetarlo dentro de la APK:

```bash
bash scripts/fetch-emulator.sh      # requiere curl y 7z
```
Esto crea `www/emulator/data`, que la app detecta y usa automáticamente.

## Controles de teclado (PC)

Flechas = cruceta · X = A · Z = B · A / S = L / R · Enter = Start · Shift = Select

## Estructura

```
www/            app web (index.html, css, js, assets)
capacitor.config.json
.github/workflows/build-apk.yml   compilación automática de la APK
scripts/fetch-emulator.sh         emulador offline (opcional)
resources/icon.png                icono de la app
```

## Licencias

Este proyecto: MIT. EmulatorJS (GPL-3.0) y mGBA (MPL-2.0) tienen sus propias licencias; consúltalas si redistribuyes la app.
Tienes que ser el propietario legítimo de los juegos que uses.
