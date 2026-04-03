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

function makeSpawnErrorMessage(command: string, error: NodeJS.ErrnoException) {
  if (error.code === "ENOENT") {
    return `${command} executable was not found. Install ${command} and make sure it is in PATH.`;
  }

  return `${command} failed to start: ${error.message}`;
}

async function getBestAudioFormat(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const ytDlp = resolveYtDlpCommand();
    const formatCheck = spawn(ytDlp.command, [
      ...ytDlp.prefixArgs,
      "--list-formats",
      "--no-playlist",
      "--quiet",
      url,
    ]);

    let output = "";
    let errorOutput = "";

    formatCheck.stdout.on("data", (data) => {
      output += data.toString();
    });

    formatCheck.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    formatCheck.on("close", (code) => {
      if (code !== 0) {
        console.log("Could not inspect formats, falling back to bestaudio:", errorOutput);
        resolve("bestaudio");
        return;
      }

      const audioFormats = [
        "bestaudio[ext=m4a]",
        "bestaudio[ext=webm]",
        "bestaudio[ext=mp3]",
        "bestaudio[ext=ogg]",
        "bestaudio",
        "best[height<=720]/bestaudio",
        "worstaudio",
      ];

      for (const format of audioFormats) {
        if (output.includes(format) || output.includes("audio only")) {
          resolve(format);
          return;
        }
      }

      resolve("bestaudio");
    });

    formatCheck.on("error", (err: NodeJS.ErrnoException) => {
      reject(new Error(makeSpawnErrorMessage(ytDlp.label, err)));
    });
  });
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
      const selectedFormat = await getBestAudioFormat(url);
      const ytDlp = resolveYtDlpCommand();
      const ytDlpProcess = spawn(ytDlp.command, [
        ...ytDlp.prefixArgs,
        "-f",
        selectedFormat,
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

      ytDlpProcess.stderr.on("data", (data) => {
        ytDlpError += data.toString();
      });

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

      ffmpegProcess.stdout.on("error", (err) => {
        failOnce(err);
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
