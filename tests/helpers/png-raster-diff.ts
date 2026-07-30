import { inflateSync } from "node:zlib";

export interface DecodedPngRgba {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
}

/**
 * Playwright exposes deterministic PNG captures but not raw pixels. Keeping
 * this small decoder in test infrastructure lets continuity gates compare
 * raster paint without adding an image dependency to production code.
 */
export function decodePngRgba(buffer: Buffer): DecodedPngRgba {
  const signature = buffer.subarray(0, 8);
  if (!signature.equals(Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
  ]))) {
    throw new Error("Raster evidence must be a PNG.");
  }
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const compressed: Buffer[] = [];
  for (let offset = 8; offset < buffer.length;) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buffer.length) {
      throw new Error("Raster evidence contains a truncated PNG chunk.");
    }
    if (type === "IHDR") {
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      bitDepth = buffer[dataStart + 8]!;
      colorType = buffer[dataStart + 9]!;
      interlace = buffer[dataStart + 12]!;
    } else if (type === "IDAT") {
      compressed.push(buffer.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      break;
    }
    offset = dataEnd + 4;
  }
  if (
    width <= 0 ||
    height <= 0 ||
    bitDepth !== 8 ||
    interlace !== 0 ||
    compressed.length === 0
  ) {
    throw new Error(
      "Raster evidence requires a non-interlaced eight-bit PNG."
    );
  }
  const channels = channelsFor(colorType);
  const rowLength = width * channels;
  const raw = inflateSync(Buffer.concat(compressed));
  if (raw.length !== (rowLength + 1) * height) {
    throw new Error("Raster evidence PNG has an unexpected scanline size.");
  }
  const decoded = new Uint8Array(rowLength * height);
  for (let row = 0; row < height; row += 1) {
    const rawStart = row * (rowLength + 1);
    const filter = raw[rawStart]!;
    const outputStart = row * rowLength;
    for (let column = 0; column < rowLength; column += 1) {
      const encoded = raw[rawStart + 1 + column]!;
      const left = column >= channels
        ? decoded[outputStart + column - channels]!
        : 0;
      const up = row > 0
        ? decoded[outputStart - rowLength + column]!
        : 0;
      const upLeft = row > 0 && column >= channels
        ? decoded[outputStart - rowLength + column - channels]!
        : 0;
      decoded[outputStart + column] = unfilter(
        filter,
        encoded,
        left,
        up,
        upLeft
      );
    }
  }
  const pixels = new Uint8Array(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    const source = index * channels;
    const target = index * 4;
    if (colorType === 6) {
      pixels[target] = decoded[source]!;
      pixels[target + 1] = decoded[source + 1]!;
      pixels[target + 2] = decoded[source + 2]!;
      pixels[target + 3] = decoded[source + 3]!;
    } else if (colorType === 2) {
      pixels[target] = decoded[source]!;
      pixels[target + 1] = decoded[source + 1]!;
      pixels[target + 2] = decoded[source + 2]!;
      pixels[target + 3] = 255;
    } else if (colorType === 4) {
      pixels[target] = decoded[source]!;
      pixels[target + 1] = decoded[source]!;
      pixels[target + 2] = decoded[source]!;
      pixels[target + 3] = decoded[source + 1]!;
    } else {
      pixels[target] = decoded[source]!;
      pixels[target + 1] = decoded[source]!;
      pixels[target + 2] = decoded[source]!;
      pixels[target + 3] = 255;
    }
  }
  return Object.freeze({ width, height, pixels });
}

export function normalizedPngRasterDelta(
  leftBuffer: Buffer,
  rightBuffer: Buffer
): number {
  const left = decodePngRgba(leftBuffer);
  const right = decodePngRgba(rightBuffer);
  if (left.width !== right.width || left.height !== right.height) {
    throw new Error("Raster evidence frames must have identical dimensions.");
  }
  let delta = 0;
  for (let index = 0; index < left.pixels.length; index += 1) {
    delta += Math.abs(left.pixels[index]! - right.pixels[index]!);
  }
  return delta / (left.pixels.length * 255);
}

function channelsFor(colorType: number): number {
  if (colorType === 6) return 4;
  if (colorType === 2) return 3;
  if (colorType === 4) return 2;
  if (colorType === 0) return 1;
  throw new Error(`Raster evidence does not support PNG color type ${colorType}.`);
}

function unfilter(
  filter: number,
  encoded: number,
  left: number,
  up: number,
  upLeft: number
): number {
  if (filter === 0) return encoded;
  if (filter === 1) return (encoded + left) & 0xff;
  if (filter === 2) return (encoded + up) & 0xff;
  if (filter === 3) return (encoded + Math.floor((left + up) / 2)) & 0xff;
  if (filter === 4) {
    return (encoded + paeth(left, up, upLeft)) & 0xff;
  }
  throw new Error(`Raster evidence PNG uses unsupported filter ${filter}.`);
}

function paeth(left: number, up: number, upLeft: number): number {
  const prediction = left + up - upLeft;
  const leftDistance = Math.abs(prediction - left);
  const upDistance = Math.abs(prediction - up);
  const upLeftDistance = Math.abs(prediction - upLeft);
  return leftDistance <= upDistance && leftDistance <= upLeftDistance
    ? left
    : upDistance <= upLeftDistance ? up : upLeft;
}
