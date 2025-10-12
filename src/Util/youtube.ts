import { spawn } from "child_process";
import { createAudioResource } from "@discordjs/voice";
import { Readable } from "stream";

// 사용 가능한 포맷을 확인하고 최적의 오디오 포맷을 선택하는 함수
async function getBestAudioFormat(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log("🔍 사용 가능한 포맷 확인 중...");

    const formatCheck = spawn("yt-dlp", [
      "--list-formats",
      "--no-playlist",
      "--quiet",
      url,
    ]);

    let output = "";
    let errorOutput = "";

    formatCheck.stdout?.on("data", (data) => {
      output += data.toString();
    });

    formatCheck.stderr?.on("data", (data) => {
      errorOutput += data.toString();
    });

    formatCheck.on("close", (code) => {
      if (code !== 0) {
        console.log("⚠️ 포맷 확인 실패, 기본 포맷 사용:", errorOutput);
        resolve("bestaudio");
        return;
      }

      // 오디오 포맷 우선순위 (품질 순)
      const audioFormats = [
        "bestaudio[ext=m4a]",
        "bestaudio[ext=webm]",
        "bestaudio[ext=mp3]",
        "bestaudio[ext=ogg]",
        "bestaudio",
        "best[height<=720]/bestaudio",
        "worstaudio",
      ];

      // 사용 가능한 포맷 중에서 가장 좋은 포맷 선택
      for (const format of audioFormats) {
        if (output.includes(format) || output.includes("audio only")) {
          console.log(`✅ 선택된 포맷: ${format}`);
          resolve(format);
          return;
        }
      }

      // fallback
      console.log("⚠️ 적합한 오디오 포맷을 찾지 못함, 기본값 사용");
      resolve("bestaudio");
    });

    formatCheck.on("error", (err) => {
      console.log("⚠️ 포맷 확인 중 오류, 기본 포맷 사용:", err.message);
      resolve("bestaudio");
    });
  });
}

export function playWithYtDlp(url: string): Promise<any> {
  console.log("🎵 URL 추출 중...");

  return new Promise(async (resolve, reject) => {
    try {
      // 먼저 최적의 포맷을 선택
      const selectedFormat = await getBestAudioFormat(url);

      // 선택된 포맷으로 yt-dlp 프로세스 생성
      const ytDlpProcess = spawn("yt-dlp", [
        "-f",
        selectedFormat,
        "-o",
        "-",
        "--quiet",
        "--no-playlist",
        "--no-warnings",
        url,
      ]);

      let errorData = "";

      // stderr 처리
      ytDlpProcess.stderr?.on("data", (data) => {
        errorData += data.toString();
      });

      // 프로세스 에러 처리
      ytDlpProcess.on("error", (err) => {
        console.error("❌ yt-dlp 실행 실패:", err.message);
        reject(new Error(`yt-dlp 실행 실패: ${err.message}`));
      });

      // 프로세스 종료 처리
      ytDlpProcess.on("exit", (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp 프로세스 실패: ${errorData}`));
        }
      });

      // stdout을 Readable 스트림으로 변환
      const readable = Readable.from(ytDlpProcess.stdout!);

      readable.on("error", (err) => {
        console.error("🚨 스트림 오류:", err.message);
        reject(err);
      });

      console.log("✅ 오디오 리소스 생성 완료");
      resolve(createAudioResource(readable));
    } catch (err: any) {
      console.error("🚨 오디오 리소스 생성 실패:", err.message);
      reject(err);
    }
  });
}
