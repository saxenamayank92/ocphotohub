CREATE TABLE IF NOT EXISTS trial_reminders_sent (
  club_id TEXT NOT NULL,
  reminder_days INTEGER NOT NULL,
  sent_at TEXT NOT NULL,
  PRIMARY KEY (club_id, reminder_days),
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS trial_reminders_sent_club_idx ON trial_reminders_sent (club_id, sent_at);
