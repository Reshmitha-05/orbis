// Official GitHub Language Colors mapping for charts and pills
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Shell: '#89e051',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Scala: '#c22d40',
  Lua: '#000080',
  R: '#198CE7',
  Zig: '#ec915c',
  Default: '#567C8D',
};

export function getLanguageColor(language: string | null | undefined): string {
  if (!language) return LANGUAGE_COLORS.Default;
  return LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Default;
}
