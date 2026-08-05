const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 10000;

// ============================================
// CONFIGURACIÓN DE BASE DE DATOS
// ============================================
let db;
let dbType = 'sqlite';
let pool;

const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL && DATABASE_URL.includes('postgres')) {
  try {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    dbType = 'postgres';
    console.log('✅ Modo PostgreSQL detectado (DATABASE_URL)');
  } catch (e) {
    console.log('⚠️ Error con PostgreSQL, usando SQLite:', e.message);
    dbType = 'sqlite';
  }
} else {
  console.log('⚠️ DATABASE_URL no encontrada, usando SQLite');
}

if (dbType === 'sqlite') {
  db = new sqlite3.Database('./litoplas_academy.db');
}

// ============================================
// HELMET CON CSP PARA YOUTUBE
// ============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://www.youtube.com", "https://s.ytimg.com", "https://www.youtube-nocookie.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://i.ytimg.com", "https://img.youtube.com"],
      connectSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
      childSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// VARIABLES DE ENTORNO
// ============================================
const JWT_SECRET = process.env.JWT_SECRET || 'litoplas-secret-default';
const ADMIN_USER = process.env.ADMIN_USER || 'litoplas_admin';
const ADMIN_PASS_HASH = process.env.ADMIN_PASS ? bcrypt.hashSync(process.env.ADMIN_PASS, 10) : bcrypt.hashSync('admin123', 10);

// ============================================
// HELPER: Convertir URL de YouTube a embed (nocookie)
// ============================================
function toYouTubeEmbed(url) {
  if (!url) return '';
  if (url.includes('youtube-nocookie.com/embed/')) return url;
  if (url.includes('youtube.com/embed/')) {
    const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return 'https://www.youtube-nocookie.com/embed/' + embedMatch[1];
  }
  let videoId = '';
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) videoId = watchMatch[1];
  if (!videoId) {
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) videoId = shortMatch[1];
  }
  if (!videoId) {
    const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) videoId = embedMatch[1];
  }
  if (videoId) {
    return 'https://www.youtube-nocookie.com/embed/' + videoId;
  }
  return url;
}

