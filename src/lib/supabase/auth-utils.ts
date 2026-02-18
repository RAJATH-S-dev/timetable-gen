// src/lib/supabase/auth-utils.ts
import { createClient } from './server';

export async function getAdminDepartment() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Unauthorized access.");

  // Retrieve the 'dept' key from user_metadata
  const departmentId = user.user_metadata?.dept;

  if (!departmentId) {
    throw new Error("Admin has no assigned department.");
  }

  return departmentId;
}