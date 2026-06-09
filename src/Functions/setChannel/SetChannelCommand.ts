import { SlashCommandBuilder, TextChannel } from "discord.js";
import SlashCommand from "../../Structures/SlashCommand";
import { getDefaultEmbed, getColorEmbed } from "../../Util/EmbedUtil";
import { upsertGuild } from "../../Util/Util";

const slashCommand = new SlashCommandBuilder()
  .setName("봇채널설정")
  .setDescription("내가 노래할 채널을 설정할 수 있어!")
  .addChannelOption((option) =>
    option.setName("channel").setDescription("채널을 골라줘!").setRequired(true)
  );

const setChannelCommand = new SlashCommand(slashCommand, async function (
  bot,
  interaction
) {
  const channel = interaction.options.getChannel("channel");
  if (!(channel instanceof TextChannel)) {
    await interaction.reply({
      embeds: [getColorEmbed().setTitle("채팅 채널로만 골라줘!")],
      flags: "Ephemeral",
    });
    return;
  }
  if (!interaction.guildId) {
    await interaction.reply({
      embeds: [getColorEmbed().setTitle("서버에서만 사용할 수 있어!")],
      flags: "Ephemeral",
    });
    return;
  }
  const embed = getDefaultEmbed();
  const message = await channel.send({
    embeds: [embed],
  });
  const messageId = message.id;
  await upsertGuild(interaction.guildId, channel.id, messageId);
  await interaction.reply({
    embeds: [
      getColorEmbed()
        .setTitle("채널이 설정되었어!")
        .setDescription(`${channel.name} 채널에서 보자!`),
    ],
    flags: "Ephemeral",
  });
});

export default setChannelCommand;
