
// Turso libSQL - Browser Only (No localStorage)
let dbConn = null;

async function connectTurso() {
  try {
    const libsql = await import('https://esm.run/@libsql/client/web');
    dbConn = libsql.createClient({
      url: 'libsql://toner-brunorhaag.aws-ap-northeast-1.turso.io',
      authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzU2MDIwOTAsImlkIjoiMDE5ZDZhMjAtZDgwMS03Y2VjLWIyNTktMTQ4N2QyYmU3ZjcwIiwicmlkIjoiZWJkMjRhY2UtZDlmZS00YWIyLTkzNjYtMTEyYTNlN2VkZGY2In0.lntXK8iw5tuIinmys-w4Q6PJyVsAywmt5sP0npj3Ga263xg5U4zuPXnJh5AS0y9QaZAsTk0n8_Qs4plvW5x7AA'
    });

    await dbConn.execute(`
      CREATE TABLE IF NOT EXISTS setores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        ramal TEXT NOT NULL,
        cilindro TEXT NOT NULL,
        toner INTEGER NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    document.getElementById('status-text').textContent = '✅ TURSO libSQL Connected';
    document.getElementById('db-status').className = 'mb-6 p-4 bg-green-100 border-l-4 border-green-500 rounded-lg shadow-md';
    loadSectors();
  } catch (error) {
    document.getElementById('status-text').textContent = '❌ TURSO Connection Failed';
    console.error('Turso Error:', error);
    alert('Falha conexão Turso. Verifique internet/token.');
  }
}

async function loadSectors() {
  if (!dbConn) return;
  try {
    const result = await dbConn.execute('SELECT * FROM setores ORDER BY id DESC');
    const tbody = document.getElementById('sectors-tbody');
    const count = document.getElementById('count');
    tbody.innerHTML = '';
    count.textContent = `(${result.rows.length})`;

    result.rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-gray-50';
      tr.innerHTML = `
        <td class="p-4 font-medium">${escapeHtml(row.nome)}</td>
        <td class="p-4">${escapeHtml(row.ramal)}</td>
        <td class="p-4">${escapeHtml(row.cilindro)}</td>
        <td class="p-4 font-bold">${row.toner}</td>
        <td class="p-4">
          <button class="edit-btn bg-blue-500 text-white px-4 py-1 rounded text-sm hover:bg-blue-600 mr-2" data-id="${row.id}">Editar</button>
          <button class="delete-btn bg-red-500 text-white px-4 py-1 rounded text-sm hover:bg-red-600" data-id="${row.id}">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Load error:', error);
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

function showEditModal(sector) {
  document.getElementById('edit-id').value = sector.id;
  document.getElementById('edit-nome').value = sector.nome;
  document.getElementById('edit-ramal').value = sector.ramal;
  document.getElementById('edit-cilindro').value = sector.cilindro;
  document.getElementById('edit-toner').value = sector.toner;
  document.getElementById('edit-modal').classList.remove('hidden');
}

function hideEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', async () => {
  await connectTurso();

  document.getElementById('add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!dbConn) return alert('Aguardando conexão Turso...');

    try {
      await dbConn.execute({
        sql: 'INSERT INTO setores (nome, ramal, cilindro, toner) VALUES (?, ?, ?, ?)',
        args: [
          document.getElementById('nome').value.trim(),
          document.getElementById('ramal').value.trim(),
          document.getElementById('cilindro').value.trim(),
          parseInt(document.getElementById('toner').value) || 0
        ]
      });
      e.target.reset();
      loadSectors();
    } catch (error) {
      alert('Erro salvar: ' + error.message);
    }
  });

  document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!dbConn) return;

    try {
      const id = parseInt(document.getElementById('edit-id').value);
      await dbConn.execute({
        sql: 'UPDATE setores SET nome = ?, ramal = ?, cilindro = ?, toner = ? WHERE id = ?',
        args: [
          document.getElementById('edit-nome').value.trim(),
          document.getElementById('edit-ramal').value.trim(),
          document.getElementById('edit-cilindro').value.trim(),
          parseInt(document.getElementById('edit-toner').value) || 0,
          id
        ]
      });
      loadSectors();
      hideEditModal();
    } catch (error) {
      alert('Erro atualizar: ' + error.message);
    }
  });

  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('edit-btn') && dbConn) {
      const id = parseInt(e.target.dataset.id);
      const result = await dbConn.execute({
        sql: 'SELECT * FROM setores WHERE id = ?',
        args: [id]
      });
      if (result.rows[0]) showEditModal(result.rows[0]);
    } else if (e.target.classList.contains('delete-btn') && dbConn) {
      if (confirm('Confirmar exclusão?')) {
        const id = parseInt(e.target.dataset.id);
        await dbConn.execute({
          sql: 'DELETE FROM setores WHERE id = ?',
          args: [id]
        });
        loadSectors();
      }
    }
  });

  document.getElementById('cancel-edit').onclick = hideEditModal;
  document.getElementById('edit-modal').onclick = (e) => {
    if (e.target.id === 'edit-modal') hideEditModal();
  };
});

