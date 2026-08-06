// ============================================
// LITOPLAS ACADEMY - APP.JS v5.5.4
// Traducciones ES/EN/PT, documento alfanumérico, colores Litoplas
// ============================================

const API_URL = window.location.origin;
let currentToken = localStorage.getItem('litoplas_token');
let currentUser = null;
let allModules = [];
let userProgress = [];
let currentModuleIndex = 0;
let currentLang = localStorage.getItem('litoplas_lang') || 'es';

// ==================== TRADUCCIONES ====================
const translations = {
  es: {
    header_subtitle: "Capacitación en Seguridad Industrial para Visitantes y Contratistas",
    tab_login: "Iniciar Sesión",
    tab_register: "Registrarse",
    login_title: "Iniciar Sesión",
    register_title: "Registro de Nuevo Usuario",
    ph_document: "Documento / ID",
    ph_password: "Contraseña",
    ph_fullname: "Nombre Completo *",
    ph_document2: "Documento (pasaporte, cédula, etc.) *",
    ph_company: "Empresa / Contratista",
    ph_password2: "Confirmar Contraseña *",
    btn_login: "Ingresar",
    btn_register: "Crear Cuenta",
    btn_logout: "Cerrar Sesión",
    btn_download: "📄 Descargar PDF",
    btn_back: "Volver al Curso",
    privacy_text1: "He leído y acepto la",
    privacy_link: "Política de Privacidad y Tratamiento de Datos Personales",
    privacy_text2: "de Litoplas S.A. Autorizo el tratamiento de mis datos personales para las finalidades descritas.",
    footer_privacy: "Litoplas S.A. es responsable del tratamiento de sus datos personales conforme a la Ley 1581 de 2012.",
    cert_title: "Certificado de Finalización",
    cert_subtitle: "Litoplas S.A. - Gestión de Riesgos y Seguridad Industrial",
    cert_label_name: "Otorgado a",
    cert_label_doc: "Documento",
    cert_text: "Por completar satisfactoriamente el programa de inducción en seguridad industrial para visitantes y contratistas, conforme a los estándares de Litoplas S.A.",
    cert_label_expiry: "Vigente hasta",
    cert_date_prefix: "Fecha de emisión:",
    quiz_title: "Cuestionario del Módulo",
    quiz_instruction: "Responde todas las preguntas correctamente para avanzar. Necesitas mínimo 70%.",
    quiz_hint_multiple: "✓ Puedes seleccionar varias respuestas",
    btn_submit_quiz: "Enviar Respuestas",
    quiz_all_required: "Responde todas las preguntas antes de enviar",
    quiz_approved: "¡Felicidades! Aprobaste con",
    quiz_approved_suffix: "Avanzando...",
    quiz_failed: "Obtuviste",
    quiz_failed_suffix: "Necesitas mínimo 70% para aprobar. Intenta de nuevo.",
    module_completed: "✓ Este módulo ya ha sido completado",
    btn_next_module: "Continuar al siguiente módulo →",
    btn_view_cert: "🏆 Ver Certificado",
    btn_start_quiz: "Responder Cuestionario para continuar",
    btn_doc: "📄 Descargar documento del módulo",
    btn_doc_small: "📄 Ver documento",
    error_login: "Error al iniciar sesión",
    error_register: "Error al registrar",
    error_connection: "Error de conexión",
    error_password_match: "Las contraseñas no coinciden",
    error_password_length: "La contraseña debe tener al menos 6 caracteres",
    error_document_format: "El documento debe tener entre 3 y 20 caracteres alfanuméricos",
    error_required_fields: "Nombre, documento y contraseña son obligatorios",
    error_privacy_required: "Debes aceptar la Política de Privacidad para registrarte.",
    welcome_back: "¡Bienvenido",
    register_success: "¡Registro exitoso! Bienvenido",
    progress_suffix: "completado",
    module_prefix: "Módulo",
    no_questions_auto: "No hay preguntas. El módulo se aprobará automáticamente.",
    loading_quiz: "Cargando cuestionario...",
    quiz_error: "Error cargando cuestionario",
    validating_error: "Error validando respuestas",
    progress_error: "Error al guardar progreso",
    cert_error: "Error cargando certificado",
    user_not_found: "Usuario no encontrado",
    wrong_password: "Contraseña incorrecta",
    document_registered: "El documento ya está registrado"
  },
  en: {
    header_subtitle: "Industrial Safety Training for Visitors and Contractors",
    tab_login: "Sign In",
    tab_register: "Register",
    login_title: "Sign In",
    register_title: "New User Registration",
    ph_document: "Document / ID",
    ph_password: "Password",
    ph_fullname: "Full Name *",
    ph_document2: "Document (passport, ID, etc.) *",
    ph_company: "Company / Contractor",
    ph_password2: "Confirm Password *",
    btn_login: "Sign In",
    btn_register: "Create Account",
    btn_logout: "Logout",
    btn_download: "📄 Download PDF",
    btn_back: "Back to Course",
    privacy_text1: "I have read and accept the",
    privacy_link: "Privacy Policy and Personal Data Treatment",
    privacy_text2: "of Litoplas S.A. I authorize the processing of my personal data for the described purposes.",
    footer_privacy: "Litoplas S.A. is responsible for the processing of your personal data in accordance with Law 1581 of 2012.",
    cert_title: "Completion Certificate",
    cert_subtitle: "Litoplas S.A. - Risk Management and Industrial Safety",
    cert_label_name: "Awarded to",
    cert_label_doc: "Document",
    cert_text: "For satisfactorily completing the industrial safety induction program for visitors and contractors, in accordance with Litoplas S.A. standards.",
    cert_label_expiry: "Valid until",
    cert_date_prefix: "Issue date:",
    quiz_title: "Module Quiz",
    quiz_instruction: "Answer all questions correctly to advance. You need at least 70%.",
    quiz_hint_multiple: "✓ You can select multiple answers",
    btn_submit_quiz: "Submit Answers",
    quiz_all_required: "Answer all questions before submitting",
    quiz_approved: "Congratulations! You passed with",
    quiz_approved_suffix: "Advancing...",
    quiz_failed: "You got",
    quiz_failed_suffix: "You need at least 70% to pass. Try again.",
    module_completed: "✓ This module has already been completed",
    btn_next_module: "Continue to next module →",
    btn_view_cert: "🏆 View Certificate",
    btn_start_quiz: "Answer Quiz to continue",
    btn_doc: "📄 Download module document",
    btn_doc_small: "📄 View document",
    error_login: "Sign in error",
    error_register: "Registration error",
    error_connection: "Connection error",
    error_password_match: "Passwords do not match",
    error_password_length: "Password must be at least 6 characters",
    error_document_format: "Document must be between 3 and 20 alphanumeric characters",
    error_required_fields: "Name, document and password are required",
    error_privacy_required: "You must accept the Privacy Policy to register.",
    welcome_back: "Welcome",
    register_success: "Registration successful! Welcome",
    progress_suffix: "completed",
    module_prefix: "Module",
    no_questions_auto: "No questions. The module will be approved automatically.",
    loading_quiz: "Loading quiz...",
    quiz_error: "Error loading quiz",
    validating_error: "Error validating answers",
    progress_error: "Error saving progress",
    cert_error: "Error loading certificate",
    user_not_found: "User not found",
    wrong_password: "Incorrect password",
    document_registered: "Document already registered"
  },
  pt: {
    header_subtitle: "Treinamento de Segurança Industrial para Visitantes e Contratistas",
    tab_login: "Entrar",
    tab_register: "Cadastrar",
    login_title: "Entrar",
    register_title: "Cadastro de Novo Usuário",
    ph_document: "Documento / ID",
    ph_password: "Senha",
    ph_fullname: "Nome Completo *",
    ph_document2: "Documento (passaporte, RG, etc.) *",
    ph_company: "Empresa / Contratista",
    ph_password2: "Confirmar Senha *",
    btn_login: "Entrar",
    btn_register: "Criar Conta",
    btn_logout: "Sair",
    btn_download: "📄 Baixar PDF",
    btn_back: "Voltar ao Curso",
    privacy_text1: "Li e aceito a",
    privacy_link: "Política de Privacidade e Tratamento de Dados Pessoais",
    privacy_text2: "da Litoplas S.A. Autorizo o tratamento dos meus dados pessoais para as finalidades descritas.",
    footer_privacy: "Litoplas S.A. é responsável pelo tratamento dos seus dados pessoais de acordo com a Lei 1581 de 2012.",
    cert_title: "Certificado de Conclusão",
    cert_subtitle: "Litoplas S.A. - Gestão de Riscos e Segurança Industrial",
    cert_label_name: "Concedido a",
    cert_label_doc: "Documento",
    cert_text: "Por completar satisfatoriamente o programa de indução em segurança industrial para visitantes e contratistas, de acordo com os padrões da Litoplas S.A.",
    cert_label_expiry: "Válido até",
    cert_date_prefix: "Data de emissão:",
    quiz_title: "Questionário do Módulo",
    quiz_instruction: "Responda todas as perguntas corretamente para avançar. Você precisa de no mínimo 70%.",
    quiz_hint_multiple: "✓ Você pode selecionar várias respostas",
    btn_submit_quiz: "Enviar Respostas",
    quiz_all_required: "Responda todas as perguntas antes de enviar",
    quiz_approved: "Parabéns! Você foi aprovado com",
    quiz_approved_suffix: "Avançando...",
    quiz_failed: "Você obteve",
    quiz_failed_suffix: "Você precisa de no mínimo 70% para passar. Tente novamente.",
    module_completed: "✓ Este módulo já foi concluído",
    btn_next_module: "Continuar para o próximo módulo →",
    btn_view_cert: "🏆 Ver Certificado",
    btn_start_quiz: "Responder Questionário para continuar",
    btn_doc: "📄 Baixar documento do módulo",
    btn_doc_small: "📄 Ver documento",
    error_login: "Erro ao entrar",
    error_register: "Erro no cadastro",
    error_connection: "Erro de conexão",
    error_password_match: "As senhas não coincidem",
    error_password_length: "A senha deve ter pelo menos 6 caracteres",
    error_document_format: "O documento deve ter entre 3 e 20 caracteres alfanuméricos",
    error_required_fields: "Nome, documento e senha são obrigatórios",
    error_privacy_required: "Você deve aceitar a Política de Privacidade para se registrar.",
    welcome_back: "Bem-vindo",
    register_success: "Cadastro realizado com sucesso! Bem-vindo",
    progress_suffix: "concluído",
    module_prefix: "Módulo",
    no_questions_auto: "Sem perguntas. O módulo será aprovado automaticamente.",
    loading_quiz: "Carregando questionário...",
    quiz_error: "Erro carregando questionário",
    validating_error: "Erro validando respostas",
    progress_error: "Erro ao salvar progresso",
    cert_error: "Erro carregando certificado",
    user_not_found: "Usuário não encontrado",
    wrong_password: "Senha incorreta",
    document_registered: "Documento já cadastrado"
  }
};

