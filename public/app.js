// ============================================
// LITOPLAS ACADEMY - APP.JS v5.4
// Múltiples videos, preguntas con multimedia, respuestas múltiples
// ============================================

const API_URL = window.location.origin;
let currentToken = localStorage.getItem('litoplas_token');
let currentUser = null;
let allModules = [];
let userProgress = [];
let currentModuleIndex = 0;

// Helper: convertir URL de YouTube a embed (fallback si backend no lo hizo)
function toYouTubeEmbedClient(url) {
  if (!url) return '';
  if (url.includes('youtube-nocookie.com/embed/')) return url;
  if (url.includes('youtube.com/embed/')) {
    const m = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (m) return 'https://www.youtube-nocookie.com/embed/' + m[1] + '?rel=0&modestbranding=1';
  }
  let vid = '';
  const wm = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (wm) vid = wm[1];
  if (!vid) {
    const sm = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (sm) vid = sm[1];
  }
  if (!vid) {
    const ssm = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (ssm) vid = ssm[1];
  }
  if (!vid) {
    const lm = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
    if (lm) vid = lm[1];
  }
  if (vid) return 'https://www.youtube-nocookie.com/embed/' + vid + '?rel=0&modestbranding=1';
  return url;
}

function isValidYouTubeEmbed(url) {
  return url && url.includes('youtube-nocookie.com/embed/') && /embed\/([a-zA-Z0-9_-]{11})/.test(url);
}

const authSection = document.getElementById('auth-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const dashboard = document.getElementById('dashboard');
const courseView = document.getElementById('course-view');
const moduleNav = document.getElementById('module-nav');
const activeModule = document.getElementById('active-module');
const quizSection = document.getElementById('quiz-section');
const certificateSection = document.getElementById('certificate-section');

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');

const loginDocument = document.getElementById('login-document');
const loginPassword = document.getElementById('login-password');
const loginMsg = document.getElementById('login-msg');
const regFullname = document.getElementById('reg-fullname');
const regDocument = document.getElementById('reg-document');
const regCompany = document.getElementById('reg-company');
const regPassword = document.getElementById('reg-password');
const regPassword2 = document.getElementById('reg-password2');
const registerMsg = document.getElementById('register-msg');

const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const btnLogout = document.getElementById('btn-logout');
const btnDownloadCert = document.getElementById('btn-download-cert');
const btnBackCourse = document.getElementById('btn-back-course');

const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const userName = document.getElementById('user-name');

const certName = document.getElementById('cert-name');
const certDocument = document.getElementById('cert-document');
const certExpiry = document.getElementById('cert-expiry');
const certDate = document.getElementById('cert-date');

document.addEventListener('DOMContentLoaded', function() {
  console.log('[APP] Iniciando Litoplas Academy v5.4');

  tabLogin.addEventListener('click', showLogin);
  tabRegister.addEventListener('click', showRegister);
  btnLogin.addEventListener('click', doLogin);
  btnRegister.addEventListener('click', doRegister);
  btnLogout.addEventListener('click', doLogout);
  btnDownloadCert.addEventListener('click', downloadCertificatePDF);
  btnBackCourse.addEventListener('click', showCourse);

  loginPassword.addEventListener('keypress', function(e) { if (e.key === 'Enter') doLogin(); });
  regPassword2.addEventListener('keypress', function(e) { if (e.key === 'Enter') doRegister(); });

  if (currentToken) {
    showDashboard();
    loadCourseData();
  }
});

function showLogin() {
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
  loginMsg.textContent = '';
}

function showRegister() {
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
  registerMsg.textContent = '';
}

function showDashboard() {
  authSection.classList.add('hidden');
  dashboard.classList.remove('hidden');
  certificateSection.classList.add('hidden');
  courseView.classList.remove('hidden');
}

function showCourse() {
  certificateSection.classList.add('hidden');
  courseView.classList.remove('hidden');
  loadCourseData();
}

async function doLogin() {
  const documento = loginDocument.value.trim();
  const password = loginPassword.value;
  if (!documento || !password) {
    loginMsg.textContent = 'Ingresa documento y contraseña';
    loginMsg.className = 'msg error';
    return;
  }
  btnLogin.textContent = 'Ingresando...';
  btnLogin.disabled = true;
  loginMsg.textContent = '';

  try {
    const res = await fetch(API_URL + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document: documento, password: password })
    });
    const data = await res.json();
    if (data.success) {
      currentToken = data.token;
      currentUser = data.user;
      localStorage.setItem('litoplas_token', currentToken);
      loginMsg.textContent = '¡Bienvenido, ' + data.user.full_name + '!';
      loginMsg.className = 'msg success';
      setTimeout(() => {
        showDashboard();
        updateUserBar(data.user);
        loadCourseData();
      }, 800);
    } else {
      loginMsg.textContent = data.error || 'Error al iniciar sesión';
      loginMsg.className = 'msg error';
    }
  } catch (err) {
    loginMsg.textContent = 'Error de conexión';
    loginMsg.className = 'msg error';
  } finally {
    btnLogin.textContent = 'Ingresar';
    btnLogin.disabled = false;
  }
}

