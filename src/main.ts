import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from "obsidian";
import { createToc, getCurrentHeaderDepth } from "./create-toc";

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
            this.plugin.settings.minimumDepth = value;
            this.plugin.saveData(this.plugin.settings);
          })
      );
  }
}

interface TableOfContentsPluginSettings {
  listStyle: "bullet" | "number";
  minimumDepth: number;
  maximumDepth: number;
  title?: string;
}

export default class TableOfContentsPlugin extends Plugin {
  public settings: TableOfContentsPluginSettings = {
    minimumDepth: 2,
    maximumDepth: 6,
    listStyle: "bullet",
  };

  public async onload(): Promise<void> {
    console.log("Load Table of Contents plugin");

    this.settings = {
      ...this.settings,
      ...(await this.loadData()),
    };
    this.saveData(this.settings);

    this.addCommand({
      id: "create-toc",
      name: "Create table of contents",
      callback: () => {
        const activeLeaf = this.app.workspace.activeLeaf;

        if (activeLeaf.view instanceof MarkdownView) {
          const editor = activeLeaf.view.sourceMode.cmEditor;
          const text = editor.getValue();
          const cursor = editor.getCursor();
          const filename = this.app.workspace.getActiveFile();

          if (!filename) {
            return;
          }

          const toc = createToc(text, cursor, this.settings);

          if (toc) {
            editor.replaceRange(toc, cursor);
          }
        }
      },
    });

    this.addCommand({
      id: "create-toc-next-level",
      name: "Create table of contents for next heading level",
      callback: () => {
        const activeLeaf = this.app.workspace.activeLeaf;

        if (activeLeaf.view instanceof MarkdownView) {
          const editor = activeLeaf.view.sourceMode.cmEditor;
          const text = editor.getValue();
          const cursor = editor.getCursor();
          const filename = this.app.workspace.getActiveFile();

          if (!filename) {
            return;
          }

          const currentHeaderDepth = getCurrentHeaderDepth(text, cursor);
          const toc = createToc(text, cursor, {
            ...this.settings,
            maximumDepth: currentHeaderDepth + 1,
          });

          if (toc) {
            editor.replaceRange(toc, cursor);
          }
        }
      },
    });

    this.addSettingTab(new TableOfContentsSettingsTab(this.app, this));
  }
}
