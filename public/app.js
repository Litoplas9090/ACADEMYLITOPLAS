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

// ============================================
// SISTEMA DE TRADUCCIONES ES / EN / PT
// ============================================
const TRANSLATIONS = {
  es: {
    subtitle: "Capacitación en Seguridad Industrial para Visitantes y Contratistas",
    login_title: "Iniciar Sesión",
    register_title: "Registro de Nuevo Usuario",
    tab_login: "Iniciar Sesión",
    tab_register: "Registrarse",
    btn_login: "Ingresar",
    btn_register: "Crear Cuenta",
    btn_logout: "Cerrar Sesión",
    btn_back: "Volver al Curso",
    btn_download: "Descargar PDF",
    progress: "Progreso",
    quiz_title: "Cuestionario del Módulo",
    quiz_desc: "Responde todas las preguntas correctamente para avanzar. Necesitas mínimo 70%.",
    quiz_submit: "Enviar Respuestas",
    quiz_all_required: "Responde todas las preguntas antes de enviar",
    quiz_approved: "¡Felicidades! Aprobaste con {score}%. Avanzando...",
    quiz_failed: "Obtuviste {score}%. Necesitas mínimo 70% para aprobar. Intenta de nuevo.",
    module_completed: "✓ Este módulo ya ha sido completado",
    btn_next: "Continuar al siguiente módulo →",
    btn_cert: "🏆 Ver Certificado",
    btn_start_quiz: "Responder Cuestionario para continuar",
    cert_title: "CERTIFICADO",
    cert_subtitle: "Litoplas S.A. - Gestión de Riesgos y Seguridad Industrial",
    cert_to: "Otorgado a",
    cert_doc: "Documento",
    cert_text: "Por completar satisfactoriamente el programa de inducción en seguridad industrial para visitantes y contratistas, conforme a los estándares de Litoplas S.A.",
    cert_valid: "Vigente hasta",
    cert_issued: "Fecha de emisión",
    mod1_title: "Módulo 1: Introducción a la Seguridad Industrial",
    mod1_desc: "Conceptos básicos de seguridad en planta.",
    mod2_title: "Módulo 2: Identificación de Riesgos",
    mod2_desc: "Cómo identificar y reportar riesgos en el área de trabajo.",
    mod3_title: "Módulo 3: Uso de EPP",
    mod3_desc: "Elementos de Protección Personal obligatorios.",
    mod4_title: "Módulo 4: Procedimientos de Emergencia",
    mod4_desc: "Rutas de evacuación y puntos de encuentro.",
    mod5_title: "Módulo 5: Manejo de Sustancias Peligrosas",
    mod5_desc: "Protocolos para el manejo seguro de químicos.",
    mod6_title: "Módulo 6: Evaluación Final",
    mod6_desc: "Cuestionario de evaluación para certificación.",
    doc_placeholder: "Número de Documento",
    pass_placeholder: "Contraseña",
    name_placeholder: "Nombre Completo *",
    company_placeholder: "Empresa / Contratista",
    pass2_placeholder: "Confirmar Contraseña *",
    error_conn: "Error de conexión",
    error_login: "Error al iniciar sesión",
    error_register: "Error al registrar",
    welcome: "¡Bienvenido, {name}!",
    register_ok: "¡Registro exitoso! Bienvenido, {name}",
    doc_invalid: "El documento debe ser alfanumérico y tener entre 5 y 20 caracteres",
    pass_mismatch: "Las contraseñas no coinciden",
    pass_short: "La contraseña debe tener al menos 6 caracteres",
    required_fields: "Nombre, documento y contraseña son obligatorios",
    video_fallback: "⚠️ No se puede reproducir este video incrustado.",
    video_youtube: "▶️ Ver en YouTube",
    video_hint: "Si el video no carga, el dueño puede haber desactivado la reproducción incrustada. Contacta al administrador.",
    doc_module: "📄 Descargar documento del módulo",
    multi_hint: "✓ Puedes seleccionar varias respuestas",
    doc_question: "📄 Ver documento"
  },
  en: {
    subtitle: "Industrial Safety Training for Visitors and Contractors",
    login_title: "Log In",
    register_title: "New User Registration",
    tab_login: "Log In",
    tab_register: "Sign Up",
    btn_login: "Sign In",
    btn_register: "Create Account",
    btn_logout: "Log Out",
    btn_back: "Back to Course",
    btn_download: "Download PDF",
    progress: "Progress",
    quiz_title: "Module Quiz",
    quiz_desc: "Answer all questions correctly to advance. You need at least 70%.",
    quiz_submit: "Submit Answers",
    quiz_all_required: "Answer all questions before submitting",
    quiz_approved: "Congratulations! You passed with {score}%. Moving forward...",
    quiz_failed: "You got {score}%. You need at least 70% to pass. Try again.",
    module_completed: "✓ This module has already been completed",
    btn_next: "Continue to next module →",
    btn_cert: "🏆 View Certificate",
    btn_start_quiz: "Answer Quiz to continue",
    cert_title: "CERTIFICATE",
    cert_subtitle: "Litoplas S.A. - Risk Management and Industrial Safety",
    cert_to: "Awarded to",
    cert_doc: "Document",
    cert_text: "For successfully completing the industrial safety induction program for visitors and contractors, in accordance with Litoplas S.A. standards.",
    cert_valid: "Valid until",
    cert_issued: "Issued on",
    mod1_title: "Module 1: Introduction to Industrial Safety",
    mod1_desc: "Basic safety concepts in the plant.",
    mod2_title: "Module 2: Hazard Identification",
    mod2_desc: "How to identify and report hazards in the work area.",
    mod3_title: "Module 3: PPE Use",
    mod3_desc: "Mandatory Personal Protective Equipment.",
    mod4_title: "Module 4: Emergency Procedures",
    mod4_desc: "Evacuation routes and meeting points.",
    mod5_title: "Module 5: Hazardous Substances Handling",
    mod5_desc: "Protocols for safe handling of chemicals.",
    mod6_title: "Module 6: Final Assessment",
    mod6_desc: "Evaluation questionnaire for certification.",
    doc_placeholder: "Document Number",
    pass_placeholder: "Password",
    name_placeholder: "Full Name *",
    company_placeholder: "Company / Contractor",
    pass2_placeholder: "Confirm Password *",
    error_conn: "Connection error",
    error_login: "Error signing in",
    error_register: "Registration error",
    welcome: "Welcome, {name}!",
    register_ok: "Registration successful! Welcome, {name}",
    doc_invalid: "Document must be alphanumeric and between 5 and 20 characters",
    pass_mismatch: "Passwords do not match",
    pass_short: "Password must be at least 6 characters",
    required_fields: "Name, document and password are required",
    video_fallback: "⚠️ This embedded video cannot be played.",
    video_youtube: "▶️ Watch on YouTube",
    video_hint: "If the video does not load, the owner may have disabled embedded playback. Contact the administrator.",
    doc_module: "📄 Download module document",
    multi_hint: "✓ You can select multiple answers",
    doc_question: "📄 View document"
  },
  pt: {
    subtitle: "Treinamento em Segurança Industrial para Visitantes e Contratistas",
    login_title: "Entrar",
    register_title: "Cadastro de Novo Usuário",
    tab_login: "Entrar",
    tab_register: "Cadastrar-se",
    btn_login: "Entrar",
    btn_register: "Criar Conta",
    btn_logout: "Sair",
    btn_back: "Voltar ao Curso",
    btn_download: "Baixar PDF",
    progress: "Progresso",
    quiz_title: "Questionário do Módulo",
    quiz_desc: "Responda todas as perguntas corretamente para avançar. Você precisa de no mínimo 70%.",
    quiz_submit: "Enviar Respostas",
    quiz_all_required: "Responda todas as perguntas antes de enviar",
    quiz_approved: "Parabéns! Você foi aprovado com {score}%. Avançando...",
    quiz_failed: "Você obteve {score}%. Você precisa de no mínimo 70% para passar. Tente novamente.",
    module_completed: "✓ Este módulo já foi concluído",
    btn_next: "Continuar para o próximo módulo →",
    btn_cert: "🏆 Ver Certificado",
    btn_start_quiz: "Responder Questionário para continuar",
    cert_title: "CERTIFICADO",
    cert_subtitle: "Litoplas S.A. - Gestão de Riscos e Segurança Industrial",
    cert_to: "Concedido a",
    cert_doc: "Documento",
    cert_text: "Por completar satisfatoriamente o programa de indução em segurança industrial para visitantes e contratistas, de acordo com os padrões da Litoplas S.A.",
    cert_valid: "Válido até",
    cert_issued: "Data de emissão",
    mod1_title: "Módulo 1: Introdução à Segurança Industrial",
    mod1_desc: "Conceitos básicos de segurança na planta.",
    mod2_title: "Módulo 2: Identificação de Riscos",
    mod2_desc: "Como identificar e reportar riscos na área de trabalho.",
    mod3_title: "Módulo 3: Uso de EPI",
    mod3_desc: "Equipamentos de Proteção Individual obrigatórios.",
    mod4_title: "Módulo 4: Procedimentos de Emergência",
    mod4_desc: "Rotas de evacuação e pontos de encontro.",
    mod5_title: "Módulo 5: Manuseio de Substâncias Perigosas",
    mod5_desc: "Protocolos para o manuseio seguro de químicos.",
    mod6_title: "Módulo 6: Avaliação Final",
    mod6_desc: "Questionário de avaliação para certificação.",
    doc_placeholder: "Número do Documento",
    pass_placeholder: "Senha",
    name_placeholder: "Nome Completo *",
    company_placeholder: "Empresa / Contratista",
    pass2_placeholder: "Confirmar Senha *",
    error_conn: "Erro de conexão",
    error_login: "Erro ao entrar",
    error_register: "Erro ao cadastrar",
    welcome: "Bem-vindo, {name}!",
    register_ok: "Cadastro realizado com sucesso! Bem-vindo, {name}",
    doc_invalid: "O documento deve ser alfanumérico e ter entre 5 e 20 caracteres",
    pass_mismatch: "As senhas não coincidem",
    pass_short: "A senha deve ter pelo menos 6 caracteres",
    required_fields: "Nome, documento e senha são obrigatórios",
    video_fallback: "⚠️ Não é possível reproduzir este vídeo incorporado.",
    video_youtube: "▶️ Ver no YouTube",
    video_hint: "Se o vídeo não carregar, o proprietário pode ter desativado a reprodução incorporada. Entre em contato com o administrador.",
    doc_module: "📄 Baixar documento do módulo",
    multi_hint: "✓ Você pode selecionar várias respostas",
    doc_question: "📄 Ver documento"
  }
};

