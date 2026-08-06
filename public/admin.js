// ============================================
// LITOPLAS ACADEMY - ADMIN.JS v5.5.4
// Gestión unificada: buscar + usuarios + próximos a vencer
// ============================================

const API_URL = window.location.origin;
let adminToken = localStorage.getItem('litoplas_admin_token');

const adminLogin = document.getElementById('admin-login');
const adminPanel = document.getElementById('admin-panel');
const adminUser = document.getElementById('admin-user');
const adminPass = document.getElementById('admin-pass');
const adminMsg = document.getElementById('admin-msg');
const btnAdminLogin = document.getElementById('btn-admin-login');
const btnAdminLogout = document.getElementById('btn-admin-logout');

const tabGestion = document.getElementById('tab-gestion');
const tabContent = document.getElementById('tab-content');
const tabStats = document.getElementById('tab-stats');

const panelGestion = document.getElementById('panel-gestion');
const panelContent = document.getElementById('panel-content');
const panelStats = document.getElementById('panel-stats');

const searchUserInput = document.getElementById('search-user');
const filterStatus = document.getElementById('filter-status');
const btnSearch = document.getElementById('btn-search');
const btnClearFilters = document.getElementById('btn-clear-filters');
const usersTableContainer = document.getElementById('users-table-container');
const statsContainer = document.getElementById('stats-container');
const modulesAdminContainer = document.getElementById('modules-admin-container');
const btnSaveModules = document.getElementById('btn-save-modules');

const certModal = document.getElementById('cert-modal');
const certModalClose = document.getElementById('cert-modal-close');
const certModalBody = document.getElementById('cert-modal-body');
const btnDownloadCertAdmin = document.getElementById('btn-download-cert-admin');

let currentCertUser = null;
let adminModulesData = [];
let adminQuestionsData = {};
let allUsers = [];

document.addEventListener('DOMContentLoaded', function() {
  console.log('[ADMIN] Iniciando panel administrativo v5.5.4');

  btnAdminLogin.addEventListener('click', doAdminLogin);
  btnAdminLogout.addEventListener('click', doAdminLogout);
  adminPass.addEventListener('keypress', function(e) { if (e.key === 'Enter') doAdminLogin(); });

  tabGestion.addEventListener('click', function() { showTab('gestion'); });
  tabContent.addEventListener('click', function() { showTab('content'); });
  tabStats.addEventListener('click', function() { showTab('stats'); });

  btnSearch.addEventListener('click', filterUsers);
  btnClearFilters.addEventListener('click', clearFilters);
  searchUserInput.addEventListener('input', debounce(filterUsers, 300));
  filterStatus.addEventListener('change', filterUsers);

  btnSaveModules.addEventListener('click', saveModules);

  certModalClose.addEventListener('click', closeCertModal);
  btnDownloadCertAdmin.addEventListener('click', downloadAdminCertificate);

  if (adminToken) {
    showAdminPanel();
    loadUsers();
  }
});

function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

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

function showTab(tab) {
  [tabGestion, tabContent, tabStats].forEach(t => t.classList.remove('active'));
  [panelGestion, panelContent, panelStats].forEach(p => p.classList.add('hidden'));

  if (tab === 'gestion') { tabGestion.classList.add('active'); panelGestion.classList.remove('hidden'); loadUsers(); }
  if (tab === 'content') { tabContent.classList.add('active'); panelContent.classList.remove('hidden'); loadModulesAdmin(); }
  if (tab === 'stats') { tabStats.classList.add('active'); panelStats.classList.remove('hidden'); loadStats(); }
}

// ============================================
// GESTIÓN DE USUARIOS UNIFICADA
// ============================================

async function loadUsers() {
  usersTableContainer.innerHTML = '<p>Cargando usuarios...</p>';
  try {
    const res = await fetch(API_URL + '/api/admin/users', {
      headers: { 'Authorization': 'Bearer ' + adminToken }
    });
    allUsers = await res.json();
    filterUsers();
  } catch (err) {
    usersTableContainer.innerHTML = '<p class="msg error">Error cargando usuarios</p>';
  }
}

function filterUsers() {
  const q = (searchUserInput.value || '').toLowerCase().trim();
  const status = filterStatus.value;
  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  let filtered = allUsers.filter(u => {
    const matchQ = !q || (u.document && u.document.toLowerCase().includes(q)) || (u.full_name && u.full_name.toLowerCase().includes(q));
    let matchStatus = true;
    if (status === 'certified') matchStatus = !!u.certificate_issued;
    if (status === 'nocert') matchStatus = !u.certificate_issued;
    if (status === 'expiring') {
      const expiry = u.certificate_expiry ? new Date(u.certificate_expiry) : null;
      matchStatus = expiry && expiry >= now && expiry <= nextMonth;
    }
    return matchQ && matchStatus;
  });

  renderUserTable(filtered);
  updateStats(filtered);
}

