import { supabase } from '../lib/supabase'

export type Role = 'AGENTE' | 'CLIENTE' | 'ADMINISTRADOR'

export type UserProfile = {
  id: string
  username: string
  role: Role
}

export type User = {
  id: string
  username: string
  role: Role
}

const STORAGE_KEY = 'eco_ticket_user'

export async function login(email: string, password: string): Promise<User | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return null
  }

  // Fetch the role from the profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, username')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching user profile:', profileError)
    return null
  }

  const loggedUser: User = {
    id: data.user.id,
    username: profile.username || data.user.email,
    role: profile.role as Role,
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser))
  window.dispatchEvent(new Event('auth-change'))

  return loggedUser
}

export async function logout() {
  await supabase.auth.signOut()
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('auth-change'))
}

export async function getCurrentUser(): Promise<User | null> {
  const storedUser = localStorage.getItem(STORAGE_KEY)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser) as User
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null
}
