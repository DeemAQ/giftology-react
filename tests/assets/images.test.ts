// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const dir = fileURLToPath(new URL('../../app/assets/images/', import.meta.url));
const shipped = readdirSync(dir).filter((name) => statSync(dir + name).isFile());

/** Width and height from a WebP header (lossy, lossless or extended). */
function webpSize(file: string): [number, number] {
  const b = readFileSync(file);
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (kind === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
  }
  return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1];
}

describe('theme images', () => {
  it('ships photos and logos as WebP; full-size originals stay in source/', () => {
    expect(shipped.filter((name) => /\.(png|jpe?g)$/i.test(name))).toEqual([]);
  });

  it('keeps every shipped image under 20 KB', () => {
    for (const name of shipped) {
      expect(statSync(dir + name).size, name).toBeLessThan(20 * 1024);
    }
  });

  it('sizes each one for where it is shown', () => {
    // 3× the largest display size for the logos, 2× for the bow.
    expect(webpSize(`${dir}teal_logo_trim.webp`)).toEqual([261, 157]);
    expect(webpSize(`${dir}white_logo_trim.webp`)).toEqual([231, 139]);
    expect(webpSize(`${dir}white_logo.webp`)).toEqual([480, 480]);
  });
});
