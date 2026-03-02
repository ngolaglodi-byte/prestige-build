import { NextRequest, NextResponse } from "next/server";
import {
  addComment,
  getComments,
  resolveComment,
  deleteComment,
  type Comment,
} from "@/lib/collaboration/comment-system";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, roomId, targetId, commentId, author, authorName, content } = body as {
      action: "add" | "list" | "resolve" | "delete";
      roomId: string;
      targetId: string;
      commentId?: string;
      author?: string;
      authorName?: string;
      content?: string;
    };

    if (!roomId || !targetId) {
      return NextResponse.json({ error: "roomId and targetId required" }, { status: 400 });
    }

    switch (action) {
      case "add": {
        if (!author || !content) {
          return NextResponse.json({ error: "author and content required" }, { status: 400 });
        }
        const comment: Comment = {
          id: crypto.randomUUID(),
          roomId,
          targetId,
          author,
          authorName: authorName ?? author,
          content,
          createdAt: Date.now(),
          resolved: false,
        };
        addComment(comment);
        return NextResponse.json({ comment });
      }
      case "list":
        return NextResponse.json({ comments: getComments(roomId, targetId) });
      case "resolve": {
        if (!commentId) {
          return NextResponse.json({ error: "commentId required" }, { status: 400 });
        }
        const resolved = resolveComment(roomId, targetId, commentId);
        return NextResponse.json({ success: resolved });
      }
      case "delete": {
        if (!commentId) {
          return NextResponse.json({ error: "commentId required" }, { status: 400 });
        }
        const deleted = deleteComment(roomId, targetId, commentId);
        return NextResponse.json({ success: deleted });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
