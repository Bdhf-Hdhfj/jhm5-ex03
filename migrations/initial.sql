-- initial migration for hkdsedata table
CREATE TABLE IF NOT EXISTS hkdsedata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  line_no INTEGER,
  item TEXT,
  category TEXT,
  day_count INTEGER,
  day_cum_count INTEGER,
  all_count INTEGER,
  all_cum_count INTEGER
);
