import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

export const SKIP_BUTTON_ID = "music_skip";

export const getSkipButton = () =>
  new ButtonBuilder()
    .setCustomId(SKIP_BUTTON_ID)
    .setLabel("스킵")
    .setStyle(ButtonStyle.Secondary);

export const getMusicComponents = () => [
  new ActionRowBuilder<ButtonBuilder>().addComponents(getSkipButton()),
];
