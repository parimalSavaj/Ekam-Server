import type { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../../../shared/constants/status-code.constants.js";
import { ApiResponse } from "../../../shared/core/api-response.js";
import type { CreateWorkspaceUseCase } from "../application/create-workspace.use-case.js";
import type { DeleteWorkspaceUseCase } from "../application/delete-workspace.use-case.js";
import { CreateWorkspaceRequestDto } from "../application/dtos/create-workspace.dto.js";
import { DeleteWorkspaceRequestDto } from "../application/dtos/delete-workspace.dto.js";
import { GetWorkspaceRequestDto } from "../application/dtos/get-workspace.dto.js";
import { ListWorkspacesRequestDto } from "../application/dtos/list-workspaces.dto.js";
import { UpdateWorkspaceRequestDto } from "../application/dtos/update-workspace.dto.js";
import type { GetWorkspaceUseCase } from "../application/get-workspace.use-case.js";
import type { ListWorkspacesUseCase } from "../application/list-workspaces.use-case.js";
import type { UpdateWorkspaceUseCase } from "../application/update-workspace.use-case.js";

export class WorkspacesController {
  constructor(
    private readonly createWorkspaceUseCase: CreateWorkspaceUseCase,
    private readonly listWorkspacesUseCase: ListWorkspacesUseCase,
    private readonly getWorkspaceUseCase: GetWorkspaceUseCase,
    private readonly updateWorkspaceUseCase: UpdateWorkspaceUseCase,
    private readonly deleteWorkspaceUseCase: DeleteWorkspaceUseCase,
  ) {}

  createWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateWorkspaceRequestDto.fromRequest(req);
      const result = await this.createWorkspaceUseCase.execute(dto);
      res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, result));
    } catch (error) {
      next(error);
    }
  };

  listWorkspaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = ListWorkspacesRequestDto.fromRequest(req);
      const result = await this.listWorkspacesUseCase.execute(dto);
      res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result));
    } catch (error) {
      next(error);
    }
  };

  getWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = GetWorkspaceRequestDto.fromRequest(req);
      const result = await this.getWorkspaceUseCase.execute(dto);
      res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result));
    } catch (error) {
      next(error);
    }
  };

  updateWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = UpdateWorkspaceRequestDto.fromRequest(req);
      const result = await this.updateWorkspaceUseCase.execute(dto);
      res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result));
    } catch (error) {
      next(error);
    }
  };

  deleteWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = DeleteWorkspaceRequestDto.fromRequest(req);
      const result = await this.deleteWorkspaceUseCase.execute(dto);
      res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result));
    } catch (error) {
      next(error);
    }
  };
}
