import type { Request } from "express";

export class DeleteSourceRequestDto {
  readonly userId: string;
  readonly workspaceId: string;
  readonly knowledgeBaseId: string;
  readonly sourceId: string;

  private constructor(props: { userId: string; workspaceId: string; knowledgeBaseId: string; sourceId: string }) {
    this.userId = props.userId;
    this.workspaceId = props.workspaceId;
    this.knowledgeBaseId = props.knowledgeBaseId;
    this.sourceId = props.sourceId;
  }

  static fromRequest(req: Request): DeleteSourceRequestDto {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error("Authenticated user is missing from the request");
    // The params have already been validated by deleteSourceParamsSchema.
    const params = req.params as { workspaceId: string; knowledgeBaseId: string; id: string };
    return new DeleteSourceRequestDto({
      userId,
      workspaceId: params.workspaceId,
      knowledgeBaseId: params.knowledgeBaseId,
      sourceId: params.id,
    });
  }
}

export class DeleteSourceResponseDto {
  readonly id: string;

  private constructor(props: { id: string }) {
    this.id = props.id;
  }

  static toResponse(source: { id: string }): DeleteSourceResponseDto {
    return new DeleteSourceResponseDto({ id: source.id });
  }
}
