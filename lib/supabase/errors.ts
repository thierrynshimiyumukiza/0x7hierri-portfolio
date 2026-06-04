import type { PostgrestError } from "@supabase/supabase-js";

function toLower(text: string | null | undefined) {
  return (text ?? "").toLowerCase();
}

export function isMissingTableError(error: PostgrestError | null, tableName?: string) {
  if (!error) return false;

  const haystack = `${toLower(error.message)} ${toLower(error.details)} ${toLower(error.hint)}`;
  const hasMissingTableCode = error.code === "PGRST205" || error.code === "42P01";

  if (!hasMissingTableCode) {
    return false;
  }

  if (!tableName) {
    return true;
  }

  const normalized = tableName.toLowerCase();
  return haystack.includes(`public.${normalized}`) || haystack.includes(normalized);
}

export function isMissingTableErrorMessage(error: unknown, tableName: string) {
  if (!(error instanceof Error)) return false;

  const message = toLower(error.message);
  const normalized = tableName.toLowerCase();

  return (
    (message.includes("schema cache") || message.includes("does not exist")) &&
    (message.includes(`public.${normalized}`) || message.includes(normalized))
  );
}

export function getMissingTableHelpMessage(tableName: string) {
  return [
    `Supabase table public.${tableName} is missing from the API schema cache.`,
    "Run the SQL from supabase/schema.sql in Supabase SQL Editor for this project, then refresh the page.",
  ].join(" ");
}