function t(key) {
  return translations[currentLang]?.[key] || translations['es'][key] || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[currentLang][key]) el.textContent = translations[currentLang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[currentLang][key]) el.placeholder = translations[currentLang][key];
  });
}

function changeLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('litoplas_lang', lang);
  window.location.reload();
}

// ==================== DOM ELEMENTS ====================
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
const regPrivacy = document.getElementById('reg-privacy');
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

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', function() {
  console.log('[APP] Litoplas Academy v5.5.4');

  // Aplicar traducciones inmediatamente
  applyTranslations();

  // Setear selectores de idioma
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', function() { changeLanguage(this.value); });
  }
  const langSelectCourse = document.getElementById('lang-select-course');
  if (langSelectCourse) {
    langSelectCourse.value = currentLang;
    langSelectCourse.addEventListener('change', function() { changeLanguage(this.value); });
  }

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
    loginMsg.textContent = t('error_required_fields');
    loginMsg.className = 'msg error';
    return;
  }
  btnLogin.textContent = '...';
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
      loginMsg.textContent = t('welcome_back') + ', ' + data.user.full_name + '!';
      loginMsg.className = 'msg success';
      setTimeout(() => {
        showDashboard();
        updateUserBar(data.user);
        loadCourseData();
      }, 800);
    } else {
      loginMsg.textContent = data.error || t('error_login');
      loginMsg.className = 'msg error';
    }
  } catch (err) {
    loginMsg.textContent = t('error_connection');
    loginMsg.className = 'msg error';
  } finally {
    btnLogin.textContent = t('btn_login');
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
    registerMsg.textContent = t('error_required_fields');
    registerMsg.className = 'msg error';
    return;
  }
  // Validación alfanumérica para documentos extranjeros
  if (!/^[a-zA-Z0-9\-]{3,20}$/.test(documento)) {
    registerMsg.textContent = t('error_document_format');
    registerMsg.className = 'msg error';
    return;
  }
  if (password !== password2) {
    registerMsg.textContent = t('error_password_match');
    registerMsg.className = 'msg error';
    return;
  }
  if (password.length < 6) {
    registerMsg.textContent = t('error_password_length');
    registerMsg.className = 'msg error';
    return;
  }
  // Validación checkbox privacidad
  if (!regPrivacy.checked) {
    registerMsg.textContent = t('error_privacy_required');
    registerMsg.className = 'msg error';
    return;
  }

  btnRegister.textContent = '...';
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
      registerMsg.textContent = t('register_success') + ', ' + data.user.full_name;
      registerMsg.className = 'msg success';
      setTimeout(() => {
        showDashboard();
        updateUserBar(data.user);
        loadCourseData();
      }, 1500);
    } else {
      registerMsg.textContent = data.error || t('error_register');
      registerMsg.className = 'msg error';
    }
  } catch (err) {
    registerMsg.textContent = t('error_connection');
    registerMsg.className = 'msg error';
  } finally {
    btnRegister.textContent = t('btn_register');
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
  html += '<span class="module-active-number">' + t('module_prefix') + ' ' + (currentModuleIndex + 1) + '</span>';
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
    html += '<a href="' + escapeHtml(mod.document_url) + '" target="_blank" class="btn-doc">' + t('btn_doc') + '</a>';
    html += '</div>';
  }

  if (completed) {
    html += '<div class="module-completed-msg">' + t('module_completed') + '</div>';
    if (!isLast) {
      html += '<button id="btn-next-module" class="btn-primary">' + t('btn_next_module') + '</button>';
    } else {
      html += '<button id="btn-view-cert" class="btn-primary">' + t('btn_view_cert') + '</button>';
    }
  } else {
    html += '<div class="module-action-area">';
    html += '<button id="btn-start-quiz" class="btn-primary">' + t('btn_start_quiz') + '</button>';
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
  quizSection.innerHTML = '<p>' + t('loading_quiz') + '</p>';
  quizSection.classList.remove('hidden');

  try {
    const res = await fetch(API_URL + '/api/modules/' + moduleId + '/questions');
    const questions = await res.json();

    if (!questions || questions.length === 0) {
      await completeModule(moduleId);
      return;
    }

    let html = '<div class="quiz-card">';
    html += '<h3>' + t('quiz_title') + '</h3>';
    html += '<p>' + t('quiz_instruction') + '</p>';
    html += '<div class="quiz-questions">';

    questions.forEach((q, idx) => {
      html += '<div class="quiz-question" data-qid="' + q.id + '">';
      html += '<p class="q-text"><strong>' + (idx + 1) + '.</strong> ' + escapeHtml(q.question_text) + '</p>';

      // Video de la pregunta
      if (q.video_url) {
        html += '<div class="question-video-container">';
        html += '<iframe src="' + escapeHtml(q.video_url) + '" frameborder="0" allowfullscreen loading="lazy"></iframe>';
        html += '</div>';
      }

      // Documento de la pregunta
      if (q.document_url) {
        html += '<div class="question-doc">';
        html += '<a href="' + escapeHtml(q.document_url) + '" target="_blank" class="btn-doc-small">' + t('btn_doc_small') + '</a>';
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
        html += '<p class="q-hint">' + t('quiz_hint_multiple') + '</p>';
      }

      html += '</div>';
    });

    html += '</div>';
    html += '<button id="btn-submit-quiz" class="btn-primary">' + t('btn_submit_quiz') + '</button>';
    html += '<p id="quiz-msg" class="msg"></p>';
    html += '</div>';

    quizSection.innerHTML = html;

    document.getElementById('btn-submit-quiz').addEventListener('click', function() {
      submitQuiz(moduleId, questions);
    });

  } catch (err) {
    quizSection.innerHTML = '<p class="msg error">' + t('quiz_error') + '</p>';
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
    document.getElementById('quiz-msg').textContent = t('quiz_all_required');
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
      document.getElementById('quiz-msg').textContent = t('quiz_approved') + ' ' + data.score + '%. ' + t('quiz_approved_suffix');
      document.getElementById('quiz-msg').className = 'msg success';
      setTimeout(() => {
        completeModule(moduleId);
      }, 1500);
    } else {
      document.getElementById('quiz-msg').textContent = t('quiz_failed') + ' ' + data.score + '%. ' + t('quiz_failed_suffix');
      document.getElementById('quiz-msg').className = 'msg error';
    }
  } catch (err) {
    document.getElementById('quiz-msg').textContent = t('validating_error');
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
    alert(t('progress_error') + ': ' + err.message);
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
        certExpiry.textContent = d.toLocaleDateString(currentLang === 'en' ? 'en-US' : currentLang === 'pt' ? 'pt-BR' : 'es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
      } else {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        certExpiry.textContent = d.toLocaleDateString(currentLang === 'en' ? 'en-US' : currentLang === 'pt' ? 'pt-BR' : 'es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      const now = new Date();
      certDate.textContent = t('cert_date_prefix') + ' ' + now.toLocaleDateString(currentLang === 'en' ? 'en-US' : currentLang === 'pt' ? 'pt-BR' : 'es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  } catch (err) {
    console.error(t('cert_error') + ':', err);
  }
}

function downloadCertificatePDF() {
  const element = document.getElementById('certificate-card');
  if (!element) return;
  const opt = {
    margin: 0,
    filename: 'Certificado_Litoplas_' + (currentUser?.document || 'usuario') + '.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };
  html2pdf().set(opt).from(element).save();
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