let currentLang = localStorage.getItem("litoplas_lang") || "es";

function t(key, params) {
  let text = TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS["es"][key] || key;
  if (params) {
    Object.keys(params).forEach(function(k) {
      text = text.replace("{" + k + "}", params[k]);
    });
  }
  return text;
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(function(el) {
    var key = el.getAttribute("data-i18n");
    if (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) {
      el.textContent = TRANSLATIONS[currentLang][key];
    }
  });
  var loginDoc = document.getElementById("login-document");
  if (loginDoc) loginDoc.placeholder = t("doc_placeholder");
  var loginPass = document.getElementById("login-password");
  if (loginPass) loginPass.placeholder = t("pass_placeholder");
  var regName = document.getElementById("reg-fullname");
  if (regName) regName.placeholder = t("name_placeholder");
  var regDoc = document.getElementById("reg-document");
  if (regDoc) regDoc.placeholder = t("doc_placeholder");
  var regComp = document.getElementById("reg-company");
  if (regComp) regComp.placeholder = t("company_placeholder");
  var regPass = document.getElementById("reg-password");
  if (regPass) regPass.placeholder = t("pass_placeholder");
  var regPass2 = document.getElementById("reg-password2");
  if (regPass2) regPass2.placeholder = t("pass2_placeholder");
  document.querySelectorAll(".lang-btn").forEach(function(btn) {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === currentLang);
  });
}

