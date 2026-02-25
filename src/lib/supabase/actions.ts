import { createClient } from '@/lib/supabase/client'

// 1. Authentication: Sign Up
export async function signUpDepartment(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        department_id: 'ISE',
        college: 'MITM'
      }
    }
  })

  if (error) throw error
  return data
}

// 2. Authentication: Sign In
export async function signInAdmin(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error
  return data
}

export async function signOutAdmin() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Change password (for logged-in users)
export async function changePassword(newPassword: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

// Send password reset email (for login page "Forgot Password")
export async function resetPasswordForEmail(email: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  })
  if (error) throw error
}

// 3. Data Bridge: The missing function causing your error
export async function upsertTeacherData(teachers: any[]) {
  const supabase = createClient()

  const teacherPayload = teachers.map(t => ({
    name: t.name,
    email: t.email,
    department_id: 'ISE', // Matches the Auth metadata above
  }))

  const { data, error } = await supabase
    .from('teachers')
    .upsert(teacherPayload, { onConflict: 'email' })
    .select()

  if (error) throw error
  return data
}