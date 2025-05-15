"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"

export async function login(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const redirectTo = (formData.get("redirectTo") as string) || "/"

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error("Login error:", error)
    redirect(`/auth?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath("/", "layout")
  redirect(redirectTo)
}

export async function signup(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    console.error("Signup error:", error)
    redirect(`/auth?error=${encodeURIComponent(error.message)}`)
  }

  // After signup, redirect to a confirmation page
  // The user will need to confirm their email
  revalidatePath("/", "layout")
  redirect("/auth/confirmation")
}

export async function logout() {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/")
}
