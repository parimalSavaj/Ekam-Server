import type { Request } from "express";

export class UpdateWorkspaceRequestDto {
  readonly userId: string;
  readonly workspaceId: string;
  readonly name: string;

  private constructor(props: { userId: string; workspaceId: string; name: string }) {
    this.userId = props.userId;
    this.workspaceId = props.workspaceId;
    this.name = props.name;
  }

  static fromRequest(req: Request): UpdateWorkspaceRequestDto {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error("Authenticated user is missing from the request");
    // Params and body have already been validated by the update schemas.
    const params = req.params as { id: string };
    const body = req.body as { name: string };
    return new UpdateWorkspaceRequestDto({ userId, workspaceId: params.id, name: body.name });
  }
}

export class UpdateWorkspaceResponseDto {
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

  static toResponse(workspace: { id: string; name: string; createdAt: Date; updatedAt: Date }): UpdateWorkspaceResponseDto {
    return new UpdateWorkspaceResponseDto({
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    });
  }
}
