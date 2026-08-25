import { useEffect, useState } from "react";

import { rpc } from "@/lib/db";

export type AppRole = "guardian" | "creator";

export async function hasRole(userId: string, role: AppRole): Promise<boolean> {
  const { data, error } = await rpc<boolean>("has_role", { _user_id: userId, _role: role });
  if (error) return false;
  return data === true;
}

export function useRole(userId: string | undefined, role: AppRole) {
  const [granted, setGranted] = useState<boolean | null>(null);
  useEffect(() => {
    if (!userId) {
      setGranted(false);
      return;
    }
    void hasRole(userId, role).then(setGranted);
  }, [userId, role]);
  return granted;
}
