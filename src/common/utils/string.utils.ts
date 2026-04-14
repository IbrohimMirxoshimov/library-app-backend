/**
 * Cyrillic to Latin character mapping for Uzbek text.
 */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e',
  'ё': 'yo', 'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k',
  'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
  'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
  'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': '', 'ы': 'i', 'ь': '',
  'э': 'e', 'ю': 'yu', 'я': 'ya',
  'ў': 'o', 'қ': 'q', 'ғ': 'g', 'ҳ': 'h',
};

/**
 * Converts Cyrillic Uzbek text to Latin equivalent.
 */
export function cyrillicToLatin(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join('');
}

/**
 * Generates a searchable name from input text.
 * Steps:
 * 1. Convert to lowercase
 * 2. Convert Cyrillic to Latin
 * 3. Normalize x/h → h
 * 4. Keep only alphanumeric characters
 *
 * Used for Books and Authors to enable fast search.
 */
export function generateSearchableName(...parts: (string | null | undefined)[]): string {
  const combined = parts.filter(Boolean).join(' ');

  return cyrillicToLatin(combined)
    .replace(/x/g, 'h')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Capitalizes the first letter of a string.
 * Used for firstName, lastName normalization.
 */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
