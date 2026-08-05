const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const path = require('path');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 10000;

// ==================== SEGURIDAD ====================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://www.youtube.com", "https://youtube-nocookie.com", "https://s.ytimg.com", "https://p.typekit.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "https://i.ytimg.com"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://youtube-nocookie.com", "https://www.youtube-nocookie.com"],
      connectSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://www.youtube.com", "https://youtube-nocookie.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ==================== BASE DE DATOS ====================
let db;
let pgPool;
let usePostgres = false;

async function initDB() {
  if (process.env.DATABASE_URL) {
    try {
      pgPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      await pgPool.query('SELECT NOW()');
      usePostgres = true;
      console.log('✅ Modo PostgreSQL detectado (DATABASE_URL)');

      // Recrear tablas para asegurar esquema v5.5.1 (con privacy_accepted)
      await pgPool.query(`DROP TABLE IF EXISTS module_videos CASCADE`);
      await pgPool.query(`DROP TABLE IF EXISTS user_progress CASCADE`);
      await pgPool.query(`DROP TABLE IF EXISTS questions CASCADE`);
      await pgPool.query(`DROP TABLE IF EXISTS modules CASCADE`);
      await pgPool.query(`DROP TABLE IF EXISTS users CASCADE`);

      await pgPool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          document VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(255),
          company VARCHAR(255),
          password_hash VARCHAR(255) NOT NULL,
          privacy_accepted BOOLEAN DEFAULT FALSE,
          privacy_accepted_at TIMESTAMP,
          progress INTEGER DEFAULT 0,
          completed_modules INTEGER DEFAULT 0,
          total_modules INTEGER DEFAULT 6,
          certificate_issued BOOLEAN DEFAULT FALSE,
          certificate_date TIMESTAMP,
          certificate_expiry TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pgPool.query(`
        CREATE TABLE modules (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          video_url TEXT,
          document_url TEXT,
          image_url TEXT,
          order_num INTEGER DEFAULT 0,
          active BOOLEAN DEFAULT TRUE
        )
      `);

      await pgPool.query(`
        CREATE TABLE questions (
          id SERIAL PRIMARY KEY,
          module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
          question_text TEXT NOT NULL,
          option_a TEXT,
          option_b TEXT,
          option_c TEXT,
          option_d TEXT,
          correct_option VARCHAR(20),
          num_options INTEGER DEFAULT 4,
          allow_multiple BOOLEAN DEFAULT FALSE,
          question_video_url TEXT,
          question_doc_url TEXT
        )
      `);

      await pgPool.query(`
        CREATE TABLE user_progress (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
          completed BOOLEAN DEFAULT FALSE,
          completed_at TIMESTAMP
        )
      `);

      await pgPool.query(`
        CREATE TABLE module_videos (
          id SERIAL PRIMARY KEY,
          module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
          video_url TEXT NOT NULL,
          order_num INTEGER DEFAULT 0
        )
      `);

      // Insertar módulos iniciales
      const modules = [
        { title: 'Módulo 1: Inducción General', desc: 'Bienvenida y políticas de seguridad de Litoplas.', order: 1 },
        { title: 'Módulo 2: Identificación de Riesgos', desc: 'Riesgos eléctricos, mecánicos y químicos.', order: 2 },
        { title: 'Módulo 3: Uso de EPP', desc: 'Equipo de Protección Personal obligatorio.', order: 3 },
        { title: 'Módulo 4: Procedimientos de Emergencia', desc: 'Rutas de evacuación y puntos de encuentro.', order: 4 },
        { title: 'Módulo 5: Seguridad en Alturas', desc: 'Trabajo seguro en alturas y espacios confinados.', order: 5 },
        { title: 'Módulo 6: Evaluación Final', desc: 'Cuestionario de evaluación de conocimientos.', order: 6 }
      ];

      for (const m of modules) {
        await pgPool.query(
          'INSERT INTO modules (title, description, order_num, active) VALUES ($1,$2,$3,$4)',
          [m.title, m.desc, m.order, true]
        );
      }

      console.log('✅ Base de datos PostgreSQL inicializada v5.5.1 (con privacy_accepted)');
      return;
    } catch (e) {
      console.log('⚠️ PostgreSQL falló, usando SQLite:', e.message);
      usePostgres = false;
    }
  }

  // SQLite fallback
  db = new sqlite3.Database('./database.sqlite');
  db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS module_videos`);
    db.run(`DROP TABLE IF EXISTS user_progress`);
    db.run(`DROP TABLE IF EXISTS questions`);
    db.run(`DROP TABLE IF EXISTS modules`);
    db.run(`DROP TABLE IF EXISTS users`);

    db.run(`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      document TEXT NOT NULL UNIQUE,
      email TEXT,
      company TEXT,
      password_hash TEXT NOT NULL,
      privacy_accepted INTEGER DEFAULT 0,
      privacy_accepted_at TEXT,
      progress INTEGER DEFAULT 0,
      completed_modules INTEGER DEFAULT 0,
      total_modules INTEGER DEFAULT 6,
      certificate_issued INTEGER DEFAULT 0,
      certificate_date TEXT,
      certificate_expiry TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      video_url TEXT,
      document_url TEXT,
      image_url TEXT,
      order_num INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    )`);

    db.run(`CREATE TABLE questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_id INTEGER,
      question_text TEXT NOT NULL,
      option_a TEXT,
      option_b TEXT,
      option_c TEXT,
      option_d TEXT,
      correct_option TEXT,
      num_options INTEGER DEFAULT 4,
      allow_multiple INTEGER DEFAULT 0,
      question_video_url TEXT,
      question_doc_url TEXT
    )`);

    db.run(`CREATE TABLE user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      module_id INTEGER,
      completed INTEGER DEFAULT 0,
      completed_at TEXT
    )`);

    db.run(`CREATE TABLE module_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_id INTEGER,
      video_url TEXT NOT NULL,
      order_num INTEGER DEFAULT 0
    )`);

    const modules = [
      ['Módulo 1: Inducción General', 'Bienvenida y políticas de seguridad de Litoplas.', 1, 1],
      ['Módulo 2: Identificación de Riesgos', 'Riesgos eléctricos, mecánicos y químicos.', 2, 1],
      ['Módulo 3: Uso de EPP', 'Equipo de Protección Personal obligatorio.', 3, 1],
      ['Módulo 4: Procedimientos de Emergencia', 'Rutas de evacuación y puntos de encuentro.', 4, 1],
      ['Módulo 5: Seguridad en Alturas', 'Trabajo seguro en alturas y espacios confinados.', 5, 1],
      ['Módulo 6: Evaluación Final', 'Cuestionario de evaluación de conocimientos.', 6, 1]
    ];

    const stmt = db.prepare('INSERT INTO modules (title, description, order_num, active) VALUES (?,?,?,?)');
    modules.forEach(m => stmt.run(m));
    stmt.finalize();
  });
  console.log('✅ Base de datos SQLite inicializada v5.5.1 (con privacy_accepted)');
}

// ==================== HELPERS ====================
function query(sql, params = []) {
  if (usePostgres) {
    return pgPool.query(sql, params).then(r => r.rows);
  }
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function run(sql, params = []) {
  if (usePostgres) {
    return pgPool.query(sql, params).then(r => r.rows);
  }
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function toYouTubeEmbed(url) {
  if (!url) return '';
  let videoId = '';
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0];
  } else if (url.includes('v=')) {
    videoId = url.split('v=')[1].split('&')[0];
  } else if (url.includes('embed/')) {
    videoId = url.split('embed/')[1].split('?')[0];
  }
  if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}`;
  return url;
}

