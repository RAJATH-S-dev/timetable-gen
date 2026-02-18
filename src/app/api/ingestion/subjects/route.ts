import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/ingestion/subjects — fetch all subjects for MIT-ISE
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('department_id', 'MIT-ISE')
      .order('semester', { ascending: true })
      .order('code',     { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ subjects: data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST /api/ingestion/subjects — parse CSV and return preview rows
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const text    = await file.text();
    const lines   = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    for (const col of ['code', 'title']) {
      if (!headers.includes(col))
        return NextResponse.json({ error: `Missing required column: "${col}"` }, { status: 400 });
    }

    const idx = (name: string, alt?: string) => {
      const i = headers.indexOf(name);
      return i >= 0 ? i : (alt ? headers.indexOf(alt) : -1);
    };

    const codeIdx     = idx('code');
    const titleIdx    = idx('title');
    const creditsIdx  = idx('weekly_credits', 'credits');
    const roomIdx     = idx('preferred_room_type', 'room_type');
    const lectureIdx  = idx('lecture_hours');
    const tutorialIdx = idx('tutorial_hours');
    const practicalIdx= idx('practical_hours');
    const semesterIdx = idx('semester');

    const rows = lines.slice(1)
      .map(line => {
        const cols     = line.split(',').map(c => c.trim());
        const roomRaw  = roomIdx >= 0 ? (cols[roomIdx] ?? 'Lecture') : 'Lecture';
        const roomNorm = roomRaw.toLowerCase().includes('lab')     ? 'Lab'
                       : roomRaw.toLowerCase().includes('seminar') ? 'Seminar Hall'
                       : 'Lecture';
        const l = lectureIdx  >= 0 ? parseInt(cols[lectureIdx]  ?? '0') : 0;
        const t = tutorialIdx >= 0 ? parseInt(cols[tutorialIdx] ?? '0') : 0;
        const p = practicalIdx>= 0 ? parseInt(cols[practicalIdx]?? '0') : 0;
        return {
          code:                cols[codeIdx]  ?? '',
          title:               cols[titleIdx] ?? '',
          lecture_hours:       l,
          tutorial_hours:      t,
          practical_hours:     p,
          weekly_credits:      creditsIdx >= 0 ? parseInt(cols[creditsIdx] ?? '3') : (l + t + Math.floor(p/2)) || 3,
          preferred_room_type: roomNorm,
          semester:            semesterIdx >= 0 ? parseInt(cols[semesterIdx] ?? '1') : 1,
          department_id:       'MIT-ISE',
          is_elective:         false,
          scheme:              'VTU-2022',
        };
      })
      .filter(r => r.code && r.title);

    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
  }
}

// PUT /api/ingestion/subjects — upsert rows to Supabase
export async function PUT(request: NextRequest) {
  try {
    const { rows } = await request.json();
    if (!rows?.length) return NextResponse.json({ error: 'No data' }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase
      .from('subjects')
      .upsert(rows, { onConflict: 'code' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, inserted: rows.length });
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

// DELETE /api/ingestion/subjects — delete by id in body
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    const supabase = await createClient();
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}