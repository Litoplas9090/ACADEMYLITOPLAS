const API = window.location.origin;
let token = localStorage.getItem('litoplas_token');
let currentUser = null;
let modules = [];
let currentLang = localStorage.getItem('litoplas_lang') || 'es';

// ==================== TRADUCCIONES ====================
const translations = {
  es: {
    login_title: "Iniciar Sesión",
    login_subtitle: "Capacitación en Seguridad Industrial",
    placeholder_document: "Documento / ID",
    placeholder_password: "Contraseña",
    btn_login: "Ingresar",
    no_account: "¿No tienes cuenta?",
    register_here: "Regístrate aquí",
    register_title: "Registro de Visitante / Contratista",
    placeholder_fullname: "Nombre completo",
    placeholder_document2: "Documento (pasaporte, cédula, etc.)",
    placeholder_email: "Correo electrónico (opcional)",
    placeholder_company: "Empresa / Contratista",
    placeholder_password2: "Contraseña (mínimo 4 caracteres)",
    btn_register: "Crear Cuenta",
    have_account: "¿Ya tienes cuenta?",
    login_here: "Inicia sesión",
    btn_logout: "Salir",
    modules_title: "Módulos del Curso",
    welcome_course: "¡Bienvenido a Litoplas Academy!",
    select_module: "Selecciona un módulo del menú lateral para comenzar tu capacitación.",
    cert_title: "CERTIFICADO DE CAPACITACIÓN",
    cert_text1: "Otorgado a:",
    cert_document: "Documento:",
    cert_text2: "Por haber completado satisfactoriamente el curso de:",
    cert_course: "Seguridad Industrial para Visitantes y Contratistas",
    cert_date: "Fecha de emisión:",
    cert_expiry: "Vigente hasta:",
    cert_sign: "Coordinador de Seguridad Industrial",
    btn_download_cert: "Descargar Certificado PDF",
    module_locked: "Bloqueado - Completa el módulo anterior",
    module_completed: "Completado",
    btn_next_module: "Siguiente Módulo",
    quiz_title: "Cuestionario de Evaluación",
    quiz_instruction: "Selecciona la(s) respuesta(s) correcta(s). Debes obtener mínimo 70% para aprobar.",
    btn_submit_quiz: "Enviar Respuestas",
    quiz_passed: "¡Aprobado! Avanzando al siguiente módulo...",
    quiz_failed: "No alcanzaste el 70% requerido. Revisa el material e intenta de nuevo.",
    question_video: "Video de referencia:",
    question_doc: "Documento de referencia:",
    btn_download_doc: "Descargar documento",
    no_questions: "No hay cuestionario para este módulo. Has clic en Finalizar para continuar.",
    btn_finish: "Finalizar Módulo",
    cert_ready: "¡Felicitaciones! Has completado el curso. Tu certificado está listo.",
    btn_view_cert: "Ver Certificado",
    error_login: "Error al iniciar sesión",
    error_register: "Error en el registro",
    error_server: "Error de servidor. Intente más tarde.",
    loading: "Cargando...",
    answer_required: "Debes responder todas las preguntas",
    privacy_required: "Debes aceptar la Política de Privacidad para registrarte.",
  },
  en: {
    login_title: "Sign In",
    login_subtitle: "Industrial Safety Training",
    placeholder_document: "Document / ID",
    placeholder_password: "Password",
    btn_login: "Sign In",
    no_account: "Don't have an account?",
    register_here: "Register here",
    register_title: "Visitor / Contractor Registration",
    placeholder_fullname: "Full name",
    placeholder_document2: "Document (passport, ID, etc.)",
    placeholder_email: "Email (optional)",
    placeholder_company: "Company / Contractor",
    placeholder_password2: "Password (minimum 4 characters)",
    btn_register: "Create Account",
    have_account: "Already have an account?",
    login_here: "Sign in",
    btn_logout: "Logout",
    modules_title: "Course Modules",
    welcome_course: "Welcome to Litoplas Academy!",
    select_module: "Select a module from the sidebar to start your training.",
    cert_title: "TRAINING CERTIFICATE",
    cert_text1: "Awarded to:",
    cert_document: "Document:",
    cert_text2: "For having successfully completed the course:",
    cert_course: "Industrial Safety for Visitors and Contractors",
    cert_date: "Issue date:",
    cert_expiry: "Valid until:",
    cert_sign: "Industrial Safety Coordinator",
    btn_download_cert: "Download Certificate PDF",
    module_locked: "Locked - Complete previous module",
    module_completed: "Completed",
    btn_next_module: "Next Module",
    quiz_title: "Evaluation Quiz",
    quiz_instruction: "Select the correct answer(s). You need at least 70% to pass.",
    btn_submit_quiz: "Submit Answers",
    quiz_passed: "Passed! Advancing to next module...",
    quiz_failed: "You didn't reach the required 70%. Review the material and try again.",
    question_video: "Reference video:",
    question_doc: "Reference document:",
    btn_download_doc: "Download document",
    no_questions: "No quiz for this module. Click Finish to continue.",
    btn_finish: "Finish Module",
    cert_ready: "Congratulations! You have completed the course. Your certificate is ready.",
    btn_view_cert: "View Certificate",
    error_login: "Sign in error",
    error_register: "Registration error",
    error_server: "Server error. Please try again later.",
    loading: "Loading...",
    answer_required: "You must answer all questions",
    privacy_required: "You must accept the Privacy Policy to register.",
  },
  pt: {
    login_title: "Entrar",
    login_subtitle: "Treinamento de Segurança Industrial",
    placeholder_document: "Documento / ID",
    placeholder_password: "Senha",
    btn_login: "Entrar",
    no_account: "Não tem conta?",
    register_here: "Registre-se aqui",
    register_title: "Cadastro de Visitante / Contratista",
    placeholder_fullname: "Nome completo",
    placeholder_document2: "Documento (passaporte, RG, etc.)",
    placeholder_email: "E-mail (opcional)",
    placeholder_company: "Empresa / Contratista",
    placeholder_password2: "Senha (mínimo 4 caracteres)",
    btn_register: "Criar Conta",
    have_account: "Já tem conta?",
    login_here: "Entre aqui",
    btn_logout: "Sair",
    modules_title: "Módulos do Curso",
    welcome_course: "Bem-vindo à Litoplas Academy!",
    select_module: "Selecione um módulo do menu lateral para iniciar seu treinamento.",
    cert_title: "CERTIFICADO DE TREINAMENTO",
    cert_text1: "Concedido a:",
    cert_document: "Documento:",
    cert_text2: "Por ter completado com sucesso o curso de:",
    cert_course: "Segurança Industrial para Visitantes e Contratistas",
    cert_date: "Data de emissão:",
    cert_expiry: "Válido até:",
    cert_sign: "Coordenador de Segurança Industrial",
    btn_download_cert: "Baixar Certificado PDF",
    module_locked: "Bloqueado - Complete o módulo anterior",
    module_completed: "Concluído",
    btn_next_module: "Próximo Módulo",
    quiz_title: "Questionário de Avaliação",
    quiz_instruction: "Selecione a(s) resposta(s) correta(s). Você precisa de no mínimo 70% para passar.",
    btn_submit_quiz: "Enviar Respostas",
    quiz_passed: "Aprovado! Avançando para o próximo módulo...",
    quiz_failed: "Você não alcançou os 70% necessários. Revise o material e tente novamente.",
    question_video: "Vídeo de referência:",
    question_doc: "Documento de referência:",
    btn_download_doc: "Baixar documento",
    no_questions: "Não há questionário para este módulo. Clique em Finalizar para continuar.",
    btn_finish: "Finalizar Módulo",
    cert_ready: "Parabéns! Você completou o curso. Seu certificado está pronto.",
    btn_view_cert: "Ver Certificado",
    error_login: "Erro ao entrar",
    error_register: "Erro no cadastro",
    error_server: "Erro do servidor. Tente novamente mais tarde.",
    loading: "Carregando...",
    answer_required: "Você deve responder todas as perguntas",
    privacy_required: "Você deve aceitar a Política de Privacidade para se registrar.",
  }
};

