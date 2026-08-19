import "server-only";

import { ApiError } from "@/lib/route-helpers";
import { LocalStorageProvider } from "@/lib/storage/local-storage";
import { S3StorageProvider } from "@/lib/storage/s3-storage";

export interface StorageProvider {
  /** Persist a file and return a public URL. */
  save(filename: string, buffer: Buffer, contentType: string): Promise<string>;
  /** Delete a previously stored file. */
  delete(url: string): Promise<void>;
}

export function getStorage(): StorageProvider {
  const driver = process.env.STORAGE_DRIVER || "local";
  if (driver === "s3") {
    if (
      !process.env.S3_BUCKET ||
      !process.env.S3_REGION ||
      !process.env.S3_ACCESS_KEY_ID ||
      !process.env.S3_SECRET_ACCESS_KEY
    ) {
      throw new ApiError(
        503,
        "Object storage is not configured. Set S3_* environment variables.",
      );
    }
    return new S3StorageProvider({
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      endpoint: process.env.S3_ENDPOINT || undefined,
    });
  }
  return new LocalStorageProvider(process.env.STORAGE_LOCAL_DIR || "storage/uploads");
}