async function doRegister() {
  const fullname = regFullname.value.trim();
  const documento = regDocument.value.trim();
  const company = regCompany.value.trim();
  const password = regPassword.value;
  const password2 = regPassword2.value;

  if (!fullname || !documento || !password) {
    registerMsg.textContent = 'Nombre, documento y contraseña son obligatorios';
    registerMsg.className = 'msg error';
    return;
  }
  if (!/^[a-zA-Z0-9-]{5,20}$/i.test(documento)) {
    registerMsg.textContent = 'El documento debe ser alfanumérico y tener entre 5 y 20 caracteres';
    registerMsg.className = 'msg error';
    return;
  }
  if (password !== password2) {
    registerMsg.textContent = 'Las contraseñas no coinciden';
    registerMsg.className = 'msg error';
    return;
  }
  if (password.length < 6) {
    registerMsg.textContent = 'La contraseña debe tener al menos 6 caracteres';
    registerMsg.className = 'msg error';
    return;
  }

  btnRegister.textContent = 'Registrando...';
  btnRegister.disabled = true;
  registerMsg.textContent = '';

  try {
    const res = await fetch(API_URL + '/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullname, document: documento, email: '', company: company, password: password })
    });
    const data = await res.json();
    if (data.success) {
      currentToken = data.token;
      currentUser = data.user;
      localStorage.setItem('litoplas_token', currentToken);
      registerMsg.textContent = '¡Registro exitoso! Bienvenido, ' + data.user.full_name;
      registerMsg.className = 'msg success';
      setTimeout(() => {
        showDashboard();
        updateUserBar(data.user);
        loadCourseData();
      }, 1500);
    } else {
      registerMsg.textContent = data.error || 'Error al registrar';
      registerMsg.className = 'msg error';
    }
  } catch (err) {
    registerMsg.textContent = 'Error de conexión';
    registerMsg.className = 'msg error';
  } finally {
    btnRegister.textContent = 'Crear Cuenta';
    btnRegister.disabled = false;
  }
}

function doLogout() {
  localStorage.removeItem('litoplas_token');
  currentToken = null;
  currentUser = null;
  allModules = [];
  userProgress = [];
  authSection.classList.remove('hidden');
  dashboard.classList.add('hidden');
  certificateSection.classList.add('hidden');
  loginDocument.value = '';
  loginPassword.value = '';
  loginMsg.textContent = '';
  showLogin();
}

function updateUserBar(user) {
  userName.textContent = user.full_name;
  const pct = user.progress || 0;
  progressFill.style.width = pct + '%';
  progressText.textContent = pct + '%';
}

async function loadCourseData() {
  if (!currentToken) return;
  try {
    const [modRes, progRes] = await Promise.all([
      fetch(API_URL + '/api/modules'),
      fetch(API_URL + '/api/progress', { headers: { 'Authorization': 'Bearer ' + currentToken } })
    ]);
    allModules = await modRes.json();
    userProgress = await progRes.json();
    renderModuleNav();
    renderActiveModule();
  } catch (err) {
    console.error('Error cargando curso:', err);
  }
}

