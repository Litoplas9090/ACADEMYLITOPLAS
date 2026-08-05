const API = window.location.origin;
let adminToken = localStorage.getItem('litoplas_admin_token');
let allUsers = [];
let allModules = [];

console.log('[ADMIN] Iniciando panel administrativo v5.5');

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();

  if (adminToken) {
    loadAdminData();
  } else {
    document.getElementById('admin-login').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
  }

  document.getElementById('btn-admin-login').addEventListener('click', doAdminLogin);
  document.getElementById('btn-admin-logout').addEventListener('click', doAdminLogout);
  document.getElementById('btn-search').addEventListener('click', filterUsers);
  document.getElementById('btn-clear-filters').addEventListener('click', clearFilters);
  document.getElementById('search-user').addEventListener('input', debounce(filterUsers, 300));
  document.getElementById('filter-status').addEventListener('change', filterUsers);
  document.getElementById('btn-add-module').addEventListener('click', addNewModule);
  document.getElementById('btn-filter-month').addEventListener('click', filterByMonth);

  document.getElementById('admin-user').addEventListener('keypress', (e) => { if (e.key === 'Enter') doAdminLogin(); });
  document.getElementById('admin-pass').addEventListener('keypress', (e) => { if (e.key === 'Enter') doAdminLogin(); });
});

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'contenido') loadModulesAdmin();
      if (btn.dataset.tab === 'estadisticas') loadStats();
    });
  });
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ==================== AUTH ====================
async function doAdminLogin() {
  const user = document.getElementById('admin-user').value;
  const pass = document.getElementById('admin-pass').value;
  try {
    const res = await fetch(`${API}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    adminToken = data.token;
    localStorage.setItem('litoplas_admin_token', adminToken);
    loadAdminData();
  } catch (err) {
    document.getElementById('admin-login-msg').textContent = err.message;
    document.getElementById('admin-login-msg').className = 'msg-error';
  }
}

function doAdminLogout() {
  adminToken = null;
  localStorage.removeItem('litoplas_admin_token');
  document.getElementById('admin-login').style.display = 'flex';
  document.getElementById('admin-dashboard').style.display = 'none';
}

async function loadAdminData() {
  document.getElementById('admin-login').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'block';
  document.getElementById('admin-user-name').textContent = 'Admin';
  await loadUsers();
  await loadStatsHeader();
}

// ==================== USUARIOS (GESTIÓN UNIFICADA) ====================
async function loadUsers() {
  try {
    const res = await fetch(`${API}/api/admin/users`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    if (!res.ok) throw new Error('No autorizado');
    allUsers = await res.json();
    renderUsers(allUsers);
  } catch (err) {
    console.error('Error cargando usuarios:', err);
    if (err.message === 'No autorizado') doAdminLogout();
  }
}

function renderUsers(users) {
  const tbody = document.getElementById('users-table-body');
  const empty = document.getElementById('users-empty');
  tbody.innerHTML = '';

  if (users.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  let total = 0, certified = 0, avgProgress = 0, expiring = 0;

  users.forEach(u => {
    total++;
    if (u.certificate_issued) certified++;
    avgProgress += (u.progress || 0);

    const expiry = u.certificate_expiry ? new Date(u.certificate_expiry) : null;
    const isExpiring = expiry && expiry >= now && expiry <= nextMonth;
    if (isExpiring) expiring++;

    const certStatus = u.certificate_issued 
      ? `<span class="badge badge-green">✓ ${expiry ? expiry.toLocaleDateString('es-CO') : 'Vigente'}</span>`
      : '<span class="badge badge-gray">Pendiente</span>';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.full_name}</td>
      <td><strong>${u.document}</strong></td>
      <td>${u.company || '-'}</td>
      <td>
        <div class="progress-bar-bg small">
          <div class="progress-bar-fill" style="width:${u.progress || 0}%"></div>
        </div>
        <small>${u.progress || 0}%</small>
      </td>
      <td>${certStatus}</td>
      <td>${isExpiring ? '<span class="badge badge-red">⚠ Próximo</span>' : (expiry ? expiry.toLocaleDateString('es-CO') : '-')}</td>
      <td>${u.created_at ? new Date(u.created_at).toLocaleDateString('es-CO') : '-'}</td>
      <td>
        <button class="btn-small btn-danger btn-delete-user" data-id="${u.id}">🗑️ Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-certified').textContent = certified;
  document.getElementById('stat-progress').textContent = (total > 0 ? Math.round(avgProgress / total) : 0) + '%';
  document.getElementById('stat-expiring').textContent = expiring;

  document.querySelectorAll('.btn-delete-user').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      if (confirm('¿Eliminar permanentemente este usuario?')) deleteUser(id);
    });
  });
}

function filterUsers() {
  const q = document.getElementById('search-user').value.toLowerCase().trim();
  const status = document.getElementById('filter-status').value;
  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  let filtered = allUsers.filter(u => {
    const matchQ = !q || u.document.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q);
    let matchStatus = true;
    if (status === 'certified') matchStatus = !!u.certificate_issued;
    if (status === 'nocert') matchStatus = !u.certificate_issued;
    if (status === 'expiring') {
      const expiry = u.certificate_expiry ? new Date(u.certificate_expiry) : null;
      matchStatus = expiry && expiry >= now && expiry <= nextMonth;
    }
    return matchQ && matchStatus;
  });

  renderUsers(filtered);
}

function clearFilters() {
  document.getElementById('search-user').value = '';
  document.getElementById('filter-status').value = 'all';
  renderUsers(allUsers);
}

async function deleteUser(id) {
  try {
    const res = await fetch(`${API}/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!res.ok) throw new Error('Error');
    allUsers = allUsers.filter(u => u.id != id);
    renderUsers(allUsers);
  } catch (err) {
    alert('Error eliminando usuario');
  }
}

