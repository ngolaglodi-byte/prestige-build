"use client";

import { useEffect, useState } from "react";

interface UserRole {
  id: string;
  clerkId: string;
  role: string;
}

let cachedPromise: Promise<UserRole | null> | null = null;

function fetchUserRole(): Promise<UserRole | null> {
  if (!cachedPromise) {
    cachedPromise = fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return cachedPromise;
}

export function useUserRole() {
  const [user, setUser] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRole()
      .then((data) => setUser(data))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading, isAdmin: user?.role === "admin" };
}
