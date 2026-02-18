import { createClient } from '@/lib/supabase/server';
import FacultyClient from './faculty-client';

export default async function FacultyPage() {
  const supabase = await createClient();

  const [{ data: faculty, error }, { data: subjects }] = await Promise.all([
    supabase
      .from('teachers')
      .select(`
        *,
        assignments: teacher_subject_assignments(
          subject: subjects(id, title, code)
        )
      `)
      .eq('department_id', 'MIT-ISE')
      .order('name'),

    supabase
      .from('subjects')
      .select('id, code, title, semester')
      .eq('department_id', 'MIT-ISE')
      .order('code'),
  ]);

  if (error) {
    console.error('[FacultyPage]', error.message);
  }

  return (
    <div style={{ fontFamily: "'Georgia', serif", maxWidth: 1100 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2D3436', margin: '0 0 4px' }}>
          Faculty Registry
        </h1>
        <p style={{ fontSize: 13, color: '#8B7D6B', margin: 0 }}>
          {(faculty?.length ?? 0)} teacher{(faculty?.length ?? 0) !== 1 ? 's' : ''} · ISE Department · Manage assignments and availability
        </p>
      </div>
      <FacultyClient
        faculty={(faculty as any) || []}
        subjects={subjects || []}
      />
    </div>
  );
}