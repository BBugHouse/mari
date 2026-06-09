import { fork, type ChildProcess } from "child_process";
import path from "path";

type SearchResult = {
  title: string;
  url: string;
  timestamp: string;
  authorName: string;
  thumbnail: string;
};

type SearchResponse = {
  id: number;
  video?: SearchResult;
  error?: string;
};

const SEARCH_TIMEOUT_MS = 15_000;

let worker: ChildProcess | null = null;
let requestId = 0;
const pendingSearches = new Map<
  number,
  {
    resolve: (video: SearchResult | null) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }
>();

function rejectPendingSearches(error: Error) {
  for (const [id, pending] of pendingSearches) {
    clearTimeout(pending.timeout);
    pending.reject(error);
    pendingSearches.delete(id);
  }
}

function getWorker() {
  if (worker?.connected) return worker;

  worker = fork(path.join(__dirname, "../Workers/YtSearchWorker.ts"), {
    execArgv: ["-r", "ts-node/register", "-r", "tsconfig-paths/register"],
  });

  worker.on("message", (response: SearchResponse) => {
    const pending = pendingSearches.get(response.id);
    if (!pending) return;

    clearTimeout(pending.timeout);
    pendingSearches.delete(response.id);

    if (response.error) {
      pending.reject(new Error(response.error));
      return;
    }

    pending.resolve(response.video ?? null);
  });

  worker.on("exit", () => {
    worker = null;
    rejectPendingSearches(new Error("YouTube search worker exited."));
  });

  worker.on("error", (error) => {
    worker = null;
    rejectPendingSearches(error);
  });

  return worker;
}

export function searchFirstVideo(query: string): Promise<SearchResult | null> {
  const id = ++requestId;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingSearches.delete(id);
      reject(new Error("YouTube search timed out."));
    }, SEARCH_TIMEOUT_MS);

    pendingSearches.set(id, {
      resolve,
      reject,
      timeout,
    });

    getWorker().send({
      id,
      query,
    });
  });
}
