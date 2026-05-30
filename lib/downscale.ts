// Client-side image downscaling.
//
// Claude's vision API resizes any image larger than ~1568px on its long edge
// (≈1.15 megapixels) before analysis, so uploading full-resolution phone photos
// is wasted bytes, tokens, and latency. We shrink to that ceiling in the browser
// so a batch of 10 photos uploads in a few MB instead of 30-50 MB.

const MAX_EDGE = 1568;
const QUALITY = 0.85;
// Below this size an already-small image isn't worth re-encoding.
const SKIP_BYTES = 1_500_000;

export async function downscaleImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  let bitmap: ImageBitmap;
  try {
    // `from-image` honors EXIF orientation so rotated phone photos stay upright.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Decode failed (e.g. HEIC on some browsers) — let the server handle the original.
    return file;
  }

  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));

  if (scale === 1 && file.size <= SKIP_BYTES) {
    bitmap.close();
    return file;
  }

  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY)
  );
  if (!blob || blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.(png|webp|heic|heif|jpe?g)$/i, "");
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
