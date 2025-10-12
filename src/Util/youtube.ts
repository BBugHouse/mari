import { spawnSync } from "child_process";
import { createAudioResource } from "@discordjs/voice";
import { Readable } from "stream";

export function playWithYtDlp(url: string) {
  console.log("🎵 URL 추출 중...");

  try {
    // 먼저 사용 가능한 포맷을 확인
    const formatCheck = spawnSync(
      "yt-dlp",
      ["--list-formats", "--no-playlist", url],
      {
        encoding: "utf8",
        maxBuffer: 1024 * 1024 * 5, // 5MB
      }
    );

    if (formatCheck.status !== 0) {
      console.error("⚠️ 포맷 확인 실패:", formatCheck.stderr?.toString());
      throw new Error(`포맷 확인 실패: ${formatCheck.stderr?.toString()}`);
    }

    // 오디오 포맷 우선순위 (bestaudio가 없을 경우 대체)
    const audioFormats = [
      "bestaudio[ext=m4a]",
      "bestaudio[ext=webm]",
      "bestaudio[ext=mp3]",
      "bestaudio",
      "best[height<=720]/bestaudio",
      "worstaudio",
    ];

    // 포맷 선택 로직
    let selectedFormat = "bestaudio";
    const availableFormats = formatCheck.stdout?.toString() || "";

    // bestaudio가 없으면 다른 오디오 포맷 시도
    if (
      !availableFormats.includes("bestaudio") &&
      !availableFormats.includes("audio only")
    ) {
      console.log(
        "⚠️ bestaudio 포맷을 사용할 수 없습니다. 대체 포맷을 시도합니다..."
      );
      selectedFormat = "best[height<=720]/bestaudio";
    }

    const result = spawnSync(
      "yt-dlp",
      [
        "-f",
        selectedFormat,
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

      // 포맷 오류인 경우 대체 포맷으로 재시도
      if (stderr.includes("Requested format is not available")) {
        console.log("🔄 대체 포맷으로 재시도합니다...");

        // 더 관대한 포맷 선택으로 재시도
        const fallbackResult = spawnSync(
          "yt-dlp",
          [
            "-f",
            "best[height<=480]/bestaudio/worst",
            "-o",
            "-",
            "--quiet",
            "--no-playlist",
            "--no-warnings",
            url,
          ],
          {
            maxBuffer: 1024 * 1024 * 20,
          }
        );

        if (fallbackResult.status === 0) {
          console.log("✅ 대체 포맷으로 성공적으로 다운로드되었습니다");
          const readable = Readable.from(fallbackResult.stdout);
          return createAudioResource(readable);
        }
      }

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
