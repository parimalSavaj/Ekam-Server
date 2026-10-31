/** Connection settings for an S3-compatible bucket (Amazon S3 in production, MinIO in development). */
export type StorageOptions = {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Set for MinIO or another S3-compatible server; leave out for Amazon S3. */
  endpoint?: string | undefined;
  /** MinIO needs path-style addressing (http://host/bucket/key). */
  forcePathStyle: boolean;
};

export type PutObjectParams = {
  key: string;
  body: Buffer;
  contentType: string;
};
