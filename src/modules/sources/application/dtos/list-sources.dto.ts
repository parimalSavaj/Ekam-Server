import type { Request } from "express";
import type { SourceStatus } from "../../../../domain/enums/source-status.enum.js";
import type { SourceType } from "../../../../domain/enums/source-type.enum.js";

export class ListSourcesRequestDto {
  readonly userId: string;
  readonly workspaceId: string;
  readonly knowledgeBaseId: string;

  private constructor(props: { userId: string; workspaceId: string; knowledgeBaseId: string }) {
    this.userId = props.userId;
    this.workspaceId = props.workspaceId;
    this.knowledgeBaseId = props.knowledgeBaseId;
  }

  static fromRequest(req: Request): ListSourcesRequestDto {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error("Authenticated user is missing from the request");
    // The params have already been validated by listSourcesParamsSchema.
    const params = req.params as { workspaceId: string; knowledgeBaseId: string };
    return new ListSourcesRequestDto({ userId, workspaceId: params.workspaceId, knowledgeBaseId: params.knowledgeBaseId });
  }
}

type SourceItem = {
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
};

export class ListSourcesResponseDto {
  readonly sources: readonly SourceItem[];

  private constructor(props: { sources: readonly SourceItem[] }) {
    this.sources = props.sources;
  }

  static toResponse(
    sources: readonly {
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
    }[],
  ): ListSourcesResponseDto {
    return new ListSourcesResponseDto({
      sources: sources.map(source => ({
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
      })),
    });
  }
}
