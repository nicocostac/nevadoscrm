export function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = (error as { code?: string }).code;
  const message = (error as { message?: string }).message ?? "";
  return code === "PGRST205" || message.includes("Could not find the table");
}

export function isMissingRelationshipError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = (error as { code?: string }).code;
  const message = (error as { message?: string }).message ?? "";
  return code === "PGRST200" || message.includes("Could not find a relationship");
}
