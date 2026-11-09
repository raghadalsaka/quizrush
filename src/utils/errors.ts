export function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

// An error whose message is already worded for teachers, so it can be shown as it is.
export class FriendlyError extends Error {}
