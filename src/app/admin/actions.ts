"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endSession, isAdmin, passwordMatches, startSession } from "@/lib/auth";
import { updateNotes } from "@/lib/store";

export async function login(_: string | null, form: FormData) {
  if (!passwordMatches(String(form.get("password") ?? ""))) return "Wrong password.";
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin");
}

export async function saveNotes(id: string, form: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  await updateNotes(id, String(form.get("notes") ?? "").slice(0, 5000));
  revalidatePath(`/admin/${id}`);
  revalidatePath("/admin");
}
