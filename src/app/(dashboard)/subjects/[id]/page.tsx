"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface Subject {
  id: string;
  code: string;
  title: string;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  weekly_credits: number;
  preferred_room_type: string;
  semester: number;
  is_elective: boolean;
  scheme: string;
  department_id: string;
}

function computeCredits(l: number, t: number, p: number): number {
  return l + t + Math.floor(p / 2);
}

const ROOM_TYPES = ["Lecture", "Lab", "Seminar Hall"];

export default function SubjectEditPage() {
  const router = useRouter();
  const params = useParams();
  const id     = params?.id as string;

  const [subject,  setSubject]  = useState<Subject | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/ingestion/subjects/${id}`)
      .then(r => r.json())
      .then(d => { setSubject(d.subject); setLoading(false); })
      .catch(() => { setError("Failed to load subject"); setLoading(false); });
  }, [id]);

  function update(field: keyof Subject, val: any) {
    if (!subject) return;
    setSubject(s => s ? { ...s, [field]: val } : s);
  }

  async function handleSave() {
    if (!subject) return;
    setSaving(true);
    setError(null);
    try {
      const credits  = computeCredits(subject.lecture_hours, subject.tutorial_hours, subject.practical_hours);
      const roomType = subject.practical_hours > 0 ? "Lab" : subject.preferred_room_type;
      const payload  = { ...subject, weekly_credits: credits, preferred_room_type: roomType };

      const res  = await fetch(`/api/ingestion/subjects/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
      setTimeout(() => router.push("/subjects"), 1000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const inp: React.CSSProperties = {
    border: "1px solid #C8C0A8", borderRadius: 4, padding: "8px 12px",
    fontSize: 13, background: "#FFFDF5", color: "#2D3436", width: "100%",
    fontFamily: "'Georgia', serif",
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#8B7D6B", fontFamily: "Georgia" }}>Loading…</div>;
  if (!subject) return <div style={{ padding: 40, textAlign: "center", color: "#C0392B", fontFamily: "Georgia" }}>Subject not found</div>;

  const liveCredits = computeCredits(subject.lecture_hours, subject.tutorial_hours, subject.practical_hours);

  return (
    <div style={{ minHeight: "100vh", background: "#F0EBE0", padding: "32px 24px", fontFamily: "'Georgia', serif" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <button onClick={() => router.push("/subjects")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#2D3436" }}>←</button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#2D3436", margin: 0 }}>Edit Subject</h1>
            <p style={{ fontSize: 12, color: "#8B7D6B", margin: 0, fontFamily: "monospace" }}>{subject.code}</p>
          </div>
        </div>

        {error   && <div style={{ background: "#FFF0EF", border: "1px solid #FF7675", borderRadius: 4, padding: "10px 14px", fontSize: 12, color: "#C0392B", marginBottom: 16 }}>{error}</div>}
        {success && <div style={{ background: "#F0FFF4", border: "1px solid #68D391", borderRadius: 4, padding: "10px 14px", fontSize: 12, color: "#27AE60", marginBottom: 16 }}>✓ Saved — redirecting…</div>}

        {/* Main card */}
        <div style={{ background: "#FFFDF5", border: "1.5px solid #C8C0A8", borderRadius: 4, padding: 28 }}>

          {/* Basic info */}
          <section style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 14px", borderBottom: "1px solid #E2D9C5", paddingBottom: 6 }}>Basic Information</p>
            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", display: "block", marginBottom: 5 }}>SUBJECT CODE</label>
                <input style={inp} value={subject.code} onChange={e => update("code", e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", display: "block", marginBottom: 5 }}>TITLE</label>
                <input style={inp} value={subject.title} onChange={e => update("title", e.target.value)} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", display: "block", marginBottom: 5 }}>SCHEME</label>
                <input style={inp} value={subject.scheme} onChange={e => update("scheme", e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", display: "block", marginBottom: 5 }}>DEPARTMENT</label>
                <input style={{ ...inp, background: "#F0EBE0", color: "#8B7D6B" }} value={subject.department_id} readOnly />
              </div>
            </div>
          </section>

          {/* L-T-P */}
          <section style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 14px", borderBottom: "1px solid #E2D9C5", paddingBottom: 6 }}>
              L - T - P  (Hours per Week)
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 14, alignItems: "end" }}>
              {[
                { label: "LECTURE (L)", field: "lecture_hours" as keyof Subject },
                { label: "TUTORIAL (T)", field: "tutorial_hours" as keyof Subject },
                { label: "PRACTICAL (P)", field: "practical_hours" as keyof Subject },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#2D3436", display: "block", marginBottom: 5 }}>{label}</label>
                  <input type="number" min={0} max={8} style={{ ...inp, textAlign: "center" }}
                    value={subject[field] as number}
                    onChange={e => update(field, parseInt(e.target.value) || 0)} />
                </div>
              ))}
              <div style={{ background: "#2D3436", borderRadius: 4, padding: "10px 16px", textAlign: "center", minWidth: 80 }}>
                <div style={{ fontSize: 9, color: "#C8C0A8", fontWeight: 600, marginBottom: 2 }}>CREDITS</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#FFFDF5", lineHeight: 1 }}>{liveCredits}</div>
                <div style={{ fontSize: 9, color: "#8B7D6B", marginTop: 2 }}>L+T+(P÷2)</div>
              </div>
            </div>
            <p style={{ fontSize: 10, color: "#8B7D6B", marginTop: 8 }}>
              {subject.lecture_hours}-{subject.tutorial_hours}-{subject.practical_hours} (L-T-P) · {liveCredits} credits
            </p>
          </section>

          {/* Settings */}
          <section style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 14px", borderBottom: "1px solid #E2D9C5", paddingBottom: 6 }}>Settings</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", display: "block", marginBottom: 5 }}>ROOM TYPE</label>
                <select style={inp} value={subject.practical_hours > 0 ? "Lab" : subject.preferred_room_type}
                  disabled={subject.practical_hours > 0}
                  onChange={e => update("preferred_room_type", e.target.value)}>
                  {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                {subject.practical_hours > 0 && <p style={{ fontSize: 9, color: "#8B7D6B", marginTop: 3 }}>Auto-set to Lab (P &gt; 0)</p>}
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", display: "block", marginBottom: 5 }}>SEMESTER</label>
                <select style={inp} value={subject.semester ?? 1} onChange={e => update("semester", Number(e.target.value))}>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={subject.is_elective} onChange={e => update("is_elective", e.target.checked)}
                    style={{ width: 16, height: 16 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#2D3436" }}>Open Elective</div>
                    <div style={{ fontSize: 10, color: "#8B7D6B" }}>Shared across departments</div>
                  </div>
                </label>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => router.push("/subjects")}
              style={{ padding: "9px 20px", background: "transparent", border: "1.5px solid #C8C0A8", borderRadius: 4, fontSize: 12, color: "#8B7D6B", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: "9px 28px", background: saving ? "#888" : "#2D3436", border: "none", borderRadius: 4, fontSize: 13, fontWeight: 700, color: "#FFFDF5", cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}