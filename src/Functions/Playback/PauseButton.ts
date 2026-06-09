import { getPlayer } from "../../Util/playerRegistry";
import Button from "../../Structures/Button";
import { getPauseButton, PAUSE_BUTTON_ID } from "../../Util/ComponentUtil";

const pauseButton = new Button(PAUSE_BUTTON_ID, getPauseButton(), async function (
  bot,
  interaction
) {
  if (!interaction.guildId) return;

  await interaction.deferUpdate();
  getPlayer(interaction.guildId)?.pause();
});

export default pauseButton;
