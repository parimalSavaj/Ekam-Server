import type { Request } from "express";

export class DeleteWorkspaceRequestDto {
  readonly userId: string;
  readonly workspaceId: string;

  private constructor(props: { userId: string; workspaceId: string }) {
    this.userId = props.userId;
    this.workspaceId = props.workspaceId;
  }

  static fromRequest(req: Request): DeleteWorkspaceRequestDto {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error("Authenticated user is missing from the request");
    // The params have already been validated by deleteWorkspaceParamsSchema.
    const params = req.params as { id: string };
    return new DeleteWorkspaceRequestDto({ userId, workspaceId: params.id });
  }
}

export class DeleteWorkspaceResponseDto {
  readonly id: string;

  private constructor(props: { id: string }) {
    this.id = props.id;
  }

  static toResponse(workspace: { id: string }): DeleteWorkspaceResponseDto {
    return new DeleteWorkspaceResponseDto({ id: workspace.id });
  }
}