// ==================== STATS HEADER ====================
async function loadStatsHeader() {
  try {
    const res = await fetch(`${API}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    if (!res.ok) return;
    const data = await res.json();
    document.getElementById('stat-total').textContent = data.total;
    document.getElementById('stat-certified').textContent = data.certified;
    document.getElementById('stat-progress').textContent = data.avgProgress + '%';
    document.getElementById('stat-expiring').textContent = data.expiring;
  } catch (err) {
    console.error('Error stats:', err);
  }
}

// ==================== ESTADÍSTICAS ====================
async function loadStats() {
  await loadStatsHeader();
  filterByMonth();
}

function filterByMonth() {
  const year = parseInt(document.getElementById('filter-year').value);
  const month = document.getElementById('filter-month').value;

  let filtered = allUsers.filter(u => {
    if (!u.created_at) return false;
    const d = new Date(u.created_at);
    if (d.getFullYear() !== year) return false;
    if (month !== 'all' && (d.getMonth() + 1) !== parseInt(month)) return false;
    return true;
  });

  const tbody = document.getElementById('stats-table-body');
  tbody.innerHTML = '';
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Sin registros</td></tr>';
    return;
  }

  filtered.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.full_name}</td>
      <td>${u.document}</td>
      <td>${u.company || '-'}</td>
      <td>${new Date(u.created_at).toLocaleDateString('es-CO')}</td>
      <td>${u.progress || 0}%</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('est-total').textContent = filtered.length;
  const certCount = filtered.filter(u => u.certificate_issued).length;
  document.getElementById('est-certified').textContent = certCount;
  const avg = filtered.length > 0 ? Math.round(filtered.reduce((a, b) => a + (b.progress || 0), 0) / filtered.length) : 0;
  document.getElementById('est-avg').textContent = avg + '%';
}

// ==================== MÓDULOS ====================
async function loadModulesAdmin() {
  try {
    const res = await fetch(`${API}/api/admin/modules`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    allModules = await res.json();
    renderModulesAdmin();
  } catch (err) {
    console.error('Error cargando módulos:', err);
  }
}

function renderModulesAdmin() {
  const container = document.getElementById('modules-admin-list');
  container.innerHTML = '';

  allModules.forEach((mod, idx) => {
    const div = document.createElement('div');
    div.className = 'module-admin-card';
    div.innerHTML = `
      <div class="module-admin-header">
        <h3>Módulo ${mod.order_num}: <input type="text" class="mod-title-input" value="${mod.title}" id="mod-title-${mod.id}"></h3>
        <button class="btn-small btn-danger btn-delete-module" data-id="${mod.id}">🗑️ Eliminar Módulo</button>
      </div>
      <div class="module-admin-body">
        <label>Descripción:</label>
        <textarea id="mod-desc-${mod.id}" rows="2">${mod.description || ''}</textarea>

        <label>Imagen URL:</label>
        <input type="text" id="mod-img-${mod.id}" value="${mod.image_url || ''}" placeholder="https://...">

        <label>Documento URL:</label>
        <input type="text" id="mod-doc-${mod.id}" value="${mod.document_url || ''}" placeholder="https://...">

        <label>Video principal (YouTube):</label>
        <input type="text" id="mod-video-${mod.id}" value="${mod.video_url || ''}" placeholder="https://youtube.com/...">

        <div class="videos-section">
          <label>Videos adicionales:</label>
          <div id="videos-list-${mod.id}"></div>
          <button class="btn-small btn-success btn-add-video" data-id="${mod.id}">+ Agregar Video</button>
        </div>

        <label>Activo:</label>
        <input type="checkbox" id="mod-active-${mod.id}" ${mod.active ? 'checked' : ''}>

        <div class="questions-section">
          <h4>Preguntas del Módulo</h4>
          <div id="questions-list-${mod.id}"></div>
          <button class="btn-small btn-success btn-add-question" data-id="${mod.id}">+ Agregar Pregunta</button>
        </div>
      </div>
    `;
    container.appendChild(div);

    // Videos adicionales
    const vidsContainer = div.querySelector(`#videos-list-${mod.id}`);
    if (mod.videos && mod.videos.length > 0) {
      mod.videos.forEach(v => {
        const vDiv = document.createElement('div');
        vDiv.className = 'video-row';
        vDiv.innerHTML = `
          <input type="text" class="video-url-input" value="${v.video_url}" placeholder="URL de YouTube">
          <button class="btn-small btn-danger btn-remove-video" data-vid="${v.id}">✕</button>
        `;
        vidsContainer.appendChild(vDiv);
      });
    }

    // Preguntas
    loadQuestionsAdmin(mod.id);

    div.querySelector('.btn-delete-module').addEventListener('click', () => {
      if (confirm('¿Eliminar este módulo? Se perderán todas sus preguntas.')) deleteModule(mod.id);
    });

    div.querySelector('.btn-add-video').addEventListener('click', () => {
      const vDiv = document.createElement('div');
      vDiv.className = 'video-row';
      vDiv.innerHTML = `
        <input type="text" class="video-url-input new-video" placeholder="URL de YouTube">
        <button class="btn-small btn-danger btn-remove-video-new">✕</button>
      `;
      vDiv.querySelector('.btn-remove-video-new').addEventListener('click', () => vDiv.remove());
      vidsContainer.appendChild(vDiv);
    });

    div.querySelector('.btn-add-question').addEventListener('click', () => addQuestionForm(mod.id));
  });

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn-primary btn-save-all';
  saveBtn.textContent = '💾 Guardar Cambios de Todos los Módulos';
  saveBtn.addEventListener('click', saveAllModules);
  container.appendChild(saveBtn);
}

