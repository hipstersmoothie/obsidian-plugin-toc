import {
  App,
  CachedMetadata,
  MarkdownView,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";
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
          .onChange((value: any) => {
            this.plugin.settings.listStyle = value;
            this.plugin.saveData(this.plugin.settings);
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
      .setName("Indent text")
      .setDesc("\\t - tabulation")
      .addText((text) =>
        text
          .setPlaceholder("\\t")
          .setValue(this.plugin.settings.indentText || "")
          .onChange((value) => {
            this.plugin.settings.indentText = value;
            this.plugin.saveData(this.plugin.settings);
          })
      );

    const linkMaskSettingItem = new Setting(containerEl)
      .setName("Link mask")
      .setDesc("Avaliable vars: {{indent}}, {{itemIndication}}, {{heading}}.");
		
	const defaultLinkMask = "{{indent}}{{itemIndication}} [[#{{heading}}]]";
	let resetLinkMaskBtn = null;
    linkMaskSettingItem.addText((input) =>
        input
          .setPlaceholder("{{indent}}{{itemIndication}} [[#{{heading}}]]")
          .setValue(this.plugin.settings.linkMask || "")
          .onChange((value) => {
            this.plugin.settings.linkMask = value;
            this.plugin.saveData(this.plugin.settings);
			
			if(!resetLinkMaskBtn){
			  resetLinkMaskBtn = linkMaskSettingItem.addExtraButton((btn) => 
				btn
				  .setTooltip("Default")
				  .setIcon("reset")
				  .onClick(() => {
					input.setValue(defaultLinkMask);		
					this.plugin.settings.linkMask = defaultLinkMask;
					this.plugin.saveData(this.plugin.settings);
				}));
			}
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

type GetSettings = (
  data: CachedMetadata,
  cursor: CodeMirror.Position
) => TableOfContentsPluginSettings;

interface TableOfContentsPluginSettings {
  listStyle: "bullet" | "number";
  minimumDepth: number;
  maximumDepth: number;
  title?: string;
  indentText?: string;
  linkMask?: string;
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
