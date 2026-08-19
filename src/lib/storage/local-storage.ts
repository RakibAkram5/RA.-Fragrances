import "server-only";

import fs from "node:fs";
import path from "node:path";
import { fileUrl } from "@/lib/storage/file-validation";
import type { StorageProvider } from "@/lib/storage/storage";

/**
 * Filesystem storage. Files are written under a fixed root with random names
 * and never trust user-controlled paths. Production deployments should use
 * the S3 provider; this is the secure local default.
 */
export class LocalStorageProvider implements StorageProvider {
  private root: string;

  constructor(relativeDir: string) {
    this.root = path.resolve(process.cwd(), relativeDir);
  }

  private ensureRoot() {
    fs.mkdirSync(this.root, { recursive: true });
  }

  async save(filename: string, buffer: Buffer): Promise<string> {
    this.ensureRoot();
    const safeName = path.basename(filename);
    await fs.promises.writeFile(path.join(this.root, safeName), buffer, {
      flag: "wx",
    });
    return fileUrl(safeName);
  }

  async delete(url: string): Promise<void> {
    const name = url.split("/").pop() ?? "";
    const safeName = path.basename(name);
    const full = path.join(this.root, safeName);
    if (!full.startsWith(this.root)) return;
    await fs.promises.unlink(full).catch(() => {});
  }

  /** Resolve + stream a stored file for the /api/files route. */
  resolve(filename: string): { path: string; contentType: string } | null {
    const safeName = path.basename(filename);
    const full = path.join(this.root, safeName);
    if (!full.startsWith(this.root) || !fs.existsSync(full)) return null;
    const ext = safeName.split(".").pop()?.toLowerCase();
    const contentType =
      {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        avif: "image/avif",
      }[ext ?? ""] ?? "application/octet-stream";
    return { path: full, contentType };
  }
}
