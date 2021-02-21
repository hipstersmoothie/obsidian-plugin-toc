import {
  App,
  MarkdownView,
  Plugin,
  PluginManifest,
  PluginSettingTab,
  Setting,
} from "obsidian";
import * as prettier from "prettier";
import markdown from "prettier/parser-markdown";

export interface CursorPosition {
  line: number;
  ch: number;
}

const positionToCursorOffset = (
  code: string,
  { line, ch }: CursorPosition
): number => {
  return code.split("\n").reduce((pos, currLine, index) => {
    if (index < line) {
      return pos + currLine.length + 1;
    }

    if (index === line) {
      return pos + ch;
    }

    return pos;
  }, 0);
};

const cursorOffsetToPosition = (
  code: string,
  cursorOffset: number
): CursorPosition => {
  const substring = code.slice(0, cursorOffset);
  const line = substring.split("\n").length - 1;
  const indexOfLastLine = substring.lastIndexOf("\n");

  return {
    line,
    ch: cursorOffset - indexOfLastLine - 1,
  };
};

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

const getDepth = (header: string) => {
  const [hashes] = header.split(" ");
  return hashes.length;
};

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
          const position = positionToCursorOffset(text, cursor);
          const precedingText = text.slice(0, position);
          const lines = precedingText.split("\n").reverse();
          const HEADER_REGEX = new RegExp(
            `^[#]{${this.settings.minimumDepth},${this.settings.maximumDepth}} `
          );
          let currentDepth = this.settings.minimumDepth - 1;

          for (const line of lines) {
            if (line.match(HEADER_REGEX)) {
              currentDepth = getDepth(line);
              break;
            }
          }

          const afterText = text.slice(position).split("\n");
          const headers: string[] = [];

          for (const line of afterText) {
            if (line.match(HEADER_REGEX)) {
              const depth = getDepth(line);

              if (depth < currentDepth) {
                break;
              }

              headers.push(line);
            }
          }

          if (!headers.length) {
            return;
          }

          const minimumDepth = headers[0].split(" ").length;
          const links = headers.map((header) => {
            const [hashes, ...words] = header.split(" ");
            const indent = new Array(Math.max(0, hashes.length - minimumDepth))
              .fill("\t")
              .join("");
            const title = words.join(" ");
            const itemIndication =
              (this.settings.listStyle === "number" && "1.") || "-";

            return `${indent}${itemIndication} [[${
              this.app.workspace.getActiveFile()?.name
            }#${title}|${title}]]`;
          });

          editor.replaceRange(
            `${
              this.settings.title ? `${this.settings.title}\n\n` : ""
            }${links.join("\n")}`,
            cursor
          );
        }
      },
    });

    this.addSettingTab(new TableOfContentsSettingsTab(this.app, this));
  }
}