// ============================================
// INICIALIZACIÓN DE BASE DE DATOS
// ============================================
async function initDB() {
  if (dbType === 'postgres') {
    try {
      // Verificar si users tiene full_name
      const checkUsers = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'full_name'
      `);
      // Verificar si questions tiene option_a (columna clave del esquema correcto)
      const checkQuestions = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'option_a'
      `);

      if (checkUsers.rows.length === 0 || checkQuestions.rows.length === 0) {
        console.log('⚠️ Esquema incompleto o desactualizado. Recreando TODAS las tablas...');
        await pool.query('DROP TABLE IF EXISTS user_progress CASCADE');
        await pool.query('DROP TABLE IF EXISTS questions CASCADE');
        await pool.query('DROP TABLE IF EXISTS modules CASCADE');
        await pool.query('DROP TABLE IF EXISTS users CASCADE');
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          document VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255),
          company VARCHAR(255),
          password_hash VARCHAR(255) NOT NULL,
          progress INTEGER DEFAULT 0,
          completed_modules INTEGER DEFAULT 0,
          total_modules INTEGER DEFAULT 6,
          certificate_issued BOOLEAN DEFAULT FALSE,
          certificate_date TIMESTAMP,
          certificate_expiry TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS modules (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          video_url VARCHAR(500),
          document_url VARCHAR(500),
          image_url VARCHAR(500),
          order_num INTEGER DEFAULT 0,
          active BOOLEAN DEFAULT TRUE
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_progress (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          module_id INTEGER,
          completed BOOLEAN DEFAULT FALSE,
          completed_at TIMESTAMP
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS questions (
          id SERIAL PRIMARY KEY,
          module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
          question_text TEXT NOT NULL,
          option_a TEXT NOT NULL,
          option_b TEXT NOT NULL,
          option_c TEXT NOT NULL,
          option_d TEXT NOT NULL,
          correct_option VARCHAR(1) NOT NULL CHECK (correct_option IN ('A','B','C','D'))
        )
      `);

      // Insertar módulos iniciales si no existen
      const modCount = await pool.query('SELECT COUNT(*) FROM modules');
      if (parseInt(modCount.rows[0].count) === 0) {
        const modules = [
          ['Módulo 1: Introducción a la Seguridad Industrial', 'Conceptos básicos de seguridad en planta.', 'https://www.youtube.com/embed/VIDEO1', '', '', 1, true],
          ['Módulo 2: Identificación de Riesgos', 'Cómo identificar y reportar riesgos en el área de trabajo.', 'https://www.youtube.com/embed/VIDEO2', '', '', 2, true],
          ['Módulo 3: Uso de EPP', 'Elementos de Protección Personal obligatorios.', 'https://www.youtube.com/embed/VIDEO3', '', '', 3, true],
          ['Módulo 4: Procedimientos de Emergencia', 'Rutas de evacuación y puntos de encuentro.', 'https://www.youtube.com/embed/VIDEO4', '', '', 4, true],
          ['Módulo 5: Manejo de Sustancias Peligrosas', 'Protocolos para el manejo seguro de químicos.', 'https://www.youtube.com/embed/VIDEO5', '', '', 5, true],
          ['Módulo 6: Evaluación Final', 'Cuestionario de evaluación para certificación.', 'https://www.youtube.com/embed/VIDEO6', '', '', 6, true],
        ];
        for (const m of modules) {
          await pool.query(
            'INSERT INTO modules (title, description, video_url, document_url, image_url, order_num, active) VALUES ($1,$2,$3,$4,$5,$6,$7)',
            m
          );
        }
        console.log('✅ Módulos iniciales insertados');
      }
      console.log('✅ Base de datos PostgreSQL inicializada');
    } catch (err) {
      console.error('❌ Error init PostgreSQL:', err.message);
    }
  } else {
    // SQLite
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        document TEXT UNIQUE NOT NULL,
        email TEXT,
        company TEXT,
        password_hash TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        completed_modules INTEGER DEFAULT 0,
        total_modules INTEGER DEFAULT 6,
        certificate_issued INTEGER DEFAULT 0,
        certificate_date TEXT,
        certificate_expiry TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        video_url TEXT,
        document_url TEXT,
        image_url TEXT,
        order_num INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        module_id INTEGER,
        completed INTEGER DEFAULT 0,
        completed_at TEXT
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module_id INTEGER,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option TEXT NOT NULL CHECK(correct_option IN ('A','B','C','D'))
      )`);
      db.get('SELECT COUNT(*) as count FROM modules', (err, row) => {
        if (!err && row.count === 0) {
          const modules = [
            ['Módulo 1: Introducción a la Seguridad Industrial', 'Conceptos básicos de seguridad en planta.', 'https://www.youtube.com/embed/VIDEO1', '', '', 1, 1],
            ['Módulo 2: Identificación de Riesgos', 'Cómo identificar y reportar riesgos en el área de trabajo.', 'https://www.youtube.com/embed/VIDEO2', '', '', 2, 1],
            ['Módulo 3: Uso de EPP', 'Elementos de Protección Personal obligatorios.', 'https://www.youtube.com/embed/VIDEO3', '', '', 3, 1],
            ['Módulo 4: Procedimientos de Emergencia', 'Rutas de evacuación y puntos de encuentro.', 'https://www.youtube.com/embed/VIDEO4', '', '', 4, 1],
            ['Módulo 5: Manejo de Sustancias Peligrosas', 'Protocolos para el manejo seguro de químicos.', 'https://www.youtube.com/embed/VIDEO5', '', '', 5, 1],
            ['Módulo 6: Evaluación Final', 'Cuestionario de evaluación para certificación.', 'https://www.youtube.com/embed/VIDEO6', '', '', 6, 1],
          ];
          const stmt = db.prepare('INSERT INTO modules (title, description, video_url, document_url, image_url, order_num, active) VALUES (?,?,?,?,?,?,?)');
          for (const m of modules) stmt.run(m);
          stmt.finalize();
          console.log('✅ Módulos iniciales insertados (SQLite)');
        }
      });
      console.log('✅ Base de datos SQLite inicializada');
    });
  }
}

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// ============================================
// ENDPOINTS DE AUTENTICACIÓN
// ============================================

