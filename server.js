const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const baseDir = __dirname;
const projectRoot = path.join(baseDir, '..');
const dbPath = path.join(projectRoot, 'sql', 'covid_database.db');

// Connect to SQLite Database
let db = null;
try {
  db = new DatabaseSync(dbPath);
  console.log('✓ Connected to SQLite database:', dbPath);
} catch (err) {
  console.error('Error connecting to SQLite:', err.message);
}

// Load static cache of global trends for ultra-fast response
let dailyGlobalTrends = [];
try {
  const trendsPath = path.join(projectRoot, 'dataset', 'daily_global_trends.json');
  if (fs.existsSync(trendsPath)) {
    dailyGlobalTrends = JSON.parse(fs.readFileSync(trendsPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not read daily_global_trends.json:', e.message);
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (pathname === '/api/summary') {
    try {
      const summaryPath = path.join(projectRoot, 'dataset', 'dataset_summary.json');
      if (fs.existsSync(summaryPath)) {
        const data = fs.readFileSync(summaryPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
        return;
      }
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
  }

  if (pathname === '/api/trends') {
    const country = parsedUrl.searchParams.get('country') || 'All';
    const continent = parsedUrl.searchParams.get('continent') || 'All';
    const startYear = parsedUrl.searchParams.get('startYear') || '2020';
    const endYear = parsedUrl.searchParams.get('endYear') || '2023';

    try {
      let sql = `
        SELECT 
          date,
          SUM(new_cases) as new_cases,
          SUM(rolling_7day_cases) as rolling_7day_cases,
          SUM(new_deaths) as new_deaths,
          SUM(rolling_7day_deaths) as rolling_7day_deaths,
          SUM(new_recovered) as new_recovered
        FROM covid_data
        WHERE date >= '${startYear}-01-01' AND date <= '${endYear}-12-31'
      `;
      if (country !== 'All') {
        sql += ` AND country = '${country.replace(/'/g, "''")}'`;
      }
      if (continent !== 'All') {
        sql += ` AND continent = '${continent.replace(/'/g, "''")}'`;
      }
      sql += ` GROUP BY date ORDER BY date ASC`;

      const rows = db ? db.prepare(sql).all() : [];
      let runningCases = 0;
      let runningDeaths = 0;
      let runningRecovered = 0;
      const formatted = rows.map(r => {
        runningCases += r.new_cases;
        runningDeaths += r.new_deaths;
        runningRecovered += r.new_recovered;
        return {
          date: r.date,
          new_cases: r.new_cases,
          rolling_7day_cases: r.rolling_7day_cases,
          new_deaths: r.new_deaths,
          rolling_7day_deaths: r.rolling_7day_deaths,
          cumulative_cases: runningCases,
          cumulative_deaths: runningDeaths,
          cumulative_recovered: runningRecovered
        };
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(formatted));
      return;
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
  }

  if (pathname === '/api/countries') {
    try {
      const sql = `
        SELECT 
          country,
          continent,
          MAX(total_cases) as total_cases,
          MAX(total_deaths) as total_deaths,
          MAX(total_recovered) as total_recovered,
          MAX(population) as population
        FROM covid_data
        WHERE country != 'Other Countries'
        GROUP BY country, continent
        ORDER BY total_cases DESC;
      `;
      const rows = db ? db.prepare(sql).all() : [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows));
      return;
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
  }

  if (pathname === '/api/query' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { query } = JSON.parse(body || '{}');
        if (!query || typeof query !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Query string required' }));
          return;
        }

        // Safety check: allow SELECT only
        const trimmed = query.trim().toUpperCase();
        if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH')) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Only SELECT and WITH queries are permitted for safety.' }));
          return;
        }

        const start = performance.now();
        const results = db.prepare(query).all();
        const duration = (performance.now() - start).toFixed(2);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          rowCount: results.length,
          executionTimeMs: duration,
          data: results
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(baseDir, pathname === '/' ? 'index.html' : pathname);

  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=============================================================`);
  console.log(` COVID-19 Disease Trend Analysis Dashboard Server Running`);
  console.log(` Author: Anuj Kumar Kushwaha (Roll: 250321540033)`);
  console.log(` Access Dashboard at: http://localhost:${PORT}`);
  console.log(`=============================================================\n`);
});
