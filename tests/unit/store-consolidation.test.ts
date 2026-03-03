import { describe, it, expect } from "vitest";

describe("lib/store index re-exports", () => {
  it("exports all client-side stores", async () => {
    const mod = await import("@/lib/store/index");
    expect(mod.useWorkspaceStore).toBeDefined();
    expect(mod.useNotificationStore).toBeDefined();
    expect(mod.useAIStore).toBeDefined();
    expect(mod.useAIPreviewStore).toBeDefined();
    expect(mod.useAIMultiPreviewStore).toBeDefined();
  });

  it("exports all feature stores", async () => {
    const mod = await import("@/lib/store/index");
    expect(mod.useFileTree).toBeDefined();
    expect(mod.useAiDiff).toBeDefined();
    expect(mod.useLogsStore).toBeDefined();
    expect(mod.useAiPanel).toBeDefined();
    expect(mod.useTabs).toBeDefined();
    expect(mod.useEditor).toBeDefined();
  });

  it("useNotificationStore manages notifications correctly", async () => {
    const { useNotificationStore } = await import(
      "@/lib/store/useNotificationStore"
    );
    const store = useNotificationStore.getState();

    store.setNotifications([]);
    expect(useNotificationStore.getState().notifications).toEqual([]);

    const notification = {
      id: "1",
      userId: "u1",
      type: "info",
      title: "Test",
      message: null,
      read: false,
      createdAt: new Date().toISOString(),
    };
    store.addNotification(notification);
    expect(useNotificationStore.getState().notifications).toHaveLength(1);

    store.markAsRead("1");
    expect(useNotificationStore.getState().notifications[0].read).toBe(true);
  });

  it("useWorkspaceStore manages files correctly", async () => {
    const { useWorkspaceStore } = await import(
      "@/lib/store/useWorkspaceStore"
    );
    const store = useWorkspaceStore.getState();

    store.setFiles({});
    expect(useWorkspaceStore.getState().files).toEqual({});

    store.updateFile("index.ts", "console.log('hello')");
    expect(useWorkspaceStore.getState().files["index.ts"].content).toBe(
      "console.log('hello')"
    );
  });

  it("useAIMultiPreviewStore manages previews correctly", async () => {
    const { useAIMultiPreviewStore } = await import(
      "@/lib/store/useAIMultiPreviewStore"
    );
    const store = useAIMultiPreviewStore.getState();

    store.clearPreviews();
    expect(useAIMultiPreviewStore.getState().previews).toEqual([]);

    store.showPreviews([{ file: "a.ts", newContent: "new code" }]);
    expect(useAIMultiPreviewStore.getState().previews).toHaveLength(1);

    store.clearPreviews();
    expect(useAIMultiPreviewStore.getState().previews).toEqual([]);
  });
});
