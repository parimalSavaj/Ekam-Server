import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { IStorageExternalService } from "./storage.external-service.interface.js";
import type { PutObjectParams, StorageOptions } from "./storage.types.js";

// DeleteObjects accepts at most 1000 keys per request.
const DELETE_BATCH_SIZE = 1000;

/** Failures are thrown to the use case, which logs them with business context. */
export class StorageExternalService implements IStorageExternalService {
  private readonly client: S3Client;

  constructor(private readonly options: StorageOptions) {
    this.client = new S3Client({
      region: options.region,
      credentials: { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey },
      forcePathStyle: options.forcePathStyle,
      // Older S3-compatible servers reject the checksum headers the SDK adds by default.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
      ...(options.endpoint === undefined ? {} : { endpoint: options.endpoint }),
    });
  }

  async put(params: PutObjectParams): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: params.key,
        Body: params.body,
        ContentLength: params.body.length,
        ContentType: params.contentType,
      }),
    );
  }

  async deleteMany(keys: readonly string[]): Promise<void> {
    for (let start = 0; start < keys.length; start += DELETE_BATCH_SIZE) {
      const batch = keys.slice(start, start + DELETE_BATCH_SIZE);
      const result = await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.options.bucket,
          Delete: { Objects: batch.map(key => ({ Key: key })), Quiet: true },
        }),
      );
      // DeleteObjects answers 200 even when single keys fail, so the per-key errors must be checked.
      const failed = result.Errors ?? [];
      if (failed.length > 0) {
        throw new Error(
          `Object storage could not delete ${failed.length} of ${batch.length} objects (first: ${failed[0]?.Code ?? "unknown"})`,
        );
      }
    }
  }
}
