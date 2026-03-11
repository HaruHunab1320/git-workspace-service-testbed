/**
 * Custom error classes for the Cozy Village Simulator frontend.
 *
 * These provide structured error information so UI components can
 * react differently to network failures vs validation errors vs 404s.
 */

export class ApiError extends Error {
  constructor(message, statusCode, detail) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'Network request failed') {
    super(message, 0, message);
    this.name = 'NetworkError';
  }
}

export class NotFoundError extends ApiError {
  constructor(detail = 'Resource not found') {
    super(detail, 404, detail);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(detail = 'Invalid request') {
    super(detail, 400, detail);
    this.name = 'ValidationError';
  }
}