function t(key) {
  return translations[currentLang]?.[key] || translations['es'][key] || key;
}

function changeLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('litoplas_lang', lang);
  document.getElementById('lang-select').value = lang;
  const courseSelect = document.getElementById('lang-select-course');
  if (courseSelect) courseSelect.value = lang;
  applyTranslations();
  if (modules.length > 0) renderModuleList();
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

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  console.log('[APP] Litoplas Academy v5.5.1');
  applyTranslations();
  document.getElementById('lang-select').value = currentLang;

  if (token) {
    loadUser().then(() => {
      if (currentUser) showCourse();
      else showAuth();
    }).catch(() => showAuth());
  } else {
    showAuth();
  }

  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('btn-login').addEventListener('click', doLogin);
  document.getElementById('btn-register').addEventListener('click', doRegister);
  document.getElementById('btn-logout').addEventListener('click', doLogout);
  document.getElementById('show-register').addEventListener('click', (e) => { e.preventDefault(); showRegister(); });
  document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); showLogin(); });
  document.getElementById('close-cert').addEventListener('click', () => document.getElementById('cert-modal').style.display = 'none');
  document.getElementById('btn-download-cert').addEventListener('click', downloadCertificate);

  document.getElementById('login-document').addEventListener('keypress', (e) => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('login-password').addEventListener('keypress', (e) => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('reg-password').addEventListener('keypress', (e) => { if (e.key === 'Enter') doRegister(); });
}

function showAuth() {
  document.getElementById('auth-section').style.display = 'flex';
  document.getElementById('course-section').style.display = 'none';
}

function showLogin() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
}