function setLang(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem("litoplas_lang", lang);
  applyTranslations();
  if (allModules.length > 0) renderActiveModule();
}
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
  console.log('[APP] Iniciando Litoplas Academy v5.5');
  applyTranslations();
  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { setLang(this.getAttribute('data-lang')); });
  });

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
  btnLogin.textContent = "Ingresando...";
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
      loginMsg.textContent = t("welcome", {name: data.user.full_name});
      loginMsg.className = 'msg success';
      setTimeout(() => {
        showDashboard();
        updateUserBar(data.user);
        loadCourseData();
      }, 800);
    } else {
      loginMsg.textContent = data.error || t("error_login");
      loginMsg.className = 'msg error';
    }
  } catch (err) {
    loginMsg.textContent = t("error_conn");
    loginMsg.className = 'msg error';
  } finally {
    btnLogin.textContent = t("btn_login");
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
    registerMsg.textContent = t("required_fields");
    registerMsg.className = 'msg error';
    return;
  }
  if (!/^[a-zA-Z0-9-]{5,20}$/i.test(documento)) {
    registerMsg.textContent = t("doc_invalid");
    registerMsg.className = 'msg error';
    return;
  }
  if (password !== password2) {
    registerMsg.textContent = t("pass_mismatch");
    registerMsg.className = 'msg error';
    return;
  }
  if (password.length < 6) {
    registerMsg.textContent = t("pass_short");
    registerMsg.className = 'msg error';
    return;
  }

  btnRegister.textContent = "Registrando...";
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
      registerMsg.textContent = t("register_ok", {name: data.user.full_name});
      registerMsg.className = 'msg success';
      setTimeout(() => {
        showDashboard();
        updateUserBar(data.user);
        loadCourseData();
      }, 1500);
    } else {
      registerMsg.textContent = data.error || t("error_register");
      registerMsg.className = 'msg error';
    }
  } catch (err) {
    registerMsg.textContent = t("error_conn");
    registerMsg.className = 'msg error';
  } finally {
    btnRegister.textContent = t("btn_register");
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

    // Forzar secuencialidad: siempre empezar en el primer módulo no completado
    const lastCompleted = getLastCompletedIndex();
    currentModuleIndex = lastCompleted + 1;
    if (currentModuleIndex >= allModules.length) currentModuleIndex = allModules.length - 1;
    if (currentModuleIndex < 0) currentModuleIndex = 0;

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
  html += '<span class="module-active-number">' + (currentLang === "en" ? "Module" : currentLang === "pt" ? "Módulo" : "Módulo") + ' ' + (currentModuleIndex + 1) + '</span>';
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
    html += '<a href="' + escapeHtml(mod.document_url) + '" target="_blank" class="btn-doc">' + t("doc_module") + '</a>';
    html += '</div>';
  }

  if (completed) {
    html += '<div class="module-completed-msg">' + t("module_completed") + '</div>';
    if (!isLast) {
      html += '<button id="btn-next-module" class="btn-primary">' + t("btn_next") + '</button>';
    } else {
      html += '<button id="btn-view-cert" class="btn-primary">' + t("btn_cert") + '</button>';
    }
  } else {
    html += '<div class="module-action-area">';
    html += '<button id="btn-start-quiz" class="btn-primary">' + t("btn_start_quiz") + '</button>';
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
    html += '<h3>' + t("quiz_title") + '</h3>';
    html += '<p>' + t("quiz_desc") + '</p>';
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
        html += '<p>' + t("video_fallback") + '</p>';
        if (qVideoId) {
          html += '<a href="https://www.youtube.com/watch?v=' + qVideoId + '" target="_blank" class="btn-doc">' + t("video_youtube") + '</a>';
        }
        html += '<p class="q-hint">' + t("video_hint") + '</p>';
        html += '</div>';
        html += '</div>';
      }

      // Documento de la pregunta
      if (q.document_url) {
        html += '<div class="question-doc">';
        html += '<a href="' + escapeHtml(q.document_url) + '" target="_blank" class="btn-doc-small">' + t("doc_question") + '</a>';
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
        html += '<p class="q-hint">' + t("multi_hint") + '</p>';
      }

      html += '</div>';
    });

    html += '</div>';
    html += '<button id="btn-submit-quiz" class="btn-primary">' + t("quiz_submit") + '</button>';
    html += '<p id="quiz-msg" class="msg"></p>';
    html += '</div>';

    quizSection.innerHTML = html;

    document.getElementById('btn-submit-quiz').addEventListener('click', function() {
      submitQuiz(moduleId, questions);
    });

  } catch (err) {
    quizSection.innerHTML = '<p class="msg error">' + t("error_conn") + '</p>';
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
    document.getElementById("quiz-msg").textContent = t("quiz_all_required");
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
      document.getElementById("quiz-msg").textContent = t("quiz_approved", {score: data.score});
      document.getElementById('quiz-msg').className = 'msg success';
      setTimeout(() => {
        completeModule(moduleId);
      }, 1500);
    } else {
      document.getElementById("quiz-msg").textContent = t("quiz_failed", {score: data.score});
      document.getElementById('quiz-msg').className = 'msg error';
    }
  } catch (err) {
    document.getElementById("quiz-msg").textContent = t("error_conn");
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
      certDate.textContent = t("cert_issued") + ": " + now.toLocaleDateString(currentLang === "en" ? "en-US" : currentLang === "pt" ? "pt-BR" : "es-CO", { day: "numeric", month: "long", year: "numeric" });
    }
  } catch (err) {
    console.error('Error cargando certificado:', err);
  }
}

