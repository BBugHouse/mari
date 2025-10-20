import Event from "../../Structures/Event";
import { VoiceState } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { stopMusic } from "../../Util/Queue";
import { prisma } from "../../Util/Prisma";
import { getMainMessage } from "../../Util/Util";
import { getDefaultEmbed } from "../../Util/EmbedUtil";
import { removePlayer } from "../../Util/playerRegistry";

const VoiceStateUpdate = new Event("voiceStateUpdate", async function (
  bot,
  oldState: VoiceState,
  newState: VoiceState
) {
  // 서버가 아니면 무시
  if (!oldState.guild) return;

  // 봇이 나간 경우는 무시
  if (oldState.member?.user.bot) return;

  // 음성 채널에서 나간 경우 또는 다른 채널로 이동한 경우가 아니면 무시
  if (!oldState.channelId || oldState.channelId === newState.channelId) return;

  const voiceChannel = oldState.channel;
  if (!voiceChannel) return;

  // 봇이 해당 채널에 있는지 확인
  const botMember = oldState.guild.members.cache.get(bot.user?.id);
  if (!botMember || botMember.voice.channelId !== oldState.channelId) {
    return; // 봇이 해당 채널에 없으면 무시
  }

  // 채널에 남은 멤버 확인
  const members = voiceChannel.members;
  const humanMembers = members.filter((member) => !member.user.bot);

  // 사람이 있으면 무시
  if (humanMembers.size > 0) return;

  try {
    const message = await getMainMessage(oldState.guild.id);
    const connection = getVoiceConnection(oldState.guild.id);

    // 음악 중지
    await stopMusic(oldState.guild.id);

    // 큐 초기화
    prisma.music.deleteMany({
      where: {
        guildId: oldState.guild.id,
      },
    });

    // 메시지가 존재하는 경우에만 메시지 업데이트
    if (message) {
      await message.edit({
        embeds: [getDefaultEmbed()],
        files: [`${__dirname}/../../Image/mari.jpg`],
      });
    }

    // 봇 연결 해제
    connection?.destroy();
    removePlayer(oldState.guild.id);
  } catch (error) {
    console.error("VoiceStateUpdate 처리 중 오류 발생:", error);
  }
});

export default VoiceStateUpdate;
