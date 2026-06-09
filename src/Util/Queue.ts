import { prisma } from "./Prisma";
import { getMainMessage } from "./Util";
import {
  getVoiceConnection,
  VoiceConnectionConnectingState,
} from "@discordjs/voice";
import { getDefaultEmbed, getMusicEmbed } from "./EmbedUtil";
import { getMusicComponents } from "./ComponentUtil";
import { getLoopMode, isPaused, requestSkip, setPaused } from "./PlaybackState";
import { getOrCreatePlayer } from "./playerRegistry";
import { playWithYtDlp } from "./youtube";

export async function getMusics(guildId: string) {
  return prisma.music.findMany({
    where: {
      guildId: guildId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getFirstMusics(guildId: string) {
  return prisma.music.findFirst({
    where: {
      guildId: guildId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function addMusic(
  guildId: string,
  url: string,
  title: string,
  timestamp: string,
  authorName: string,
  thumbnail: string
) {
  try {
    const [musicCountBeforeAdd] = await prisma.$transaction([
      prisma.music.count({
        where: {
          guildId: guildId,
        },
      }),
      prisma.guild.update({
        where: {
          id: guildId,
        },
        data: {
          musics: {
            create: {
              title: title,
              url: url,
              timestamp: timestamp,
              authorName: authorName,
              thumbnail: thumbnail,
            },
          },
        },
        select: {
          id: true,
        },
      }),
    ]);
    if (musicCountBeforeAdd === 0) {
      await playMusic(guildId);
      console.log("Playing music");
    } else {
      const message = await getMainMessage(guildId);
      if (message) {
        await message.edit({
          components: getMusicComponents(
            await getMusics(guildId),
            getLoopMode(guildId),
            isPaused(guildId)
          ),
        });
      }
    }
  } catch (e: any) {
    console.log(e.message);
  }
}

export async function removeMusic(
  guildId: string,
  id: string,
  noPlay: boolean = false
) {
  try {
    await prisma.music.delete({
      where: {
        id: id,
      },
    });
    if (noPlay) return;
    if ((await getMusics(guildId)).length > 0) {
      await playMusic(guildId);
    } else {
      const message = await getMainMessage(guildId);
      if (message) {
        await message.edit({
          embeds: [getDefaultEmbed()],
          components: [],
          files: [],
        });
      }
    }
  } catch (error) {
    console.error("removeMusic 처리 중 오류 발생:", error);
  }
}

export async function skipMusic(guildId: string, id: number = 1) {
  const musics = await getMusics(guildId);
  if (musics.length === 0) return;
  if (id === 1) {
    requestSkip(guildId);
    await stopMusic(guildId);
    return;
  }
  if (id < 1 || id > musics.length) return;
  await removeMusic(guildId, musics[id - 1].id, true);
}

export async function stopMusic(guildId: string) {
  const connection = getVoiceConnection(guildId);
  if (!connection) return;
  const state = connection.state as VoiceConnectionConnectingState;
  if (!state.subscription) return;
  state.subscription.player.stop();
}

export async function playMusic(guildId: string) {
  try {
    const music = await getFirstMusics(guildId);
    if (!music) {
      console.log("No music found");
      return;
    }
    const player = getOrCreatePlayer(guildId);
    const connection = getVoiceConnection(guildId);
    if (!connection) {
      console.log("No connection found");
      return;
    }

    const resource = await playWithYtDlp(music.url);
    console.log("자료 생성 완료");

    setPaused(guildId, false);
    player.play(resource);
    console.log("플레이어 플레이");

    const message = await getMainMessage(guildId);
    if (message) {
      await message.edit({
        embeds: [
          getMusicEmbed(
            music.title,
            music.url,
            music.thumbnail,
            music.timestamp,
            music.authorName
          ),
        ],
        components: getMusicComponents(
          await getMusics(guildId),
          getLoopMode(guildId),
          isPaused(guildId)
        ),
        files: [],
      });
    }
  } catch (error) {
    console.error("playMusic 처리 중 오류 발생:", error);
  }
}