function showModal() {
  document.getElementById('edit-modal').classList.remove('hidden');
}

function hideModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

// Export DB (bonus)
window.exportDB = () => {
  const data = db.export();
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'toner.db';
  a.click();
};
// Data storage keys
const SECTORS_KEY = 'toner_sectors';

// Load data from localStorage
function loadData() {
  return {
    sectors: JSON.parse(localStorage.getItem(SECTORS_KEY)) || []
  };
}

// Save data to localStorage
function saveData(data) {
  localStorage.setItem(SECTORS_KEY, JSON.stringify(data.sectors));
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Render sectors table
function renderSectors() {
  const data = loadData();
  const tbody = document.getElementById('sectors-tbody');
  tbody.innerHTML = '';

  data.sectors.forEach(sector => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    row.innerHTML = `
      <td class="p-4 font-medium">${escapeHtml(sector.nome)}</td>
      <td class="p-4">${escapeHtml(sector.ramal)}</td>
      <td class="p-4">${escapeHtml(sector.cilindro)}</td>
      <td class="p-4">${sector.toner}</td>
      <td class="p-4">
        <button class="edit-btn bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 mr-2" data-id="${sector.id}">Editar</button>
        <button class="delete-btn bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600" data-id="${sector.id}">Excluir</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Update sector (full)
function updateSector(id, changes) {
  const data = loadData();
  const sector = data.sectors.find(s => s.id == id);
  if (!sector) return;

  Object.keys(changes).forEach(key => {
    sector[key] = changes[key];
  });
  saveData(data);
  renderSectors();
  hideEditModal();
}

// Edit modal functions
function showEditModal(sector) {
  document.getElementById('edit-id').value = sector.id;
  document.getElementById('edit-nome').value = sector.nome || '';
  document.getElementById('edit-ramal').value = sector.ramal || '';
  document.getElementById('edit-cilindro').value = sector.cilindro || '';
  document.getElementById('edit-toner').value = sector.toner || 0;
  document.getElementById('edit-modal').classList.remove('hidden');
}

function hideEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

// Event delegation for edit buttons
function deleteSector(id) {
  if (confirm('Confirma excluir este setor?')) {
    const data = loadData();
    data.sectors = data.sectors.filter(s => s.id != id);
    saveData(data);
    renderSectors();
  }
}

function attachEventListeners() {
  document.addEventListener('click', function(e) {
    if (e.target.matches('.edit-btn')) {
      e.preventDefault();
      const id = parseInt(e.target.dataset.id);
      const data = loadData();
      const sector = data.sectors.find(s => s.id == id);
      if (sector) showEditModal(sector);
    } else if (e.target.matches('.delete-btn')) {
      e.preventDefault();
      const id = parseInt(e.target.dataset.id);
      deleteSector(id);
    }
  });
}

// Add sector
function initAddForm() {
  const addForm = document.getElementById('add-form');
  if (addForm) {
    addForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const sector = {
        id: Date.now(),
        nome: document.getElementById('nome').value.trim(),
        ramal: document.getElementById('ramal').value.trim(),
        cilindro: document.getElementById('cilindro').value.trim(),
        toner: parseInt(document.getElementById('toner').value) || 0
      };
      const data = loadData();
      data.sectors.push(sector);
      saveData(data);
      this.reset();
      renderSectors();
    });
  }
}

// Edit form
function initEditForm() {
  const editForm = document.getElementById('edit-form');
  if (editForm) {
    editForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const id = parseInt(document.getElementById('edit-id').value);
      const changes = {
        nome: document.getElementById('edit-nome').value.trim(),
        ramal: document.getElementById('edit-ramal').value.trim(),
        cilindro: document.getElementById('edit-cilindro').value.trim(),
        toner: parseInt(document.getElementById('edit-toner').value) || 0
      };
      updateSector(id, changes);
    });
  }
  
  const cancelBtn = document.getElementById('cancel-edit');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', hideEditModal);
  }
  
  const modal = document.getElementById('edit-modal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) hideEditModal();
    });
  }
}

// Init everything
document.addEventListener('DOMContentLoaded', () => {
  initAddForm();
  initEditForm();
  attachEventListeners();
  renderSectors();
});

