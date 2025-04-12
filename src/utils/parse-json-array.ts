// --- Helper Functions ---
export function parseJsonArray<T>(envVar?: string, defaultValue: T[] = []): T[] {
  if (!envVar) return defaultValue;

  try {
    const parsed = JSON.parse(envVar);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    console.warn(
      `Invalid JSON array format for env var, using default: ${JSON.stringify(defaultValue)}`
    );
  } catch (e) {
    console.error(
      `Error parsing JSON array from env var: ${e}. Using default: ${JSON.stringify(defaultValue)}`
    );
  }
  return defaultValue;
}
