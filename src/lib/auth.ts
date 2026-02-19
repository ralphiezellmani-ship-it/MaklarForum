import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { UserRole } from "@/lib/types";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", authData.user.id)
    .single();

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
  };
}

export async function requireUser(nextPath = "/") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

export async function requireRole(role: UserRole, nextPath = "/") {
  const user = await requireUser(nextPath);
  if (user.role !== role) {
    redirect("/");
  }
  return user;
}
