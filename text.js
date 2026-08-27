/** Capitalizes just the first letter — used so a title typed lowercase on a
 * phone keyboard still reads as a proper sentence. */
export function cap(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
