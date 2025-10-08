import { spawnSync } from "child_process";
import { createAudioResource } from "@discordjs/voice";
import { Readable } from "stream";

export function playWithYtDlp(url: string) {
  console.log("🎵 URL 추출 중...");

  try {
    const result = spawnSync(
      "yt-dlp",
      [
        "-f",
        "bestaudio",
        "-o",
        "-",
        "--quiet",
        "--no-playlist",
        "--no-warnings",
        url,
      ],
      {
        maxBuffer: 1024 * 1024 * 20, // 최대 20MB
      }
    );

    // 프로세스 실행 에러
    if (result.error) {
      console.error("❌ yt-dlp 실행 실패:", result.error.message);
      throw new Error(`yt-dlp 실행 실패: ${result.error.message}`);
    }

    // yt-dlp 프로세스가 비정상 종료된 경우
    if (result.status !== 0) {
      const stderr = result.stderr?.toString() || "stderr 없음";
      console.error("⚠️ yt-dlp 프로세스 오류:", stderr);
      throw new Error(`yt-dlp 프로세스 실패: ${stderr}`);
    }

    const stdout = result.stdout;
    if (!stdout || stdout.length === 0) {
      throw new Error("오디오 스트림 데이터가 비어 있습니다.");
    }

    // Buffer → Readable 변환
    const readable = Readable.from(stdout);

    console.log("✅ 오디오 리소스 생성 완료");
    return createAudioResource(readable);
  } catch (err: any) {
    console.error("🚨 오디오 리소스 생성 실패:", err.message);
    throw err;
  }
}
