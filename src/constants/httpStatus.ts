// src/constants/httpStatus.ts
/**
 * HTTP状态码常量
 * 参考：https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 */

// 1xx: Informational responses
export const HTTP_CONTINUE = 100;
export const HTTP_SWITCHING_PROTOCOLS = 101;
export const HTTP_PROCESSING = 102;
export const HTTP_EARLY_HINTS = 103;

// 2xx: Success responses
export const HTTP_OK = 200;
export const HTTP_CREATED = 201;
export const HTTP_ACCEPTED = 202;
export const HTTP_NON_AUTHORITATIVE_INFORMATION = 203;
export const HTTP_NO_CONTENT = 204;
export const HTTP_RESET_CONTENT = 205;
export const HTTP_PARTIAL_CONTENT = 206;
export const HTTP_MULTI_STATUS = 207;
export const HTTP_ALREADY_REPORTED = 208;
export const HTTP_IM_USED = 226;

// 3xx: Redirection messages
export const HTTP_MULTIPLE_CHOICES = 300;
export const HTTP_MOVED_PERMANENTLY = 301;
export const HTTP_FOUND = 302;
export const HTTP_SEE_OTHER = 303;
export const HTTP_NOT_MODIFIED = 304;
export const HTTP_USE_PROXY = 305;
export const HTTP_TEMPORARY_REDIRECT = 307;
export const HTTP_PERMANENT_REDIRECT = 308;

// 4xx: Client error responses
export const HTTP_BAD_REQUEST = 400;
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_PAYMENT_REQUIRED = 402;
export const HTTP_FORBIDDEN = 403;
export const HTTP_NOT_FOUND = 404;
export const HTTP_METHOD_NOT_ALLOWED = 405;
export const HTTP_NOT_ACCEPTABLE = 406;
export const HTTP_PROXY_AUTHENTICATION_REQUIRED = 407;
export const HTTP_REQUEST_TIMEOUT = 408;
export const HTTP_CONFLICT = 409;
export const HTTP_GONE = 410;
export const HTTP_LENGTH_REQUIRED = 411;
export const HTTP_PRECONDITION_FAILED = 412;
export const HTTP_PAYLOAD_TOO_LARGE = 413;
export const HTTP_URI_TOO_LONG = 414;
export const HTTP_UNSUPPORTED_MEDIA_TYPE = 415;
export const HTTP_RANGE_NOT_SATISFIABLE = 416;
export const HTTP_EXPECTATION_FAILED = 417;
export const HTTP_IM_A_TEAPOT = 418;
export const HTTP_MISDIRECTED_REQUEST = 421;
export const HTTP_UNPROCESSABLE_ENTITY = 422;
export const HTTP_LOCKED = 423;
export const HTTP_FAILED_DEPENDENCY = 424;
export const HTTP_TOO_EARLY = 425;
export const HTTP_UPGRADE_REQUIRED = 426;
export const HTTP_PRECONDITION_REQUIRED = 428;
export const HTTP_TOO_MANY_REQUESTS = 429;
export const HTTP_REQUEST_HEADER_FIELDS_TOO_LARGE = 431;
export const HTTP_UNAVAILABLE_FOR_LEGAL_REASONS = 451;

// 5xx: Server error responses
export const HTTP_INTERNAL_SERVER_ERROR = 500;
export const HTTP_NOT_IMPLEMENTED = 501;
export const HTTP_BAD_GATEWAY = 502;
export const HTTP_SERVICE_UNAVAILABLE = 503;
export const HTTP_GATEWAY_TIMEOUT = 504;
export const HTTP_VERSION_NOT_SUPPORTED = 505;
export const HTTP_VARIANT_ALSO_NEGOTIATES = 506;
export const HTTP_INSUFFICIENT_STORAGE = 507;
export const HTTP_LOOP_DETECTED = 508;
export const HTTP_NOT_EXTENDED = 510;
export const HTTP_NETWORK_AUTHENTICATION_REQUIRED = 511;

// 常用状态码分组
export const SUCCESS_CODES = {
  OK: HTTP_OK,
  CREATED: HTTP_CREATED,
  ACCEPTED: HTTP_ACCEPTED,
  NO_CONTENT: HTTP_NO_CONTENT,
} as const;

export const CLIENT_ERROR_CODES = {
  BAD_REQUEST: HTTP_BAD_REQUEST,
  UNAUTHORIZED: HTTP_UNAUTHORIZED,
  FORBIDDEN: HTTP_FORBIDDEN,
  NOT_FOUND: HTTP_NOT_FOUND,
  CONFLICT: HTTP_CONFLICT,
  TOO_MANY_REQUESTS: HTTP_TOO_MANY_REQUESTS,
} as const;

export const SERVER_ERROR_CODES = {
  INTERNAL_SERVER_ERROR: HTTP_INTERNAL_SERVER_ERROR,
  NOT_IMPLEMENTED: HTTP_NOT_IMPLEMENTED,
  BAD_GATEWAY: HTTP_BAD_GATEWAY,
  SERVICE_UNAVAILABLE: HTTP_SERVICE_UNAVAILABLE,
} as const;

