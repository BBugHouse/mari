export type LoopMode = "continue" | "repeat_once" | "repeat_always";

const loopModes = new Map<string, LoopMode>();
const skipRequests = new Set<string>();

export function getLoopMode(guildId: string): LoopMode {
  return loopModes.get(guildId) ?? "continue";
}

export function nextLoopMode(guildId: string): LoopMode {
  const current = getLoopMode(guildId);
  const next: LoopMode =
    current === "continue"
      ? "repeat_once"
      : current === "repeat_once"
        ? "repeat_always"
        : "continue";

  loopModes.set(guildId, next);
  return next;
}

export function resetRepeatOnce(guildId: string) {
  if (getLoopMode(guildId) === "repeat_once") {
    loopModes.set(guildId, "continue");
  }
}

export function requestSkip(guildId: string) {
  skipRequests.add(guildId);
}

export function consumeSkipRequest(guildId: string) {
  const hasRequest = skipRequests.has(guildId);
  skipRequests.delete(guildId);
  return hasRequest;
}

export function clearPlaybackState(guildId: string) {
  loopModes.delete(guildId);
  skipRequests.delete(guildId);
}
