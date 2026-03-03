import { describe, it, expect, beforeEach } from "vitest";
import { useNotificationStore, type Notification } from "@/lib/store/useNotificationStore";

const makeNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: "n1",
  userId: "u1",
  type: "info",
  title: "Test",
  message: null,
  read: false,
  createdAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

describe("useNotificationStore", () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [], loading: true });
  });

  it("initial state has empty notifications and loading=true", () => {
    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([]);
    expect(state.loading).toBe(true);
  });

  it("setNotifications stores items and replaces existing ones", () => {
    const first = [makeNotification({ id: "a" })];
    useNotificationStore.getState().setNotifications(first);
    expect(useNotificationStore.getState().notifications).toEqual(first);

    const second = [makeNotification({ id: "b" }), makeNotification({ id: "c" })];
    useNotificationStore.getState().setNotifications(second);
    expect(useNotificationStore.getState().notifications).toEqual(second);
  });

  it("addNotification prepends a new notification", () => {
    const existing = makeNotification({ id: "existing" });
    useNotificationStore.getState().setNotifications([existing]);

    const added = makeNotification({ id: "new" });
    useNotificationStore.getState().addNotification(added);

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(2);
    expect(notifications[0].id).toBe("new");
    expect(notifications[1].id).toBe("existing");
  });

  it("markAsRead marks a specific notification as read", () => {
    useNotificationStore.getState().setNotifications([
      makeNotification({ id: "a", read: false }),
      makeNotification({ id: "b", read: false }),
    ]);

    useNotificationStore.getState().markAsRead("a");
    const { notifications } = useNotificationStore.getState();
    expect(notifications.find((n) => n.id === "a")!.read).toBe(true);
    expect(notifications.find((n) => n.id === "b")!.read).toBe(false);
  });

  it("markAllAsRead marks all notifications as read", () => {
    useNotificationStore.getState().setNotifications([
      makeNotification({ id: "a", read: false }),
      makeNotification({ id: "b", read: false }),
    ]);

    useNotificationStore.getState().markAllAsRead();
    const { notifications } = useNotificationStore.getState();
    expect(notifications.every((n) => n.read)).toBe(true);
  });

  it("removeNotification removes a notification by id", () => {
    useNotificationStore.getState().setNotifications([
      makeNotification({ id: "a" }),
      makeNotification({ id: "b" }),
    ]);

    useNotificationStore.getState().removeNotification("a");
    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].id).toBe("b");
  });

  it("setLoading toggles loading state", () => {
    useNotificationStore.getState().setLoading(false);
    expect(useNotificationStore.getState().loading).toBe(false);

    useNotificationStore.getState().setLoading(true);
    expect(useNotificationStore.getState().loading).toBe(true);
  });

  it("unreadCount returns correct count of unread notifications", () => {
    useNotificationStore.getState().setNotifications([
      makeNotification({ id: "a", read: false }),
      makeNotification({ id: "b", read: true }),
      makeNotification({ id: "c", read: false }),
    ]);

    expect(useNotificationStore.getState().unreadCount()).toBe(2);

    useNotificationStore.getState().markAllAsRead();
    expect(useNotificationStore.getState().unreadCount()).toBe(0);
  });
});
