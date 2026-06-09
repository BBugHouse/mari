import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from "discord.js";
import type { Music } from "@prisma/client";
import type { LoopMode } from "./PlaybackState";

export const SKIP_BUTTON_ID = "music_skip";
export const PAUSE_BUTTON_ID = "music_pause";
export const RESUME_BUTTON_ID = "music_resume";
export const LOOP_BUTTON_ID = "music_loop";
export const QUEUE_SELECT_ID = "music_queue_select";

const loopLabels: Record<LoopMode, string> = {
  continue: "계속",
  repeat_once: "한번반복",
  repeat_always: "계속반복",
};

export const getSkipButton = () =>
  new ButtonBuilder()
    .setCustomId(SKIP_BUTTON_ID)
    .setLabel("스킵")
    .setStyle(ButtonStyle.Secondary);

export const getPauseButton = () =>
  new ButtonBuilder()
    .setCustomId(PAUSE_BUTTON_ID)
    .setLabel("일시정지")
    .setStyle(ButtonStyle.Danger);

export const getResumeButton = () =>
  new ButtonBuilder()
    .setCustomId(RESUME_BUTTON_ID)
    .setLabel("다시재생")
    .setStyle(ButtonStyle.Success);

export const getLoopButton = (loopMode: LoopMode) =>
  new ButtonBuilder()
    .setCustomId(LOOP_BUTTON_ID)
    .setLabel(`반복: ${loopLabels[loopMode]}`)
    .setStyle(ButtonStyle.Primary);

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

export const getMusicComponents = (
  musics: Music[],
  loopMode: LoopMode = "continue"
) => {
  const components = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      getSkipButton(),
      getPauseButton(),
      getResumeButton(),
      getLoopButton(loopMode)
    ),
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