function clearFilters() {
  searchUserInput.value = '';
  filterStatus.value = 'all';
  filterUsers();
}

function updateStats(users) {
  const total = users.length;
  const certified = users.filter(u => u.certificate_issued).length;
  const avgProgress = total > 0 ? Math.round(users.reduce((a, b) => a + (b.progress || 0), 0) / total) : 0;
  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  const expiring = users.filter(u => {
    const expiry = u.certificate_expiry ? new Date(u.certificate_expiry) : null;
    return expiry && expiry >= now && expiry <= nextMonth;
  }).length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-certified').textContent = certified;
  document.getElementById('stat-progress').textContent = avgProgress + '%';
  document.getElementById('stat-expiring').textContent = expiring;
}

function renderUserTable(users) {
  if (!users || users.length === 0) {
    usersTableContainer.innerHTML = '<p class="msg">No hay usuarios para mostrar</p>';
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
    const isExpiring = u.certificate_expiry && new Date(u.certificate_expiry) <= new Date(Date.now() + 30*24*60*60*1000) && new Date(u.certificate_expiry) > new Date();

    html += '<tr>';
    html += '<td>' + escapeHtml(u.full_name) + '</td>';
    html += '<td><strong>' + escapeHtml(u.document) + '</strong></td>';
    html += '<td>' + escapeHtml(u.company || '-') + '</td>';
    html += '<td>' + (u.progress || 0) + '% (' + (u.completed_modules || 0) + '/' + (u.total_modules || 6) + ')</td>';
    html += '<td>' + certStatus + '<br><small>' + (isExpiring ? '<span style="color:#dc3545;font-weight:700;">⚠ ' + expiryText + '</span>' : expiryText) + '</small></td>';
    html += '<td>';
    if (u.certificate_issued) {
      html += '<button class="btn-small btn-cert" data-user-id="' + u.id + '" data-user-name="' + escapeHtml(u.full_name) + '" data-user-doc="' + escapeHtml(u.document) + '" data-expiry="' + (u.certificate_expiry || '') + '">📄 Certificado</button> ';
    }
    html += '<button class="btn-small btn-reset" data-user-id="' + u.id + '">🔑 Reset Pass</button> ';
    html += '<button class="btn-small btn-delete-user" data-user-id="' + u.id + '" data-user-name="' + escapeHtml(u.full_name) + '">🗑️ Eliminar</button>';
    html += '</td></tr>';
  });
  html += '</tbody></table>';
  usersTableContainer.innerHTML = html;

  usersTableContainer.querySelectorAll('.btn-cert').forEach(btn => {
    btn.addEventListener('click', function() {
      openCertificateModal(this.getAttribute('data-user-id'), this.getAttribute('data-user-name'), this.getAttribute('data-user-doc'), this.getAttribute('data-expiry'));
    });
  });
  usersTableContainer.querySelectorAll('.btn-reset').forEach(btn => {
    btn.addEventListener('click', function() { resetPassword(this.getAttribute('data-user-id')); });
  });
  usersTableContainer.querySelectorAll('.btn-delete-user').forEach(btn => {
    btn.addEventListener('click', function() { deleteUser(this.getAttribute('data-user-id'), this.getAttribute('data-user-name')); });
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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

async function deleteUser(userId, userName) {
  if (!confirm('¿Estás seguro de eliminar al usuario "' + userName + '"? Esta acción no se puede deshacer.')) return;
  try {
    const res = await fetch(API_URL + '/api/admin/users/' + userId, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + adminToken }
    });
    const data = await res.json();
    if (data.success) {
      alert('Usuario eliminado correctamente');
      loadUsers();
    } else {
      alert('Error: ' + (data.error || 'No se pudo eliminar'));
    }
  } catch (err) { alert('Error de conexión'); }
}

// ============================================
// ESTADÍSTICAS
// ============================================

