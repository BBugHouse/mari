import ytSearch from "yt-search";

type SearchRequest = {
  id: number;
  query: string;
};

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

process.on("message", async (request: SearchRequest) => {
  try {
    const videos = (await ytSearch(request.query)).videos;
    const video = videos[0];
    const response: SearchResponse = {
      id: request.id,
      video: video
        ? {
            title: video.title,
            url: video.url,
            timestamp: video.timestamp,
            authorName: video.author.name || "",
            thumbnail: video.thumbnail,
          }
        : undefined,
    };

    process.send?.(response);
  } catch (error: any) {
    process.send?.({
      id: request.id,
      error: error?.message || "Failed to search YouTube.",
    } satisfies SearchResponse);
  }
});
