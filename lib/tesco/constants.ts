export const TESCO_BASE = 'https://potravinydomov.itesco.sk';
export const TESCO_GROCERIES = `${TESCO_BASE}/groceries/sk-SK`;

export function tescoSearchUrl(query: string): string {
  return `${TESCO_GROCERIES}/search?query=${encodeURIComponent(query)}`;
}