export type InstagramErrorCode =
  | "INVALID_URL"
  | "NOT_FOUND"
  | "PARSE_ERROR"
  | "FETCH_ERROR";

export class InstagramFetchError extends Error {
  readonly code: InstagramErrorCode;
  readonly statusCode: number;

  constructor(
    message: string,
    code: InstagramErrorCode,
    statusCode: number,
  ) {
    super(message);
    this.name = "InstagramFetchError";
    this.code = code;
    this.statusCode = statusCode;
  }
}
