"use client";

export function PromoteButton({ clerkId }: { clerkId: string }) {
  async function handlePromote() {
    await fetch("/api/admin/promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerkId }),
    });
    window.location.reload();
  }

  return (
    <button
      onClick={handlePromote}
      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Promouvoir en admin
    </button>
  );
}

export function DemoteButton({ clerkId }: { clerkId: string }) {
  async function handleDemote() {
    await fetch("/api/admin/demote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerkId }),
    });
    window.location.reload();
  }

  return (
    <button
      onClick={handleDemote}
      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Retirer le rôle admin
    </button>
  );
}