async function loadQuestionsAdmin(moduleId) {
  try {
    const res = await fetch(`${API}/api/modules/${moduleId}/questions`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    const questions = await res.json();
    const container = document.getElementById(`questions-list-${moduleId}`);
    container.innerHTML = '';

    questions.forEach((q, i) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'question-form';
      qDiv.innerHTML = `
        <div class="question-header">
          <span>Pregunta ${i+1}</span>
          <button class="btn-small btn-danger btn-remove-question" data-qid="${q.id}">🗑️</button>
        </div>
        <input type="text" class="q-text" value="${q.question_text}" placeholder="Texto de la pregunta">

        <label>Video de la pregunta (YouTube):</label>
        <input type="text" class="q-video" value="${q.question_video_url || ''}" placeholder="https://youtube.com/...">

        <label>Documento de la pregunta (URL):</label>
        <input type="text" class="q-doc" value="${q.question_doc_url || ''}" placeholder="https://...">

        <label>Número de opciones:</label>
        <select class="q-numopts">
          <option value="2" ${q.num_options === 2 ? 'selected' : ''}>2 opciones</option>
          <option value="3" ${q.num_options === 3 ? 'selected' : ''}>3 opciones</option>
          <option value="4" ${q.num_options === 4 || !q.num_options ? 'selected' : ''}>4 opciones</option>
        </select>

        <label><input type="checkbox" class="q-multiple" ${q.allow_multiple ? 'checked' : ''}> Permitir respuestas múltiples</label>

        <div class="options-inputs">
          <input type="text" class="q-opt-a" value="${q.option_a || ''}" placeholder="Opción A">
          <input type="text" class="q-opt-b" value="${q.option_b || ''}" placeholder="Opción B">
          <input type="text" class="q-opt-c" value="${q.option_c || ''}" placeholder="Opción C" ${q.num_options === 2 ? 'style="display:none"' : ''}>
          <input type="text" class="q-opt-d" value="${q.option_d || ''}" placeholder="Opción D" ${q.num_options === 2 || q.num_options === 3 ? 'style="display:none"' : ''}>
        </div>

        <label>Respuesta(s) correcta(s):</label>
        <input type="text" class="q-correct" value="${q.correct_option || ''}" placeholder="A  o  A,B  o  B,C,D">
      `;
      container.appendChild(qDiv);

      const numSelect = qDiv.querySelector('.q-numopts');
      numSelect.addEventListener('change', (e) => {
        const num = parseInt(e.target.value);
        qDiv.querySelector('.q-opt-c').style.display = num >= 3 ? 'block' : 'none';
        qDiv.querySelector('.q-opt-d').style.display = num >= 4 ? 'block' : 'none';
      });

      qDiv.querySelector('.btn-remove-question').addEventListener('click', () => qDiv.remove());
    });
  } catch (err) {
    console.error('Error cargando preguntas:', err);
  }
}

