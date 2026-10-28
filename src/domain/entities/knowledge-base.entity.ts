export class KnowledgeBaseEntity {
  private constructor(
    private readonly _id: string,
    private readonly _workspaceId: string,
    private readonly _name: string,
    private readonly _description: string | null,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  // --- Factory: create a new knowledge base (use case calls this) ---
  static create(props: { id: string; workspaceId: string; name: string; description: string | null }): KnowledgeBaseEntity {
    const now = new Date();
    return new KnowledgeBaseEntity(props.id, props.workspaceId, props.name, props.description, now, now);
  }

  // --- Factory: reconstruct from a database row (repository calls this) ---
  static fromRecord(row: {
    id: string;
    workspace_id: string;
    name: string;
    description: string | null;
    created_at: Date;
    updated_at: Date;
  }): KnowledgeBaseEntity {
    return new KnowledgeBaseEntity(row.id, row.workspace_id, row.name, row.description, row.created_at, row.updated_at);
  }

  // --- Getters ---
  get id(): string { return this._id; }
  get workspaceId(): string { return this._workspaceId; }
  get name(): string { return this._name; }
  get description(): string | null { return this._description; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  // --- Business methods ---
  /** Returns an updated copy; entities are immutable. A field left undefined keeps its current value. */
  update(changes: { name?: string | undefined; description?: string | null | undefined }): KnowledgeBaseEntity {
    return new KnowledgeBaseEntity(
      this._id,
      this._workspaceId,
      changes.name ?? this._name,
      changes.description === undefined ? this._description : changes.description,
      this._createdAt,
      new Date(),
    );
  }
}
