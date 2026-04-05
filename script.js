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

