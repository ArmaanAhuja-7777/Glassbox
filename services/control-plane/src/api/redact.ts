/**
 * Removes secret-shaped text from anything about to be logged or returned: database connection strings
 * (which embed a password) and bearer tokens. Errors from drivers can quote the URL they failed on.
 */
export function redact(text: string): string {
  return text
    .replace(/postgres(?:ql)?:\/\/[^\s"'<>]+/gi, 'postgresql://[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/g, 'Bearer [redacted]');
}

/** A short, safe description of an unknown error for logs. */
export function describeError(error: unknown): string {
  if (error instanceof Error) return redact(`${error.name}: ${error.message}`);
  return redact(String(error));
}
