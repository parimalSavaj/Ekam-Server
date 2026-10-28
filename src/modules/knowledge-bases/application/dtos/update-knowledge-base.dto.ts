import type { Request } from "express";

export class UpdateKnowledgeBaseRequestDto {
  readonly userId: string;
  readonly workspaceId: string;
  readonly knowledgeBaseId: string;
  /** Undefined means "leave the name unchanged". */
  readonly name: string | undefined;
  /** Undefined means "leave unchanged"; null clears the description. */
  readonly description: string | null | undefined;

  private constructor(props: {
    userId: string;
    workspaceId: string;
    knowledgeBaseId: string;
    name: string | undefined;
    description: string | null | undefined;
  }) {
    this.userId = props.userId;
    this.workspaceId = props.workspaceId;
    this.knowledgeBaseId = props.knowledgeBaseId;
    this.name = props.name;
    this.description = props.description;
  }

  static fromRequest(req: Request): UpdateKnowledgeBaseRequestDto {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error("Authenticated user is missing from the request");
    // Params and body have already been validated by the update schemas.
    const params = req.params as { workspaceId: string; id: string };
    const body = req.body as { name?: string; description?: string | null };
    return new UpdateKnowledgeBaseRequestDto({
      userId,
      workspaceId: params.workspaceId,
      knowledgeBaseId: params.id,
      name: body.name,
      description: body.description,
    });
  }
}

export class UpdateKnowledgeBaseResponseDto {
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
  }): UpdateKnowledgeBaseResponseDto {
    return new UpdateKnowledgeBaseResponseDto({
      id: knowledgeBase.id,
      workspaceId: knowledgeBase.workspaceId,
      name: knowledgeBase.name,
      description: knowledgeBase.description,
      createdAt: knowledgeBase.createdAt.toISOString(),
      updatedAt: knowledgeBase.updatedAt.toISOString(),
    });
  }
}
