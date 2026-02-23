"use client";

import { useEffect, useState } from "react";

interface UserRole {
  id: string;
  clerkId: string;
  role: string;
}

export function useUserRole() {
  const [user, setUser] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading, isAdmin: user?.role === "admin" };
}
