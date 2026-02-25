-- ============================================================
-- SEED DATA: VTU ISE Department — MIT Mysore
-- ============================================================
-- Uses proper UUIDs for all ID columns.
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- ── 0. Clean existing data (uncomment for fresh start)
-- DELETE FROM timetable_slots WHERE department_id = 'MIT-ISE';
-- DELETE FROM teacher_subject_assignments WHERE department_id = 'MIT-ISE';
-- DELETE FROM subjects WHERE department_id = 'MIT-ISE';
-- DELETE FROM room_pool WHERE department_id = 'MIT-ISE';
-- DELETE FROM teachers WHERE department_id = 'MIT-ISE';

-- ============================================================
-- 1. TEACHERS (12 faculty)
-- ============================================================

INSERT INTO teachers (id, name, email, department_id, is_available, max_daily_slots) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Dr. Ramesh Babu',       'ramesh.babu@mit.edu',      'MIT-ISE', true,  4),
  ('a0000000-0000-0000-0000-000000000002', 'Prof. Anitha Sharma',    'anitha.sharma@mit.edu',    'MIT-ISE', true,  5),
  ('a0000000-0000-0000-0000-000000000003', 'Dr. Suresh Kumar',       'suresh.kumar@mit.edu',     'MIT-ISE', true,  4),
  ('a0000000-0000-0000-0000-000000000004', 'Prof. Kavitha M',        'kavitha.m@mit.edu',        'MIT-ISE', true,  5),
  ('a0000000-0000-0000-0000-000000000005', 'Dr. Venkatesh P',        'venkatesh.p@mit.edu',      'MIT-ISE', true,  4),
  ('a0000000-0000-0000-0000-000000000006', 'Prof. Deepa Rao',        'deepa.rao@mit.edu',        'MIT-ISE', true,  5),
  ('a0000000-0000-0000-0000-000000000007', 'Dr. Harish Gowda',       'harish.gowda@mit.edu',     'MIT-ISE', true,  4),
  ('a0000000-0000-0000-0000-000000000008', 'Prof. Lakshmi Devi',     'lakshmi.devi@mit.edu',     'MIT-ISE', true,  5),
  ('a0000000-0000-0000-0000-000000000009', 'Dr. Prasad Hegde',       'prasad.hegde@mit.edu',     'MIT-ISE', true,  3),
  ('a0000000-0000-0000-0000-000000000010', 'Prof. Nandini R',        'nandini.r@mit.edu',        'MIT-ISE', true,  5),
  ('a0000000-0000-0000-0000-000000000011', 'Dr. Mohan Raj',          'mohan.raj@mit.edu',        'MIT-ISE', false, 4),  -- unavailable
  ('a0000000-0000-0000-0000-000000000012', 'Prof. Sahana K',         'sahana.k@mit.edu',         'MIT-ISE', true,  4)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, email = EXCLUDED.email,
  is_available = EXCLUDED.is_available, max_daily_slots = EXCLUDED.max_daily_slots;

-- ============================================================
-- 2. SUBJECTS — Semester 3
-- ============================================================

INSERT INTO subjects (id, code, title, lecture_hours, tutorial_hours, practical_hours, preferred_room_type, semester, is_elective, scheme, department_id) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'M23BMAT301', 'Transform Calculus & Statistics',     4, 0, 0, 'Lecture', 3, false, '2023', 'MIT-ISE'),
  ('b0000000-0000-0000-0000-000000000002', 'M23BCS301',  'Data Structures',                     3, 0, 2, 'Lecture', 3, false, '2023', 'MIT-ISE'),
  ('b0000000-0000-0000-0000-000000000003', 'M23BCS302',  'Digital Design & Comp. Organization', 3, 0, 2, 'Lecture', 3, false, '2023', 'MIT-ISE'),
  ('b0000000-0000-0000-0000-000000000004', 'M23BCS303',  'Object Oriented Programming (Java)',  3, 0, 2, 'Lecture', 3, false, '2023', 'MIT-ISE'),
  ('b0000000-0000-0000-0000-000000000005', 'M23BCS304',  'Discrete Mathematical Structures',    3, 0, 0, 'Lecture', 3, false, '2023', 'MIT-ISE'),
  ('b0000000-0000-0000-0000-000000000006', 'M23BCS305',  'Computer Architecture',               3, 0, 0, 'Lecture', 3, false, '2023', 'MIT-ISE')
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code, title = EXCLUDED.title,
  lecture_hours = EXCLUDED.lecture_hours, tutorial_hours = EXCLUDED.tutorial_hours,
  practical_hours = EXCLUDED.practical_hours, preferred_room_type = EXCLUDED.preferred_room_type,
  semester = EXCLUDED.semester;

