import type { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../../../shared/constants/status-code.constants.js";
import { ApiResponse } from "../../../shared/core/api-response.js";
import type { CreateKnowledgeBaseUseCase } from "../application/create-knowledge-base.use-case.js";
import type { DeleteKnowledgeBaseUseCase } from "../application/delete-knowledge-base.use-case.js";
import { CreateKnowledgeBaseRequestDto } from "../application/dtos/create-knowledge-base.dto.js";
import { DeleteKnowledgeBaseRequestDto } from "../application/dtos/delete-knowledge-base.dto.js";
import { GetKnowledgeBaseRequestDto } from "../application/dtos/get-knowledge-base.dto.js";
import { ListKnowledgeBasesRequestDto } from "../application/dtos/list-knowledge-bases.dto.js";
import { UpdateKnowledgeBaseRequestDto } from "../application/dtos/update-knowledge-base.dto.js";
import type { GetKnowledgeBaseUseCase } from "../application/get-knowledge-base.use-case.js";
import type { ListKnowledgeBasesUseCase } from "../application/list-knowledge-bases.use-case.js";
import type { UpdateKnowledgeBaseUseCase } from "../application/update-knowledge-base.use-case.js";

export class KnowledgeBasesController {
  constructor(
    private readonly createKnowledgeBaseUseCase: CreateKnowledgeBaseUseCase,
    private readonly listKnowledgeBasesUseCase: ListKnowledgeBasesUseCase,
    private readonly getKnowledgeBaseUseCase: GetKnowledgeBaseUseCase,
    private readonly updateKnowledgeBaseUseCase: UpdateKnowledgeBaseUseCase,
    private readonly deleteKnowledgeBaseUseCase: DeleteKnowledgeBaseUseCase,
  ) {}

  createKnowledgeBase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateKnowledgeBaseRequestDto.fromRequest(req);
      const result = await this.createKnowledgeBaseUseCase.execute(dto);
      res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, result));
    } catch (error) {
      next(error);
    }
  };

  listKnowledgeBases = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = ListKnowledgeBasesRequestDto.fromRequest(req);
      const result = await this.listKnowledgeBasesUseCase.execute(dto);
      res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result));
    } catch (error) {
      next(error);
    }
  };

  getKnowledgeBase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = GetKnowledgeBaseRequestDto.fromRequest(req);
      const result = await this.getKnowledgeBaseUseCase.execute(dto);
      res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result));
    } catch (error) {
      next(error);
    }
  };

  updateKnowledgeBase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = UpdateKnowledgeBaseRequestDto.fromRequest(req);
      const result = await this.updateKnowledgeBaseUseCase.execute(dto);
      res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result));
    } catch (error) {
      next(error);
    }
  };

  deleteKnowledgeBase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = DeleteKnowledgeBaseRequestDto.fromRequest(req);
      const result = await this.deleteKnowledgeBaseUseCase.execute(dto);
      res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result));
    } catch (error) {
      next(error);
    }
  };
}
