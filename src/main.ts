import {
  App,
  CachedMetadata,
  MarkdownView,
  Plugin,
  PluginSettingTab,
  Setting,
ToggleComponent,
} from "obsidian";
import { createToc, getCurrentHeaderDepth } from "./create-toc";
import { TableOfContentsPluginSettings } from "./types";

export interface CursorPosition {
  line: number;
  ch: number;
}

class TableOfContentsSettingsTab extends PluginSettingTab {
  private readonly plugin: TableOfContentsPlugin;

  constructor(app: App, plugin: TableOfContentsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  public display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Table of Contents - Settings" });

    new Setting(containerEl)
      .setName("List Style")
      .setDesc("The type of list to render the table of contents as.")
      .addDropdown((dropdown) =>
        dropdown
          .setValue(this.plugin.settings.listStyle)
          .addOption("bullet", "Bullet")
          .addOption("number", "Number")
          .onChange((value) => {
            this.plugin.settings.listStyle = value as any;
            this.plugin.saveData(this.plugin.settings);
            this.display();
          })
      );

    new Setting(containerEl)
      .setName("Title")
      .setDesc("Optional title to put before the table of contents")
      .addText((text) =>
        text
          .setPlaceholder("**Table of Contents**")
          .setValue(this.plugin.settings.title || "")
          .onChange((value) => {
            this.plugin.settings.title = value;
            this.plugin.saveData(this.plugin.settings);
          })
      );

    new Setting(containerEl)
      .setName("Minimum Header Depth")
      .setDesc(
        "The lowest header depth to add to the table of contents. Defaults to 2"
      )
      .addSlider((text) =>
        text
          .setValue(this.plugin.settings.minimumDepth)
          .setDynamicTooltip()
          .setLimits(1, 6, 1)
          .onChange((value) => {
            this.plugin.settings.minimumDepth = value;
            this.plugin.saveData(this.plugin.settings);
          })
      );

    new Setting(containerEl)
      .setName("Maximum Header Depth")
      .setDesc(
        "The highest header depth to add to the table of contents. Defaults to 6"
      )
      .addSlider((text) =>
        text
          .setValue(this.plugin.settings.maximumDepth)
          .setDynamicTooltip()
          .setLimits(1, 6, 1)
          .onChange((value) => {
            this.plugin.settings.maximumDepth = value;
            this.plugin.saveData(this.plugin.settings);
          })
      );
    
    new Setting(containerEl)
      .setName("Use Markdown links")
      .setDesc("Auto-generate Markdown links, instead of the default WikiLinks")
      .addToggle((value) =>
        value.setValue(this.plugin.settings.useMarkdown).onChange((value) => {
          this.plugin.settings.useMarkdown = value;
          this.plugin.saveData(this.plugin.settings);
          if(!value) (githubSetting.components[0] as ToggleComponent).setValue(false)
          githubSetting.setDisabled(!value)
        })
      );
    
    const githubCompatDesc: DocumentFragment = new DocumentFragment()
    githubCompatDesc.appendText("Github generates section links differently than Obsidian, this setting uses ")
    githubCompatDesc.createEl('a', {href: "https://github.com/thlorenz/anchor-markdown-header", text: "anchor-markdown-header"})
    githubCompatDesc.appendText(" to generate the proper links.")

    const githubSetting = new Setting(containerEl)
      .setName("Github compliant Markdown section links")
      .setDesc(githubCompatDesc)
      .setDisabled(!this.plugin.settings.useMarkdown)
      .addToggle((value) =>
        value
          .setValue(this.plugin.settings.githubCompat ?? false)
          .setDisabled(!this.plugin.settings.useMarkdown)
          .onChange((value) => {
            this.plugin.settings.githubCompat = value;
            this.plugin.saveData(this.plugin.settings);
        })
      );
  }
}

type GetSettings = (
  data: CachedMetadata,
  cursor: CodeMirror.Position
) => TableOfContentsPluginSettings;

export default class TableOfContentsPlugin extends Plugin {
  public settings: TableOfContentsPluginSettings = {
    minimumDepth: 2,
    maximumDepth: 6,
    listStyle: "bullet",
    useMarkdown: false
  };

  public async onload(): Promise<void> {
    console.log("Load Table of Contents plugin");

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
        const currentHeaderDepth = getCurrentHeaderDepth(
          data.headings || [],
          cursor
        );
        const depth = Math.max(
          currentHeaderDepth + 1,
          this.settings.minimumDepth
        );

        return {
          ...this.settings,
          minimumDepth: depth,
          maximumDepth: depth,
        };
      }),
    });

    this.addSettingTab(new TableOfContentsSettingsTab(this.app, this));
  }

  private createTocForActiveFile = (
    settings: TableOfContentsPluginSettings | GetSettings = this.settings
  ) => () => {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (activeView && activeView.file) {
      const editor = activeView.sourceMode.cmEditor;
      const cursor = editor.getCursor();
      const data = this.app.metadataCache.getFileCache(activeView.file) || {};
      const toc = createToc(
        data,
        cursor,
        typeof settings === "function" ? settings(data, cursor) : settings
      );

      if (toc) {
        editor.replaceRange(toc, cursor);
      }
    }
  };
}
