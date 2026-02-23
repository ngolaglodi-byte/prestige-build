import { create } from "zustand";

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  createdAt: string;
};

type NotificationState = {
  notifications: Notification[];
  loading: boolean;
  setNotifications: (items: Notification[]) => void;
  addNotification: (item: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  setLoading: (v: boolean) => void;
  unreadCount: () => number;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: true,

  setNotifications: (items) => set({ notifications: items }),

  addNotification: (item) =>
    set((state) => ({
      notifications: [item, ...state.notifications],
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  setLoading: (v) => set({ loading: v }),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