// 状态码描述
export const HTTP_STATUS_MESSAGES = {
  [HTTP_OK]: 'OK',
  [HTTP_CREATED]: 'Created',
  [HTTP_BAD_REQUEST]: 'Bad Request',
  [HTTP_UNAUTHORIZED]: 'Unauthorized',
  [HTTP_FORBIDDEN]: 'Forbidden',
  [HTTP_NOT_FOUND]: 'Not Found',
  [HTTP_CONFLICT]: 'Conflict',
  [HTTP_INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [HTTP_TOO_MANY_REQUESTS]: 'Too Many Requests',
} as const;

// 获取状态码描述
export function getStatusMessage(statusCode: number): string {
  return HTTP_STATUS_MESSAGES[statusCode as keyof typeof HTTP_STATUS_MESSAGES] || 'Unknown';
}

// 判断是否为成功状态码
export function isSuccess(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300;
}

// 判断是否为客户端错误
export function isClientError(statusCode: number): boolean {
  return statusCode >= 400 && statusCode < 500;
}

// 判断是否为服务器错误
export function isServerError(statusCode: number): boolean {
  return statusCode >= 500 && statusCode < 600;
}

// 常用状态码类型
export type HttpStatus = 
  | typeof HTTP_OK
  | typeof HTTP_CREATED
  | typeof HTTP_BAD_REQUEST
  | typeof HTTP_UNAUTHORIZED
  | typeof HTTP_FORBIDDEN
  | typeof HTTP_NOT_FOUND
  | typeof HTTP_CONFLICT
  | typeof HTTP_INTERNAL_SERVER_ERROR;

// ==================== 分组导出 ====================

// 常用状态码分组（用于大多数API场景）
export const COMMON_HTTP_STATUS = {
  // 成功
  OK: HTTP_OK,
  CREATED: HTTP_CREATED,
  NO_CONTENT: HTTP_NO_CONTENT,
  
  // 客户端错误
  BAD_REQUEST: HTTP_BAD_REQUEST,
  UNAUTHORIZED: HTTP_UNAUTHORIZED,
  FORBIDDEN: HTTP_FORBIDDEN,
  NOT_FOUND: HTTP_NOT_FOUND,
  CONFLICT: HTTP_CONFLICT,
  TOO_MANY_REQUESTS: HTTP_TOO_MANY_REQUESTS,
  
  // 服务器错误
  INTERNAL_SERVER_ERROR: HTTP_INTERNAL_SERVER_ERROR,
  NOT_IMPLEMENTED: HTTP_NOT_IMPLEMENTED,
  BAD_GATEWAY: HTTP_BAD_GATEWAY,
  SERVICE_UNAVAILABLE: HTTP_SERVICE_UNAVAILABLE,
} as const;

// 所有成功状态码
export const SUCCESS_STATUS = {
  OK: HTTP_OK,
  CREATED: HTTP_CREATED,
  ACCEPTED: HTTP_ACCEPTED,
  NO_CONTENT: HTTP_NO_CONTENT,
  PARTIAL_CONTENT: HTTP_PARTIAL_CONTENT,
} as const;

// 所有客户端错误状态码
export const CLIENT_ERROR_STATUS = {
  BAD_REQUEST: HTTP_BAD_REQUEST,
  UNAUTHORIZED: HTTP_UNAUTHORIZED,
  FORBIDDEN: HTTP_FORBIDDEN,
  NOT_FOUND: HTTP_NOT_FOUND,
  METHOD_NOT_ALLOWED: HTTP_METHOD_NOT_ALLOWED,
  CONFLICT: HTTP_CONFLICT,
  GONE: HTTP_GONE,
  TOO_MANY_REQUESTS: HTTP_TOO_MANY_REQUESTS,
  UNPROCESSABLE_ENTITY: HTTP_UNPROCESSABLE_ENTITY,
} as const;

// 所有服务器错误状态码
export const SERVER_ERROR_STATUS = {
  INTERNAL_SERVER_ERROR: HTTP_INTERNAL_SERVER_ERROR,
  NOT_IMPLEMENTED: HTTP_NOT_IMPLEMENTED,
  BAD_GATEWAY: HTTP_BAD_GATEWAY,
  SERVICE_UNAVAILABLE: HTTP_SERVICE_UNAVAILABLE,
  GATEWAY_TIMEOUT: HTTP_GATEWAY_TIMEOUT,
} as const;

// 快捷方式：直接导出常用状态码
export const {
  OK,
  CREATED,
  NO_CONTENT,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
  CONFLICT,
  TOO_MANY_REQUESTS,
  INTERNAL_SERVER_ERROR,
  NOT_IMPLEMENTED,
  BAD_GATEWAY,
  SERVICE_UNAVAILABLE,
} = COMMON_HTTP_STATUS;