function isModuleCompleted(moduleId) {
  return userProgress.some(p => p.module_id == moduleId && p.completed);
}

function getLastCompletedIndex() {
  for (let i = allModules.length - 1; i >= 0; i--) {
    if (isModuleCompleted(allModules[i].id)) return i;
  }
  return -1;
}

function renderModuleNav() {
  moduleNav.innerHTML = '';
  const lastCompleted = getLastCompletedIndex();

  allModules.forEach((mod, idx) => {
    const completed = isModuleCompleted(mod.id);
    const isCurrent = idx === currentModuleIndex;
    const isLocked = idx > lastCompleted + 1;

    const btn = document.createElement('button');
    btn.className = 'nav-module-btn' + (completed ? ' completed' : '') + (isCurrent ? ' current' : '') + (isLocked ? ' locked' : '');
    btn.textContent = (idx + 1);
    btn.title = mod.title;
    if (!isLocked) {
      btn.addEventListener('click', function() {
        currentModuleIndex = idx;
        renderModuleNav();
        renderActiveModule();
      });
    }
    moduleNav.appendChild(btn);
  });
}

function renderActiveModule() {
  activeModule.innerHTML = '';
  quizSection.innerHTML = '';
  quizSection.classList.add('hidden');

  if (!allModules[currentModuleIndex]) return;
  const mod = allModules[currentModuleIndex];
  const completed = isModuleCompleted(mod.id);
  const isLast = currentModuleIndex === allModules.length - 1;

  const card = document.createElement('div');
  card.className = 'module-active-card';

  let html = '<div class="module-active-header">';
  html += '<span class="module-active-number">Módulo ' + (currentModuleIndex + 1) + '</span>';
  html += '<h2>' + escapeHtml(mod.title) + '</h2>';
  html += '</div>';
  html += '<p class="module-active-desc">' + escapeHtml(mod.description || '') + '</p>';

  // Múltiples videos
  if (mod.videos && mod.videos.length > 0) {
    mod.videos.forEach((vid, vidx) => {
      if (vid.video_url) {
        html += '<div class="video-container">';
        html += '<iframe src="' + escapeHtml(vid.video_url) + '" ';
        html += 'frameborder="0" ';
        html += 'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ';
        html += 'referrerpolicy="strict-origin-when-cross-origin" ';
        html += 'allowfullscreen ';
        html += 'loading="lazy" ';
        html += 'title="Video ' + (vidx + 1) + '"></iframe>';
        html += '</div>';
      }
    });
  }

  // Documento del módulo
  if (mod.document_url) {
    html += '<div class="module-document">';
    html += '<a href="' + escapeHtml(mod.document_url) + '" target="_blank" class="btn-doc">📄 Descargar documento del módulo</a>';
    html += '</div>';
  }

  if (completed) {
    html += '<div class="module-completed-msg">✓ Este módulo ya ha sido completado</div>';
    if (!isLast) {
      html += '<button id="btn-next-module" class="btn-primary">Continuar al siguiente módulo →</button>';
    } else {
      html += '<button id="btn-view-cert" class="btn-primary">🏆 Ver Certificado</button>';
    }
  } else {
    html += '<div class="module-action-area">';
    html += '<button id="btn-start-quiz" class="btn-primary">Responder Cuestionario para continuar</button>';
    html += '</div>';
  }

  card.innerHTML = html;
  activeModule.appendChild(card);

  const btnNext = document.getElementById('btn-next-module');
  if (btnNext) btnNext.addEventListener('click', function() {
    currentModuleIndex++;
    renderModuleNav();
    renderActiveModule();
  });

  const btnViewCert = document.getElementById('btn-view-cert');
  if (btnViewCert) btnViewCert.addEventListener('click', showCertificateView);

  const btnStartQuiz = document.getElementById('btn-start-quiz');
  if (btnStartQuiz) btnStartQuiz.addEventListener('click', function() {
    loadQuiz(mod.id);
  });
}

