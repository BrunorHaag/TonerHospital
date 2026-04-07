let db = null;

// Init SQLite
async function initDB() {
  try {
    const SQL = await initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });
    db = new SQL.Database();
    
    // Create table
    db.run(`
      CREATE TABLE IF NOT EXISTS setores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        ramal TEXT NOT NULL,
        cilindro TEXT NOT NULL,
        toner INTEGER NOT NULL
      )
    `);
    
    document.getElementById('status-text').textContent = '✅ Conectado';
    document.getElementById('db-status').className = 'mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg shadow-md';
    loadSectors();
  } catch (err) {
    document.getElementById('status-text').textContent = '❌ Erro SQLite';
    console.error(err);
  }
}

// Load sectors
function loadSectors() {
  if (!db) return;
  const res = db.exec('SELECT * FROM setores');
  const tbody = document.getElementById('sectors-tbody');
  tbody.innerHTML = '';
  const count = document.getElementById('count');
  
  if (res[0]) {
    const sectors = res[0].values;
    count.textContent = `(${sectors.length})`;
    sectors.forEach(row => {
      const [id, nome, ramal, cilindro, toner] = row;
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-gray-50';
      tr.innerHTML = `
        <td class="p-4 font-medium">${nome}</td>
        <td class="p-4">${ramal}</td>
        <td class="p-4">${cilindro}</td>
        <td class="p-4 font-bold">${toner}</td>
        <td class="p-4">
          <button class="edit-btn bg-blue-500 text-white px-4 py-1 rounded text-sm hover:bg-blue-600 mr-2" data-id="${id}">Editar</button>
          <button class="delete-btn bg-red-500 text-white px-4 py-1 rounded text-sm hover:bg-red-600" data-id="${id}">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    count.textContent = '(0)';
  }
}

// Add sector
document.addEventListener('DOMContentLoaded', async () => {
  await initDB();
  
  // Add form
  document.getElementById('add-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!db) return;
    
    const stmt = db.prepare('INSERT INTO setores (nome, ramal, cilindro, toner) VALUES (?, ?, ?, ?)');
    stmt.bind([
      document.getElementById('nome').value,
      document.getElementById('ramal').value,
      document.getElementById('cilindro').value,
      parseInt(document.getElementById('toner').value)
    ]);
    stmt.step();
    stmt.free();
    
    e.target.reset();
    loadSectors();
  });

  // Edit form
  document.getElementById('edit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!db) return;
    
    const id = document.getElementById('edit-id').value;
    const stmt = db.prepare('UPDATE setores SET nome=?, ramal=?, cilindro=?, toner=? WHERE id=?');
    stmt.bind([
      document.getElementById('edit-nome').value,
      document.getElementById('edit-ramal').value,
      document.getElementById('edit-cilindro').value,
      parseInt(document.getElementById('edit-toner').value),
      id
    ]);
    stmt.step();
    stmt.free();
    
    loadSectors();
    hideModal();
  });

  // Event delegation
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-btn')) {
      const id = e.target.dataset.id;
      const res = db.exec('SELECT * FROM setores WHERE id = ?', { returnData: true });
      if (res[0]) {
        const sector = res[0].values[0];
        document.getElementById('edit-id').value = sector[0];
        document.getElementById('edit-nome').value = sector[1];
        document.getElementById('edit-ramal').value = sector[2];
        document.getElementById('edit-cilindro').value = sector[3];
        document.getElementById('edit-toner').value = sector[4];
        showModal();
      }
    } else if (e.target.classList.contains('delete-btn')) {
      if (confirm('Excluir setor?')) {
        const id = e.target.dataset.id;
        db.run('DELETE FROM setores WHERE id = ?', [id]);
        loadSectors();
      }
    }
  });

  // Modal controls
  document.getElementById('cancel-edit').onclick = hideModal;
  document.getElementById('edit-modal').onclick = (e) => {
    if (e.target.id === 'edit-modal') hideModal();
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

