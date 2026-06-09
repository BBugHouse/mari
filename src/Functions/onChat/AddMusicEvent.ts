import Event from "@/Structures/Event";
import { Message, TextChannel } from "discord.js";
import { getFailEmbed } from "@/Util/EmbedUtil";
import { addMusic, skipMusic } from "@/Util/Queue";
import {
  getVoiceConnection,
  joinVoiceChannel,
} from "@discordjs/voice";
import { getGuild } from "@/Util/Util";
import { searchFirstVideo } from "@/Util/YtSearchUtil";

const AddMusic = new Event("messageCreate", async function (
  bot,
  message: Message
) {
  // 채널 확인
  if (!message.guildId || !message.guild) return;
  if (!(message.channel instanceof TextChannel)) return;
  if (message.author.bot) return;
  const guildData = await getGuild(message.guildId);
  if (!guildData) return;
  if (message.channelId !== guildData.channelId) return;
  // 메세지 지우기
  await message.delete();
  // 음성 채널 확인
  const voiceChannel = message.member?.voice.channel;
  if (!voiceChannel) return;
  const song = message.content;
  // 스킵
  if (song.startsWith("!s")) {
    const number = song.split(" ")[1] || "1";
    if (isNaN(Number(number))) return;
    await skipMusic(message.guildId, Number(number));
    return;
  }

  /* const yt = await getYouTube();
  const videos = (
    await yt.search(song, {
      type: "video",
    })
  ).videos;

  if (!videos.length) {
    const res = await message.channel.send({
      content: message.author.toString(),
      embeds: [getFailEmbed()],
      files: [`${__dirname}/../../Image/sadmari.jpg`],
    });
    setTimeout(() => {
      res.delete();
    }, 1000 * 10);
    return;
  }

  const first = videos.first();
  first.
 */
  // 제목으로 찾기
  const video = await searchFirstVideo(song);
  if (!video) {
    const res = await message.channel.send({
      content: message.author.toString(),
      embeds: [getFailEmbed()],
      files: [`${__dirname}/../../Image/sadmari.jpg`],
    });
    setTimeout(() => {
      res.delete();
    }, 1000 * 10);
    return;
  }
  // 연결
  const connection = getVoiceConnection(message.guildId);
  if (!connection || connection.joinConfig.channelId !== voiceChannel.id) {
    joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guildId,
      adapterCreator: message.guild.voiceAdapterCreator,
    });
  }
  console.log(video.title);
  await addMusic(
    message.guildId,
    video.url,
    video.title,
    video.timestamp,
    video.authorName,
    video.thumbnail
  );
});

export default AddMusic;
