import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "child_process";
import {
  createAudioResource,
  StreamType,
  type AudioResource,
} from "@discordjs/voice";
import ffmpegPath from "ffmpeg-static";

type CommandSpec = {
  command: string;
  prefixArgs: string[];
  label: string;
};

function resolveYtDlpCommand(): CommandSpec {
  const candidates: CommandSpec[] = process.platform === "win32"
    ? [
        { command: "yt-dlp.exe", prefixArgs: [], label: "yt-dlp" },
        { command: "yt-dlp", prefixArgs: [], label: "yt-dlp" },
        { command: "py", prefixArgs: ["-m", "yt_dlp"], label: "py -m yt_dlp" },
        {
          command: "python",
          prefixArgs: ["-m", "yt_dlp"],
          label: "python -m yt_dlp",
        },
      ]
    : [
        { command: "yt-dlp", prefixArgs: [], label: "yt-dlp" },
        { command: "python3", prefixArgs: ["-m", "yt_dlp"], label: "python3 -m yt_dlp" },
        { command: "python", prefixArgs: ["-m", "yt_dlp"], label: "python -m yt_dlp" },
      ];

  for (const candidate of candidates) {
    const result = spawnSync(candidate.command, [...candidate.prefixArgs, "--version"], {
      stdio: "ignore",
    });

    if (result.status === 0) {
      return candidate;
    }
  }

  return candidates[0];
}

const AUDIO_FORMAT = "bestaudio/best";

function makeSpawnErrorMessage(command: string, error: NodeJS.ErrnoException) {
  if (error.code === "ENOENT") {
    return `${command} executable was not found. Install ${command} and make sure it is in PATH.`;
  }

  return `${command} failed to start: ${error.message}`;
}

function isExpectedStreamClose(error: NodeJS.ErrnoException) {
  return error.code === "EPIPE" || error.code === "ERR_STREAM_PREMATURE_CLOSE";
}

function pipeToFfmpeg(
  ytDlpProcess: ChildProcessWithoutNullStreams
): ChildProcessWithoutNullStreams {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static could not resolve an ffmpeg binary.");
  }

  const ffmpegProcess = spawn(ffmpegPath, [
    "-loglevel",
    "error",
    "-analyzeduration",
    "0",
    "-i",
    "pipe:0",
    "-f",
    "s16le",
    "-ar",
    "48000",
    "-ac",
    "2",
    "pipe:1",
  ]);

  ytDlpProcess.stdout.pipe(ffmpegProcess.stdin);

  return ffmpegProcess;
}

export function playWithYtDlp(url: string): Promise<AudioResource> {
  return new Promise(async (resolve, reject) => {
    try {
      const ytDlp = resolveYtDlpCommand();
      const ytDlpProcess = spawn(ytDlp.command, [
        ...ytDlp.prefixArgs,
        "-f",
        AUDIO_FORMAT,
        "-o",
        "-",
        "--quiet",
        "--no-playlist",
        "--no-warnings",
        url,
      ]);

      let ytDlpError = "";
      let ffmpegError = "";
      let settled = false;

      const failOnce = (error: Error) => {
        if (settled) return;
        settled = true;
        ytDlpProcess.kill();
        reject(error);
      };

      const handleStreamError = (error: NodeJS.ErrnoException) => {
        if (isExpectedStreamClose(error)) return;
        failOnce(error);
      };

      ytDlpProcess.stderr.on("data", (data) => {
        ytDlpError += data.toString();
      });

      ytDlpProcess.stdout.on("error", handleStreamError);

      ytDlpProcess.on("error", (err: NodeJS.ErrnoException) => {
        failOnce(new Error(makeSpawnErrorMessage(ytDlp.label, err)));
      });

      ytDlpProcess.on("exit", (code) => {
        if (code !== 0 && !settled) {
          failOnce(
            new Error(
              `yt-dlp exited with code ${code}. ${ytDlpError || "No stderr output."}`
            )
          );
        }
      });

      const ffmpegProcess = pipeToFfmpeg(ytDlpProcess);

      ffmpegProcess.stderr.on("data", (data) => {
        ffmpegError += data.toString();
      });

      ffmpegProcess.stdin.on("error", handleStreamError);

      ffmpegProcess.on("error", (err: NodeJS.ErrnoException) => {
        failOnce(new Error(makeSpawnErrorMessage("ffmpeg", err)));
      });

      ffmpegProcess.on("exit", (code) => {
        if (code !== 0 && !settled) {
          failOnce(
            new Error(
              `ffmpeg exited with code ${code}. ${ffmpegError || "No stderr output."}`
            )
          );
        }
      });

      ffmpegProcess.stdout.on("error", handleStreamError);
      ffmpegProcess.stdout.on("close", () => {
        ytDlpProcess.stdout.unpipe(ffmpegProcess.stdin);
        if (!ytDlpProcess.killed) ytDlpProcess.kill();
      });

      settled = true;
      resolve(
        createAudioResource(ffmpegProcess.stdout, {
          inputType: StreamType.Raw,
        })
      );
    } catch (err: any) {
      reject(err);
    }
  });
}
