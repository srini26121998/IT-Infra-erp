-- ============================================================
--  Migration 003 — Attendance
-- ============================================================

CREATE TABLE IF NOT EXISTS office_config (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id         UUID REFERENCES branches(id),
  office_lat        NUMERIC(10,7) NOT NULL,
  office_lng        NUMERIC(10,7) NOT NULL,
  geofence_radius   INTEGER NOT NULL DEFAULT 200,  -- metres
  shift_start_time  TIME NOT NULL DEFAULT '09:30',
  shift_end_time    TIME NOT NULL DEFAULT '18:30',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (branch_id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      UUID        NOT NULL REFERENCES employees(id),
  date             DATE        NOT NULL,
  check_in         TIME,
  check_out        TIME,
  status           VARCHAR(30) NOT NULL DEFAULT 'Present',
  -- Present|Late|WFH|Half Day|Auto Logout|Outside Location|Absent
  check_in_lat     NUMERIC(10,7),
  check_in_lng     NUMERIC(10,7),
  check_out_lat    NUMERIC(10,7),
  check_out_lng    NUMERIC(10,7),
  is_wfh           BOOLEAN NOT NULL DEFAULT FALSE,
  is_late          BOOLEAN NOT NULL DEFAULT FALSE,
  is_half_day      BOOLEAN NOT NULL DEFAULT FALSE,
  logout_type      VARCHAR(10) DEFAULT 'Manual',   -- Manual|Auto
  admin_status     VARCHAR(15) DEFAULT 'pending',  -- pending|approved|rejected|half-day
  admin_remarks    TEXT,
  device_info      VARCHAR(100),
  gps_accuracy     NUMERIC(8,2),
  geofence_status  VARCHAR(10),                    -- inside|outside|boundary
  anomalies        JSONB DEFAULT '[]',
  timeline         JSONB DEFAULT '[]',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_att_emp_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_att_date     ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_att_status   ON attendance(status);