async function loadQuiz(moduleId) {
  quizSection.innerHTML = '<p>Cargando cuestionario...</p>';
  quizSection.classList.remove('hidden');

  try {
    const res = await fetch(API_URL + '/api/modules/' + moduleId + '/questions');
    const questions = await res.json();

    if (!questions || questions.length === 0) {
      await completeModule(moduleId);
      return;
    }

    let html = '<div class="quiz-card">';
    html += '<h3>Cuestionario del Módulo</h3>';
    html += '<p>Responde todas las preguntas correctamente para avanzar. Necesitas mínimo 70%.</p>';
    html += '<div class="quiz-questions">';

    questions.forEach((q, idx) => {
      html += '<div class="quiz-question" data-qid="' + q.id + '">';
      html += '<p class="q-text"><strong>' + (idx + 1) + '.</strong> ' + escapeHtml(q.question_text) + '</p>';

      // Video de la pregunta con fallback
      let qVideoUrl = q.video_url || '';
      if (qVideoUrl && !isValidYouTubeEmbed(qVideoUrl)) {
        qVideoUrl = toYouTubeEmbedClient(qVideoUrl);
      }
      if (qVideoUrl) {
        const qVideoId = qVideoUrl.match(/embed\/([a-zA-Z0-9_-]{11})/)?.[1] || '';
        html += '<div class="video-wrapper">';
        html += '<div class="question-video-container">';
        html += '<iframe src="' + escapeHtml(qVideoUrl) + '" frameborder="0" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
        html += '</div>';
        html += '<div class="video-fallback hidden">';
        html += '<p>⚠️ No se puede reproducir este video incrustado.</p>';
        if (qVideoId) {
          html += '<a href="https://www.youtube.com/watch?v=' + qVideoId + '" target="_blank" class="btn-doc">▶️ Ver en YouTube</a>';
        }
        html += '<p class="q-hint">Si el video no carga, el dueño puede haber desactivado la reproducción incrustada.</p>';
        html += '</div>';
        html += '</div>';
      }

      // Documento de la pregunta
      if (q.document_url) {
        html += '<div class="question-doc">';
        html += '<a href="' + escapeHtml(q.document_url) + '" target="_blank" class="btn-doc-small">📄 Ver documento</a>';
        html += '</div>';
      }

      const numOpts = q.num_options || 4;
      const isMultiple = q.allow_multiple;
      const inputType = isMultiple ? 'checkbox' : 'radio';

      const options = [
        { key: 'A', label: q.option_a },
        { key: 'B', label: q.option_b },
        { key: 'C', label: q.option_c },
        { key: 'D', label: q.option_d }
      ];

      options.slice(0, numOpts).forEach(opt => {
        html += '<label class="q-option">';
        html += '<input type="' + inputType + '" name="q_' + q.id + '" value="' + opt.key + '"> ';
        html += '<strong>' + opt.key + ')</strong> ' + escapeHtml(opt.label);
        html += '</label>';
      });

      if (isMultiple) {
        html += '<p class="q-hint">✓ Puedes seleccionar varias respuestas</p>';
      }

      html += '</div>';
    });

    html += '</div>';
    html += '<button id="btn-submit-quiz" class="btn-primary">Enviar Respuestas</button>';
    html += '<p id="quiz-msg" class="msg"></p>';
    html += '</div>';

    quizSection.innerHTML = html;

    document.getElementById('btn-submit-quiz').addEventListener('click', function() {
      submitQuiz(moduleId, questions);
    });

  } catch (err) {
    quizSection.innerHTML = '<p class="msg error">Error cargando cuestionario</p>';
  }
}