function downloadCertificatePDF() {
  const element = document.getElementById('certificate-card');
  if (!element) return;

  const certSection = document.getElementById('certificate-section');
  const wasHidden = certSection ? certSection.classList.contains('hidden') : false;

  // Hacer visible temporalmente para que html2canvas pueda renderizarlo
  if (certSection && wasHidden) {
    certSection.classList.remove('hidden');
    certSection.style.position = 'absolute';
    certSection.style.left = '-9999px';
    certSection.style.top = '0';
  }

  // Forzar dimensiones exactas A4 para captura
  const originalWidth = element.style.width;
  const originalMaxWidth = element.style.maxWidth;
  element.style.width = '297mm';
  element.style.maxWidth = 'none';

  const opt = {
    margin: 0,
    filename: 'Certificado_Litoplas_' + (currentUser?.document || 'usuario') + '.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      logging: false,
      width: 1123,
      height: 794
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };

  html2pdf().set(opt).from(element).save().then(function() {
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
    if (certSection && wasHidden) {
      certSection.classList.add('hidden');
      certSection.style.position = '';
      certSection.style.left = '';
      certSection.style.top = '';
    }
  }).catch(function() {
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
    if (certSection && wasHidden) {
      certSection.classList.add('hidden');
      certSection.style.position = '';
      certSection.style.left = '';
      certSection.style.top = '';
    }
  });
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
