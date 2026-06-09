import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from "discord.js";
import type { Music } from "@prisma/client";

export const SKIP_BUTTON_ID = "music_skip";
export const QUEUE_SELECT_ID = "music_queue_select";

export const getSkipButton = () =>
  new ButtonBuilder()
    .setCustomId(SKIP_BUTTON_ID)
    .setLabel("스킵")
    .setStyle(ButtonStyle.Secondary);

export const getQueueSelectMenu = (musics: Music[]) =>
  new StringSelectMenuBuilder()
    .setCustomId(QUEUE_SELECT_ID)
    .setPlaceholder("곡 리스트")
    .addOptions(
      musics.slice(0, 25).map((music, index) => ({
        label: `${index + 1}. ${music.title}`.slice(0, 100),
        description: `${music.authorName} - ${music.timestamp}`.slice(0, 100),
        value: String(index + 1),
      }))
    );

export const getMusicComponents = (musics: Music[]) => {
  const components = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(getSkipButton()),
  ];

  if (musics.length > 0) {
    return [
      ...components,
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        getQueueSelectMenu(musics)
      ),
    ];
  }

  return components;
};
