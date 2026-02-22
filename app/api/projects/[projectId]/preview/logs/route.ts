import { NextRequest } from "next/server";
import { getPreviewLogs } from "@/lib/preview/previewEngine";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const userId = await getCurrentUserId(req);
  const { projectId } = params;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      getPreviewLogs(userId, projectId, (msg, type) => {
        const data = JSON.stringify({ msg, type });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
    },
  });
}