async function loadStats() {
  statsContainer.innerHTML = '<p>Cargando estadísticas...</p>';
  try {
    const res = await fetch(API_URL + '/api/admin/stats', {
      headers: { 'Authorization': 'Bearer ' + adminToken }
    });
    const stats = await res.json();

    let html = '<div class="stats-grid">';
    html += '<div class="stat-card"><div class="stat-number">' + (stats.total_users || 0) + '</div><div class="stat-label">Total Usuarios</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + (stats.certified_users || 0) + '</div><div class="stat-label">Certificados</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + (stats.avg_progress || 0) + '%</div><div class="stat-label">Progreso Promedio</div></div>';
    html += '<div class="stat-card"><div class="stat-number">' + (stats.expiring_soon || 0) + '</div><div class="stat-label">Próximos a Vencer</div></div>';
    html += '</div>';

    html += '<div class="stats-filters">';
    html += '<h4>Filtrar por período</h4>';
    html += '<div class="filter-row">';
    html += '<select id="filter-year"><option value="">Todos los años</option>' + generateYearOptions() + '</select>';
    html += '<select id="filter-month"><option value="">Todos los meses</option><option value="1">Enero</option><option value="2">Febrero</option><option value="3">Marzo</option><option value="4">Abril</option><option value="5">Mayo</option><option value="6">Junio</option><option value="7">Julio</option><option value="8">Agosto</option><option value="9">Septiembre</option><option value="10">Octubre</option><option value="11">Noviembre</option><option value="12">Diciembre</option></select>';
    html += '<button id="btn-filter-stats" class="btn-primary" style="width:auto;padding:10px 20px;">Filtrar</button>';
    html += '</div></div>';

    if (stats.monthly && stats.monthly.length > 0) {
      html += '<h4 style="margin-top:20px;margin-bottom:10px;">Registros por Mes</h4>';
      html += '<table class="data-table"><thead><tr><th>Año</th><th>Mes</th><th>Usuarios Registrados</th></tr></thead><tbody>';
      stats.monthly.forEach(m => {
        const monthNames = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        html += '<tr><td>' + m.year + '</td><td>' + monthNames[parseInt(m.month)] + '</td><td>' + m.count + '</td></tr>';
      });
      html += '</tbody></table>';
    } else {
      html += '<p class="msg" style="margin-top:15px;">No hay datos para el período seleccionado</p>';
    }

    statsContainer.innerHTML = html;

    document.getElementById('btn-filter-stats').addEventListener('click', async function() {
      const year = document.getElementById('filter-year').value;
      const month = document.getElementById('filter-month').value;
      let url = API_URL + '/api/admin/stats';
      const params = [];
      if (year) params.push('year=' + year);
      if (month) params.push('month=' + month);
      if (params.length > 0) url += '?' + params.join('&');

      const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + adminToken } });
      const filtered = await res.json();

      let tableHtml = '';
      if (filtered.monthly && filtered.monthly.length > 0) {
        tableHtml += '<h4 style="margin-top:20px;margin-bottom:10px;">Registros por Mes</h4>';
        tableHtml += '<table class="data-table"><thead><tr><th>Año</th><th>Mes</th><th>Usuarios Registrados</th></tr></thead><tbody>';
        filtered.monthly.forEach(m => {
          const monthNames = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
          tableHtml += '<tr><td>' + m.year + '</td><td>' + monthNames[parseInt(m.month)] + '</td><td>' + m.count + '</td></tr>';
        });
        tableHtml += '</tbody></table>';
      } else {
        tableHtml += '<p class="msg" style="margin-top:15px;">No hay datos para el período seleccionado</p>';
      }

      const oldTable = statsContainer.querySelector('table');
      const oldMsg = statsContainer.querySelector('.msg');
      if (oldTable) oldTable.remove();
      if (oldMsg) oldMsg.remove();

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = tableHtml;
      while (tempDiv.firstChild) {
        statsContainer.appendChild(tempDiv.firstChild);
      }
    });

  } catch (err) {
    statsContainer.innerHTML = '<p class="msg error">Error cargando estadísticas</p>';
  }
}

function generateYearOptions() {
  const currentYear = new Date().getFullYear();
  let html = '';
  for (let y = currentYear; y >= currentYear - 5; y--) {
    html += '<option value="' + y + '">' + y + '</option>';
  }
  return html;
}

// ============================================
// GESTIÓN DE MÓDULOS Y PREGUNTAS
// ============================================

