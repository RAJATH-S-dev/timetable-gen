"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Subject {
  id?: string;
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

const roomBadge = (type: string): React.CSSProperties => {
  if (type === "Lab") return { background: "#F0EBE0", color: "#2D3436" };
  if (type === "Seminar Hall") return { background: "#EDE8F5", color: "#5B2C8A" };
  return { background: "#E8F0E8", color: "#2C6E2C" };
};

const inp: React.CSSProperties = {
  border: "1px solid #C8C0A8", borderRadius: 4, padding: "6px 10px",
  fontSize: 12, background: "#FFFDF5", color: "#2D3436", width: "100%",
  fontFamily: "'Georgia', serif", outline: "none",
};

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSemester, setFilterSemester] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewData, setPreviewData] = useState<Subject[] | null>(null);

  const [newSubject, setNewSubject] = useState<Subject>({
    code: "", title: "", lecture_hours: 3, tutorial_hours: 0,
    practical_hours: 0, weekly_credits: 3, preferred_room_type: "Lecture",
    semester: 1, is_elective: false, scheme: "VTU-2022", department_id: "MIT-ISE",
  });

  useEffect(() => { fetchSubjects(); }, []);

  async function fetchSubjects() {
    setLoading(true);
    try {
      const res = await fetch("/api/ingestion/subjects?t=" + Date.now());
      const data = await res.json();
      setSubjects(data.subjects ?? []);
    } catch { setError("Failed to load subjects"); }
    finally { setLoading(false); }
  }

  async function handleAdd() {
    if (!newSubject.code || !newSubject.title) { setError("Code and title required"); return; }
    const credits = computeCredits(newSubject.lecture_hours, newSubject.tutorial_hours, newSubject.practical_hours);
    const roomType = newSubject.practical_hours > 0 ? "Lab" : newSubject.preferred_room_type;
    const payload = { ...newSubject, weekly_credits: credits, preferred_room_type: roomType };
    try {
      const res = await fetch("/api/ingestion/subjects", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: [payload] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash("✓ Subject added");
      setShowAdd(false);
      resetForm();
      fetchSubjects();
    } catch (e: any) { setError(e.message); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this subject? This cannot be undone.")) return;
    try {
      await fetch("/api/ingestion/subjects", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchSubjects();
    } catch { setError("Failed to delete"); }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/ingestion/subjects", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setPreviewData(result.data);
    } catch (e: any) { setError(e.message); }
    finally { setIsUploading(false); }
  }

  async function handleConfirmImport() {
    if (!previewData) return;
    setIsSaving(true);
    try {
      const rows = previewData.map(r => ({
        ...r,
        weekly_credits: computeCredits(r.lecture_hours, r.tutorial_hours, r.practical_hours),
        preferred_room_type: r.practical_hours > 0 ? "Lab" : r.preferred_room_type,
      }));
      const res = await fetch("/api/ingestion/subjects", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      flash(`✓ ${result.inserted} subjects imported`);
      setPreviewData(null);
      setShowUpload(false);
      fetchSubjects();
    } catch (e: any) { setError(e.message); }
    finally { setIsSaving(false); }
  }

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  function resetForm() {
    setNewSubject({
      code: "", title: "", lecture_hours: 3, tutorial_hours: 0,
      practical_hours: 0, weekly_credits: 3, preferred_room_type: "Lecture",
      semester: 1, is_elective: false, scheme: "VTU-2022", department_id: "MIT-ISE"
    });
  }

  function updateNew(field: keyof Subject, val: any) {
    setNewSubject(s => ({ ...s, [field]: val }));
  }

  const liveCredits = computeCredits(newSubject.lecture_hours, newSubject.tutorial_hours, newSubject.practical_hours);

  // Filtered + searched subjects
  const filteredSubjects = subjects
    .filter(s => filterSemester === "all" || s.semester === filterSemester)
    .filter(s =>
      searchQuery === "" ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Semester counts for the filter pills
  const semesterCounts = subjects.reduce<Record<number, number>>((acc, s) => {
    acc[s.semester] = (acc[s.semester] || 0) + 1;
    return acc;
  }, {});
  const semesters = Object.keys(semesterCounts).map(Number).sort();

  return (
    <div style={{ fontFamily: "'Georgia', serif", maxWidth: 1100 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .subj-row:hover { background: #F8F3E8 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2D3436", margin: "0 0 4px" }}>Subject Registry</h1>
          <p style={{ fontSize: 13, color: "#8B7D6B", margin: 0 }}>
            {subjects.length} subject{subjects.length !== 1 ? "s" : ""} · VTU Credit System (L+T+P/2)
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {successMsg && <span style={{ fontSize: 12, color: "#27AE60", fontWeight: 600 }}>{successMsg}</span>}
          <button onClick={() => { setShowAdd(f => !f); setShowUpload(false); }}
            style={{
              padding: "7px 14px", fontSize: 12, fontWeight: 600, borderRadius: 4, cursor: "pointer",
              background: showAdd ? "#2D3436" : "transparent",
              border: "1.5px solid #2D3436",
              color: showAdd ? "#FFFDF5" : "#2D3436",
              transition: "all 0.15s",
            }}>
            {showAdd ? "✕ Cancel" : "+ Add Subject"}
          </button>
          <button onClick={() => { setShowUpload(u => !u); setShowAdd(false); }}
            style={{
              padding: "7px 14px", fontSize: 12, fontWeight: 600, borderRadius: 4, cursor: "pointer",
              background: showUpload ? "#2D3436" : "transparent",
              border: "1.5px solid #2D3436",
              color: showUpload ? "#FFFDF5" : "#2D3436",
              transition: "all 0.15s",
            }}>
            {showUpload ? "✕ Cancel" : "↑ Upload CSV"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#FFF0EF", border: "1px solid #FF7675", borderRadius: 4, padding: "8px 12px", fontSize: 12, color: "#C0392B", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C0392B", fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* ── Add Form ── */}
      {showAdd && (
        <div style={{ background: "#FFFDF5", border: "1.5px solid #C8C0A8", borderRadius: 4, padding: 20, marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 14px" }}>New Subject</p>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 100px 100px", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", display: "block", marginBottom: 4 }}>CODE *</label>
              <input style={inp} placeholder="M23BMATS101" value={newSubject.code} onChange={e => updateNew("code", e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", display: "block", marginBottom: 4 }}>TITLE *</label>
              <input style={inp} placeholder="Mathematics-I" value={newSubject.title} onChange={e => updateNew("title", e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", display: "block", marginBottom: 4 }}>SEMESTER</label>
              <select style={inp} value={newSubject.semester} onChange={e => updateNew("semester", Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", display: "block", marginBottom: 4 }}>SCHEME</label>
              <input style={inp} value={newSubject.scheme} onChange={e => updateNew("scheme", e.target.value)} />
            </div>
          </div>

          {/* L-T-P */}
          <div style={{ background: "#F0EBE0", borderRadius: 4, padding: "12px 16px", marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>L - T - P  (Hours per Week)</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#2D3436", display: "block", marginBottom: 4 }}>LECTURE (L)</label>
                <input type="number" min={0} max={6} style={inp} value={newSubject.lecture_hours}
                  onChange={e => updateNew("lecture_hours", parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#2D3436", display: "block", marginBottom: 4 }}>TUTORIAL (T)</label>
                <input type="number" min={0} max={6} style={inp} value={newSubject.tutorial_hours}
                  onChange={e => updateNew("tutorial_hours", parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#2D3436", display: "block", marginBottom: 4 }}>PRACTICAL (P)</label>
                <input type="number" min={0} max={6} style={inp} value={newSubject.practical_hours}
                  onChange={e => updateNew("practical_hours", parseInt(e.target.value) || 0)} />
              </div>
              <div style={{ background: "#2D3436", borderRadius: 4, padding: "8px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#C8C0A8", fontWeight: 600 }}>CREDITS</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFDF5", lineHeight: 1.2, fontFamily: "'Courier New', monospace" }}>{liveCredits}</div>
                <div style={{ fontSize: 9, color: "#C8C0A8" }}>L+T+(P/2)</div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "160px 160px 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", display: "block", marginBottom: 4 }}>ROOM TYPE</label>
              <select style={inp} value={newSubject.practical_hours > 0 ? "Lab" : newSubject.preferred_room_type}
                disabled={newSubject.practical_hours > 0}
                onChange={e => updateNew("preferred_room_type", e.target.value)}>
                {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              {newSubject.practical_hours > 0 && <p style={{ fontSize: 9, color: "#8B7D6B", margin: "3px 0 0" }}>Auto-set to Lab (P &gt; 0)</p>}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12 }}>
                <input type="checkbox" checked={newSubject.is_elective} onChange={e => updateNew("is_elective", e.target.checked)} />
                <span style={{ color: "#2D3436", fontWeight: 600 }}>Open Elective</span>
              </label>
            </div>
          </div>

          <button onClick={handleAdd} style={{
            padding: "8px 24px", background: "#2D3436", border: "none", borderRadius: 4,
            fontSize: 12, fontWeight: 700, color: "#FFFDF5", cursor: "pointer",
            transition: "background 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#3D4D4F'}
            onMouseLeave={e => e.currentTarget.style.background = '#2D3436'}
          >
            Save Subject
          </button>
        </div>
      )}

      {/* ── CSV Upload ── */}
      {showUpload && (
        <div style={{ background: "#FFFDF5", border: "1.5px solid #C8C0A8", borderRadius: 4, padding: 20, marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 8px" }}>Upload CSV</p>
          <p style={{ fontSize: 11, color: "#8B7D6B", marginBottom: 14, margin: "0 0 14px" }}>
            Columns: <code style={{ background: "#F0EBE0", padding: "1px 6px", borderRadius: 3, fontSize: 10 }}>code, title, lecture_hours, tutorial_hours, practical_hours, preferred_room_type</code>
          </p>
          {!previewData && !isUploading && (
            <div style={{ border: "2px dashed #C8C0A8", borderRadius: 4, padding: 28, textAlign: "center" }}>
              <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} id="subject-csv" />
              <label htmlFor="subject-csv" style={{ cursor: "pointer", fontSize: 13, color: "#2D3436", fontWeight: 600 }}>📄 Click to select CSV</label>
              <p style={{ fontSize: 11, color: "#8B7D6B", marginTop: 6 }}>Credits auto-computed from L-T-P</p>
            </div>
          )}
          {isUploading && (
            <div style={{ textAlign: "center", padding: 24 }}>
              <div style={{
                width: 28, height: 28,
                border: "3px solid #E2D9C5", borderTopColor: "#2D3436",
                borderRadius: "50%", margin: "0 auto 8px",
                animation: "spin 0.8s linear infinite",
              }} />
              <p style={{ fontSize: 12, color: "#8B7D6B" }}>Parsing…</p>
            </div>
          )}
          {previewData && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#2D3436", marginBottom: 10 }}>Preview — {previewData.length} subjects</p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "#F0EBE0" }}>
                      {["Code", "Title", "L", "T", "P", "Credits", "Room Type", ""].map(h => (
                        <th key={h} style={{ border: "1px solid #C8C0A8", padding: "6px 8px", textAlign: "center", fontWeight: 700, color: "#2D3436", fontSize: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => {
                      const c = computeCredits(row.lecture_hours, row.tutorial_hours, row.practical_hours);
                      return (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? "#FFFFFF" : "#FFFDF5" }}>
                          <td style={{ border: "1px solid #E2D9C5", padding: "4px 6px" }}>
                            <input style={{ ...inp, width: 120 }} value={row.code} onChange={e => { const d = [...previewData]; d[idx].code = e.target.value; setPreviewData(d); }} />
                          </td>
                          <td style={{ border: "1px solid #E2D9C5", padding: "4px 6px" }}>
                            <input style={{ ...inp, width: "100%" }} value={row.title} onChange={e => { const d = [...previewData]; d[idx].title = e.target.value; setPreviewData(d); }} />
                          </td>
                          {(["lecture_hours", "tutorial_hours", "practical_hours"] as const).map(f => (
                            <td key={f} style={{ border: "1px solid #E2D9C5", padding: "4px 6px", textAlign: "center" }}>
                              <input type="number" min={0} max={6} style={{ ...inp, width: 40, textAlign: "center" }} value={row[f]}
                                onChange={e => { const d = [...previewData]; (d[idx] as any)[f] = parseInt(e.target.value) || 0; setPreviewData(d); }} />
                            </td>
                          ))}
                          <td style={{ border: "1px solid #E2D9C5", padding: "4px 6px", textAlign: "center", fontWeight: 700, color: "#2D3436", fontFamily: "'Courier New', monospace" }}>{c}</td>
                          <td style={{ border: "1px solid #E2D9C5", padding: "4px 6px" }}>
                            <select style={{ ...inp, width: 100 }} value={row.practical_hours > 0 ? "Lab" : row.preferred_room_type}
                              disabled={row.practical_hours > 0}
                              onChange={e => { const d = [...previewData]; d[idx].preferred_room_type = e.target.value; setPreviewData(d); }}>
                              {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                          </td>
                          <td style={{ border: "1px solid #E2D9C5", padding: "4px 6px", textAlign: "center" }}>
                            <button onClick={() => setPreviewData(previewData.filter((_, i) => i !== idx))}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#C0392B", fontSize: 12, fontWeight: 700 }}>✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                <button onClick={() => setPreviewData(null)} style={{
                  padding: "7px 14px", background: "transparent", border: "1.5px solid #C8C0A8",
                  borderRadius: 4, fontSize: 12, cursor: "pointer", color: "#2D3436",
                }}>← Back</button>
                <button onClick={handleConfirmImport} disabled={isSaving} style={{
                  padding: "7px 18px", background: "#2D3436", border: "none", borderRadius: 4,
                  fontSize: 12, fontWeight: 700, color: "#FFFDF5", cursor: isSaving ? "not-allowed" : "pointer",
                }}>
                  {isSaving ? "Saving…" : `Import ${previewData.length} Subjects`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        marginBottom: 14, flexWrap: "wrap",
      }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search by code or title..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            ...inp, width: 220,
            background: "#FFFDF5", padding: "6px 12px",
          }}
        />

        {/* Semester Pills */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", textTransform: "uppercase", letterSpacing: 1, marginRight: 4 }}>Sem</span>
          <button
            onClick={() => setFilterSemester("all")}
            style={{
              padding: "4px 10px", fontSize: 10, fontWeight: 700, borderRadius: 3, cursor: "pointer",
              background: filterSemester === "all" ? "#2D3436" : "#FFFDF5",
              color: filterSemester === "all" ? "#FFFDF5" : "#8B7D6B",
              border: `1px solid ${filterSemester === "all" ? "#2D3436" : "#E2D9C5"}`,
              transition: "all 0.15s",
            }}
          >
            All ({subjects.length})
          </button>
          {semesters.map(sem => (
            <button
              key={sem}
              onClick={() => setFilterSemester(sem)}
              style={{
                padding: "4px 10px", fontSize: 10, fontWeight: 700, borderRadius: 3, cursor: "pointer",
                background: filterSemester === sem ? "#2D3436" : "#FFFDF5",
                color: filterSemester === sem ? "#FFFDF5" : "#8B7D6B",
                border: `1px solid ${filterSemester === sem ? "#2D3436" : "#E2D9C5"}`,
                transition: "all 0.15s",
              }}
            >
              {sem} ({semesterCounts[sem]})
            </button>
          ))}
        </div>

        {/* Results count */}
        <span style={{ fontSize: 11, color: "#8B7D6B", marginLeft: "auto" }}>
          {filteredSubjects.length} result{filteredSubjects.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Subjects Table ── */}
      <div style={{ background: "#FFFDF5", border: "1.5px solid #C8C0A8", borderRadius: 4, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#F0EBE0" }}>
              {["Code", "Title", "Sem", "L", "T", "P", "Credits", "Room Type", "Type", "Actions"].map(h => (
                <th key={h} style={{
                  border: "1px solid #C8C0A8", padding: "9px 10px",
                  textAlign: h === "Code" || h === "Title" ? "left" : "center",
                  fontWeight: 700, color: "#2D3436", fontSize: 10,
                  textTransform: "uppercase", letterSpacing: 0.5,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: "center", padding: 40, color: "#8B7D6B" }}>Loading subjects…</td></tr>
            ) : filteredSubjects.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: "center", padding: 40, color: "#8B7D6B" }}>
                {subjects.length === 0 ? "No subjects yet — add one or upload a CSV" : "No subjects match your filter"}
              </td></tr>
            ) : filteredSubjects.map((s, i) => (
              <tr key={s.id ?? i} className="subj-row" style={{ background: i % 2 === 0 ? "#FFFFFF" : "#FFFDF5", transition: "background 0.1s" }}>
                <td style={{ border: "1px solid #E2D9C5", padding: "8px 10px", fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: 11 }}>{s.code}</td>
                <td style={{ border: "1px solid #E2D9C5", padding: "8px 10px" }}>{s.title}</td>
                <td style={{ border: "1px solid #E2D9C5", padding: "8px 10px", textAlign: "center", fontWeight: 600 }}>{s.semester ?? "—"}</td>
                <td style={{ border: "1px solid #E2D9C5", padding: "8px 10px", textAlign: "center" }}>{s.lecture_hours ?? "—"}</td>
                <td style={{ border: "1px solid #E2D9C5", padding: "8px 10px", textAlign: "center" }}>{s.tutorial_hours ?? "—"}</td>
                <td style={{ border: "1px solid #E2D9C5", padding: "8px 10px", textAlign: "center" }}>{s.practical_hours ?? "—"}</td>
                <td style={{ border: "1px solid #E2D9C5", padding: "8px 10px", textAlign: "center", fontWeight: 700, fontFamily: "'Courier New', monospace" }}>{s.weekly_credits}</td>
                <td style={{ border: "1px solid #E2D9C5", padding: "8px 10px", textAlign: "center" }}>
                  <span style={{ ...roomBadge(s.preferred_room_type), padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 600 }}>{s.preferred_room_type}</span>
                </td>
                <td style={{ border: "1px solid #E2D9C5", padding: "8px 10px", textAlign: "center" }}>
                  {s.is_elective ? <span style={{ fontSize: 10, color: "#5B2C8A", fontWeight: 600 }}>Elective</span> : <span style={{ color: "#C8C0A8" }}>—</span>}
                </td>
                <td style={{ border: "1px solid #E2D9C5", padding: "8px 10px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => router.push(`/subjects/${s.id}`)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#2D3436", fontSize: 11, fontWeight: 700 }}>Edit</button>
                    {s.id && (
                      <button onClick={() => handleDelete(s.id!)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#C0392B", fontSize: 11, fontWeight: 600 }}>Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}