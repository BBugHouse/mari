import Button from "../../Structures/Button";
import {
  getLoopButton,
  getMusicComponents,
  LOOP_BUTTON_ID,
} from "../../Util/ComponentUtil";
import { isPaused, nextLoopMode } from "../../Util/PlaybackState";
import { getMusics } from "../../Util/Queue";

const loopButton = new Button(LOOP_BUTTON_ID, getLoopButton("continue"), async function (
  bot,
  interaction
) {
  if (!interaction.guildId) return;

  const loopMode = nextLoopMode(interaction.guildId);
  await interaction.deferUpdate();
  await interaction.message.edit({
    components: getMusicComponents(
      await getMusics(interaction.guildId),
      loopMode,
      isPaused(interaction.guildId)
    ),
  });
});

export default loopButton;
