import { prisma } from "./Prisma";
import { bot } from "../../index";
import { TextChannel } from "discord.js";

export function upsertGuild(
  guildId: string,
  channelId: string,
  messageId: string
) {
  return prisma.guild.upsert({
    where: {
      id: guildId,
    },
    update: {
      channelId: channelId,
      messageId: messageId,
    },
    create: {
      id: guildId,
      channelId: channelId,
      messageId: messageId,
    },
  });
}

export async function getGuild(guildId: string) {
  const guild = await prisma.guild.findUnique({
    where: {
      id: guildId,
    },
    select: {
      id: true,
      channelId: true,
      messageId: true,
    },
  });
  if (!guild) {
    return null;
  }
  return guild;
}

export async function getMainMessage(guildId: string) {
  try {
    const guild = await getGuild(guildId);
    if (!guild) {
      console.log(`Guild not found: ${guildId}`);
      return null;
    }

    const channel = bot.guilds.cache
      .get(guildId)
      ?.channels.cache.get(guild.channelId);
    if (!channel) {
      console.log(`Channel not found: ${guild.channelId}`);
      return null;
    }

    if (!(channel instanceof TextChannel)) {
      console.log(`Channel is not a text channel: ${guild.channelId}`);
      return null;
    }

    return await channel.messages.fetch(guild.messageId);
  } catch (error) {
    console.error("getMainMessage 처리 중 오류 발생:", error);
    return null;
  }
}
