import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getBuild } from "@/lib/build/buildPipeline";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string; buildId: string } }
) {
  try {
    await getCurrentUserId();
    const { buildId } = params;

    const build = getBuild(buildId);

    if (!build) {
      return Response.json({ error: "Build introuvable" }, { status: 404 });
    }

    // SSE stream of logs
    let logIndex = 0;

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        function sendLogs() {
          const logs = build!.logs;
          while (logIndex < logs.length) {
            const rawLine = logs[logIndex];
            const typeMatch = rawLine.match(/^\[(info|error|warn)\] /);
            const type = typeMatch ? typeMatch[1] : "info";
            const msg = typeMatch ? rawLine.slice(typeMatch[0].length) : rawLine;

            const data = JSON.stringify({ msg, type });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            logIndex++;
          }

          if (
            build!.status === "success" ||
            build!.status === "failed" ||
            build!.status === "cancelled"
          ) {
            // Flush remaining logs, then close
            controller.close();
          }
        }

        sendLogs();

        if (
          build!.status === "queued" ||
          build!.status === "building"
        ) {
          const interval = setInterval(() => {
            sendLogs();

            if (
              build!.status === "success" ||
              build!.status === "failed" ||
              build!.status === "cancelled"
            ) {
              clearInterval(interval);
            }
          }, 500);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return Response.json({ error: "Erreur interne" }, { status: 500 });
  }
}
