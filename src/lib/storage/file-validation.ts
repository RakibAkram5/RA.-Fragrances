import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { ApiError } from "@/lib/route-helpers";
import { ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_BYTES } from "@/lib/constants";

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

function sniffExtension(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const pngMagic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (pngMagic.every((b, i) => buffer[i] === b)) return "png";

  // WEBP: RIFF .... WEBP
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  // AVIF: ftyp box with avif/avis brand
  if (
    buffer.toString("ascii", 4, 8) === "ftyp" &&
    (buffer.toString("ascii", 8, 12) === "avif" ||
      buffer.toString("ascii", 8, 12) === "avis")
  ) {
    return "avif";
  }

  return null;
}

/**
 * Validate an uploaded image: extension whitelist, size limit, and actual
 * file-content (magic-byte) verification. The file is renamed to a random,
 * extension-only name — the client's filename is never trusted.
 */
export function validateImageBuffer(
  buffer: Buffer,
  originalName: string,
): { filename: string; contentType: string; ext: string } {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new ApiError(400, "Empty file upload.");
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new ApiError(413, "Image must be 5 MB or smaller.");
  }

  const extFromName = originalName.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extFromName)) {
    throw new ApiError(400, "Unsupported image format.");
  }

  const sniffed = sniffExtension(buffer);
  if (!sniffed) {
    throw new ApiError(400, "File content is not a recognised image.");
  }
  // The declared extension must match the actual bytes.
  const canonical = extFromName === "jpeg" ? "jpg" : extFromName;
  if (canonical !== sniffed) {
    throw new ApiError(400, "File content does not match its extension.");
  }

  const filename = `${randomBytes(16).toString("hex")}.${sniffed}`;
  return {
    filename,
    contentType: EXT_TO_MIME[sniffed] ?? "application/octet-stream",
    ext: sniffed,
  };
}

/** Produce a safe, unguessable public URL for a stored file. */
export function fileUrl(filename: string): string {
  return `/api/files/${encodeURIComponent(filename)}`;
}

export function hashForStorage(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}
