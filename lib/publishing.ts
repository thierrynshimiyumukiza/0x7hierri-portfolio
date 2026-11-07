/**
 * A post can be marked published with a future publish date to schedule it.
 * Public queries add this filter so it stays hidden until that moment; rows
 * without a date (older posts) are always visible.
 */
export function releasedFilter() {
  return `published_at.is.null,published_at.lte."${new Date().toISOString()}"`;
}
