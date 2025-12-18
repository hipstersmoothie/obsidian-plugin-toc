export interface TableOfContentsPluginSettings {
  listStyle: "bullet" | "number";
  formatStyle: 'plain' | 'markdown' | 'wiki'
  minimumDepth: number;
  maximumDepth: number;
  title?: string;
  githubCompat?: boolean
}
