const http = require('http');
const fs = require('fs');
const url = require('url');
const querystring = require('querystring');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const PORT = 3075;
const SESSIONS = {};

const db = new sqlite3.Database('users_db', (err) => {
    if (err) console.error('Database error:', err);
    else {
        db.run(`CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY, 
        name TEXT, 
        password TEXT, 
        note TEXT
        )`);
    }
});

const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        handleGet(req, res);
    } else if (req.method === 'POST') {
        handlePost(req, res);
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method not allowed');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

function loadHtml(filePath, res, replacements = {}) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Page not found');
            return;
        } else {
            Object.keys(replacements).forEach((key) => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                data = data.replace(regex, replacements[key]);
            });
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        }
    });
}
  
function handleGet(req, res) {
    const parsedUrl = url.parse(req.url, true);
    
    if (parsedUrl.pathname === '/main') {
        const cookies = querystring.parse(req.headers.cookie, '; ');
        const sessionId = cookies.session_id;

        if (sessionId && SESSIONS[sessionId]) {
            const username = SESSIONS[sessionId];
            loadHtml('views/main.html', res, { username });
        } else {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Access denied');
        }
    } else if (parsedUrl.pathname === '/') {
        db.all('SELECT name FROM users', [], (err, rows) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal server error');
                return;
            }
            const userList = rows.map(row => `<li>${row.name}</li>`).join('');
            loadHtml('views/index.html', res, { userList });
        });
    } else if (parsedUrl.pathname === '/register') {
        loadHtml('views/register.html', res);
    } else if (parsedUrl.pathname === '/login') {
        loadHtml('views/login.html', res);
    } else if (parsedUrl.pathname === '/show_note') {
        const cookies = req.headers.cookie
        ? Object.fromEntries(req.headers.cookie.split('; ').map(c => c.split('=')))
        : {};
        const sessionId = cookies.session_id;

        if (!sessionId || !SESSIONS[sessionId]) {
            console.log('Session not found or invalid:', sessionId);
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Access denied' }));
            return;
        }

        const username = SESSIONS[sessionId];
        console.log(`Fetching note for user: ${username}`);
        db.get('SELECT note FROM users WHERE name = ?', [username], (err, row) => {
            if (err) {
                console.error('Database error:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Failed to fetch note' }));
                return;
            }   
            if (row && row.note) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, note: row.note }));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'No note found' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Page not found');
    }
}

function handlePost(req, res) {
    
    const parsedUrl = url.parse(req.url, true);
    let body = '';
    
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        
        const fields = querystring.parse(body);
        
        if (parsedUrl.pathname === '/register') {
            const username = fields.username;
            console.log(fields);
            console.log(username);
            if (!username) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Username is required' }));
                return;
            }

            db.get('SELECT name FROM users WHERE name = ?', [username], (err, row) => {
                if (row) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Username already exists' }));
                } else {
                    const password = crypto.createHash('md5')
                    .update(username + Math.floor(Date.now() / 60000))
                    .digest('hex')
                    .slice(0, -22);

                    db.run('INSERT INTO users (name, password) VALUES (?, ?)', [username, password], () => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, message: 'Failed to register user' }));
                            return;
                        }
                        loadHtml('views/regend.html', res, {password});
                    });
                }
            });

        } else if (parsedUrl.pathname === '/login') {
            const username = fields.username;
            const password = fields.password;

            if (!username || !password) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Username and password are required');
                return;
            }

            db.get("SELECT * FROM users WHERE name = '" + username + "' AND password = '" + password + "'", (err, row) => {
                if (row) {
                    const sessionId = crypto.createHash('md5')
                    .update(row.name + Math.floor(Date.now()))
                    .digest('hex');
                    SESSIONS[sessionId] = row.name;
                    console.log('Setting Cookie:', `session_id=${sessionId}; Path=/`);
                    res.writeHead(302, {
                        'Set-Cookie': `session_id=${sessionId}; HttpOnly; Path=/;`,
                        'Location': '/main'
                    });
                    res.end();
                } else {
                    res.writeHead(401, { 'Content-Type': 'text/plain' });
                    res.end('Invalid login or password');
                }
            });
        } else if (parsedUrl.pathname === '/store_note') {
            const cookies = req.headers.cookie
            ? Object.fromEntries(req.headers.cookie.split('; ').map(c => c.split('=')))
            : {};
            
            const sessionId = cookies.session_id;
            
            if (!sessionId || !SESSIONS[sessionId]) {
                console.log('Session not found or invalid session ID:', sessionId);
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Access denied' }));
                return;
            }
            const username = SESSIONS[sessionId];
            const postData = querystring.parse(body);
            const note = postData.note;

            if (!note) {
                console.log('No note provided');
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Note is required' }));
                return;
            }

            db.run(
                'UPDATE users SET note = ? WHERE name = ?',
                [note, username],
                function (err) {
                    if (err) {
                        console.error('Database error:', err.message);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Failed to save note' }));
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Note saved successfully!' }));
                }
            );

            req.on('error', err => {
                console.error('Request error:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
            });
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Page not found');
        }
    });
}