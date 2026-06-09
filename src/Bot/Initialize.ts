import Bot from "./Bot";
import { readdirSync } from "fs";
import {
  ApplicationCommandDataResolvable,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Collection,
  ContextMenuCommandInteraction,
  Interaction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import Button from "../Structures/Button";
import SlashCommand from "../Structures/SlashCommand";
import Modal from "../Structures/Modal";
import SelectMenu from "../Structures/SelectMenu";
import Event from "../Structures/Event";
import ContextMenuCommand from "../Structures/ContextMenuCommand";

const slashCommands = new Collection<string, SlashCommand>();
const contextMenuCommands = new Collection<string, ContextMenuCommand>();
const buttons = new Collection<string, Button>();
const modals = new Collection<string, Modal>();
const selectMenus = new Collection<string, SelectMenu>();

export default function Initialize(bot: Bot): void {
  bot.on(
    "interactionCreate",
    async (interaction: Interaction): Promise<void> => {
      if (interaction instanceof ChatInputCommandInteraction) {
        const slashCommand: SlashCommand | undefined = slashCommands.get(
          interaction.commandName
        );
        if (slashCommand === undefined) return;
        slashCommand.onInteract(bot, interaction);
      } else if (interaction instanceof ContextMenuCommandInteraction) {
        const contextMenuCommand: ContextMenuCommand | undefined =
          contextMenuCommands.get(interaction.commandName);
        if (contextMenuCommand === undefined) return;
        contextMenuCommand.onInteract(bot, interaction);
      } else if (interaction instanceof ButtonInteraction) {
        const button: Button | undefined = buttons.get(interaction.customId);
        if (button === undefined) return;
        button.onInteract(bot, interaction);
      } else if (interaction instanceof ModalSubmitInteraction) {
        const modal: Modal | undefined = modals.get(interaction.customId);
        if (modal === undefined) return;
        modal.onInteract(bot, interaction);
      } else if (interaction instanceof StringSelectMenuInteraction) {
        const selectMenu: SelectMenu | undefined = selectMenus.get(
          interaction.customId
        );
        if (selectMenu === undefined) return;
        selectMenu.onInteract(bot, interaction);
      }
    }
  );
  const commandData: ApplicationCommandDataResolvable[] = [];
  bot.on("clientReady", () => {
    bot.application?.commands.cache.clear();
    bot.application?.commands.set(commandData);
  });
  readdirSync("./src/Functions")
    .filter((folderName) => !folderName.endsWith(".ts"))
    .forEach((folderName) => {
      readdirSync(`./src/Functions/${folderName}`)
        .filter((fileName) => fileName.endsWith(".ts"))
        .forEach((fileName) => {
          const file: Button | SlashCommand | Modal | SelectMenu | Event =
            require(`../Functions/${folderName}/${fileName}`).default;
          if (file instanceof Event) {
            bot.on(file.eventName, (...args) => file.onCall(bot, ...args));
          } else if (file instanceof SlashCommand) {
            slashCommands.set(file.slashCommand.name, file);
            commandData.push(file.slashCommand.toJSON());
          } else if (file instanceof ContextMenuCommand) {
            contextMenuCommands.set(file.contextMenuCommand.name, file);
            commandData.push(file.contextMenuCommand.toJSON());
          } else if (file instanceof Button) {
            buttons.set(file.customId, file);
          } else if (file instanceof Modal) {
            modals.set(file.customId, file);
          } else if (file instanceof SelectMenu) {
            selectMenus.set(file.customId, file);
          }
        });
    });
}
