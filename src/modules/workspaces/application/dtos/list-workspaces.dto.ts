import type { Request } from "express";

export class ListWorkspacesRequestDto {
  readonly userId: string;

  private constructor(props: { userId: string }) {
    this.userId = props.userId;
  }

  static fromRequest(req: Request): ListWorkspacesRequestDto {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error("Authenticated user is missing from the request");
    return new ListWorkspacesRequestDto({ userId });
  }
}

type WorkspaceItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export class ListWorkspacesResponseDto {
  readonly workspaces: readonly WorkspaceItem[];

  private constructor(props: { workspaces: readonly WorkspaceItem[] }) {
    this.workspaces = props.workspaces;
  }

  static toResponse(
    workspaces: readonly { id: string; name: string; createdAt: Date; updatedAt: Date }[],
  ): ListWorkspacesResponseDto {
    return new ListWorkspacesResponseDto({
      workspaces: workspaces.map(workspace => ({
        id: workspace.id,
        name: workspace.name,
        createdAt: workspace.createdAt.toISOString(),
        updatedAt: workspace.updatedAt.toISOString(),
      })),
    });
  }
}
