export class WorkspaceEntity {
  private constructor(
    private readonly _id: string,
    private readonly _ownerId: string,
    private readonly _name: string,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  // --- Factory: create a new workspace (use case calls this) ---
  static create(props: { id: string; ownerId: string; name: string }): WorkspaceEntity {
    const now = new Date();
    return new WorkspaceEntity(props.id, props.ownerId, props.name, now, now);
  }

  // --- Factory: reconstruct from a database row (repository calls this) ---
  static fromRecord(row: {
    id: string;
    owner_id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
  }): WorkspaceEntity {
    return new WorkspaceEntity(row.id, row.owner_id, row.name, row.created_at, row.updated_at);
  }

  // --- Getters ---
  get id(): string { return this._id; }
  get ownerId(): string { return this._ownerId; }
  get name(): string { return this._name; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  // --- Business methods ---
  /** Returns a renamed copy; entities are immutable. */
  rename(name: string): WorkspaceEntity {
    return new WorkspaceEntity(this._id, this._ownerId, name, this._createdAt, new Date());
  }
}
