import type { Request } from "express";

export class DeleteKnowledgeBaseRequestDto {
  readonly userId: string;
  readonly workspaceId: string;
  readonly knowledgeBaseId: string;

  private constructor(props: { userId: string; workspaceId: string; knowledgeBaseId: string }) {
    this.userId = props.userId;
    this.workspaceId = props.workspaceId;
    this.knowledgeBaseId = props.knowledgeBaseId;
  }

  static fromRequest(req: Request): DeleteKnowledgeBaseRequestDto {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error("Authenticated user is missing from the request");
    // The params have already been validated by deleteKnowledgeBaseParamsSchema.
    const params = req.params as { workspaceId: string; id: string };
    return new DeleteKnowledgeBaseRequestDto({ userId, workspaceId: params.workspaceId, knowledgeBaseId: params.id });
  }
}

export class DeleteKnowledgeBaseResponseDto {
  readonly id: string;

  private constructor(props: { id: string }) {
    this.id = props.id;
  }

  static toResponse(knowledgeBase: { id: string }): DeleteKnowledgeBaseResponseDto {
    return new DeleteKnowledgeBaseResponseDto({ id: knowledgeBase.id });
  }
}
