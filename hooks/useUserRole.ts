"use client";

import { useEffect, useState } from "react";

interface UserRole {
  id: string;
  email: string;
  role: "ADMIN" | "AGENT";
  status: "ACTIVE" | "DISABLED" | "PENDING";
  name: string | null;
}

let cachedPromise: Promise<UserRole | null> | null = null;

function fetchUserRole(): Promise<UserRole | null> {
  // Only fetch in browser environment
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (!cachedPromise) {
    console.log("[UserRole] Fetching user role...");
    cachedPromise = fetch("/api/me")
      .then((res) => {
        console.log("[UserRole] Response status:", res.status);
        return res.ok ? res.json() : null;
      })
      .catch((err) => {
        console.error("[UserRole] Fetch error:", err);
        return null;
      });
  }
  return cachedPromise;
}

export function useUserRole() {
  const [user, setUser] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRole()
      .then((data) => {
        console.log("[UserRole] User loaded:", data?.id ?? "null");
        setUser(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return { user, loading, isAdmin: user?.role === "ADMIN" };
}

export function clearUserCache() {
  cachedPromise = null;
}
