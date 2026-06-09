import { getPlayer } from "../../Util/playerRegistry";
import Button from "../../Structures/Button";
import {
  getMusicComponents,
  getPlayPauseButton,
  PLAY_PAUSE_BUTTON_ID,
} from "../../Util/ComponentUtil";
import { getLoopMode, isPaused, setPaused } from "../../Util/PlaybackState";
import { getMusics } from "../../Util/Queue";

const pauseButton = new Button(PLAY_PAUSE_BUTTON_ID, getPlayPauseButton(), async function (
  bot,
  interaction
) {
  if (!interaction.guildId) return;

  await interaction.deferUpdate();
  const paused = isPaused(interaction.guildId);
  const player = getPlayer(interaction.guildId);
  if (paused) {
    player?.unpause();
    setPaused(interaction.guildId, false);
  } else {
    player?.pause();
    setPaused(interaction.guildId, true);
  }

  await interaction.message.edit({
    components: getMusicComponents(
      await getMusics(interaction.guildId),
      getLoopMode(interaction.guildId),
      !paused
    ),
  });
});

export default pauseButton;
