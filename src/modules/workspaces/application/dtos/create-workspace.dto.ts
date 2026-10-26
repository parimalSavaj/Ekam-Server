import type { Request } from "express";

export class CreateWorkspaceRequestDto {
  readonly userId: string;
  readonly name: string;

  private constructor(props: { userId: string; name: string }) {
    this.userId = props.userId;
    this.name = props.name;
  }

  static fromRequest(req: Request): CreateWorkspaceRequestDto {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error("Authenticated user is missing from the request");
    // The body has already been validated by createWorkspaceBodySchema.
    const body = req.body as { name: string };
    return new CreateWorkspaceRequestDto({ userId, name: body.name });
  }
}

export class CreateWorkspaceResponseDto {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;

  private constructor(props: { id: string; name: string; createdAt: string; updatedAt: string }) {
    this.id = props.id;
    this.name = props.name;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static toResponse(workspace: { id: string; name: string; createdAt: Date; updatedAt: Date }): CreateWorkspaceResponseDto {
    return new CreateWorkspaceResponseDto({
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    });
  }
}
