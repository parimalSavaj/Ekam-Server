import type { Request } from "express";

export class GetWorkspaceRequestDto {
  readonly userId: string;
  readonly workspaceId: string;

  private constructor(props: { userId: string; workspaceId: string }) {
    this.userId = props.userId;
    this.workspaceId = props.workspaceId;
  }

  static fromRequest(req: Request): GetWorkspaceRequestDto {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error("Authenticated user is missing from the request");
    // The params have already been validated by getWorkspaceParamsSchema.
    const params = req.params as { id: string };
    return new GetWorkspaceRequestDto({ userId, workspaceId: params.id });
  }
}

export class GetWorkspaceResponseDto {
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

  static toResponse(workspace: { id: string; name: string; createdAt: Date; updatedAt: Date }): GetWorkspaceResponseDto {
    return new GetWorkspaceResponseDto({
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    });
  }
}
