from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "src" / "assets"
MAP_FILES = [
    "map-speakeasy.webp",
    "map-speakeasy-decayed.webp",
    "map-speakeasy-upstairs.webp",
    "map-speakeasy-upstairs-decayed.webp",
    "map-speakeasy-attic.webp",
    "map-speakeasy-attic-decayed.webp",
    "map-speakeasy-cantina.webp",
    "map-speakeasy-cantina-decayed.webp",
    "map-speakeasy-basement.webp",
    "map-speakeasy-basement-decayed.webp",
]
KNOWN_PAIR_ERRORS = [
    ("map-speakeasy.webp", "map-speakeasy-decayed.webp"),
    ("map-speakeasy-upstairs.webp", "map-speakeasy-upstairs-decayed.webp"),
    ("map-speakeasy-attic.webp", "map-speakeasy-attic-decayed.webp"),
    ("map-speakeasy-cantina.webp", "map-speakeasy-cantina-decayed.webp"),
    ("map-speakeasy-basement.webp", "map-speakeasy-basement-decayed.webp"),
]
TEXT_ALLOWLIST = {
    "mahjong",
}
FORBIDDEN_TEXT_HINTS = {
    "bagatelle",
    "pin",
    "table",
    "thej",
    "the",
}


@dataclass
class MapReport:
    name: str
    size: tuple[int, int]
    text_hits: list[str]
    gold_frame_score: float
    errors: list[str]


def normalize_token(token: str) -> str:
    token = token.strip().lower()
    token = re.sub(r"[^a-záéíóúüñ]", "", token)
    return token


def build_ocr_variants(image: Image.Image) -> list[Image.Image]:
    base = image.convert("L")
    strong = ImageEnhance.Contrast(ImageOps.autocontrast(base)).enhance(2.6)
    threshold = strong.point(lambda p: 255 if p > 150 else 0)
    sharpened = strong.filter(ImageFilter.SHARPEN)
    return [strong, threshold, sharpened]


def extract_text_hits(image: Image.Image) -> list[str]:
    width, height = image.size
    found: set[str] = set()
    config = "--psm 11 --oem 3 -l eng"

    for variant in build_ocr_variants(image):
        data = pytesseract.image_to_data(variant, config=config, output_type=pytesseract.Output.DICT)
        for i, raw in enumerate(data["text"]):
            token = normalize_token(raw)
            if not token or token in TEXT_ALLOWLIST:
                continue
            if len(token) < 4:
                continue
            try:
                confidence = float(data["conf"][i])
            except ValueError:
                continue
            x = int(data["left"][i])
            y = int(data["top"][i])
            w = int(data["width"][i])
            h = int(data["height"][i])
            area_ratio = (w * h) / float(width * height)
            if confidence < 72:
                continue
            if w < width * 0.025 or h < height * 0.01:
                continue
            if area_ratio < 0.00018:
                continue
            if token in FORBIDDEN_TEXT_HINTS or len(token) >= 5:
                found.add(token)
    return sorted(found)


def compute_gold_frame_score(image: Image.Image) -> float:
    arr = np.asarray(image.convert("RGB")).astype(np.float32)
    h, w, _ = arr.shape
    band = max(18, int(min(w, h) * 0.035))

    r = arr[..., 0]
    g = arr[..., 1]
    b = arr[..., 2]

    warm = (r > 105) & (g > 72) & (b < 150) & ((r - g) > 8) & ((g - b) > 2)
    bright = ((r + g + b) / 3) > 70
    goldish = warm & bright

    edge_mask = np.zeros((h, w), dtype=bool)
    edge_mask[:band, :] = True
    edge_mask[-band:, :] = True
    edge_mask[:, :band] = True
    edge_mask[:, -band:] = True

    inner_margin = band * 2
    inner_mask = np.zeros((h, w), dtype=bool)
    if h > inner_margin * 2 and w > inner_margin * 2:
        inner_mask[inner_margin : h - inner_margin, inner_margin : w - inner_margin] = True

    edge_density = float(goldish[edge_mask].mean())
    inner_density = float(goldish[inner_mask].mean()) if inner_mask.any() else 0.0

    top = float(goldish[:band, :].mean())
    bottom = float(goldish[-band:, :].mean())
    left = float(goldish[:, :band].mean())
    right = float(goldish[:, -band:].mean())
    side_floor = min(top, bottom, left, right)

    return edge_density + max(0.0, edge_density - inner_density) + side_floor


def verify_map(path: Path) -> MapReport:
    image = Image.open(path)
    width, height = image.size
    errors: list[str] = []

    text_hits = extract_text_hits(image)
    if text_hits:
        errors.append(f"texto detectado: {', '.join(text_hits)}")

    gold_frame_score = compute_gold_frame_score(image)
    if gold_frame_score > 0.115:
        errors.append(f"posible marco déco dorado (score {gold_frame_score:.3f})")

    return MapReport(
        name=path.name,
        size=(width, height),
        text_hits=text_hits,
        gold_frame_score=gold_frame_score,
        errors=errors,
    )


def verify_pairs(reports: list[MapReport]) -> list[str]:
    by_name = {report.name: report for report in reports}
    errors: list[str] = []

    for clean, decayed in KNOWN_PAIR_ERRORS:
        clean_report = by_name[clean]
        decayed_report = by_name[decayed]
        if clean_report.size != decayed_report.size:
            errors.append(
                f"{clean} y {decayed} no comparten tamaño ({clean_report.size} vs {decayed_report.size})"
            )

    non_attic = [
        by_name["map-speakeasy.webp"].size,
        by_name["map-speakeasy-upstairs.webp"].size,
        by_name["map-speakeasy-cantina.webp"].size,
        by_name["map-speakeasy-basement.webp"].size,
    ]
    if len(set(non_attic)) != 1:
        errors.append("los mapas clean de pisos no ático no comparten el mismo tamaño base")

    return errors


def main() -> int:
    missing = [name for name in MAP_FILES if not (ASSETS / name).exists()]
    if missing:
        print("Faltan mapas requeridos:")
        for item in missing:
            print(f"- {item}")
        return 1

    reports = [verify_map(ASSETS / name) for name in MAP_FILES]
    pair_errors = verify_pairs(reports)

    print("Verificación automática de mapas\n")
    for report in reports:
        status = "OK" if not report.errors else "ERROR"
        print(f"[{status}] {report.name}")
        print(f"  tamaño: {report.size[0]}x{report.size[1]}")
        print(f"  score marco dorado: {report.gold_frame_score:.3f}")
        if report.errors:
            for error in report.errors:
                print(f"  - {error}")
        print()

    if pair_errors:
        print("Errores de consistencia:")
        for error in pair_errors:
            print(f"- {error}")
        print()

    has_errors = any(report.errors for report in reports) or bool(pair_errors)
    print("Resultado:", "FALLÓ la verificación de mapas" if has_errors else "todos los mapas pasaron la verificación")
    return 1 if has_errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