async function loadModulesAdmin() {
  modulesAdminContainer.innerHTML = '<p>Cargando módulos...</p>';
  try {
    const modRes = await fetch(API_URL + '/api/modules');
    adminModulesData = await modRes.json();

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
    html += '<button class="btn-delete-module" data-index="' + idx + '">🗑️ Eliminar Módulo</button>';
    html += '</div>';

    html += '<label>Título del Módulo</label>';
    html += '<input type="text" class="mod-title" value="' + escapeHtml(mod.title) + '">';
    html += '<label>Descripción</label>';
    html += '<textarea class="mod-desc" rows="2">' + escapeHtml(mod.description || '') + '</textarea>';

    html += '<div class="module-videos-section">';
    html += '<label>Videos de YouTube</label>';
    html += '<div class="videos-list" data-module-index="' + idx + '">';
    if (mod.videos && mod.videos.length > 0) {
      mod.videos.forEach((vid, vidx) => {
        html += '<div class="video-input-row">';
        html += '<input type="text" class="mod-video-url" value="' + escapeHtml(vid.video_url || '') + '" placeholder="https://www.youtube.com/watch?v=...">';
        html += '<button class="btn-remove-video" data-mod-idx="' + idx + '" data-vid-idx="' + vidx + '">🗑️</button>';
        html += '</div>';
      });
    }
    html += '</div>';
    html += '<button class="btn-add-video" data-index="' + idx + '">+ Agregar Video</button>';
    html += '</div>';

    html += '<label>Documento del Módulo (URL)</label>';
    html += '<input type="text" class="mod-document" value="' + escapeHtml(mod.document_url || '') + '" placeholder="https://.../documento.pdf">';

    html += '<label>Activo</label>';
    html += '<select class="mod-active"><option value="1" ' + (mod.active !== false ? 'selected' : '') + '>Sí</option><option value="0" ' + (mod.active === false ? 'selected' : '') + '>No</option></select>';

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
  html += '<button id="btn-add-module" class="btn-primary" style="margin-top:20px;">+ Agregar Nuevo Módulo</button>';
  modulesAdminContainer.innerHTML = html;

  document.querySelectorAll('.btn-add-video').forEach(btn => {
    btn.addEventListener('click', function() {
      addVideoInput(parseInt(this.getAttribute('data-index')));
    });
  });
  document.querySelectorAll('.btn-remove-video').forEach(btn => {
    btn.addEventListener('click', function() {
      removeVideoInput(parseInt(this.getAttribute('data-mod-idx')), parseInt(this.getAttribute('data-vid-idx')));
    });
  });
  document.querySelectorAll('.btn-add-question').forEach(btn => {
    btn.addEventListener('click', function() {
      const modId = parseInt(this.getAttribute('data-module-id'));
      addQuestionEditor(modId);
    });
  });
  document.querySelectorAll('.btn-delete-module').forEach(btn => {
    btn.addEventListener('click', function() {
      deleteModule(parseInt(this.getAttribute('data-index')));
    });
  });
  document.getElementById('btn-add-module').addEventListener('click', addNewModule);
}

function addVideoInput(moduleIndex) {
  const list = document.querySelector('.videos-list[data-module-index="' + moduleIndex + '"]');
  if (!list) return;
  const row = document.createElement('div');
  row.className = 'video-input-row';
  row.innerHTML = '<input type="text" class="mod-video-url" placeholder="https://www.youtube.com/watch?v=..."> <button class="btn-remove-video">🗑️</button>';
  list.appendChild(row);
  row.querySelector('.btn-remove-video').addEventListener('click', function() {
    row.remove();
  });
}

function removeVideoInput(moduleIndex, videoIndex) {
  const list = document.querySelector('.videos-list[data-module-index="' + moduleIndex + '"]');
  if (!list) return;
  const rows = list.querySelectorAll('.video-input-row');
  if (rows[videoIndex]) rows[videoIndex].remove();
}

function renderQuestionEditor(moduleId, qidx, q) {
  q = q || {};
  const numOpts = q.num_options || 4;
  const isMultiple = q.allow_multiple || false;

  let html = '<div class="question-editor" data-qidx="' + qidx + '">';
  html += '<div class="question-editor-header">';
  html += '<span>Pregunta ' + (qidx + 1) + '</span>';
  html += '<button class="btn-remove-question" data-module-id="' + moduleId + '" data-qidx="' + qidx + '">🗑️ Eliminar</button>';
  html += '</div>';

  html += '<input type="text" class="q-text-input" placeholder="Texto de la pregunta" value="' + escapeHtml(q.question_text || '') + '">';

  html += '<div class="question-media">';
  html += '<label>Video de la pregunta (YouTube URL)</label>';
  html += '<input type="text" class="q-video" placeholder="https://www.youtube.com/watch?v=..." value="' + escapeHtml(q.video_url || '') + '">';
  html += '<label>Documento de la pregunta (URL)</label>';
  html += '<input type="text" class="q-document" placeholder="https://.../doc.pdf" value="' + escapeHtml(q.document_url || '') + '">';
  html += '</div>';

  html += '<div class="question-config">';
  html += '<label>Número de opciones</label>';
  html += '<select class="q-num-options">';
  html += '<option value="2" ' + (numOpts === 2 ? 'selected' : '') + '>2 opciones</option>';
  html += '<option value="3" ' + (numOpts === 3 ? 'selected' : '') + '>3 opciones</option>';
  html += '<option value="4" ' + (numOpts === 4 ? 'selected' : '') + '>4 opciones</option>';
  html += '</select>';
  html += '<label class="q-multiple-label"><input type="checkbox" class="q-allow-multiple" ' + (isMultiple ? 'checked' : '') + '> Permitir respuestas múltiples</label>';
  html += '</div>';

  html += '<div class="options-row">';
  html += '<div class="option-field"><label>A)</label><input type="text" class="q-opt-a" value="' + escapeHtml(q.option_a || '') + '"></div>';
  html += '<div class="option-field"><label>B)</label><input type="text" class="q-opt-b" value="' + escapeHtml(q.option_b || '') + '"></div>';
  html += '<div class="option-field"><label>C)</label><input type="text" class="q-opt-c" value="' + escapeHtml(q.option_c || '') + '"></div>';
  html += '<div class="option-field"><label>D)</label><input type="text" class="q-opt-d" value="' + escapeHtml(q.option_d || '') + '"></div>';
  html += '</div>';

  html += '<label>Respuesta(s) Correcta(s)</label>';
  html += '<input type="text" class="q-correct" placeholder="A  o  A,B  o  B,C,D" value="' + escapeHtml(q.correct_options || 'A') + '">';
  html += '<p class="q-hint">Separa las letras con coma si son múltiples (ej: A,B)</p>';

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

function deleteModule(index) {
  if (!confirm('¿Eliminar este módulo? Se perderán sus preguntas y videos.')) return;
  adminModulesData.splice(index, 1);
  renderModulesAdmin();
}

function addNewModule() {
  const newIndex = adminModulesData.length;
  adminModulesData.push({
    id: 'new_' + Date.now(),
    title: 'Nuevo Módulo ' + (newIndex + 1),
    description: '',
    videos: [''],
    document_url: '',
    active: true
  });
  adminQuestionsData['new_' + Date.now()] = [];
  renderModulesAdmin();
  setTimeout(() => {
    const items = document.querySelectorAll('.module-admin-item');
    if (items[items.length - 1]) items[items.length - 1].scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

async function saveModules() {
  btnSaveModules.textContent = 'Guardando...';
  btnSaveModules.disabled = true;

  const items = modulesAdminContainer.querySelectorAll('.module-admin-item');
  const modules = [];
  items.forEach(item => {
    const videos = [];
    item.querySelectorAll('.mod-video-url').forEach(inp => {
      if (inp.value.trim()) videos.push(inp.value.trim());
    });

    modules.push({
      title: item.querySelector('.mod-title').value,
      description: item.querySelector('.mod-desc').value,
      videos: videos,
      document_url: item.querySelector('.mod-document').value,
      active: item.querySelector('.mod-active').value === '1'
    });
  });

  try {
    const modRes = await fetch(API_URL + '/api/admin/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
      body: JSON.stringify({ modules })
    });
    const modData = await modRes.json();

    if (!modData.success) {
      alert('Error guardando módulos: ' + (modData.error || ''));
      btnSaveModules.textContent = 'Guardar Cambios de Módulos';
      btnSaveModules.disabled = false;
      return;
    }

    const freshModules = modData.modules || [];

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
          video_url: ed.querySelector('.q-video').value,
          document_url: ed.querySelector('.q-document').value,
          option_a: ed.querySelector('.q-opt-a').value,
          option_b: ed.querySelector('.q-opt-b').value,
          option_c: ed.querySelector('.q-opt-c').value,
          option_d: ed.querySelector('.q-opt-d').value,
          num_options: parseInt(ed.querySelector('.q-num-options').value) || 4,
          allow_multiple: ed.querySelector('.q-allow-multiple').checked,
          correct_options: ed.querySelector('.q-correct').value || 'A'
        });
      });

      const qRes = await fetch(API_URL + '/api/admin/modules/' + modId + '/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
        body: JSON.stringify({ questions })
      });
      const qData = await qRes.json();
      if (!qData.success) {
        console.error('Error guardando preguntas para módulo ' + modId + ':', qData.error);
      }
    }

    alert('Módulos y preguntas guardados correctamente');
    loadModulesAdmin();
  } catch (err) {
    alert('Error de conexión al guardar: ' + err.message);
  } finally {
    btnSaveModules.textContent = 'Guardar Cambios de Módulos';
    btnSaveModules.disabled = false;
  }
}
