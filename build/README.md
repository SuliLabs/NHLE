# Build resources

electron-builder picks up app icons from this folder automatically:

| File | Used for |
|---|---|
| `icon.ico` | Windows installer + executable (256×256 recommended) |
| `icon.png` | Linux (512×512 recommended) |

Drop those two files here to brand the packaged builds. If they're
missing, electron-builder falls back to the default Electron icon — the
app still builds and runs, it just won't have custom artwork.
