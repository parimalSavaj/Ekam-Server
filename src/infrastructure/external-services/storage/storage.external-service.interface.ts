import type { PutObjectParams } from "./storage.types.js";

/** Object storage for uploaded source files. */
export interface IStorageExternalService {
  /** Stores the object, replacing any object with the same key. */
  put(params: PutObjectParams): Promise<void>;
  /** Deletes the objects. Keys that do not exist are not an error. Throws if any deletion fails. */
  deleteMany(keys: readonly string[]): Promise<void>;
}
