import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  getVoiceConnection,
} from "@discordjs/voice";
import { getFirstMusics, playMusic, removeMusic } from "./Queue";
import {
  consumeSkipRequest,
  getLoopMode,
  resetRepeatOnce,
} from "./PlaybackState";

const players = new Map<string, AudioPlayer>();

export function getOrCreatePlayer(guildId: string) {
  let player = players.get(guildId);
  if (!player) {
    const connection = getVoiceConnection(guildId);
    if (!connection) throw new Error("No voice connection");
    player = createAudioPlayer();
    connection.subscribe(player); // ★ 최초 1회만
    players.set(guildId, player);

    player.on(AudioPlayerStatus.Idle, async () => {
      try {
        const music = await getFirstMusics(guildId);
        if (music) {
          const isSkip = consumeSkipRequest(guildId);
          const loopMode = getLoopMode(guildId);
          if (!isSkip && loopMode !== "continue") {
            if (loopMode === "repeat_once") resetRepeatOnce(guildId);
            await playMusic(guildId);
            return;
          }

          await removeMusic(guildId, music.id);
        }
      } catch (e) {
        console.error("AudioPlayer Idle 상태 처리 중 오류:", e);
      }
    });
    player.on("error", async (error: any) => {
      console.error("AudioPlayer 에러 발생:", error);
    });
  }
  return player;
}

export function getPlayer(guildId: string) {
  return players.get(guildId) ?? null;
}

export function removePlayer(guildId: string) {
  players.delete(guildId);
}
