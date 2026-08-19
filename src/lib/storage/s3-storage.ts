import "server-only";

import type { StorageProvider } from "@/lib/storage/storage";

interface S3Config {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
}

/**
 * S3-compatible object storage (works with AWS S3 and S3-compatible providers
 * such as MinIO/R2). Imported lazily so the SDK is only loaded when used.
 */
export class S3StorageProvider implements StorageProvider {
  constructor(private config: S3Config) {}

  private async client() {
    const { S3Client } = await import("@aws-sdk/client-s3");
    return new S3Client({
      region: this.config.region,
      endpoint: this.config.endpoint,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  }

  async save(filename: string, buffer: Buffer, contentType: string): Promise<string> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = await this.client();
    const key = `products/${filename}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    const base = this.config.endpoint ?? `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com`;
    return `${base.replace(/\/$/, "")}/${key}`;
  }

  async delete(url: string): Promise<void> {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = await this.client();
    const key = url.split("/").slice(3).join("/");
    await s3.send(
      new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }),
    );
  }
}
