import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/ingest/subjects/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ subject: data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// PATCH /api/ingest/subjects/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body     = await request.json();
    const supabase = await createClient();

    const { error } = await supabase
      .from('subjects')
      .update({
        code:                body.code,
        title:               body.title,
        lecture_hours:       body.lecture_hours,
        tutorial_hours:      body.tutorial_hours,
        practical_hours:     body.practical_hours,
        weekly_credits:      body.weekly_credits,
        preferred_room_type: body.preferred_room_type,
        semester:            body.semester,
        is_elective:         body.is_elective,
        scheme:              body.scheme,
      })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}