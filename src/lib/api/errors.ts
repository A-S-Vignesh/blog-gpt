import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYLOAD_TOO_LARGE"
  | "VALIDATION_FAILED"
  | "PROMPT_TOO_LONG"
  | "PROMPT_REJECTED"
  | "CONTENT_FLAGGED"
  | "PLAN_LIMIT_REACHED"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_FAILED: 400,
  PROMPT_TOO_LONG: 400,
  PROMPT_REJECTED: 422,
  CONTENT_FLAGGED: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  PLAN_LIMIT_REACHED: 402,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  UPSTREAM_ERROR: 502,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ApiErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}

export function apiErrorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json(
      {
        error: err.message,
        code: err.code,
        ...(err.details ? { details: err.details } : {}),
      },
      { status: err.status },
    );
  }

  // Log the full detail server-side, but NEVER return the raw error message to
  // the client — it can leak stack frames, query shapes, or connection strings.
  // Only surface details in non-production to aid local debugging.
  console.error("[api] unhandled error:", err);
  const body =
    process.env.NODE_ENV !== "production" && err instanceof Error
      ? { error: "Internal server error", code: "INTERNAL_ERROR", details: { message: err.message } }
      : { error: "Internal server error", code: "INTERNAL_ERROR" };
  return NextResponse.json(body, { status: 500 });
}

export function jsonError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
) {
  return apiErrorResponse(new ApiError(code, message, details));
}
