import type { Request } from "express";
import type { SourceStatus } from "../../../../domain/enums/source-status.enum.js";
import type { SourceType } from "../../../../domain/enums/source-type.enum.js";

export class UploadFileSourceRequestDto {
  readonly userId: string;
  readonly workspaceId: string;
  readonly knowledgeBaseId: string;
  readonly originalName: string;
  readonly content: Buffer;

  private constructor(props: {
    userId: string;
    workspaceId: string;
    knowledgeBaseId: string;
    originalName: string;
    content: Buffer;
  }) {
    this.userId = props.userId;
    this.workspaceId = props.workspaceId;
    this.knowledgeBaseId = props.knowledgeBaseId;
    this.originalName = props.originalName;
    this.content = props.content;
  }

  static fromRequest(req: Request): UploadFileSourceRequestDto {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error("Authenticated user is missing from the request");
    // UploadMiddleware has already read the file and rejected requests without one.
    const file = req.file;
    if (file === undefined) throw new Error("Uploaded file is missing from the request");
    // The params have already been validated by uploadFileSourceParamsSchema.
    const params = req.params as { workspaceId: string; knowledgeBaseId: string };
    return new UploadFileSourceRequestDto({
      userId,
      workspaceId: params.workspaceId,
      knowledgeBaseId: params.knowledgeBaseId,
      // Browsers send the name as UTF-8 bytes, but the multipart parser reads headers as Latin-1.
      originalName: Buffer.from(file.originalname, "latin1").toString("utf8"),
      content: file.buffer,
    });
  }
}

export class UploadFileSourceResponseDto {
  readonly id: string;
  readonly knowledgeBaseId: string;
  readonly type: SourceType;
  readonly name: string;
  readonly url: string | null;
  readonly sizeBytes: number | null;
  readonly contentType: string | null;
  readonly status: SourceStatus;
  readonly createdAt: string;
  readonly updatedAt: string;

  private constructor(props: {
    id: string;
    knowledgeBaseId: string;
    type: SourceType;
    name: string;
    url: string | null;
    sizeBytes: number | null;
    contentType: string | null;
    status: SourceStatus;
    createdAt: string;
    updatedAt: string;
  }) {
    this.id = props.id;
    this.knowledgeBaseId = props.knowledgeBaseId;
    this.type = props.type;
    this.name = props.name;
    this.url = props.url;
    this.sizeBytes = props.sizeBytes;
    this.contentType = props.contentType;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static toResponse(source: {
    id: string;
    knowledgeBaseId: string;
    type: SourceType;
    name: string;
    url: string | null;
    sizeBytes: number | null;
    contentType: string | null;
    status: SourceStatus;
    createdAt: Date;
    updatedAt: Date;
  }): UploadFileSourceResponseDto {
    return new UploadFileSourceResponseDto({
      id: source.id,
      knowledgeBaseId: source.knowledgeBaseId,
      type: source.type,
      name: source.name,
      url: source.url,
      sizeBytes: source.sizeBytes,
      contentType: source.contentType,
      status: source.status,
      createdAt: source.createdAt.toISOString(),
      updatedAt: source.updatedAt.toISOString(),
    });
  }
}
