export class ApiResponse<T> {
  constructor(
    public readonly statusCode: number,
    public readonly data: T,
  ) {}
}
