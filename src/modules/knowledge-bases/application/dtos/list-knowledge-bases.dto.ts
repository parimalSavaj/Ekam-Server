import type { Request } from "express";

export class ListKnowledgeBasesRequestDto {
  readonly userId: string;
  readonly workspaceId: string;

  private constructor(props: { userId: string; workspaceId: string }) {
    this.userId = props.userId;
    this.workspaceId = props.workspaceId;
  }

  static fromRequest(req: Request): ListKnowledgeBasesRequestDto {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error("Authenticated user is missing from the request");
    // The params have already been validated by listKnowledgeBasesParamsSchema.
    const params = req.params as { workspaceId: string };
    return new ListKnowledgeBasesRequestDto({ userId, workspaceId: params.workspaceId });
  }
}

type KnowledgeBaseItem = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export class ListKnowledgeBasesResponseDto {
  readonly knowledgeBases: readonly KnowledgeBaseItem[];

  private constructor(props: { knowledgeBases: readonly KnowledgeBaseItem[] }) {
    this.knowledgeBases = props.knowledgeBases;
  }

  static toResponse(
    knowledgeBases: readonly {
      id: string;
      workspaceId: string;
      name: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
    }[],
  ): ListKnowledgeBasesResponseDto {
    return new ListKnowledgeBasesResponseDto({
      knowledgeBases: knowledgeBases.map(knowledgeBase => ({
        id: knowledgeBase.id,
        workspaceId: knowledgeBase.workspaceId,
        name: knowledgeBase.name,
        description: knowledgeBase.description,
        createdAt: knowledgeBase.createdAt.toISOString(),
        updatedAt: knowledgeBase.updatedAt.toISOString(),
      })),
    });
  }
}
