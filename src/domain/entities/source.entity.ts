import { SourceStatus } from "../enums/source-status.enum.js";
import { SourceType } from "../enums/source-type.enum.js";

/** A web page is only an address; every other source is a file kept in object storage. */
type NewSourceProps = { id: string; knowledgeBaseId: string; name: string } & (
  | { type: SourceType.WEB_PAGE; url: string }
  | { type: SourceType.PDF | SourceType.TEXT_FILE; storageKey: string; sizeBytes: number; contentType: string }
);

export class SourceEntity {
  private constructor(
    private readonly _id: string,
    private readonly _knowledgeBaseId: string,
    private readonly _type: SourceType,
    private readonly _name: string,
    private readonly _url: string | null,
    private readonly _storageKey: string | null,
    private readonly _sizeBytes: number | null,
    private readonly _contentType: string | null,
    private readonly _status: SourceStatus,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  // --- Factory: create a new source (use case calls this) ---
  static create(props: NewSourceProps): SourceEntity {
    const now = new Date();
    if (props.type === SourceType.WEB_PAGE) {
      return new SourceEntity(
        props.id, props.knowledgeBaseId, props.type, props.name,
        props.url, null, null, null,
        SourceStatus.STORED, now, now,
      );
    }
    return new SourceEntity(
      props.id, props.knowledgeBaseId, props.type, props.name,
      null, props.storageKey, props.sizeBytes, props.contentType,
      SourceStatus.STORED, now, now,
    );
  }

  // --- Factory: reconstruct from a database row (repository calls this) ---
  static fromRecord(row: {
    id: string;
    knowledge_base_id: string;
    type: string;
    name: string;
    url: string | null;
    storage_key: string | null;
    size_bytes: number | null;
    content_type: string | null;
    status: string;
    created_at: Date;
    updated_at: Date;
  }): SourceEntity {
    return new SourceEntity(
      row.id,
      row.knowledge_base_id,
      row.type as SourceType,
      row.name,
      row.url,
      row.storage_key,
      row.size_bytes,
      row.content_type,
      row.status as SourceStatus,
      row.created_at,
      row.updated_at,
    );
  }

  // --- Getters ---
  get id(): string { return this._id; }
  get knowledgeBaseId(): string { return this._knowledgeBaseId; }
  get type(): SourceType { return this._type; }
  get name(): string { return this._name; }
  get url(): string | null { return this._url; }
  get storageKey(): string | null { return this._storageKey; }
  get sizeBytes(): number | null { return this._sizeBytes; }
  get contentType(): string | null { return this._contentType; }
  get status(): SourceStatus { return this._status; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
}