-- ============================================================
-- 3. SUBJECTS — Semester 5
-- ============================================================

INSERT INTO subjects (id, code, title, lecture_hours, tutorial_hours, practical_hours, preferred_room_type, semester, is_elective, scheme, department_id) VALUES
  ('b0000000-0000-0000-0000-000000000007', 'M23BCS501', 'Computer Networks',              3, 0, 2, 'Lecture', 5, false, '2023', 'MIT-ISE'),
  ('b0000000-0000-0000-0000-000000000008', 'M23BCS502', 'Automata Theory & Computability', 3, 0, 0, 'Lecture', 5, false, '2023', 'MIT-ISE'),
  ('b0000000-0000-0000-0000-000000000009', 'M23BCS503', 'Machine Learning',                3, 0, 2, 'Lecture', 5, false, '2023', 'MIT-ISE'),
  ('b0000000-0000-0000-0000-000000000010', 'M23BCS504', 'Advanced Java Programming',       3, 0, 2, 'Lecture', 5, false, '2023', 'MIT-ISE'),
  ('b0000000-0000-0000-0000-000000000011', 'M23BCS505', 'Theory of Computation',           3, 0, 0, 'Lecture', 5, false, '2023', 'MIT-ISE'),
  ('b0000000-0000-0000-0000-000000000012', 'M23BCSE51', 'Cloud Computing (Elective)',      3, 0, 0, 'Lecture', 5, true,  '2023', 'MIT-ISE')
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code, title = EXCLUDED.title,
  lecture_hours = EXCLUDED.lecture_hours, tutorial_hours = EXCLUDED.tutorial_hours,
  practical_hours = EXCLUDED.practical_hours, preferred_room_type = EXCLUDED.preferred_room_type,
  semester = EXCLUDED.semester;

-- ============================================================
-- 4. ROOMS (4 lecture + 2 lab)
-- ============================================================

INSERT INTO room_pool (id, room_name, capacity, room_type, department_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'ISE-301',   60, 'Lecture', 'MIT-ISE'),
  ('c0000000-0000-0000-0000-000000000002', 'ISE-302',   60, 'Lecture', 'MIT-ISE'),
  ('c0000000-0000-0000-0000-000000000003', 'ISE-501',   60, 'Lecture', 'MIT-ISE'),
  ('c0000000-0000-0000-0000-000000000004', 'ISE-502',   60, 'Lecture', 'MIT-ISE'),
  ('c0000000-0000-0000-0000-000000000005', 'ISE-LAB-1', 30, 'Lab',     'MIT-ISE'),
  ('c0000000-0000-0000-0000-000000000006', 'ISE-LAB-2', 30, 'Lab',     'MIT-ISE')
ON CONFLICT (id) DO UPDATE SET
  room_name = EXCLUDED.room_name, capacity = EXCLUDED.capacity, room_type = EXCLUDED.room_type;

-- ============================================================
-- 5. TEACHER-SUBJECT ASSIGNMENTS
-- ============================================================
-- t-001 & t-003 teach in BOTH semesters (cross-semester)
-- t-009 has max 3 slots/day, t-011 is unavailable
-- t-012 is backup for Data Structures

-- Semester 3
INSERT INTO teacher_subject_assignments (teacher_id, subject_id, department_id) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'MIT-ISE'),  -- Ramesh → Maths
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'MIT-ISE'),  -- Anitha → DS
  ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'MIT-ISE'),  -- Suresh → DigDesign
  ('a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'MIT-ISE'),  -- Kavitha → OOP
  ('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'MIT-ISE'),  -- Venkatesh → DMS
  ('a0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', 'MIT-ISE'),  -- Deepa → CompArch
  ('a0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000002', 'MIT-ISE')   -- Sahana → DS (backup)
ON CONFLICT DO NOTHING;

-- Semester 5
INSERT INTO teacher_subject_assignments (teacher_id, subject_id, department_id) VALUES
  ('a0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000007', 'MIT-ISE'),  -- Harish → Networks
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008', 'MIT-ISE'),  -- Ramesh → Automata (shared!)
  ('a0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000009', 'MIT-ISE'),  -- Lakshmi → ML
  ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000010', 'MIT-ISE'),  -- Suresh → AdvJava (shared!)
  ('a0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000011', 'MIT-ISE'),  -- Prasad → TOC (low cap!)
  ('a0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000012', 'MIT-ISE')   -- Nandini → Cloud
ON CONFLICT DO NOTHING;

-- ============================================================
-- DONE! Now test:
--   1. Semester 3, Section A → Generate (~25 slots)
--   2. Semester 3, Section B → Generate (blocked_slots active)
--   3. Semester 5, Section A → Generate
-- ============================================================