function showRegister() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}

function showCourse() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('course-section').style.display = 'block';
  document.getElementById('user-name').textContent = currentUser?.full_name || '';
  loadModules();
}

async function loadUser() {
  const res = await fetch(`${API}/api/progress`, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!res.ok) throw new Error('No autorizado');
}

// ==================== AUTH ====================
async function doLogin() {
  const documento = document.getElementById('login-document').value.trim().toUpperCase();
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document: documento, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t('error_login'));

    token = data.token;
    currentUser = data.user;
    localStorage.setItem('litoplas_token', token);
    showCourse();
  } catch (err) {
    showMessage('auth-message', err.message, 'error');
  }
}

async function doRegister() {
  const full_name = document.getElementById('reg-fullname').value.trim();
  const documento = document.getElementById('reg-document').value.trim().toUpperCase();
  const email = document.getElementById('reg-email').value.trim();
  const company = document.getElementById('reg-company').value.trim();
  const password = document.getElementById('reg-password').value;
  const privacyAccepted = document.getElementById('reg-privacy').checked;

  // Validación checkbox privacidad
  if (!privacyAccepted) {
    showMessage('auth-message', t('privacy_required'), 'error');
    return;
  }

  // Validación alfanumérica para documentos extranjeros
  if (!/^[a-zA-Z0-9\-]{3,20}$/.test(documento)) {
    showMessage('auth-message', 'Documento inválido. Use 3-20 caracteres alfanuméricos.', 'error');
    return;
  }
  if (password.length < 4) {
    showMessage('auth-message', 'Contraseña mínimo 4 caracteres', 'error');
    return;
  }
  if (full_name.length < 3) {
    showMessage('auth-message', 'Nombre completo requerido', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, document: documento, email, company, password, privacy_accepted: true })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t('error_register'));

    showMessage('auth-message', 'Registro exitoso. Ahora puedes iniciar sesión.', 'success');
    showLogin();
  } catch (err) {
    showMessage('auth-message', err.message, 'error');
  }
}

function doLogout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('litoplas_token');
  showAuth();
  showLogin();
}

function showMessage(id, msg, type) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = type === 'error' ? 'msg-error' : 'msg-success';
  setTimeout(() => el.textContent = '', 5000);
}

// ==================== MODULES ====================
async function loadModules() {
  try {
    const res = await fetch(`${API}/api/modules`, { headers: { 'Authorization': `Bearer ${token}` } });
    modules = await res.json();
    renderModuleList();
  } catch (err) {
    console.error('Error cargando módulos:', err);
  }
}

async function getProgress() {
  try {
    const res = await fetch(`${API}/api/progress`, { headers: { 'Authorization': `Bearer ${token}` } });
    return await res.json();
  } catch { return []; }
}

