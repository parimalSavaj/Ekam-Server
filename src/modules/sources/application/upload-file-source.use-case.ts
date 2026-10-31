import { SourceEntity } from "../../../domain/entities/source.entity.js";
import { SourceType } from "../../../domain/enums/source-type.enum.js";
import type { IStorageExternalService } from "../../../infrastructure/external-services/storage/storage.external-service.interface.js";
import type { IKnowledgeBasesRepository } from "../../../infrastructure/repositories/knowledge-bases/knowledge-bases.repository.interface.js";
import type { ISourcesRepository } from "../../../infrastructure/repositories/sources/sources.repository.interface.js";
import { InternalError, NotFoundError, ValidationError } from "../../../shared/core/api-error.js";
import type { IIdService } from "../../../shared/services/id/id.service.interface.js";
import type { ILoggerService } from "../../../shared/services/logger/logger.service.interface.js";
import { SourceFileMapper, type AcceptedFileKind } from "../mappers/source-file.mapper.js";
import { UploadFileSourceResponseDto, type UploadFileSourceRequestDto } from "./dtos/upload-file-source.dto.js";

const MAX_FILE_NAME_LENGTH = 255;
const PDF_SIGNATURE = Buffer.from("%PDF-");
// Text is checked on its first bytes only; a binary file nearly always shows a zero byte early.
const TEXT_PROBE_BYTES = 8192;

export class UploadFileSourceUseCase {
  constructor(
    private readonly knowledgeBases: IKnowledgeBasesRepository,
    private readonly sources: ISourcesRepository,
    private readonly storage: IStorageExternalService,
    private readonly ids: IIdService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(dto: UploadFileSourceRequestDto): Promise<UploadFileSourceResponseDto> {
    // Knowledge bases of other users look exactly like missing ones, so ids cannot be probed.
    const knowledgeBase = await this.knowledgeBases.findByIdInWorkspaceOfOwner(
      dto.knowledgeBaseId,
      dto.workspaceId,
      dto.userId,
    );
    if (!knowledgeBase) throw new NotFoundError("Knowledge base not found");

    // The file is checked before it is stored: allowed type, not empty, and content that matches the type.
    const fileName = this.cleanFileName(dto.originalName);
    if (fileName === null) throw new ValidationError("The file needs a name.");
    const kind = SourceFileMapper.fromFileName(fileName);
    if (kind === null) {
      throw new ValidationError(`This file type is not supported. Upload a ${SourceFileMapper.ACCEPTED_DESCRIPTION} file.`);
    }
    if (dto.content.length === 0) throw new ValidationError("The file is empty.");
    if (!this.contentMatchesKind(kind, dto.content)) {
      throw new ValidationError(
        `This file's content does not match its type. Upload a valid ${SourceFileMapper.ACCEPTED_DESCRIPTION} file.`,
      );
    }

    const id = this.ids.generate();
    // The key never contains the user's file name, so it is always safe for object storage.
    const storageKey = `knowledge-bases/${knowledgeBase.id}/sources/${id}`;
    const source = SourceEntity.create({
      id,
      knowledgeBaseId: knowledgeBase.id,
      type: kind.type,
      name: fileName,
      storageKey,
      sizeBytes: dto.content.length,
      contentType: kind.contentType,
    });

    const context = { sourceId: id, knowledgeBaseId: dto.knowledgeBaseId, workspaceId: dto.workspaceId, userId: dto.userId };

    try {
      await this.storage.put({ key: storageKey, body: dto.content, contentType: kind.contentType });
    } catch (error) {
      this.logger.error("Source file storage failed", error, context);
      throw new InternalError("Could not store the file - please try again");
    }

    // Storage and the database cannot share a transaction. If the row is not saved, the stored
    // file is removed so nothing is left behind that no source points to.
    try {
      await this.sources.create(source);
    } catch (error) {
      this.logger.error("Source creation failed after the file was stored", error, context);
      try {
        await this.storage.deleteMany([storageKey]);
      } catch (cleanupError) {
        this.logger.error("Orphaned source file could not be removed", cleanupError, { ...context, storageKey });
      }
      throw new InternalError("Could not add the file - please try again");
    }

    this.logger.info("File source created", { ...context, type: source.type, sizeBytes: dto.content.length });
    return UploadFileSourceResponseDto.toResponse(source);
  }

  /**
   * Keeps only the file name (no folders) and removes control characters, so the stored name is
   * safe to show. Returns null when nothing usable is left.
   */
  private cleanFileName(originalName: string): string | null {
    const baseName = originalName.split(/[\\/]/).pop() ?? "";
    const cleaned = baseName.replace(/[\u0000-\u001f\u007f]/g, "").trim();
    if (cleaned === "" || cleaned === "." || cleaned === "..") return null;
    return cleaned.length > MAX_FILE_NAME_LENGTH ? cleaned.slice(0, MAX_FILE_NAME_LENGTH) : cleaned;
  }

  /** A PDF must start with the PDF signature; a text file must not look binary. */
  private contentMatchesKind(kind: AcceptedFileKind, content: Buffer): boolean {
    if (kind.type === SourceType.PDF) {
      return content.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE);
    }
    return !content.subarray(0, TEXT_PROBE_BYTES).includes(0);
  }
}