// ==================== MIDDLEWARE ====================
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
    next();
  } catch { res.status(401).json({ error: 'Token inválido' }); }
}

function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Solo admin' });
  next();
}

// ==================== AUTH ====================
app.post('/api/register', async (req, res) => {
  try {
    const { full_name, document, email, company, password, privacy_accepted } = req.body;

    // Validación checkbox privacidad (Ley 1581)
    if (!privacy_accepted) {
      return res.status(400).json({ error: 'Debe aceptar la Política de Privacidad para registrarse.' });
    }

    // Validación alfanumérica para documentos extranjeros
    if (!document || !/^[a-zA-Z0-9\-]{3,20}$/.test(document)) {
      return res.status(400).json({ error: 'Documento inválido. Use 3-20 caracteres alfanuméricos.' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Contraseña mínimo 4 caracteres' });
    }
    if (!full_name || full_name.length < 3) {
      return res.status(400).json({ error: 'Nombre completo requerido' });
    }

    const hash = await bcrypt.hash(password, 10);
    const now = new Date();

    if (usePostgres) {
      const exists = await pgPool.query('SELECT id FROM users WHERE document = $1', [document]);
      if (exists.rows.length > 0) return res.status(400).json({ error: 'Documento ya registrado' });

      await pgPool.query(
        'INSERT INTO users (full_name, document, email, company, password_hash, privacy_accepted, privacy_accepted_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [full_name, document.toUpperCase(), email || null, company || null, hash, true, now]
      );
    } else {
      const exists = await query('SELECT id FROM users WHERE document = ?', [document]);
      if (exists.length > 0) return res.status(400).json({ error: 'Documento ya registrado' });
      await run('INSERT INTO users (full_name, document, email, company, password_hash, privacy_accepted, privacy_accepted_at) VALUES (?,?,?,?,?,?,?)',
        [full_name, document.toUpperCase(), email || null, company || null, hash, 1, now.toISOString()]);
    }

    res.json({ success: true, message: 'Registro exitoso' });
  } catch (err) {
    console.error('Error registro:', err.message);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { document, password } = req.body;
    const rows = usePostgres
      ? (await pgPool.query('SELECT * FROM users WHERE document = $1', [document.toUpperCase()])).rows
      : await query('SELECT * FROM users WHERE document = ?', [document.toUpperCase()]);

    if (rows.length === 0) return res.status(400).json({ error: 'Usuario no encontrado' });
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { id: user.id, document: user.document, role: 'user' },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, full_name: user.full_name, document: user.document, progress: user.progress } });
  } catch (err) {
    console.error('Error login:', err.message);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === (process.env.ADMIN_USER || 'admin') && password === (process.env.ADMIN_PASS || 'admin')) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'defaultsecret', { expiresIn: '1d' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Credenciales incorrectas' });
});