async function renderModuleList() {
  const progress = await getProgress();
  const completedIds = progress.filter(p => p.completed).map(p => p.module_id);
  const total = modules.length;
  const completed = completedIds.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('progress-text').textContent = pct + '%';

  const list = document.getElementById('module-list');
  list.innerHTML = '';

  modules.forEach((mod, idx) => {
    const isCompleted = completedIds.includes(mod.id);
    const isLocked = idx > 0 && !completedIds.includes(modules[idx - 1].id);
    const isActive = !isLocked;

    const div = document.createElement('div');
    div.className = `module-item ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''} ${isActive ? 'active' : ''}`;
    div.innerHTML = `
      <span class="mod-num">${mod.order_num}</span>
      <span class="mod-title">${mod.title}</span>
      ${isCompleted ? '<span class="mod-check">✓</span>' : ''}
      ${isLocked ? '<span class="mod-lock">🔒</span>' : ''}
    `;

    if (isActive) {
      div.addEventListener('click', () => openModule(mod, isCompleted));
    }
    list.appendChild(div);
  });

  if (pct >= 100) showCertificateReady();
}

function openModule(mod, isCompleted) {
  const view = document.getElementById('module-view');
  const videosHtml = (mod.videos || []).map(v => `
    <div class="video-wrapper">
      <iframe src="${toEmbed(v.video_url || v)}" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        referrerpolicy="strict-origin-when-cross-origin" 
        allowfullscreen 
        loading="lazy" 
        title="Video ${mod.order_num}">
      </iframe>
    </div>
  `).join('');

  const mainVideo = mod.video_url ? `
    <div class="video-wrapper">
      <iframe src="${toEmbed(mod.video_url)}" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        referrerpolicy="strict-origin-when-cross-origin" 
        allowfullscreen 
        loading="lazy" 
        title="Video principal">
      </iframe>
    </div>
  ` : '';

  view.innerHTML = `
    <div class="module-card">
      <h2>${mod.title}</h2>
      <p class="module-desc">${mod.description || ''}</p>
      ${mainVideo}
      ${videosHtml}
      ${mod.document_url ? `<a href="${mod.document_url}" target="_blank" class="doc-link">📄 ${t('btn_download_doc')}</a>` : ''}
      ${mod.image_url ? `<img src="${mod.image_url}" class="module-image" alt="Imagen del módulo">` : ''}

      ${isCompleted 
        ? `<div class="completed-badge">✓ ${t('module_completed')}</div>
           <button class="btn-primary" id="btn-next-${mod.id}">${t('btn_next_module')}</button>`
        : `<div id="quiz-area-${mod.id}"></div>
           <button class="btn-primary" id="btn-finish-${mod.id}" style="display:none">${t('btn_finish')}</button>`
      }
    </div>
  `;

  if (isCompleted) {
    const nextBtn = document.getElementById(`btn-next-${mod.id}`);
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const nextMod = modules.find(m => m.order_num === mod.order_num + 1);
        if (nextMod) openModule(nextMod, completedIds?.includes(nextMod.id));
      });
    }
  } else {
    loadQuiz(mod.id);
  }
}

function toEmbed(url) {
  if (!url) return '';
  if (url.includes('youtube-nocookie.com/embed/')) return url;
  let id = '';
  if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1].split('?')[0];
  else if (url.includes('v=')) id = url.split('v=')[1].split('&')[0];
  else if (url.includes('embed/')) id = url.split('embed/')[1].split('?')[0];
  if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
  return url;
}

