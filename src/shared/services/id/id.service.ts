import { v7 } from "uuid";
import type { IIdService } from "./id.service.interface.js";

export class IdService implements IIdService {
  private static instance: IdService | undefined;

  private constructor() {}

  static getInstance(): IdService {
    return (this.instance ??= new IdService());
  }

  generate(): string {
    return v7();
  }
}
