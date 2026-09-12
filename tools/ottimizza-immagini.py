#!/usr/bin/env python3
"""
Ottimizza le foto in images/ per il web.

Le foto che escono dalla fotocamera (o dai banchi di immagini stock) pesano
diversi MB l'una: su rete mobile il sito diventa inutilizzabile. Questo script
le ridimensiona alla larghezza massima realmente usata dal layout e le
ricomprime in JPEG progressivo, mantenendo gli stessi nomi di file.

Uso:
    pip install Pillow
    python3 tools/ottimizza-immagini.py

Da rilanciare ogni volta che si sostituisce una foto (per esempio images/hero.jpg).
"""

import os
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Manca Pillow. Installalo con:  pip install Pillow")

CARTELLA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "images")

# nome file (senza estensione) -> (lato lungo massimo in px, qualita JPEG)
REGOLE = {
    "hero":    (2000, 78),
    "solive":  (1600, 80),
    "story":   (1200, 80),
    "gallery": (1400, 80),
}
DEFAULT = (1600, 80)


def regola_per(nome):
    for prefisso, valori in REGOLE.items():
        if nome.startswith(prefisso):
            return valori
    return DEFAULT


def main():
    if not os.path.isdir(CARTELLA):
        sys.exit(f"Cartella non trovata: {CARTELLA}")

    totale_prima = totale_dopo = 0

    for nome_file in sorted(os.listdir(CARTELLA)):
        if not nome_file.lower().endswith((".jpg", ".jpeg", ".png")):
            continue

        percorso = os.path.join(CARTELLA, nome_file)
        prima = os.path.getsize(percorso)
        lato_max, qualita = regola_per(nome_file.lower())

        img = Image.open(percorso)
        img = ImageOps.exif_transpose(img).convert("RGB")
        if max(img.size) > lato_max:
            img.thumbnail((lato_max, lato_max), Image.LANCZOS)

        destinazione = os.path.splitext(percorso)[0] + ".jpg"
        img.save(destinazione, "JPEG", quality=qualita, optimize=True, progressive=True)
        if destinazione != percorso:
            os.remove(percorso)

        dopo = os.path.getsize(destinazione)
        totale_prima += prima
        totale_dopo += dopo
        print(f"{nome_file:<16} {prima/1024/1024:6.2f} MB -> {dopo/1024:7.1f} KB   ({img.width}x{img.height})")

    if totale_prima:
        print(f"\nTotale: {totale_prima/1024/1024:.1f} MB -> {totale_dopo/1024/1024:.2f} MB "
              f"(-{100 - totale_dopo * 100 / totale_prima:.0f}%)")


if __name__ == "__main__":
    main()