async function submitQuiz(moduleId, questions) {
  const answers = {};
  let allAnswered = true;

  questions.forEach(q => {
    const inputs = document.querySelectorAll('input[name="q_' + q.id + '"]:checked');
    if (inputs.length > 0) {
      if (q.allow_multiple) {
        answers[q.id] = Array.from(inputs).map(inp => inp.value);
      } else {
        answers[q.id] = inputs[0].value;
      }
    } else {
      allAnswered = false;
    }
  });

  if (!allAnswered) {
    document.getElementById('quiz-msg').textContent = 'Responde todas las preguntas antes de enviar';
    document.getElementById('quiz-msg').className = 'msg error';
    return;
  }

  try {
    const res = await fetch(API_URL + '/api/modules/' + moduleId + '/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + currentToken
      },
      body: JSON.stringify({ answers })
    });
    const data = await res.json();

    if (data.approved) {
      document.getElementById('quiz-msg').textContent = '¡Felicidades! Aprobaste con ' + data.score + '%. Avanzando...';
      document.getElementById('quiz-msg').className = 'msg success';
      setTimeout(() => {
        completeModule(moduleId);
      }, 1500);
    } else {
      document.getElementById('quiz-msg').textContent = 'Obtuviste ' + data.score + '%. Necesitas mínimo 70% para aprobar. Intenta de nuevo.';
      document.getElementById('quiz-msg').className = 'msg error';
    }
  } catch (err) {
    document.getElementById('quiz-msg').textContent = 'Error validando respuestas';
    document.getElementById('quiz-msg').className = 'msg error';
  }
}

async function completeModule(moduleId) {
  try {
    const res = await fetch(API_URL + '/api/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + currentToken
      },
      body: JSON.stringify({ module_id: moduleId })
    });
    const data = await res.json();

    if (data.success) {
      const progRes = await fetch(API_URL + '/api/progress', { headers: { 'Authorization': 'Bearer ' + currentToken } });
      userProgress = await progRes.json();
      updateUserBar({ progress: data.progress });
      renderModuleNav();
      renderActiveModule();

      if (data.certificate_issued) {
        setTimeout(() => {
          showCertificateView(data.certificate_expiry);
        }, 500);
      }
    }
  } catch (err) {
    alert('Error al guardar progreso: ' + err.message);
  }
}

async function showCertificateView(expiryDate) {
  courseView.classList.add('hidden');
  certificateSection.classList.remove('hidden');

  try {
    const res = await fetch(API_URL + '/api/public/certificate?document=' + encodeURIComponent(currentUser?.document || ''), {
      headers: { 'Authorization': 'Bearer ' + currentToken }
    });
    const userData = await res.json();

    if (userData) {
      certName.textContent = userData.full_name;
      certDocument.textContent = userData.document;
      const expiry = expiryDate || userData.certificate_expiry;
      if (expiry) {
        const d = new Date(expiry);
        certExpiry.textContent = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
      } else {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        certExpiry.textContent = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      const now = new Date();
      certDate.textContent = 'Fecha de emisión: ' + now.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  } catch (err) {
    console.error('Error cargando certificado:', err);
  }
}

function downloadCertificatePDF() {
  const element = document.getElementById('certificate-card');
  if (!element) return;
  const opt = {
    margin: 0,
    filename: 'Certificado_Litoplas_' + (currentUser?.document || 'usuario') + '.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    pagebreak: { mode: ['avoid-all', 'css'], before: '#cert-end-marker' }
  };
  html2pdf().set(opt).from(element).save();
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


// Detectar videos de YouTube que no cargaron (bloqueados por el dueño)
function detectBlockedVideos() {
  document.querySelectorAll('.video-wrapper').forEach(wrapper => {
    const container = wrapper.querySelector('.video-container, .question-video-container');
    const iframe = container ? container.querySelector('iframe') : null;
    const fallback = wrapper.querySelector('.video-fallback');
    if (iframe && fallback) {
      // Verificar si el iframe tiene contenido cargado (cross-origin limita acceso directo)
      // Usamos un timeout como heurística
      setTimeout(() => {
        fallback.classList.remove('hidden');
      }, 6000);
    }
  });
}

// Ejecutar al cargar DOM y después de renderizar módulos/preguntas
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectBlockedVideos);
} else {
  detectBlockedVideos();
}
