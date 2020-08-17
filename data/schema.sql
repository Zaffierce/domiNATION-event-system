CREATE TABLE events (
  id VARCHAR(255),
  created_date BIGINT,
  start_date_ms BIGINT,
  start_date VARCHAR(255),
  time VARCHAR(255),
  timezone VARCHAR(255),
  summary TEXT,
  description TEXT,
  showEvent VARCHAR(255)
);

CREATE TABLE signed_up_events (
  event_id VARCHAR(255),
  discord_id VARCHAR(255)
);

CREATE TABLE events_images (
  event_id VARCHAR(255),
  file_id VARCHAR(255)
);