// 1. Configurações de Conexão
// Substitua pelos seus dados do Supabase (Project Settings > API)
const SUPABASE_URL = 'https://hyelausjutkbvmvxjvic.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5ZWxhdXNqdXRrYnZtdnhqdmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODIxMjQsImV4cCI6MjA5MTI1ODEyNH0.46Gf7zfpvsvsXLDhxZH6h-ylRNZF91rYAE_yyKxjIFE';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Elementos do DOM
const tableBody = document.getElementById('sectors-tbody');
const addForm = document.getElementById('add-form');
const countSpan = document.getElementById('count');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const cancelEditBtn = document.getElementById('cancel-edit');

// --- FUNÇÕES DE DADOS (CRUD) ---

// Buscar todos os setores e atualizar a tela
async function fetchSectors() {
    const { data, error } = await _supabase
        .from('setores')
        .select('*')
        .order('nome', { ascending: true });

    if (error) {
        console.error('Erro ao buscar dados:', error.message);
        return;
    }
    renderTable(data);
}

// Adicionar novo setor
addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newSector = {
        nome: document.getElementById('nome').value,
        ramal: document.getElementById('ramal').value,
        cilindro: document.getElementById('cilindro').value,
        toner: parseInt(document.getElementById('toner').value)
    };

    const { error } = await _supabase.from('setores').insert([newSector]);
    
    if (error) {
        alert('Erro ao adicionar: ' + error.message);
    } else {
        addForm.reset();
        // Não precisamos chamar fetchSectors() aqui pois o Realtime fará isso
    }
});

// Deletar setor
async function deleteSector(id) {
    if (confirm('Tem certeza que deseja excluir este setor?')) {
        const { error } = await _supabase.from('setores').delete().eq('id', id);
        if (error) alert('Erro ao deletar: ' + error.message);
    }
}

// Atualizar setor (Salvar edição)
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    
    const updatedData = {
        nome: document.getElementById('edit-nome').value,
        ramal: document.getElementById('edit-ramal').value,
        cilindro: document.getElementById('edit-cilindro').value,
        toner: parseInt(document.getElementById('edit-toner').value)
    };

    const { error } = await _supabase.from('setores').update(updatedData).eq('id', id);
    
    if (error) {
        alert('Erro ao atualizar: ' + error.message);
    } else {
        closeModal();
    }
});

// --- LÓGICA DE INTERFACE ---

function renderTable(sectors) {
    tableBody.innerHTML = '';
    
    // Atualiza o contador (X) ao lado do título
    if (countSpan) countSpan.innerText = `(${sectors.length})`;
    
    sectors.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition-colors border-b";
        tr.innerHTML = `
            <td class="p-4">${item.nome}</td>
            <td class="p-4">${item.ramal}</td>
            <td class="p-4">${item.cilindro}</td>
            <td class="p-4 font-semibold text-blue-600">${item.toner}</td>
            <td class="p-4 flex gap-3">
                <button onclick="openEditModal('${item.id}', '${item.nome}', '${item.ramal}', '${item.cilindro}', ${item.toner})" 
                        class="text-blue-500 hover:text-blue-700 font-medium">Editar</button>
                <button onclick="deleteSector('${item.id}')" 
                        class="text-red-500 hover:text-red-700 font-medium">Excluir</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Funções do Modal
function openEditModal(id, nome, ramal, cilindro, toner) {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-nome').value = nome;
    document.getElementById('edit-ramal').value = ramal;
    document.getElementById('edit-cilindro').value = cilindro;
    document.getElementById('edit-toner').value = toner;
    
    editModal.classList.remove('hidden');
}

function closeModal() {
    editModal.classList.add('hidden');
    editForm.reset();
}

cancelEditBtn.addEventListener('click', closeModal);

// Fechar modal ao clicar fora dele
window.onclick = function(event) {
    if (event.target == editModal) closeModal();
}

// --- SINCRONIZAÇÃO EM TEMPO REAL ---

const subscribeToChanges = () => {
    _supabase
        .channel('db-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'setores' }, 
            (payload) => {
                console.log('Mudança detectada no banco:', payload);
                fetchSectors(); 
            }
        )
        .subscribe();
};

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    fetchSectors();
    subscribeToChanges();
});