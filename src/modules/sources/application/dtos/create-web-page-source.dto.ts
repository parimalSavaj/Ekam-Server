import type { Request } from "express";
import type { SourceStatus } from "../../../../domain/enums/source-status.enum.js";
import type { SourceType } from "../../../../domain/enums/source-type.enum.js";

export class CreateWebPageSourceRequestDto {
  readonly userId: string;
  readonly workspaceId: string;
  readonly knowledgeBaseId: string;
  readonly url: string;

  private constructor(props: { userId: string; workspaceId: string; knowledgeBaseId: string; url: string }) {
    this.userId = props.userId;
    this.workspaceId = props.workspaceId;
    this.knowledgeBaseId = props.knowledgeBaseId;
    this.url = props.url;
  }

  static fromRequest(req: Request): CreateWebPageSourceRequestDto {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error("Authenticated user is missing from the request");
    // Params and body have already been validated by the create web page schemas.
    const params = req.params as { workspaceId: string; knowledgeBaseId: string };
    const body = req.body as { url: string };
    return new CreateWebPageSourceRequestDto({
      userId,
      workspaceId: params.workspaceId,
      knowledgeBaseId: params.knowledgeBaseId,
      url: body.url,
    });
  }
}

export class CreateWebPageSourceResponseDto {
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
  }): CreateWebPageSourceResponseDto {
    return new CreateWebPageSourceResponseDto({
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
