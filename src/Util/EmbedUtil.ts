import { EmbedBuilder } from "discord.js";

export const getColorEmbed = () => new EmbedBuilder().setColor("#cf85ff");

export const getDefaultEmbed = () =>
  getColorEmbed()
    .setTitle("🎤 노래 대기실")
    .setDescription(
      "듣고 싶은 곡 제목이나 유튜브 링크를 보내줘.\n재생 중에는 버튼으로 일시정지, 스킵, 반복을 조작할 수 있어."
    );

export const getFailEmbed = () =>
  getColorEmbed()
    .setTitle("Sorry! I can't find the song TwT")
    .setDescription("Can you try again?")
    .setImage("attachment://sadmari.jpg");

export const getMusicEmbed = (
  title: string,
  url: string,
  thumbnail: string,
  timestamp: string,
  author: string
) =>
  getColorEmbed()
    .setTitle(`🎤 노래 부르는중`)
    .setDescription(`[${title}](${url})`)
    .setThumbnail(thumbnail)
    .setFields([
      { name: "시간", value: timestamp, inline: true },
      { name: "채널", value: author, inline: true },
    ]);
