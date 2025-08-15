interface AppErrorOptions {
  statusCode?: number;
  details?: any;
  cause?: unknown;
}

export class AppError extends Error {
  statusCode?: number;
  details?: any;
  cause?: unknown;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.cause = options.cause;

    // Mantém stack trace limpa
    Error.captureStackTrace?.(this, this.constructor);
  }
}


