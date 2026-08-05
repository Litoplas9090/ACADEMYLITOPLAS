// ============================================
// LITOPLAS ACADEMY - ADMIN.JS v5.3
// Con gestión completa de preguntas por módulo
// ============================================

const API_URL = window.location.origin;
let adminToken = localStorage.getItem('litoplas_admin_token');

// DOM refs
const adminLogin = document.getElementById('admin-login');
const adminPanel = document.getElementById('admin-panel');
const adminUser = document.getElementById('admin-user');
const adminPass = document.getElementById('admin-pass');
const adminMsg = document.getElementById('admin-msg');
const btnAdminLogin = document.getElementById('btn-admin-login');
const btnAdminLogout = document.getElementById('btn-admin-logout');

const tabSearch = document.getElementById('tab-search');
const tabUsers = document.getElementById('tab-users');
const tabExpiring = document.getElementById('tab-expiring');
const tabContent = document.getElementById('tab-content');

const panelSearch = document.getElementById('panel-search');
const panelUsers = document.getElementById('panel-users');
const panelExpiring = document.getElementById('panel-expiring');
const panelContent = document.getElementById('panel-content');

const searchDocument = document.getElementById('search-document');
const btnSearch = document.getElementById('btn-search');
const searchResults = document.getElementById('search-results');

const usersTableContainer = document.getElementById('users-table-container');
const expiringTableContainer = document.getElementById('expiring-table-container');
const modulesAdminContainer = document.getElementById('modules-admin-container');
const btnSaveModules = document.getElementById('btn-save-modules');

const certModal = document.getElementById('cert-modal');
const certModalClose = document.getElementById('cert-modal-close');
const certModalBody = document.getElementById('cert-modal-body');
const btnDownloadCertAdmin = document.getElementById('btn-download-cert-admin');

let currentCertUser = null;
let adminModulesData = [];
let adminQuestionsData = {}; // { moduleId: [questions] }

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('[ADMIN] Iniciando panel administrativo v5.3');

  btnAdminLogin.addEventListener('click', doAdminLogin);
  btnAdminLogout.addEventListener('click', doAdminLogout);
  adminPass.addEventListener('keypress', function(e) { if (e.key === 'Enter') doAdminLogin(); });

  tabSearch.addEventListener('click', function() { showTab('search'); });
  tabUsers.addEventListener('click', function() { showTab('users'); });
  tabExpiring.addEventListener('click', function() { showTab('expiring'); });
  tabContent.addEventListener('click', function() { showTab('content'); });

  btnSearch.addEventListener('click', searchUser);
  searchDocument.addEventListener('keypress', function(e) { if (e.key === 'Enter') searchUser(); });

  btnSaveModules.addEventListener('click', saveModules);

  certModalClose.addEventListener('click', closeCertModal);
  btnDownloadCertAdmin.addEventListener('click', downloadAdminCertificate);

  if (adminToken) {
    showAdminPanel();
    loadUsers();
  }
});

// ============================================
// LOGIN / LOGOUT
// ============================================

async function doAdminLogin() {
  const username = adminUser.value.trim();
  const password = adminPass.value;
  if (!username || !password) {
    adminMsg.textContent = 'Ingresa usuario y contraseña';
    adminMsg.className = 'msg error';
    return;
  }
  btnAdminLogin.textContent = 'Ingresando...';
  btnAdminLogin.disabled = true;
  adminMsg.textContent = '';

  try {
    const res = await fetch(API_URL + '/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      adminToken = data.token;
      localStorage.setItem('litoplas_admin_token', adminToken);
      adminMsg.textContent = '¡Acceso concedido!';
      adminMsg.className = 'msg success';
      setTimeout(() => { showAdminPanel(); loadUsers(); }, 800);
    } else {
      adminMsg.textContent = data.error || 'Credenciales incorrectas';
      adminMsg.className = 'msg error';
    }
  } catch (err) {
    adminMsg.textContent = 'Error de conexión';
    adminMsg.className = 'msg error';
  } finally {
    btnAdminLogin.textContent = 'Ingresar';
    btnAdminLogin.disabled = false;
  }
}

function doAdminLogout() {
  localStorage.removeItem('litoplas_admin_token');
  adminToken = null;
  adminLogin.classList.remove('hidden');
  adminPanel.classList.add('hidden');
  adminPass.value = '';
  adminMsg.textContent = '';
}

function showAdminPanel() {
  adminLogin.classList.add('hidden');
  adminPanel.classList.remove('hidden');
}

// ============================================
// TABS
// ============================================