// ==================== QUIZ ====================
async function loadQuiz(moduleId) {
  try {
    const res = await fetch(`${API}/api/modules/${moduleId}/questions`, { headers: { 'Authorization': `Bearer ${token}` } });
    const questions = await res.json();
    const area = document.getElementById(`quiz-area-${moduleId}`);

    if (questions.length === 0) {
      area.innerHTML = `<p class="no-quiz">${t('no_questions')}</p>`;
      const btn = document.getElementById(`btn-finish-${moduleId}`);
      btn.style.display = 'block';
      btn.addEventListener('click', () => submitProgress(moduleId, {}));
      return;
    }

    let html = `<h3>${t('quiz_title')}</h3><p class="quiz-instruction">${t('quiz_instruction')}</p><div class="quiz-form">`;
    questions.forEach((q, i) => {
      const opts = [];
      const labels = ['A', 'B', 'C', 'D'];
      const numOpts = q.num_options || 4;

      for (let j = 0; j < numOpts; j++) {
        const optKey = ['option_a', 'option_b', 'option_c', 'option_d'][j];
        const optVal = q[optKey];
        if (!optVal) continue;

        const inputType = q.allow_multiple ? 'checkbox' : 'radio';
        const nameAttr = q.allow_multiple ? `q-${q.id}[]` : `q-${q.id}`;
        opts.push(`
          <label class="quiz-option">
            <input type="${inputType}" name="${nameAttr}" value="${labels[j]}" data-qid="${q.id}">
            <span><strong>${labels[j]}.</strong> ${optVal}</span>
          </label>
        `);
      }

      let mediaHtml = '';
      if (q.question_video_url) {
        mediaHtml += `<p class="question-media-label">${t('question_video')}</p>
          <div class="video-wrapper small">
            <iframe src="${toEmbed(q.question_video_url)}" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerpolicy="strict-origin-when-cross-origin" 
              allowfullscreen 
              loading="lazy" 
              title="Video pregunta ${i+1}">
            </iframe>
          </div>`;
      }
      if (q.question_doc_url) {
        mediaHtml += `<a href="${q.question_doc_url}" target="_blank" class="doc-link">📄 ${t('question_doc')}</a>`;
      }

      html += `
        <div class="question-card">
          <p class="question-text"><strong>${i+1}.</strong> ${q.question_text}</p>
          ${mediaHtml}
          <div class="options-group">${opts.join('')}</div>
        </div>
      `;
    });
    html += `<button class="btn-primary" id="btn-submit-quiz-${moduleId}">${t('btn_submit_quiz')}</button></div>`;
    area.innerHTML = html;

    document.getElementById(`btn-submit-quiz-${moduleId}`).addEventListener('click', () => submitQuiz(moduleId, questions));
  } catch (err) {
    console.error('Error cargando cuestionario:', err);
  }
}

function submitQuiz(moduleId, questions) {
  const answers = {};
  for (const q of questions) {
    if (q.allow_multiple) {
      const checked = Array.from(document.querySelectorAll(`input[data-qid="${q.id}"]:checked`)).map(cb => cb.value);
      answers[q.id] = checked.join(',');
    } else {
      const selected = document.querySelector(`input[name="q-${q.id}"]:checked`);
      answers[q.id] = selected ? selected.value : '';
    }
    if (!answers[q.id]) {
      alert(t('answer_required'));
      return;
    }
  }
  submitProgress(moduleId, answers);
}

async function submitProgress(moduleId, answers) {
  try {
    const res = await fetch(`${API}/api/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ module_id: moduleId, answers })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (data.passed) {
      alert(t('quiz_passed'));
      renderModuleList();
      const nextMod = modules.find(m => m.order_num > modules.find(x => x.id === moduleId)?.order_num);
      if (nextMod) setTimeout(() => openModule(nextMod, false), 1000);
      else showCertificateReady();
    } else {
      alert(t('quiz_failed'));
    }
  } catch (err) {
    alert(err.message);
  }
}

// ==================== CERTIFICATE ====================
function showCertificateReady() {
  const view = document.getElementById('module-view');
  view.innerHTML = `
    <div class="cert-ready-card">
      <h2>🎉 ${t('cert_ready')}</h2>
      <button class="btn-primary" id="btn-view-cert">${t('btn_view_cert')}</button>
    </div>
  `;
  document.getElementById('btn-view-cert').addEventListener('click', loadCertificate);
}

async function loadCertificate() {
  try {
    const res = await fetch(`${API}/api/certificate`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) return;

    document.getElementById('cert-name').textContent = data.full_name;
    document.getElementById('cert-document').textContent = data.document;
    document.getElementById('cert-date').textContent = new Date(data.certificate_date).toLocaleDateString(currentLang === 'en' ? 'en-US' : currentLang === 'pt' ? 'pt-BR' : 'es-CO');
    document.getElementById('cert-expiry').textContent = new Date(data.certificate_expiry).toLocaleDateString(currentLang === 'en' ? 'en-US' : currentLang === 'pt' ? 'pt-BR' : 'es-CO');
    document.getElementById('cert-modal').style.display = 'flex';
  } catch (err) {
    console.error('Error certificado:', err);
  }
}

function downloadCertificate() {
  const element = document.getElementById('cert-content');
  const opt = {
    margin: 0.5,
    filename: `Certificado_Litoplas_${currentUser?.document || 'user'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
}
