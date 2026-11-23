CREATE TABLE IF NOT EXISTS event_types (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  duration_minutes INT NOT NULL
);
