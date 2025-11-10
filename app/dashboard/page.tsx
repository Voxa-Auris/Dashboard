import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import ClientDashboard from '@/components/dashboard/ClientDashboard'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // If no profile exists, sign out and redirect to login
    await supabase.auth.signOut()
    redirect('/login')
  }

  // Render appropriate dashboard based on role
  if (profile.role === 'admin') {
    return <AdminDashboard user={user} profile={profile} />
  } else {
    return <ClientDashboard user={user} profile={profile} />
  }
}