function addQuestionForm(moduleId) {
  const container = document.getElementById(`questions-list-${moduleId}`);
  const count = container.querySelectorAll('.question-form').length + 1;
  const qDiv = document.createElement('div');
  qDiv.className = 'question-form';
  qDiv.innerHTML = `
    <div class="question-header">
      <span>Pregunta nueva ${count}</span>
      <button class="btn-small btn-danger btn-remove-question-new">🗑️</button>
    </div>
    <input type="text" class="q-text" placeholder="Texto de la pregunta">

    <label>Video de la pregunta (YouTube):</label>
    <input type="text" class="q-video" placeholder="https://youtube.com/...">

    <label>Documento de la pregunta (URL):</label>
    <input type="text" class="q-doc" placeholder="https://...">

    <label>Número de opciones:</label>
    <select class="q-numopts">
      <option value="2">2 opciones</option>
      <option value="3">3 opciones</option>
      <option value="4" selected>4 opciones</option>
    </select>

    <label><input type="checkbox" class="q-multiple"> Permitir respuestas múltiples</label>

    <div class="options-inputs">
      <input type="text" class="q-opt-a" placeholder="Opción A">
      <input type="text" class="q-opt-b" placeholder="Opción B">
      <input type="text" class="q-opt-c" placeholder="Opción C">
      <input type="text" class="q-opt-d" placeholder="Opción D">
    </div>

    <label>Respuesta(s) correcta(s):</label>
    <input type="text" class="q-correct" placeholder="A  o  A,B  o  B,C,D">
  `;
  container.appendChild(qDiv);

  const numSelect = qDiv.querySelector('.q-numopts');
  numSelect.addEventListener('change', (e) => {
    const num = parseInt(e.target.value);
    qDiv.querySelector('.q-opt-c').style.display = num >= 3 ? 'block' : 'none';
    qDiv.querySelector('.q-opt-d').style.display = num >= 4 ? 'block' : 'none';
  });

  qDiv.querySelector('.btn-remove-question-new').addEventListener('click', () => qDiv.remove());
}

