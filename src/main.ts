import { MarkdownView, Plugin } from "obsidian";
import { createToc, getCurrentHeaderDepth } from "./create-toc";
import { DEFAULT_SETTINGS, GetSettings, TableOfContentsPluginSettings } from "./types";
import { TableOfContentsSettingsTab } from "./settingsTab";

/**
 * The plugin itself.
 * 
 * @author Andrew Lisowski (source); dbarenholz (edits)
 */
export default class TableOfContentsPlugin extends Plugin {
  public settings = DEFAULT_SETTINGS;

  public async onload(): Promise<void> {
    console.log("Load Table of Contents plugin.");

    this.settings = {
      ...this.settings,
      ...(await this.loadData()),
    };

    this.addCommand({
      id: "create-toc",
      name: "Create table of contents",
      callback: this.createTocForActiveFile(),
    });

    this.addCommand({
      id: "create-toc-next-level",
      name: "Create table of contents for next heading level",
      callback: this.createTocForActiveFile((data, cursor) => {
        const currentHeaderDepth = getCurrentHeaderDepth(data.headings || [], cursor);
        const depth = Math.max(currentHeaderDepth + 1, this.settings.minimumDepth);

        return {
          ...this.settings,
          minimumDepth: depth,
          maximumDepth: depth,
        };
      }),
    });

    this.addSettingTab(new TableOfContentsSettingsTab(this.app, this));
  }

  /**
   * Creates a TOC for current active file.
   * 
   * @param settings plugin settings
   * @returns Anonymous function
   */
  private createTocForActiveFile =
    (settings: TableOfContentsPluginSettings | GetSettings = this.settings) =>
    () => {
      const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

      if (activeView && activeView.file) {
        const editor = activeView.editor;
        const cursor = editor.getCursor();
        const data = this.app.metadataCache.getFileCache(activeView.file) || {};
        const toc = createToc(data, cursor, typeof settings === "function" ? settings(data, cursor) : settings);

        if (toc) {
          editor.replaceRange(toc, cursor);
        }
      }
    };
}