function showTab(tab) {
  [tabSearch, tabUsers, tabExpiring, tabContent].forEach(t => t.classList.remove('active'));
  [panelSearch, panelUsers, panelExpiring, panelContent].forEach(p => p.classList.add('hidden'));

  if (tab === 'search') { tabSearch.classList.add('active'); panelSearch.classList.remove('hidden'); }
  if (tab === 'users') { tabUsers.classList.add('active'); panelUsers.classList.remove('hidden'); loadUsers(); }
  if (tab === 'expiring') { tabExpiring.classList.add('active'); panelExpiring.classList.remove('hidden'); loadExpiring(); }
  if (tab === 'content') { tabContent.classList.add('active'); panelContent.classList.remove('hidden'); loadModulesAdmin(); }
}

// ============================================
// BUSCAR USUARIO
// ============================================

async function searchUser() {
  const doc = searchDocument.value.trim();
  if (!doc) { searchResults.innerHTML = '<p class="msg">Ingresa un número de documento</p>'; return; }
  searchResults.innerHTML = '<p>Buscando...</p>';

  try {
    const res = await fetch(API_URL + '/api/admin/users/search?document=' + encodeURIComponent(doc), {
      headers: { 'Authorization': 'Bearer ' + adminToken }
    });
    const users = await res.json();
    if (!users || users.length === 0) {
      searchResults.innerHTML = '<p class="msg">No se encontró ningún usuario con ese documento</p>';
      return;
    }
    renderUserCards(users, searchResults);
  } catch (err) {
    searchResults.innerHTML = '<p class="msg error">Error de conexión</p>';
  }
}

// ============================================
// LISTAR USUARIOS
// ============================================

async function loadUsers() {
  usersTableContainer.innerHTML = '<p>Cargando usuarios...</p>';
  try {
    const res = await fetch(API_URL + '/api/admin/users', {
      headers: { 'Authorization': 'Bearer ' + adminToken }
    });
    const users = await res.json();
    renderUserTable(users, usersTableContainer);
  } catch (err) {
    usersTableContainer.innerHTML = '<p class="msg error">Error cargando usuarios</p>';
  }
}

// ============================================
// PRÓXIMOS A VENCER
// ============================================

async function loadExpiring() {
  expiringTableContainer.innerHTML = '<p>Cargando...</p>';
  try {
    const res = await fetch(API_URL + '/api/admin/users', {
      headers: { 'Authorization': 'Bearer ' + adminToken }
    });
    const users = await res.json();
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const expiring = users.filter(u => {
      if (!u.certificate_expiry) return false;
      const exp = new Date(u.certificate_expiry);
      return exp <= thirtyDays && exp >= now;
    });

    if (expiring.length === 0) {
      expiringTableContainer.innerHTML = '<p class="msg success">No hay certificados próximos a vencer en los próximos 30 días</p>';
      return;
    }
    renderUserTable(expiring, expiringTableContainer, true);
  } catch (err) {
    expiringTableContainer.innerHTML = '<p class="msg error">Error cargando datos</p>';
  }
}

// ============================================
// RENDER HELPERS
// ============================================

function renderUserTable(users, container, showExpiryOnly) {
  if (!users || users.length === 0) {
    container.innerHTML = '<p class="msg">No hay usuarios registrados</p>';
    return;
  }
  let html = '<table class="data-table"><thead><tr>';
  html += '<th>Nombre</th><th>Documento</th><th>Empresa</th><th>Progreso</th><th>Certificado</th><th>Acciones</th>';
  html += '</tr></thead><tbody>';

  users.forEach(u => {
    const certStatus = u.certificate_issued 
      ? '<span class="badge-success">✓ Emitido</span>' 
      : '<span class="badge-pending">Pendiente</span>';
    const expiryText = u.certificate_expiry ? new Date(u.certificate_expiry).toLocaleDateString('es-CO') : '-';

    html += '<tr>';
    html += '<td>' + escapeHtml(u.full_name) + '</td>';
    html += '<td>' + escapeHtml(u.document) + '</td>';
    html += '<td>' + escapeHtml(u.company || '-') + '</td>';
    html += '<td>' + (u.progress || 0) + '% (' + (u.completed_modules || 0) + '/' + (u.total_modules || 6) + ')</td>';
    html += '<td>' + certStatus + '<br><small>' + expiryText + '</small></td>';
    html += '<td>';
    if (u.certificate_issued) {
      html += '<button class="btn-small btn-cert" data-user-id="' + u.id + '" data-user-name="' + escapeHtml(u.full_name) + '" data-user-doc="' + escapeHtml(u.document) + '" data-expiry="' + (u.certificate_expiry || '') + '">📄 Certificado</button> ';
    }
    html += '<button class="btn-small btn-reset" data-user-id="' + u.id + '">🔑 Reset Pass</button>';
    html += '</td></tr>';
  });
  html += '</tbody></table>';
  container.innerHTML = html;

  container.querySelectorAll('.btn-cert').forEach(btn => {
    btn.addEventListener('click', function() {
      openCertificateModal(this.getAttribute('data-user-id'), this.getAttribute('data-user-name'), this.getAttribute('data-user-doc'), this.getAttribute('data-expiry'));
    });
  });
  container.querySelectorAll('.btn-reset').forEach(btn => {
    btn.addEventListener('click', function() { resetPassword(this.getAttribute('data-user-id')); });
  });
}