async function saveAllModules() {
  try {
    for (const mod of allModules) {
      const title = document.getElementById(`mod-title-${mod.id}`).value;
      const description = document.getElementById(`mod-desc-${mod.id}`).value;
      const video_url = document.getElementById(`mod-video-${mod.id}`).value;
      const document_url = document.getElementById(`mod-doc-${mod.id}`).value;
      const image_url = document.getElementById(`mod-img-${mod.id}`).value;
      const active = document.getElementById(`mod-active-${mod.id}`).checked;

      await fetch(`${API}/api/admin/modules/${mod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ title, description, video_url, document_url, image_url, order_num: mod.order_num, active })
      });

      // Guardar videos nuevos
      const newVideos = [];
      document.querySelectorAll(`#videos-list-${mod.id} .new-video`).forEach(inp => {
        if (inp.value.trim()) newVideos.push(inp.value.trim());
      });
      for (const vurl of newVideos) {
        await fetch(`${API}/api/admin/modules/${mod.id}/videos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
          body: JSON.stringify({ video_url: vurl, order_num: 0 })
        });
      }

      // Guardar preguntas
      const questions = [];
      document.querySelectorAll(`#questions-list-${mod.id} .question-form`).forEach(qDiv => {
        const numOpts = parseInt(qDiv.querySelector('.q-numopts').value);
        questions.push({
          question_text: qDiv.querySelector('.q-text').value,
          question_video_url: qDiv.querySelector('.q-video').value,
          question_doc_url: qDiv.querySelector('.q-doc').value,
          option_a: qDiv.querySelector('.q-opt-a').value,
          option_b: qDiv.querySelector('.q-opt-b').value,
          option_c: numOpts >= 3 ? qDiv.querySelector('.q-opt-c').value : '',
          option_d: numOpts >= 4 ? qDiv.querySelector('.q-opt-d').value : '',
          correct_option: qDiv.querySelector('.q-correct').value.toUpperCase(),
          num_options: numOpts,
          allow_multiple: qDiv.querySelector('.q-multiple').checked
        });
      });

      const qRes = await fetch(`${API}/api/admin/modules/${mod.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ questions })
      });
      if (!qRes.ok) {
        const err = await qRes.json();
        console.error('Error guardando preguntas módulo', mod.id, err);
      }
    }
    alert('Módulos y preguntas guardados correctamente');
    loadModulesAdmin();
  } catch (err) {
    console.error('Error guardando:', err);
    alert('Error guardando cambios: ' + err.message);
  }
}

async function deleteModule(id) {
  try {
    await fetch(`${API}/api/admin/modules/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    loadModulesAdmin();
  } catch (err) {
    alert('Error eliminando módulo');
  }
}

async function addNewModule() {
  try {
    const maxOrder = allModules.length > 0 ? Math.max(...allModules.map(m => m.order_num)) : 0;
    const res = await fetch(`${API}/api/admin/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: `Nuevo Módulo ${maxOrder + 1}`,
        description: 'Descripción del nuevo módulo',
        video_url: '',
        document_url: '',
        image_url: '',
        order_num: maxOrder + 1,
        active: true
      })
    });
    if (!res.ok) throw new Error('Error');
    loadModulesAdmin();
  } catch (err) {
    alert('Error creando módulo');
  }
}
