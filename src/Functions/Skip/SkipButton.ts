import Button from "../../Structures/Button";
import { getSkipButton, SKIP_BUTTON_ID } from "../../Util/ComponentUtil";
import { skipMusic } from "../../Util/Queue";

const skipButton = new Button(SKIP_BUTTON_ID, getSkipButton(), async function (
  bot,
  interaction
) {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "서버에서만 사용할 수 있어!",
      flags: "Ephemeral",
    });
    return;
  }

  const member =
    interaction.guild?.members.cache.get(interaction.user.id) ??
    (await interaction.guild?.members.fetch(interaction.user.id).catch(() => null));

  if (!member?.voice.channelId) {
    await interaction.reply({
      content: "음성 채널에 들어와야 스킵할 수 있어!",
      flags: "Ephemeral",
    });
    return;
  }

  await interaction.deferReply({
    flags: "Ephemeral",
  });
  await skipMusic(interaction.guildId);
  await interaction.editReply({
    content: "스킵했어!",
  });
});

export default skipButton;
