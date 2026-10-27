import { readFileSync } from 'node:fs';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export function readPng(file: URL | Buffer): PNG {
  return PNG.sync.read(Buffer.isBuffer(file) ? file : readFileSync(file));
}

export function writePng(png: PNG): Buffer {
  return PNG.sync.write(png);
}

/** Copies a rectangle out of an image (pixel units). */
export function crop(source: PNG, x: number, y: number, width: number, height: number): PNG {
  const out = new PNG({ width, height });
  PNG.bitblt(source, out, x, y, width, height, 0, 0);
  return out;
}

/** Figma exports are transparent outside the shape; flatten them onto the page background before comparing. */
export function flatten(image: PNG, background: readonly [number, number, number]): PNG {
  const out = new PNG({ width: image.width, height: image.height });
  for (let i = 0; i < image.data.length; i += 4) {
    const alpha = (image.data[i + 3] ?? 0) / 255;
    background.forEach((bg, channel) => {
      const fg = image.data[i + channel] ?? 0;
      out.data[i + channel] = Math.round(fg * alpha + bg * (1 - alpha));
    });
    out.data[i + 3] = 255;
  }
  return out;
}

export interface Difference {
  /** Share of pixels that differ beyond pixelmatch's colour threshold (anti-aliasing ignored). */
  readonly ratio: number;
  readonly diff: PNG;
}

export function compare(expected: PNG, actual: PNG): Difference {
  if (expected.width !== actual.width || expected.height !== actual.height) {
    throw new Error(
      `size differs: expected ${String(expected.width)}×${String(expected.height)}, got ${String(actual.width)}×${String(actual.height)}`,
    );
  }
  const { width, height } = expected;
  const diff = new PNG({ width, height });
  const count = pixelmatch(expected.data, actual.data, diff.data, width, height, {
    threshold: 0.1,
  });
  return { ratio: count / (width * height), diff };
}

/** `#0b0c0e` → [11, 12, 14]. */
export function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
