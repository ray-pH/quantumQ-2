import { parseLevelPack } from "@quantumq/core";
import { unzipSync } from "fflate";

const MAX_PACK_BYTES = 8 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 256 * 1024;
const MAX_IMAGE_BYTES = 512 * 1024;
const PNG_PATH = /^assets\/(?:[\w-][\w.-]*\/)*[\w-][\w.-]*\.png$/i;

function pngDataUrl(bytes: Uint8Array, path: string): string {
  const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    bytes.length < 33 ||
    header.getUint32(0) !== 0x89504e47 ||
    header.getUint32(4) !== 0x0d0a1a0a ||
    header.getUint32(8) !== 13 ||
    header.getUint32(12) !== 0x49484452
  ) {
    throw new Error(`"${path}" must be a PNG image.`);
  }
  const width = header.getUint32(16);
  const height = header.getUint32(20);
  if (!width || !height || width > 512 || height > 512) {
    throw new Error(`"${path}" must be at most 512 × 512 pixels.`);
  }

  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:image/png;base64,${btoa(binary)}`;
}

export async function readLevelPackArchive(file: File) {
  if (file.size > MAX_PACK_BYTES)
    throw new Error("The ZIP must be at most 8 MiB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const seen = new Set<string>();
  let totalSize = 0;
  let entryCount = 0;

  const files = unzipSync(bytes, {
    filter({ name, size, originalSize, compression }) {
      if (++entryCount > 128)
        throw new Error("The ZIP can contain at most 128 entries.");
      if (name !== "pack.json" && !PNG_PATH.test(name)) return false;
      if (seen.has(name))
        throw new Error(`The ZIP contains more than one "${name}".`);
      seen.add(name);
      totalSize += originalSize;
      const limit = name === "pack.json" ? MAX_MANIFEST_BYTES : MAX_IMAGE_BYTES;
      if (
        size > bytes.length ||
        (compression === 0 && size !== originalSize) ||
        originalSize <= 0 ||
        originalSize > limit ||
        totalSize > MAX_PACK_BYTES
      )
        throw new Error(`"${name}" exceeds the level pack size limit.`);
      return true;
    },
  });

  if (!files["pack.json"])
    throw new Error("Place pack.json at the root of the ZIP.");
  let manifest: unknown;
  try {
    manifest = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(files["pack.json"]),
    );
  } catch {
    throw new Error("pack.json must be a valid UTF-8 JSON file.");
  }

  const images = new Map<string, string>();
  const pack = parseLevelPack(manifest, (path) => {
    if (!PNG_PATH.test(path) || !Object.hasOwn(files, path)) {
      throw new Error(
        `Missing gate image "${path}". Place PNG files under assets/.`,
      );
    }
    const dataUrl = images.get(path) ?? pngDataUrl(files[path], path);
    images.set(path, dataUrl);
    return dataUrl;
  });

  await Promise.all(
    Array.from(images, async ([path, url]) => {
      const image = new Image();
      image.src = url;
      try {
        await image.decode();
      } catch {
        throw new Error(`"${path}" could not be decoded as a PNG image.`);
      }
    }),
  );
  return pack;
}