// ==================== MODULES ====================
app.get('/api/modules', async (req, res) => {
  try {
    const mods = usePostgres
      ? (await pgPool.query('SELECT * FROM modules ORDER BY order_num')).rows
      : await query('SELECT * FROM modules ORDER BY order_num');

    for (const m of mods) {
      const vids = usePostgres
        ? (await pgPool.query('SELECT * FROM module_videos WHERE module_id = $1 ORDER BY order_num', [m.id])).rows
        : await query('SELECT * FROM module_videos WHERE module_id = ? ORDER BY order_num', [m.id]);
      m.videos = vids;
      m.video_url = toYouTubeEmbed(m.video_url);
    }
    res.json(mods);
  } catch (err) {
    console.error('Error modules:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/modules/:id/questions', async (req, res) => {
  try {
    const rows = usePostgres
      ? (await pgPool.query('SELECT * FROM questions WHERE module_id = $1', [req.params.id])).rows
      : await query('SELECT * FROM questions WHERE module_id = ?', [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error('Error questions:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== PROGRESS ====================
app.post('/api/progress', authMiddleware, async (req, res) => {
  try {
    const { module_id, answers } = req.body;
    const userId = req.user.id;

    const questions = usePostgres
      ? (await pgPool.query('SELECT * FROM questions WHERE module_id = $1', [module_id])).rows
      : await query('SELECT * FROM questions WHERE module_id = ?', [module_id]);

    let passed = true;
    if (questions.length > 0) {
      const minScore = Math.ceil(questions.length * 0.7);
      let score = 0;

      for (const q of questions) {
        const userAns = answers?.[q.id];
        if (!userAns) { passed = false; break; }

        if (q.allow_multiple) {
          const correct = q.correct_option.split(',').map(s => s.trim().toUpperCase()).sort();
          const given = userAns.split(',').map(s => s.trim().toUpperCase()).sort();
          if (JSON.stringify(correct) === JSON.stringify(given)) score++;
        } else {
          if (userAns.toUpperCase() === q.correct_option.toUpperCase()) score++;
        }
      }
      if (score < minScore) passed = false;
    }

    if (!passed) return res.json({ passed: false, message: 'No alcanzó el 70% requerido' });

    if (usePostgres) {
      await pgPool.query(
        'INSERT INTO user_progress (user_id, module_id, completed, completed_at) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
        [userId, module_id, true, new Date()]
      );
    } else {
      await run('INSERT OR IGNORE INTO user_progress (user_id, module_id, completed, completed_at) VALUES (?,?,?,?)',
        [userId, module_id, 1, new Date().toISOString()]);
    }

    const total = usePostgres
      ? (await pgPool.query('SELECT COUNT(*) as c FROM modules WHERE active = TRUE')).rows[0].c
      : (await query('SELECT COUNT(*) as c FROM modules WHERE active = 1'))[0].c;

    const completed = usePostgres
      ? (await pgPool.query('SELECT COUNT(*) as c FROM user_progress WHERE user_id = $1 AND completed = TRUE', [userId])).rows[0].c
      : (await query('SELECT COUNT(*) as c FROM user_progress WHERE user_id = ? AND completed = 1', [userId]))[0].c;

    const progress = Math.round((completed / total) * 100);

    if (usePostgres) {
      await pgPool.query('UPDATE users SET progress = $1, completed_modules = $2 WHERE id = $3', [progress, completed, userId]);
    } else {
      await run('UPDATE users SET progress = ?, completed_modules = ? WHERE id = ?', [progress, completed, userId]);
    }

    if (progress >= 100) {
      const certDate = new Date();
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);
      if (usePostgres) {
        await pgPool.query('UPDATE users SET certificate_issued = TRUE, certificate_date = $1, certificate_expiry = $2 WHERE id = $3',
          [certDate, expiry, userId]);
      } else {
        await run('UPDATE users SET certificate_issued = 1, certificate_date = ?, certificate_expiry = ? WHERE id = ?',
          [certDate.toISOString(), expiry.toISOString(), userId]);
      }
    }

    res.json({ passed: true, progress, completed, total });
  } catch (err) {
    console.error('Error progress:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/progress', authMiddleware, async (req, res) => {
  try {
    const rows = usePostgres
      ? (await pgPool.query('SELECT module_id, completed FROM user_progress WHERE user_id = $1', [req.user.id])).rows
      : await query('SELECT module_id, completed FROM user_progress WHERE user_id = ?', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CERTIFICATE ====================
app.get('/api/certificate', authMiddleware, async (req, res) => {
  try {
    const rows = usePostgres
      ? (await pgPool.query('SELECT * FROM users WHERE id = $1', [req.user.id])).rows
      : await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!rows[0]?.certificate_issued) return res.status(400).json({ error: 'No certificado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ADMIN ====================
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const rows = usePostgres
      ? (await pgPool.query('SELECT * FROM users ORDER BY created_at DESC')).rows
      : await query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error admin users:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/users/search', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const q = req.query.q || '';
    let rows;
    if (usePostgres) {
      rows = (await pgPool.query(
        `SELECT * FROM users 
         WHERE document ILIKE $1 OR full_name ILIKE $1 
         ORDER BY created_at DESC`,
        [`%${q}%`]
      )).rows;
    } else {
      rows = await query(
        `SELECT * FROM users WHERE document LIKE ? OR full_name LIKE ? ORDER BY created_at DESC`,
        [`%${q}%`, `%${q}%`]
      );
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (usePostgres) {
      await pgPool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    } else {
      await run('DELETE FROM users WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/modules', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const mods = usePostgres
      ? (await pgPool.query('SELECT * FROM modules ORDER BY order_num')).rows
      : await query('SELECT * FROM modules ORDER BY order_num');
    for (const m of mods) {
      const vids = usePostgres
        ? (await pgPool.query('SELECT * FROM module_videos WHERE module_id = $1 ORDER BY order_num', [m.id])).rows
        : await query('SELECT * FROM module_videos WHERE module_id = ? ORDER BY order_num', [m.id]);
      m.videos = vids;
    }
    res.json(mods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/modules', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, video_url, document_url, image_url, order_num, active } = req.body;
    const result = usePostgres
      ? (await pgPool.query(
          'INSERT INTO modules (title, description, video_url, document_url, image_url, order_num, active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
          [title, description, video_url, document_url, image_url, order_num, active]
        )).rows[0]
      : await run('INSERT INTO modules (title, description, video_url, document_url, image_url, order_num, active) VALUES (?,?,?,?,?,?,?)',
          [title, description, video_url, document_url, image_url, order_num, active ? 1 : 0]);
    res.json({ id: result.id || result.lastID, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/modules/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, video_url, document_url, image_url, order_num, active } = req.body;
    if (usePostgres) {
      await pgPool.query(
        'UPDATE modules SET title=$1, description=$2, video_url=$3, document_url=$4, image_url=$5, order_num=$6, active=$7 WHERE id=$8',
        [title, description, video_url, document_url, image_url, order_num, active, req.params.id]
      );
    } else {
      await run('UPDATE modules SET title=?, description=?, video_url=?, document_url=?, image_url=?, order_num=?, active=? WHERE id=?',
        [title, description, video_url, document_url, image_url, order_num, active ? 1 : 0, req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/modules/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (usePostgres) {
      await pgPool.query('DELETE FROM modules WHERE id = $1', [req.params.id]);
    } else {
      await run('DELETE FROM modules WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/modules/:id/videos', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { video_url, order_num } = req.body;
    if (usePostgres) {
      await pgPool.query('INSERT INTO module_videos (module_id, video_url, order_num) VALUES ($1,$2,$3)',
        [req.params.id, video_url, order_num]);
    } else {
      await run('INSERT INTO module_videos (module_id, video_url, order_num) VALUES (?,?,?)',
        [req.params.id, video_url, order_num]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/modules/:id/videos/:vid', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (usePostgres) {
      await pgPool.query('DELETE FROM module_videos WHERE id = $1', [req.params.vid]);
    } else {
      await run('DELETE FROM module_videos WHERE id = ?', [req.params.vid]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/modules/:id/questions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { questions } = req.body;
    if (usePostgres) {
      await pgPool.query('DELETE FROM questions WHERE module_id = $1', [req.params.id]);
      for (const q of questions) {
        await pgPool.query(
          'INSERT INTO questions (module_id, question_text, option_a, option_b, option_c, option_d, correct_option, num_options, allow_multiple, question_video_url, question_doc_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
          [req.params.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.num_options || 4, q.allow_multiple || false, q.question_video_url, q.question_doc_url]
        );
      }
    } else {
      await run('DELETE FROM questions WHERE module_id = ?', [req.params.id]);
      for (const q of questions) {
        await run(
          'INSERT INTO questions (module_id, question_text, option_a, option_b, option_c, option_d, correct_option, num_options, allow_multiple, question_video_url, question_doc_url) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
          [req.params.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.num_options || 4, q.allow_multiple ? 1 : 0, q.question_video_url, q.question_doc_url]
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error POST questions:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let total, certified, avgProgress, expiring;
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    if (usePostgres) {
      total = (await pgPool.query('SELECT COUNT(*) as c FROM users')).rows[0].c;
      certified = (await pgPool.query('SELECT COUNT(*) as c FROM users WHERE certificate_issued = TRUE')).rows[0].c;
      avgProgress = (await pgPool.query('SELECT COALESCE(AVG(progress),0) as c FROM users')).rows[0].c;
      expiring = (await pgPool.query('SELECT COUNT(*) as c FROM users WHERE certificate_expiry BETWEEN $1 AND $2', [now, nextMonth])).rows[0].c;
    } else {
      total = (await query('SELECT COUNT(*) as c FROM users'))[0].c;
      certified = (await query('SELECT COUNT(*) as c FROM users WHERE certificate_issued = 1'))[0].c;
      avgProgress = (await query('SELECT COALESCE(AVG(progress),0) as c FROM users'))[0].c;
      expiring = (await query('SELECT COUNT(*) as c FROM users WHERE certificate_expiry BETWEEN ? AND ?', [now.toISOString(), nextMonth.toISOString()]))[0].c;
    }
    res.json({ total, certified, avgProgress: Math.round(avgProgress), expiring });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PUBLIC ====================
app.get('/api/public/certificate/:document', async (req, res) => {
  try {
    const rows = usePostgres
      ? (await pgPool.query('SELECT * FROM users WHERE document = $1 AND certificate_issued = TRUE', [req.params.document.toUpperCase()])).rows
      : await query('SELECT * FROM users WHERE document = ? AND certificate_issued = 1', [req.params.document.toUpperCase()]);
    if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== START ====================
initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Litoplas Academy v5.5.1 corriendo en puerto ${PORT} [${usePostgres ? 'POSTGRES' : 'SQLITE'}]`));
});
