import type { Request } from "express";

export class CreateKnowledgeBaseRequestDto {
  readonly userId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly description: string | null;

  private constructor(props: { userId: string; workspaceId: string; name: string; description: string | null }) {
    this.userId = props.userId;
    this.workspaceId = props.workspaceId;
    this.name = props.name;
    this.description = props.description;
  }

  static fromRequest(req: Request): CreateKnowledgeBaseRequestDto {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error("Authenticated user is missing from the request");
    // Params and body have already been validated by the create schemas.
    const params = req.params as { workspaceId: string };
    const body = req.body as { name: string; description?: string | null };
    return new CreateKnowledgeBaseRequestDto({
      userId,
      workspaceId: params.workspaceId,
      name: body.name,
      description: body.description ?? null,
    });
  }
}

export class CreateKnowledgeBaseResponseDto {
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
  }): CreateKnowledgeBaseResponseDto {
    return new CreateKnowledgeBaseResponseDto({
      id: knowledgeBase.id,
      workspaceId: knowledgeBase.workspaceId,
      name: knowledgeBase.name,
      description: knowledgeBase.description,
      createdAt: knowledgeBase.createdAt.toISOString(),
      updatedAt: knowledgeBase.updatedAt.toISOString(),
    });
  }
}
