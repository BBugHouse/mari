import SelectMenu from "../../Structures/SelectMenu";
import {
  QUEUE_SELECT_ID,
  getMusicComponents,
  getQueueSelectMenu,
} from "../../Util/ComponentUtil";
import { getLoopMode, isPaused } from "../../Util/PlaybackState";
import { getMusics } from "../../Util/Queue";

const queueSelectMenu = new SelectMenu(
  QUEUE_SELECT_ID,
  getQueueSelectMenu([]),
  async function (bot, interaction) {
    if (!interaction.guildId) return;

    await interaction.deferUpdate();

    const musics = await getMusics(interaction.guildId);
    await interaction.message.edit({
      components:
        musics.length > 0
          ? getMusicComponents(
              musics,
              getLoopMode(interaction.guildId),
              isPaused(interaction.guildId)
            )
          : [],
    });
  }
);

export default queueSelectMenu;
