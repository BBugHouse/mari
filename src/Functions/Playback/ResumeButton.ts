import { getPlayer } from "../../Util/playerRegistry";
import Button from "../../Structures/Button";
import { getResumeButton, RESUME_BUTTON_ID } from "../../Util/ComponentUtil";

const resumeButton = new Button(
  RESUME_BUTTON_ID,
  getResumeButton(),
  async function (bot, interaction) {
    if (!interaction.guildId) return;

    await interaction.deferUpdate();
    getPlayer(interaction.guildId)?.unpause();
  }
);

export default resumeButton;
