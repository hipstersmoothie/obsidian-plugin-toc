import { App, PluginSettingTab, Setting } from "obsidian";
import TableOfContentsPlugin from "./main";
import { ListStyleEnum } from "./types";

/**
 * Plugin settings.
 * 
 * @author Andrew Lisowski (source); dbarenholz (edits)
 */
export class TableOfContentsSettingsTab extends PluginSettingTab {
  private readonly plugin: TableOfContentsPlugin;
  
  constructor(app: App, plugin: TableOfContentsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  public display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Table of Contents - Settings" });

    // List Style dropdown
    new Setting(containerEl)
      .setName("List Style")
      .setDesc("The type of list to render the table of contents as.")
      .addDropdown((dropdown) =>
        dropdown
        .addOption("bullet", "Bullet")
        .addOption("number", "Number")
        .addOption("none", "None")
        .setValue(this.plugin.settings.listStyle)
        .onChange((value) => {
            const listStyle = value as string;

            if (ListStyleEnum.hasOwnProperty(listStyle)) {
              this.plugin.settings.listStyle = listStyle;
            } else {
              console.log(`Managed to set listSyle to an invalid value: ${value}. You broke the plugin, wooh!`);
            }

            this.plugin.saveData(this.plugin.settings);
          })
      );

    // Title text field
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

    // Minimum header depth slider
    new Setting(containerEl)
      .setName("Minimum Header Depth")
      .setDesc("The lowest header depth to add to the table of contents. Defaults to 2")
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
    
    // Maximum header depth slider
    new Setting(containerEl)
      .setName("Maximum Header Depth")
      .setDesc("The highest header depth to add to the table of contents. Defaults to 6")
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

    // Quoteblock toggle
    new Setting(containerEl)
      .setName("As quoteblock")
      .setDesc("Input TOC inside a quoteblock.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.isQuoted).onChange((value) => {
          this.plugin.settings.isQuoted = value;
          this.plugin.saveData(this.plugin.settings);
        });
      });
  }
}