function renderUserCards(users, container) {
  if (!users || users.length === 0) return;
  let html = '<div class="user-cards">';
  users.forEach(u => {
    const certStatus = u.certificate_issued 
      ? '<span class="badge-success">Certificado Emitido</span>' 
      : '<span class="badge-pending">Sin Certificado</span>';
    html += '<div class="user-card">';
    html += '<h4>' + escapeHtml(u.full_name) + '</h4>';
    html += '<p><strong>Documento:</strong> ' + escapeHtml(u.document) + '</p>';
    html += '<p><strong>Empresa:</strong> ' + escapeHtml(u.company || '-') + '</p>';
    html += '<p><strong>Progreso:</strong> ' + (u.progress || 0) + '%</p>';
    html += '<p>' + certStatus + '</p>';
    if (u.certificate_issued) {
      html += '<button class="btn-small btn-cert" data-user-id="' + u.id + '" data-user-name="' + escapeHtml(u.full_name) + '" data-user-doc="' + escapeHtml(u.document) + '" data-expiry="' + (u.certificate_expiry || '') + '">📄 Ver Certificado</button>';
    }
    html += '</div>';
  });
  html += '</div>';
  container.innerHTML = html;
  container.querySelectorAll('.btn-cert').forEach(btn => {
    btn.addEventListener('click', function() {
      openCertificateModal(this.getAttribute('data-user-id'), this.getAttribute('data-user-name'), this.getAttribute('data-user-doc'), this.getAttribute('data-expiry'));
    });
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// CERTIFICADO ADMIN (MODAL)
// ============================================

function openCertificateModal(userId, userName, userDoc, expiry) {
  currentCertUser = { userId, userName, userDoc, expiry };
  const expiryDate = expiry ? new Date(expiry) : new Date();
  if (!expiry) expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  const now = new Date();

  certModalBody.innerHTML = `
    <div id="admin-cert-card" class="certificate-card">
      <div class="cert-header">
        <img src="images/logo-litoplas.png" alt="Litoplas" class="cert-logo" onerror="this.style.display='none'">
      </div>
      <div class="cert-body">
        <h2>Certificado de Finalización</h2>
        <h3>Litoplas S.A. - Gestión de Riesgos y Seguridad Industrial</h3>
        <p class="cert-label">Otorgado a</p>
        <p class="cert-name">${escapeHtml(userName)}</p>
        <p class="cert-label">Documento</p>
        <p class="cert-document">${escapeHtml(userDoc)}</p>
        <p class="cert-text">Por completar satisfactoriamente el programa de inducción en seguridad industrial para visitantes y contratistas, conforme a los estándares de Litoplas S.A.</p>
        <p class="cert-label">Vigente hasta</p>
        <p class="cert-expiry">${expiryDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p class="cert-date">Fecha de emisión: ${now.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <div class="cert-footer">
        <div class="cert-stripe"></div>
      </div>
    </div>
  `;
  certModal.classList.remove('hidden');
}

function closeCertModal() {
  certModal.classList.add('hidden');
  currentCertUser = null;
}

function downloadAdminCertificate() {
  const element = document.getElementById('admin-cert-card');
  if (!element) return;
  const doc = currentCertUser ? currentCertUser.userDoc : 'usuario';
  const opt = {
    margin: 0,
    filename: 'Certificado_Litoplas_' + doc + '.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };
  html2pdf().set(opt).from(element).save();
}

async function resetPassword(userId) {
  const newPass = prompt('Ingresa la nueva contraseña para el usuario (mínimo 6 caracteres):');
  if (!newPass || newPass.length < 6) { alert('Contraseña inválida.'); return; }
  try {
    const res = await fetch(API_URL + '/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
      body: JSON.stringify({ userId: parseInt(userId), newPassword: newPass })
    });
    const data = await res.json();
    if (data.success) alert('Contraseña actualizada correctamente');
    else alert('Error: ' + (data.error || 'No se pudo actualizar'));
  } catch (err) { alert('Error de conexión'); }
}

// ============================================
// GESTIÓN DE MÓDULOS Y PREGUNTAS
// ============================================

async function loadModulesAdmin() {
  modulesAdminContainer.innerHTML = '<p>Cargando módulos...</p>';
  try {
    const [modRes, allQuestions] = await Promise.all([
      fetch(API_URL + '/api/modules'),
      fetch(API_URL + '/api/admin/modules/0/questions', { headers: { 'Authorization': 'Bearer ' + adminToken } }).catch(() => ({ json: () => [] }))
    ]);
    adminModulesData = await modRes.json();

    // Cargar preguntas de cada módulo
    adminQuestionsData = {};
    for (const mod of adminModulesData) {
      try {
        const qRes = await fetch(API_URL + '/api/admin/modules/' + mod.id + '/questions', {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        adminQuestionsData[mod.id] = await qRes.json();
      } catch (e) {
        adminQuestionsData[mod.id] = [];
      }
    }

    renderModulesAdmin();
  } catch (err) {
    modulesAdminContainer.innerHTML = '<p class="msg error">Error cargando módulos: ' + err.message + '</p>';
  }
}

function renderModulesAdmin() {
  let html = '<div class="modules-admin-list">';
  adminModulesData.forEach((mod, idx) => {
    const questions = adminQuestionsData[mod.id] || [];
    html += '<div class="module-admin-item" data-module-index="' + idx + '">';
    html += '<div class="module-admin-header">';
    html += '<span class="module-admin-number">' + (idx + 1) + '</span>';
    html += '<h4>' + escapeHtml(mod.title) + '</h4>';
    html += '</div>';

    html += '<label>Título del Módulo</label>';
    html += '<input type="text" class="mod-title" value="' + escapeHtml(mod.title) + '">';
    html += '<label>Descripción</label>';
    html += '<textarea class="mod-desc" rows="2">' + escapeHtml(mod.description || '') + '</textarea>';
    html += '<label>URL del Video (YouTube)</label>';
    html += '<input type="text" class="mod-video" value="' + escapeHtml(mod.video_url || '') + '" placeholder="https://www.youtube.com/watch?v=...">';
    html += '<label>Activo</label>';
    html += '<select class="mod-active"><option value="1" ' + (mod.active !== false ? 'selected' : '') + '>Sí</option><option value="0" ' + (mod.active === false ? 'selected' : '') + '>No</option></select>';

    // Sección de preguntas
    html += '<div class="questions-section">';
    html += '<h5>📝 Preguntas del Módulo</h5>';
    html += '<div class="questions-list" data-module-id="' + mod.id + '">';

    if (questions.length === 0) {
      html += '<p class="no-questions">No hay preguntas. El módulo se aprobará automáticamente.</p>';
    }

    questions.forEach((q, qidx) => {
      html += renderQuestionEditor(mod.id, qidx, q);
    });
    html += '</div>';
    html += '<button class="btn-add-question" data-module-id="' + mod.id + '">+ Agregar Pregunta</button>';
    html += '</div>';
    html += '</div>';
  });
  html += '</div>';
  modulesAdminContainer.innerHTML = html;

  // Event listeners
  document.querySelectorAll('.btn-add-question').forEach(btn => {
    btn.addEventListener('click', function() {
      const modId = parseInt(this.getAttribute('data-module-id'));
      addQuestionEditor(modId);
    });
  });

  document.querySelectorAll('.btn-remove-question').forEach(btn => {
    btn.addEventListener('click', function() {
      const modId = parseInt(this.getAttribute('data-module-id'));
      const qidx = parseInt(this.getAttribute('data-qidx'));
      removeQuestionEditor(modId, qidx);
    });
  });
}

function renderQuestionEditor(moduleId, qidx, q) {
  q = q || {};
  let html = '<div class="question-editor" data-qidx="' + qidx + '">';
  html += '<div class="question-editor-header">';
  html += '<span>Pregunta ' + (qidx + 1) + '</span>';
  html += '<button class="btn-remove-question" data-module-id="' + moduleId + '" data-qidx="' + qidx + '">🗑️ Eliminar</button>';
  html += '</div>';
  html += '<input type="text" class="q-text-input" placeholder="Texto de la pregunta" value="' + escapeHtml(q.question_text || '') + '">';
  html += '<div class="options-row">';
  html += '<div class="option-field"><label>A)</label><input type="text" class="q-opt-a" value="' + escapeHtml(q.option_a || '') + '"></div>';
  html += '<div class="option-field"><label>B)</label><input type="text" class="q-opt-b" value="' + escapeHtml(q.option_b || '') + '"></div>';
  html += '<div class="option-field"><label>C)</label><input type="text" class="q-opt-c" value="' + escapeHtml(q.option_c || '') + '"></div>';
  html += '<div class="option-field"><label>D)</label><input type="text" class="q-opt-d" value="' + escapeHtml(q.option_d || '') + '"></div>';
  html += '</div>';
  html += '<label>Respuesta Correcta</label>';
  html += '<select class="q-correct">';
  html += '<option value="A" ' + (q.correct_option === 'A' ? 'selected' : '') + '>A</option>';
  html += '<option value="B" ' + (q.correct_option === 'B' ? 'selected' : '') + '>B</option>';
  html += '<option value="C" ' + (q.correct_option === 'C' ? 'selected' : '') + '>C</option>';
  html += '<option value="D" ' + (q.correct_option === 'D' ? 'selected' : '') + '>D</option>';
  html += '</select>';
  html += '</div>';
  return html;
}

function addQuestionEditor(moduleId) {
  const list = document.querySelector('.questions-list[data-module-id="' + moduleId + '"]');
  if (!list) return;
  const currentCount = list.querySelectorAll('.question-editor').length;
  if (currentCount === 0) {
    const noQ = list.querySelector('.no-questions');
    if (noQ) noQ.remove();
  }
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = renderQuestionEditor(moduleId, currentCount, {});
  list.appendChild(tempDiv.firstElementChild);

  // Re-asignar listeners
  list.querySelectorAll('.btn-remove-question').forEach(btn => {
    btn.removeEventListener('click', handleRemoveQuestion);
    btn.addEventListener('click', handleRemoveQuestion);
  });
}

function handleRemoveQuestion() {
  const modId = parseInt(this.getAttribute('data-module-id'));
  const qidx = parseInt(this.getAttribute('data-qidx'));
  removeQuestionEditor(modId, qidx);
}

function removeQuestionEditor(moduleId, qidx) {
  const list = document.querySelector('.questions-list[data-module-id="' + moduleId + '"]');
  if (!list) return;
  const editors = list.querySelectorAll('.question-editor');
  if (editors[qidx]) editors[qidx].remove();

  // Reindexar
  const remaining = list.querySelectorAll('.question-editor');
  if (remaining.length === 0) {
    list.innerHTML = '<p class="no-questions">No hay preguntas. El módulo se aprobará automáticamente.</p>';
  } else {
    remaining.forEach((ed, idx) => {
      ed.setAttribute('data-qidx', idx);
      ed.querySelector('.question-editor-header span').textContent = 'Pregunta ' + (idx + 1);
      const removeBtn = ed.querySelector('.btn-remove-question');
      removeBtn.setAttribute('data-qidx', idx);
    });
  }
}

async function saveModules() {
  // Recolectar módulos
  const items = modulesAdminContainer.querySelectorAll('.module-admin-item');
  const modules = [];
  items.forEach(item => {
    modules.push({
      title: item.querySelector('.mod-title').value,
      description: item.querySelector('.mod-desc').value,
      video_url: item.querySelector('.mod-video').value,
      document_url: '',
      image_url: '',
      active: item.querySelector('.mod-active').value === '1'
    });
  });

  try {
    // Guardar módulos primero
    const modRes = await fetch(API_URL + '/api/admin/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
      body: JSON.stringify({ modules })
    });
    const modData = await modRes.json();
    if (!modData.success) { alert('Error guardando módulos: ' + (modData.error || '')); return; }

    // Recargar IDs de módulos para guardar preguntas
    const freshRes = await fetch(API_URL + '/api/modules');
    const freshModules = await freshRes.json();

    // Guardar preguntas para cada módulo
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const modId = freshModules[i].id;
      const qEditors = item.querySelectorAll('.question-editor');
      const questions = [];
      qEditors.forEach(ed => {
        const qt = ed.querySelector('.q-text-input').value.trim();
        if (!qt) return;
        questions.push({
          question_text: qt,
          option_a: ed.querySelector('.q-opt-a').value,
          option_b: ed.querySelector('.q-opt-b').value,
          option_c: ed.querySelector('.q-opt-c').value,
          option_d: ed.querySelector('.q-opt-d').value,
          correct_option: ed.querySelector('.q-correct').value
        });
      });

      await fetch(API_URL + '/api/admin/modules/' + modId + '/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
        body: JSON.stringify({ questions })
      });
    }

    alert('Módulos y preguntas guardados correctamente');
    loadModulesAdmin();
  } catch (err) {
    alert('Error de conexión al guardar: ' + err.message);
  }
}
