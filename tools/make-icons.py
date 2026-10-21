#!/usr/bin/env python3
"""Generate the PNG app icons into icons/ (pure stdlib, no dependencies).
Usage: python3 tools/make-icons.py"""
import math, os, struct, zlib

SS = 2  # supersampling factor for smooth edges

def lerp(a, b, t): return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))

def render(size, content):
    """content = fraction of the canvas the artwork may occupy (safe zone)."""
    n = size * SS
    top, bot = (200, 185, 240), (243, 238, 251)
    cx = cy = n / 2
    r_moon = n * content * 0.36
    moon = (255, 236, 179)
    stars = [(-0.30, -0.28, 0.045), (0.31, -0.18, 0.035), (0.26, 0.30, 0.04), (-0.32, 0.22, 0.03)]
    rows = []
    for y in range(n):
        row = bytearray()
        for x in range(n):
            c = lerp(top, bot, y / n)
            # crescent moon: disc minus offset disc
            d1 = math.hypot(x - cx, y - cy)
            d2 = math.hypot(x - (cx + r_moon * 0.45), y - (cy - r_moon * 0.25))
            if d1 <= r_moon and d2 > r_moon * 0.85:
                c = moon
            for sx, sy, sr in stars:
                if math.hypot(x - (cx + sx * n * content / 0.8), y - (cy + sy * n * content / 0.8)) <= sr * n * content / 0.8:
                    c = (255, 255, 255)
            row += bytes(int(v) for v in c)
        rows.append(bytes(row))
    # downsample
    out = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            acc = [0, 0, 0]
            for dy in range(SS):
                src = rows[y * SS + dy]
                for dx in range(SS):
                    i = (x * SS + dx) * 3
                    acc[0] += src[i]; acc[1] += src[i + 1]; acc[2] += src[i + 2]
            row += bytes(v // (SS * SS) for v in acc)
        out.append(b"\x00" + bytes(row))
    return out

def png(path, size, content):
    raw = b"".join(render(size, content))
    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)) \
        + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    open(path, "wb").write(data)

os.makedirs("icons", exist_ok=True)
png("icons/icon-192.png", 192, 0.9)
png("icons/icon-512.png", 512, 0.9)
png("icons/maskable-512.png", 512, 0.6)   # artwork inside the 80% maskable safe zone
png("icons/apple-touch-icon.png", 180, 0.9)
