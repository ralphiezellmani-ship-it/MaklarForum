"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const blockedPersonalDomains = new Set([
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "yahoo.com",
  "live.com",
]);

export async function loginAction(_: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const next = String(formData.get("next") ?? "/");
  const portal = String(formData.get("portal") ?? "consumer");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (next === "/" || !next) {
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profile?.role === "agent") {
        redirect("/dashboard/maklare/profil");
      }
      if (profile?.role === "consumer") {
        redirect("/dashboard/konsument");
      }
      if (profile?.role === "admin") {
        redirect("/admin");
      }
    }

    if (portal === "agent") {
      redirect("/dashboard/maklare/profil");
    }
    redirect("/dashboard/konsument");
  }

  redirect(next);
}

export async function registerConsumerAction(_: { error?: string } | undefined, formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: "consumer",
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      role: "consumer",
      full_name: fullName,
      email,
      accepted_terms_at: new Date().toISOString(),
    });
  }

  redirect("/dashboard/konsument");
}

export async function registerAgentAction(_: { error?: string } | undefined, formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const firm = String(formData.get("firm") ?? "").trim();
  const fmiNumber = String(formData.get("fmi_number") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  const domain = email.split("@")[1] ?? "";
  if (!domain || blockedPersonalDomains.has(domain)) {
    return { error: "Mäklare måste registrera sig med företagsmail." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: "agent",
        full_name: fullName,
        firm,
        city,
        fmi_number: fmiNumber,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    const slug = `${fullName}-${city}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    await supabase.from("profiles").upsert({
      id: data.user.id,
      role: "agent",
      full_name: fullName,
      email,
      firm,
      city,
      fmi_number: fmiNumber,
      verification_status: "pending",
      profile_slug: slug,
      accepted_terms_at: new Date().toISOString(),
    });
  }

  redirect("/dashboard/maklare/profil");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
