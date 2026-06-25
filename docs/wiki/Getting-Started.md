# Getting Started / Primeros pasos

[← Back to Home / Volver al inicio](Home.md)

---

## 🇬🇧 English

### 1. What you need

- A **Nintendo Switch with custom firmware** (Atmosphère). A normal, unmodified Switch will **not** work.
- **sys-botbase 2.4 or newer** installed on the Switch (instructions below).
- The game **Animal Crossing: New Horizons, version 3.0.3**.
- A **computer** (Windows or Linux) on the **same Wi-Fi / network** as the Switch.

### 2. Install sys-botbase on the Switch

sys-botbase is a small plugin that lets a computer read and change the game's memory.

1. On your computer, download the latest `sys-botbase` release from
   <https://github.com/olliz0r/sys-botbase/releases> (the `.zip` file).
2. Insert your Switch's **microSD card** into your computer.
3. Copy the `atmosphere` folder from the zip onto the **root** of the microSD card.
   When asked, choose **"merge"** / **"replace"** — this only adds files, it won't delete your setup.
4. Put the microSD back in the Switch and **fully reboot** it (hold Power → Restart).

That's it — sys-botbase now starts automatically every time the Switch boots.

### 3. Find your Switch's IP address

1. On the Switch: **System Settings → Internet → Connection Status**.
2. Write down the **IP Address**, for example `192.168.1.45`.
   (It usually starts with `192.168.` — the example `192.168.1.254` in NHLE is just a placeholder.)

> Tip: setting a **static IP** for the Switch in your router means the address never changes.

### 4. Open the game

Boot **Animal Crossing: New Horizons** and load your island. Stand on the island (not in a menu) so NHLE can read your data.

### 5. Connect with NHLE

1. Open NHLE.
2. Choose your **language** at the top.
3. Type the Switch **IP address** and leave the **port** as `6000`.
4. Click **Connect**. A green dot means you're connected. 🎉

If it fails, see **[Troubleshooting](Troubleshooting.md)**.

### 6. Item images (asked once)

The first time you connect, NHLE asks if you want to see items with **real images**.
- **Yes:** it unpacks the image pack once (a progress bar shows up). After that, icons load instantly.
- **No:** items show as simple colour tiles. You can keep it light this way.

Your answer is saved, so you're only asked once.

---

## 🇪🇸 Español

### 1. Qué necesitas

- Una **Nintendo Switch con firmware personalizado** (Atmosphère). Una Switch normal sin modificar **no** funcionará.
- **sys-botbase 2.4 o más nuevo** instalado en la Switch (instrucciones abajo).
- El juego **Animal Crossing: New Horizons, versión 3.0.3**.
- Una **computadora** (Windows o Linux) en la **misma red / Wi-Fi** que la Switch.

### 2. Instalar sys-botbase en la Switch

sys-botbase es un pequeño complemento que permite a una computadora leer y cambiar la memoria del juego.

1. En tu computadora, descarga la última versión de `sys-botbase` desde
   <https://github.com/olliz0r/sys-botbase/releases> (el archivo `.zip`).
2. Inserta la **tarjeta microSD** de la Switch en tu computadora.
3. Copia la carpeta `atmosphere` del zip a la **raíz** de la microSD.
   Cuando te pregunte, elige **"combinar"** / **"reemplazar"**: solo añade archivos, no borra tu configuración.
4. Vuelve a poner la microSD en la Switch y **reiníciala por completo** (mantén Encendido → Reiniciar).

Listo: sys-botbase ahora se inicia solo cada vez que enciendes la Switch.

### 3. Encontrar la dirección IP de tu Switch

1. En la Switch: **Configuración de la consola → Internet → Estado de la conexión**.
2. Anota la **Dirección IP**, por ejemplo `192.168.1.45`.
   (Normalmente empieza con `192.168.` — el ejemplo `192.168.1.254` en NHLE es solo un texto de muestra.)

> Consejo: poner una **IP fija** para la Switch en tu router hace que la dirección nunca cambie.

### 4. Abrir el juego

Inicia **Animal Crossing: New Horizons** y carga tu isla. Quédate de pie en la isla (no en un menú) para que NHLE pueda leer tus datos.

### 5. Conectar con NHLE

1. Abre NHLE.
2. Elige tu **idioma** arriba.
3. Escribe la **dirección IP** de la Switch y deja el **puerto** en `6000`.
4. Pulsa **Conectar**. Un punto verde significa que estás conectado. 🎉

Si falla, mira **[Solución de problemas](Troubleshooting.md)**.

### 6. Imágenes de objetos (se pregunta una vez)

La primera vez que conectas, NHLE te pregunta si quieres ver los objetos con **imágenes reales**.
- **Sí:** descomprime el paquete de imágenes una vez (aparece una barra de progreso). Después, los iconos cargan al instante.
- **No:** los objetos se muestran como simples cuadros de color. Así la app va más ligera.

Tu respuesta se guarda, así que solo te pregunta una vez.

---

[← Back to Home / Volver al inicio](Home.md) · [Next: Using NHLE / Siguiente: Usar NHLE →](Using-NHLE.md)
