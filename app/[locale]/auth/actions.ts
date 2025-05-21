"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { Owner } from "@/types"

export async function login(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const redirectTo = (formData.get("redirectTo") as string) || "/"

  const { error, data: sessionData } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error("Login error:", error)
    redirect(`/auth?error=${encodeURIComponent(error.message)}`)
  }

  (await cookieStore).set("user_id", sessionData.user.id, {
    path: "/",
    sameSite: "lax",
  })

  revalidatePath("/", "layout")
  redirect(redirectTo)
}

export async function signup(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = (formData.get("full-name") as string) || ""

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/confirm`,
    },
  })

  if (authError) {
    console.error("Signup error:", authError)
    redirect(`/auth?error=${encodeURIComponent(authError.message)}`)
  }

  if (authData.user) {
    const { error: insertError } = await supabase
      .from("users")
      .insert({
        email: email,
        full_name: fullName,
        auth_user_id: authData.user.id,
        role: Owner.USER,
      })

    if (insertError) {
      console.error("Error inserting user data:", insertError)

      await supabase.auth.admin.deleteUser(authData.user.id)

      redirect(`/auth?error=${encodeURIComponent("Failed to create user profile")}`)
    }
  }

  // Instead of redirecting, return a success response
  return { success: true, message: "Registration successful. Please check your email." }
}

export async function logout() {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/auth")
}