app.post('/api/register', async (req, res) => {
  try {
    const { full_name, document, email, company, password } = req.body;
    if (!full_name || !document || !password) {
      return res.status(400).json({ error: 'Nombre, documento y contraseña son obligatorios' });
    }
    const hash = await bcrypt.hash(password, 10);

    if (dbType === 'postgres') {
      const exists = await pool.query('SELECT id FROM users WHERE document = $1', [document]);
      if (exists.rows.length > 0) return res.status(400).json({ error: 'El documento ya está registrado' });
      const result = await pool.query(
        'INSERT INTO users (full_name, document, email, company, password_hash) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [full_name, document, email || '', company || '', hash]
      );
      const token = jwt.sign({ userId: result.rows[0].id, document }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ success: true, token, user: { id: result.rows[0].id, full_name, document } });
    } else {
      db.get('SELECT id FROM users WHERE document = ?', [document], (err, row) => {
        if (row) return res.status(400).json({ error: 'El documento ya está registrado' });
        db.run(
          'INSERT INTO users (full_name, document, email, company, password_hash) VALUES (?,?,?,?,?)',
          [full_name, document, email || '', company || '', hash],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            const token = jwt.sign({ userId: this.lastID, document }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ success: true, token, user: { id: this.lastID, full_name, document } });
          }
        );
      });
    }
  } catch (err) {
    console.error('Error en /api/register:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { document, password } = req.body;
    if (dbType === 'postgres') {
      const result = await pool.query('SELECT * FROM users WHERE document = $1', [document]);
      if (result.rows.length === 0) return res.status(400).json({ error: 'Usuario no encontrado' });
      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(400).json({ error: 'Contraseña incorrecta' });
      const token = jwt.sign({ userId: user.id, document: user.document }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ success: true, token, user: { id: user.id, full_name: user.full_name, document: user.document, progress: user.progress, completed_modules: user.completed_modules, total_modules: user.total_modules, certificate_issued: user.certificate_issued, certificate_expiry: user.certificate_expiry } });
    } else {
      db.get('SELECT * FROM users WHERE document = ?', [document], async (err, user) => {
        if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(400).json({ error: 'Contraseña incorrecta' });
        const token = jwt.sign({ userId: user.id, document: user.document }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token, user: { id: user.id, full_name: user.full_name, document: user.document, progress: user.progress, completed_modules: user.completed_modules, total_modules: user.total_modules, certificate_issued: user.certificate_issued, certificate_expiry: user.certificate_expiry } });
      });
    }
  } catch (err) {
    console.error('Error en /api/login:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username !== ADMIN_USER) return res.status(401).json({ error: 'Usuario incorrecto' });
    const valid = await bcrypt.compare(password, ADMIN_PASS_HASH);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ success: true, token });
  } catch (err) {
    console.error('Error en /api/admin/login:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ENDPOINTS DE MÓDULOS
// ============================================

app.get('/api/modules', async (req, res) => {
  try {
    if (dbType === 'postgres') {
      const result = await pool.query('SELECT * FROM modules WHERE active = TRUE ORDER BY order_num');
      result.rows.forEach(m => { m.video_url = toYouTubeEmbed(m.video_url); });
      res.json(result.rows);
    } else {
      db.all('SELECT * FROM modules WHERE active = 1 ORDER BY order_num', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        rows.forEach(m => { m.video_url = toYouTubeEmbed(m.video_url); });
        res.json(rows);
      });
    }
  } catch (err) {
    console.error('Error en /api/modules:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/modules/:id', async (req, res) => {
  try {
    const moduleId = req.params.id;
    let module, questions;

    if (dbType === 'postgres') {
      const modRes = await pool.query('SELECT * FROM modules WHERE id = $1', [moduleId]);
      module = modRes.rows[0];
      if (module) module.video_url = toYouTubeEmbed(module.video_url);
      const qRes = await pool.query('SELECT * FROM questions WHERE module_id = $1 ORDER BY id', [moduleId]);
      questions = qRes.rows;
    } else {
      module = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM modules WHERE id = ?', [moduleId], (err, row) => {
          if (err) reject(err); else resolve(row);
        });
      });
      if (module) module.video_url = toYouTubeEmbed(module.video_url);
      questions = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM questions WHERE module_id = ? ORDER BY id', [moduleId], (err, rows) => {
          if (err) reject(err); else resolve(rows);
        });
      });
    }

    res.json({ module, questions: questions || [] });
  } catch (err) {
    console.error('Error en /api/modules/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ENDPOINTS DE PROGRESO
// ============================================

app.get('/api/progress', authMiddleware, async (req, res) => {
  try {
    if (dbType === 'postgres') {
      const result = await pool.query('SELECT * FROM user_progress WHERE user_id = $1', [req.user.userId]);
      res.json(result.rows);
    } else {
      db.all('SELECT * FROM user_progress WHERE user_id = ?', [req.user.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    }
  } catch (err) {
    console.error('Error en /api/progress:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/progress', authMiddleware, async (req, res) => {
  try {
    const { module_id } = req.body;
    const userId = req.user.userId;

    if (dbType === 'postgres') {
      const exists = await pool.query('SELECT id FROM user_progress WHERE user_id = $1 AND module_id = $2', [userId, module_id]);
      if (exists.rows.length === 0) {
        await pool.query('INSERT INTO user_progress (user_id, module_id, completed, completed_at) VALUES ($1,$2,TRUE,NOW())', [userId, module_id]);
      } else {
        await pool.query('UPDATE user_progress SET completed = TRUE, completed_at = NOW() WHERE user_id = $1 AND module_id = $2', [userId, module_id]);
      }
      const count = await pool.query('SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND completed = TRUE', [userId]);
      const total = await pool.query('SELECT COUNT(*) FROM modules WHERE active = TRUE');
      const completed = parseInt(count.rows[0].count);
      const totalModules = parseInt(total.rows[0].count);
      const progress = totalModules > 0 ? Math.round((completed / totalModules) * 100) : 0;

      let certData = {};
      if (completed === totalModules && totalModules > 0) {
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        await pool.query('UPDATE users SET certificate_issued = TRUE, certificate_date = NOW(), certificate_expiry = $1, completed_modules = $2, progress = $3 WHERE id = $4', [expiry, completed, progress, userId]);
        certData = { certificate_issued: true, certificate_expiry: expiry };
      } else {
        await pool.query('UPDATE users SET completed_modules = $1, progress = $2 WHERE id = $3', [completed, progress, userId]);
      }

      res.json({ success: true, progress, completed_modules: completed, total_modules: totalModules, ...certData });
    } else {
      db.get('SELECT id FROM user_progress WHERE user_id = ? AND module_id = ?', [userId, module_id], (err, row) => {
        if (!row) {
          db.run('INSERT INTO user_progress (user_id, module_id, completed, completed_at) VALUES (?,?,1,datetime("now"))', [userId, module_id]);
        } else {
          db.run('UPDATE user_progress SET completed = 1, completed_at = datetime("now") WHERE user_id = ? AND module_id = ?', [userId, module_id]);
        }
        db.get('SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND completed = 1', [userId], (err, countRow) => {
          db.get('SELECT COUNT(*) as total FROM modules WHERE active = 1', [], (err, totalRow) => {
            const completed = countRow ? countRow.count : 0;
            const totalModules = totalRow ? totalRow.total : 6;
            const progress = totalModules > 0 ? Math.round((completed / totalModules) * 100) : 0;

            if (completed === totalModules && totalModules > 0) {
              const expiry = new Date();
              expiry.setFullYear(expiry.getFullYear() + 1);
              db.run('UPDATE users SET certificate_issued = 1, certificate_date = datetime("now"), certificate_expiry = ?, completed_modules = ?, progress = ? WHERE id = ?', [expiry.toISOString(), completed, progress, userId]);
              res.json({ success: true, progress, completed_modules: completed, total_modules: totalModules, certificate_issued: true, certificate_expiry: expiry });
            } else {
              db.run('UPDATE users SET completed_modules = ?, progress = ? WHERE id = ?', [completed, progress, userId]);
              res.json({ success: true, progress, completed_modules: completed, total_modules: totalModules });
            }
          });
        });
      });
    }
  } catch (err) {
    console.error('Error en /api/progress:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ENDPOINTS DE PREGUNTAS
// ============================================

app.get('/api/modules/:id/questions', async (req, res) => {
  try {
    const moduleId = req.params.id;
    if (dbType === 'postgres') {
      const result = await pool.query('SELECT id, question_text, option_a, option_b, option_c, option_d FROM questions WHERE module_id = $1 ORDER BY id', [moduleId]);
      res.json(result.rows);
    } else {
      db.all('SELECT id, question_text, option_a, option_b, option_c, option_d FROM questions WHERE module_id = ? ORDER BY id', [moduleId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    }
  } catch (err) {
    console.error('Error en /api/modules/:id/questions:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/modules/:id/validate', authMiddleware, async (req, res) => {
  try {
    const moduleId = req.params.id;
    const { answers } = req.body;

    let questions;
    if (dbType === 'postgres') {
      const result = await pool.query('SELECT id, correct_option FROM questions WHERE module_id = $1', [moduleId]);
      questions = result.rows;
    } else {
      questions = await new Promise((resolve, reject) => {
        db.all('SELECT id, correct_option FROM questions WHERE module_id = ?', [moduleId], (err, rows) => {
          if (err) reject(err); else resolve(rows);
        });
      });
    }

    if (!questions || questions.length === 0) {
      return res.json({ success: true, approved: true, score: 100, total: 0, correct: 0 });
    }

    let correct = 0;
    questions.forEach(q => {
      if (answers && answers[q.id] === q.correct_option) correct++;
    });

    const score = Math.round((correct / questions.length) * 100);
    const approved = score >= 70;

    res.json({ success: true, approved, score, total: questions.length, correct });
  } catch (err) {
    console.error('Error en /api/modules/:id/validate:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/modules/:id/questions', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    const moduleId = req.params.id;
    if (dbType === 'postgres') {
      const result = await pool.query('SELECT * FROM questions WHERE module_id = $1 ORDER BY id', [moduleId]);
      res.json(result.rows);
    } else {
      db.all('SELECT * FROM questions WHERE module_id = ? ORDER BY id', [moduleId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    }
  } catch (err) {
    console.error('Error en /api/admin/modules/:id/questions:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/modules/:id/questions', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    const moduleId = req.params.id;
    const { questions } = req.body;

    if (dbType === 'postgres') {
      const modCheck = await pool.query('SELECT id FROM modules WHERE id = $1', [moduleId]);
      if (modCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Módulo no encontrado' });
      }
      await pool.query('DELETE FROM questions WHERE module_id = $1', [moduleId]);
      for (const q of questions) {
        if (!q.question_text) continue;
        await pool.query(
          'INSERT INTO questions (module_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [moduleId, q.question_text, q.option_a || '', q.option_b || '', q.option_c || '', q.option_d || '', q.correct_option || 'A']
        );
      }
    } else {
      const modCheck = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM modules WHERE id = ?', [moduleId], (err, row) => {
          if (err) reject(err); else resolve(row);
        });
      });
      if (!modCheck) return res.status(404).json({ error: 'Módulo no encontrado' });
      db.run('DELETE FROM questions WHERE module_id = ?', [moduleId]);
      const stmt = db.prepare('INSERT INTO questions (module_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES (?,?,?,?,?,?,?)');
      for (const q of questions) {
        if (!q.question_text) continue;
        stmt.run(moduleId, q.question_text, q.option_a || '', q.option_b || '', q.option_c || '', q.option_d || '', q.correct_option || 'A');
      }
      stmt.finalize();
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error en POST /api/admin/modules/:id/questions:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ENDPOINTS DE ADMIN
// ============================================

app.get('/api/admin/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    if (dbType === 'postgres') {
      const result = await pool.query('SELECT id, full_name, document, email, company, progress, completed_modules, total_modules, certificate_issued, certificate_date, certificate_expiry, created_at FROM users ORDER BY created_at DESC');
      res.json(result.rows);
    } else {
      db.all('SELECT id, full_name, document, email, company, progress, completed_modules, total_modules, certificate_issued, certificate_date, certificate_expiry, created_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    }
  } catch (err) {
    console.error('Error en /api/admin/users:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/users/search', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    const { document } = req.query;
    if (dbType === 'postgres') {
      const result = await pool.query('SELECT id, full_name, document, email, company, progress, completed_modules, total_modules, certificate_issued, certificate_date, certificate_expiry, created_at FROM users WHERE document = $1', [document]);
      res.json(result.rows);
    } else {
      db.all('SELECT id, full_name, document, email, company, progress, completed_modules, total_modules, certificate_issued, certificate_date, certificate_expiry, created_at FROM users WHERE document = ?', [document], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    }
  } catch (err) {
    console.error('Error en /api/admin/users/search:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/certificate/:userId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    const { userId } = req.params;
    if (dbType === 'postgres') {
      const result = await pool.query('SELECT full_name, document, certificate_issued, certificate_date, certificate_expiry FROM users WHERE id = $1', [userId]);
      res.json(result.rows[0] || {});
    } else {
      db.get('SELECT full_name, document, certificate_issued, certificate_date, certificate_expiry FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || {});
      });
    }
  } catch (err) {
    console.error('Error en /api/admin/certificate:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/public/certificate', async (req, res) => {
  try {
    const { document } = req.query;
    if (dbType === 'postgres') {
      const result = await pool.query('SELECT full_name, document, certificate_issued, certificate_date, certificate_expiry FROM users WHERE document = $1', [document]);
      res.json(result.rows[0] || null);
    } else {
      db.get('SELECT full_name, document, certificate_issued, certificate_date, certificate_expiry FROM users WHERE document = ?', [document], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || null);
      });
    }
  } catch (err) {
    console.error('Error en /api/public/certificate:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/modules', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    const { modules } = req.body;

    if (dbType === 'postgres') {
      await pool.query('DELETE FROM modules');
      await pool.query('ALTER SEQUENCE IF EXISTS modules_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE IF EXISTS questions_id_seq RESTART WITH 1');

      for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        await pool.query(
          'INSERT INTO modules (title, description, video_url, document_url, image_url, order_num, active) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [m.title, m.description, toYouTubeEmbed(m.video_url), m.document_url, m.image_url, i + 1, m.active !== false]
        );
      }

      const fresh = await pool.query('SELECT * FROM modules WHERE active = TRUE ORDER BY order_num');
      fresh.rows.forEach(m => { m.video_url = toYouTubeEmbed(m.video_url); });
      res.json({ success: true, modules: fresh.rows });
    } else {
      db.run('DELETE FROM modules');
      db.run('DELETE FROM sqlite_sequence WHERE name = "modules"');
      db.run('DELETE FROM sqlite_sequence WHERE name = "questions"');

      const stmt = db.prepare('INSERT INTO modules (title, description, video_url, document_url, image_url, order_num, active) VALUES (?,?,?,?,?,?,?)');
      for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        stmt.run(m.title, m.description, toYouTubeEmbed(m.video_url), m.document_url, m.image_url, i + 1, m.active !== false ? 1 : 0);
      }
      stmt.finalize();

      db.all('SELECT * FROM modules WHERE active = 1 ORDER BY order_num', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        rows.forEach(m => { m.video_url = toYouTubeEmbed(m.video_url); });
        res.json({ success: true, modules: rows });
      });
    }
  } catch (err) {
    console.error('Error en /api/admin/modules:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/reset-password', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    const { userId, newPassword } = req.body;
    const hash = await bcrypt.hash(newPassword, 10);
    if (dbType === 'postgres') {
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
    } else {
      db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error en /api/admin/reset-password:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
initDB().then(() => {
  app.listen(PORT, () => {
    console.log('🚀 Litoplas Academy v5.3.2 corriendo en puerto ' + PORT + ' [' + dbType.toUpperCase() + ']');
  });
});
