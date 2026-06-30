# Troubleshooting / Solución de problemas

[← Back to Home / Volver al inicio](Home.md)

---

## 🇬🇧 English

### "Could not connect"

- Make sure the Switch and computer are on the **same network**.
- Double-check the **IP address** (it can change after a reboot — re-check in System Settings → Internet).
- Confirm **sys-botbase** is installed and the Switch was **fully rebooted** after installing it.
- **Close other tools** that talk to the Switch (NXAPI, other botbase clients) — sys-botbase allows only **one connection at a time**.
- Some firewalls block the connection. Allow NHLE through your computer's firewall.

### It connects, but Island / Character shows "—"

You must be **in-game, standing on your island** — not at the title screen or in a building menu. Open the game, walk around your island, then press **Refresh** on the Home tab.

### Items show as colour squares instead of pictures

You chose "colour tiles" on first launch, or the image pack didn't unpack. To redo it: the image choice is remembered per computer; delete NHLE's saved data folder (see below) and reconnect to be asked again.

### Inventory changes don't appear in the game

Open and close your **pockets** in the game to refresh the on-screen view. The data is already changed in memory.

### The game froze or crashed

Memory editing carries this risk. Restart the game. If your island looks wrong, **restore your save backup**. This is why a backup is essential before using NHLE.

### Where is NHLE's saved data?

- **Windows:** `%AppData%\nhle`
- **Linux:** `~/.config/nhle`

Deleting this folder resets the image choice and unpacked sprites.

### Linux: the app won't start

Make the binary executable: `chmod +x nhle`, then run `./nhle`.

---

## 🇪🇸 Español

### "No se pudo conectar"

- Asegúrate de que la Switch y la computadora estén en la **misma red**.
- Revisa bien la **dirección IP** (puede cambiar tras reiniciar — vuelve a mirarla en Configuración → Internet).
- Confirma que **sys-botbase** está instalado y que la Switch se **reinició por completo** después de instalarlo.
- **Cierra otras herramientas** que hablen con la Switch (NXAPI, otros clientes de botbase): sys-botbase permite solo **una conexión a la vez**.
- Algunos cortafuegos bloquean la conexión. Permite NHLE en el firewall de tu computadora.

### Conecta, pero Isla / Personaje muestra "—"

Debes estar **dentro del juego, de pie en tu isla**, no en la pantalla de título ni en el menú de un edificio. Abre el juego, camina por tu isla y pulsa **Actualizar** en la pestaña Inicio.

### Los objetos salen como cuadros de color en vez de imágenes

Elegiste "cuadros de color" en el primer inicio, o el paquete de imágenes no se descomprimió. Para rehacerlo: la elección se guarda por computadora; borra la carpeta de datos de NHLE (más abajo) y vuelve a conectar para que te pregunte otra vez.

### Los cambios del inventario no aparecen en el juego

Abre y cierra el **bolsillo** en el juego para refrescar lo que se ve en pantalla. Los datos ya están cambiados en memoria.

### El juego se congeló o se cerró

Editar memoria conlleva este riesgo. Reinicia el juego. Si tu isla se ve mal, **restaura tu copia de seguridad**. Por esto es esencial hacer una copia antes de usar NHLE.

### ¿Dónde están los datos guardados de NHLE?

- **Windows:** `%AppData%\nhle`
- **Linux:** `~/.config/nhle`

Borrar esta carpeta reinicia la elección de imágenes y los sprites descomprimidos.

### Linux: la app no inicia

Haz el binario ejecutable: `chmod +x nhle`, luego ejecuta `./nhle`.

---

[← Using NHLE / Usar NHLE](Using-NHLE.md) · [Back to Home / Volver al inicio](Home.md)
