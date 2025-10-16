#!/usr/bin/env node
// Simple CSV -> SQLite import script
// Usage: node scripts/import-csv.js

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { parse } = require('csv-parse/sync');

const csvPath = path.resolve(__dirname, '..', 'public', 'Data', '2024_HKDSE_results_statistics_table3f_tc.csv');
const outDbPath = path.resolve(__dirname, '..', 'data', 'hkdsedata.sqlite');
const sqlOutPath = path.resolve(__dirname, '..', 'migrations', 'import_data.sql');

if (!fs.existsSync(path.dirname(outDbPath))) fs.mkdirSync(path.dirname(outDbPath), { recursive: true });

const raw = fs.readFileSync(csvPath, 'utf8');
const records = parse(raw, { columns: false, skip_empty_lines: true, relax_column_count: true, trim: true });

// Parse headerless CSV rows
const rows = [];
for (let i = 0; i < records.length; i++) {
  const r = records[i];
  // Expected columns based on provided file: 行號,項目,類別,日校考生 - 人數,日校考生 - 累計總人數,全體考生 - 人數,全體考生 - 累計總人數
  if (i === 0) continue; // skip header
  // normalize to at least 7 columns
  const cols = Array.from({ length: 7 }, (_, idx) => (r[idx] !== undefined ? r[idx] : ''));
  const lineNo = parseInt(cols[0], 10) || null;
  const item = cols[1] || null;
  const category = cols[2] || null;
  const dayCount = cols[3] ? parseInt(String(cols[3]).replace(/,/g, ''), 10) : null;
  const dayCum = cols[4] ? parseInt(String(cols[4]).replace(/,/g, ''), 10) : null;
  const allCount = cols[5] ? parseInt(String(cols[5]).replace(/,/g, ''), 10) : null;
  const allCum = cols[6] ? parseInt(String(cols[6]).replace(/,/g, ''), 10) : null;
  rows.push({ lineNo, item, category, dayCount, dayCum, allCount, allCum });
}

// create sqlite and insert
if (fs.existsSync(outDbPath)) fs.unlinkSync(outDbPath);
const db = new sqlite3.Database(outDbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS hkdsedata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    line_no INTEGER,
    item TEXT,
    category TEXT,
    day_count INTEGER,
    day_cum_count INTEGER,
    all_count INTEGER,
    all_cum_count INTEGER
  );`);

  const stmt = db.prepare(`INSERT INTO hkdsedata (line_no, item, category, day_count, day_cum_count, all_count, all_cum_count) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const r of rows) {
    stmt.run(r.lineNo, r.item, r.category, r.dayCount, r.dayCum, r.allCount, r.allCum);
  }
  stmt.finalize();

  // dump SQL insert statements for migration
  const inserts = rows.map(r => {
    const vals = [r.lineNo, r.item, r.category, r.dayCount, r.dayCum, r.allCount, r.allCum].map(v => v === null ? 'NULL' : (typeof v === 'number' ? v : `'${String(v).replace(/'/g, "''")}'`)).join(', ');
    return `INSERT INTO hkdsedata (line_no, item, category, day_count, day_cum_count, all_count, all_cum_count) VALUES (${vals});`;
  }).join('\n');

  fs.writeFileSync(sqlOutPath, inserts, 'utf8');

  console.log('Imported', rows.length, 'rows into', outDbPath);
  console.log('Generated SQL migration at', sqlOutPath);
});

db.close();
