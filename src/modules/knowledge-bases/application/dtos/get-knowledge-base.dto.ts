import type { Request } from "express";

export class GetKnowledgeBaseRequestDto {
  readonly userId: string;
  readonly workspaceId: string;
  readonly knowledgeBaseId: string;

  private constructor(props: { userId: string; workspaceId: string; knowledgeBaseId: string }) {
    this.userId = props.userId;
    this.workspaceId = props.workspaceId;
    this.knowledgeBaseId = props.knowledgeBaseId;
  }

  static fromRequest(req: Request): GetKnowledgeBaseRequestDto {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error("Authenticated user is missing from the request");
    // The params have already been validated by getKnowledgeBaseParamsSchema.
    const params = req.params as { workspaceId: string; id: string };
    return new GetKnowledgeBaseRequestDto({ userId, workspaceId: params.workspaceId, knowledgeBaseId: params.id });
  }
}

export class GetKnowledgeBaseResponseDto {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly description: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;

  private constructor(props: {
    id: string;
    workspaceId: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  }) {
    this.id = props.id;
    this.workspaceId = props.workspaceId;
    this.name = props.name;
    this.description = props.description;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static toResponse(knowledgeBase: {
    id: string;
    workspaceId: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): GetKnowledgeBaseResponseDto {
    return new GetKnowledgeBaseResponseDto({
      id: knowledgeBase.id,
      workspaceId: knowledgeBase.workspaceId,
      name: knowledgeBase.name,
      description: knowledgeBase.description,
      createdAt: knowledgeBase.createdAt.toISOString(),
      updatedAt: knowledgeBase.updatedAt.toISOString(),
    });
  }
}
