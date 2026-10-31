import type { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../../../shared/constants/status-code.constants.js";
import { ApiResponse } from "../../../shared/core/api-response.js";
import type { CreateWebPageSourceUseCase } from "../application/create-web-page-source.use-case.js";
import type { DeleteSourceUseCase } from "../application/delete-source.use-case.js";
import { CreateWebPageSourceRequestDto } from "../application/dtos/create-web-page-source.dto.js";
import { DeleteSourceRequestDto } from "../application/dtos/delete-source.dto.js";
import { ListSourcesRequestDto } from "../application/dtos/list-sources.dto.js";
import { UploadFileSourceRequestDto } from "../application/dtos/upload-file-source.dto.js";
import type { ListSourcesUseCase } from "../application/list-sources.use-case.js";
import type { UploadFileSourceUseCase } from "../application/upload-file-source.use-case.js";

export class SourcesController {
  constructor(
    private readonly listSourcesUseCase: ListSourcesUseCase,
    private readonly createWebPageSourceUseCase: CreateWebPageSourceUseCase,
    private readonly uploadFileSourceUseCase: UploadFileSourceUseCase,
    private readonly deleteSourceUseCase: DeleteSourceUseCase,
  ) {}

  listSources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = ListSourcesRequestDto.fromRequest(req);
      const result = await this.listSourcesUseCase.execute(dto);
      res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result));
    } catch (error) {
      next(error);
    }
  };

  createWebPageSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateWebPageSourceRequestDto.fromRequest(req);
      const result = await this.createWebPageSourceUseCase.execute(dto);
      res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, result));
    } catch (error) {
      next(error);
    }
  };

  uploadFileSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = UploadFileSourceRequestDto.fromRequest(req);
      const result = await this.uploadFileSourceUseCase.execute(dto);
      res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, result));
    } catch (error) {
      next(error);
    }
  };

  deleteSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = DeleteSourceRequestDto.fromRequest(req);
      const result = await this.deleteSourceUseCase.execute(dto);
      res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result));
    } catch (error) {
      next(error);
    }
  };
}
