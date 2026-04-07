// Turso libSQL - SQLite Cloud
const DB_URL = 'libsql://toner-brunorhaag.aws-ap-northeast-1.turso.io';
const DB_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzU2MDIwOTAsImlkIjoiMDE5ZDZhMjAtZDgwMS03Y2VjLWIyNTktMTQ4N2QyYmU3ZjcwIiwicmlkIjoiZWJkMjRhY2UtZDlmZS00YWIyLTkzNjYtMTEyYTNlN2VkZGY2In0.lntXK8iw5tuIinmys-w4Q6PJyVsAywmt5sP0npj3Ga263xg5U4zuPXnJh5AS0y9QaZAsTk0n8_Qs4plvW5x7AA';

let db = null;

async function initDB() {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@libsql/client@0.10.1/web/+esm');
    db = createClient({
      url: DB_URL,
      authToken: DB_AUTH_TOKEN
    });
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS setores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        ramal TEXT NOT NULL,
        cilindro TEXT NOT NULL,
        toner INTEGER NOT NULL
      )
    `);
    
    document.getElementById('status-text').textContent = '✅ Turso libSQL Connected';
    document.getElementById('db-status').className = 'mb-6 p-4 bg-green-100 border-l-4 border-green-500 rounded-lg';
    
    loadSectors();
  } catch (error) {
    document.getElementById('status-text').textContent = '❌ Turso Error - Using local fallback';
    console.error('Turso failed:', error);
    useLocalStorage();
  }
}

async function loadSectors() {
  if (!db) return;
  const result = await db.execute('SELECT * FROM setores ORDER BY id DESC');
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
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function useLocalStorage() {
  // Fallback localStorage code here (from previous version)
  document.getElementById('status-text').textContent = '🗄️ LocalStorage Fallback';
  // Add localStorage logic if needed
}

function showModal(sector) {
  document.getElementById('edit-id').value = sector.id;
  document.getElementById('edit-nome').value = sector.nome;
  document.getElementById('edit-ramal').value = sector.ramal;
  document.getElementById('edit-cilindro').value = sector.cilindro;
  document.getElementById('edit-toner').value = sector.toner;
  document.getElementById('edit-modal').classList.remove('hidden');
}

function hideModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', async () => {
  await initDB();
  
  document.getElementById('add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!db) return alert('DB not ready');
    
    await db.execute({
      sql: 'INSERT INTO setores (nome, ramal, cilindro, toner) VALUES (?, ?, ?, ?)',
      args: [
        document.getElementById('nome').value,
        document.getElementById('ramal').value,
        document.getElementById('cilindro').value,
        parseInt(document.getElementById('toner').value) || 0
      ]
    });
    
    e.target.reset();
    loadSectors();
  });

  document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!db) return;
    
    const id = parseInt(document.getElementById('edit-id').value);
    await db.execute({
      sql: 'UPDATE setores SET nome = ?, ramal = ?, cilindro = ?, toner = ? WHERE id = ?',
      args: [
        document.getElementById('edit-nome').value,
        document.getElementById('edit-ramal').value,
        document.getElementById('edit-cilindro').value,
        parseInt(document.getElementById('edit-toner').value) || 0,
        id
      ]
    });
    
    loadSectors();
    hideModal();
  });

  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('edit-btn') && db) {
      const id = parseInt(e.target.dataset.id);
      const result = await db.execute({
        sql: 'SELECT * FROM setores WHERE id = ?',
        args: [id]
      });
      if (result.rows[0]) showModal(result.rows[0]);
    } else if (e.target.classList.contains('delete-btn') && db) {
      if (confirm('Confirmar exclusão do setor?')) {
        const id = parseInt(e.target.dataset.id);
        await db.execute({
          sql: 'DELETE FROM setores WHERE id = ?',
          args: [id]
        });
        loadSectors();
      }
    }
  });

  document.getElementById('cancel-edit').addEventListener('click', hideModal);
  document.getElementById('edit-modal').addEventListener('click', (e) => {
    if (e.target.id === 'edit-modal') hideModal();
  });
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

