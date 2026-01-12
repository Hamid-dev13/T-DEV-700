// from TypeScript Guide by Convex: https://www.convex.dev/typescript/best-practices/error-handling-debugging/typescript-catch-error-type
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  // Fallback for unexpected types
  try {
    return JSON.stringify(error);
  } catch {
    // JSON.stringify can fail on circular references
    return 'Unable to determine error message';
  }
}
