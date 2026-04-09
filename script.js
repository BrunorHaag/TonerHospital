// 1. Configurações de Conexão
const SUPABASE_URL = 'https://hyelausjutkbvmvxjvic.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5ZWxhdXNqdXRrYnZtdnhqdmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODIxMjQsImV4cCI6MjA5MTI1ODEyNH0.46Gf7zfpvsvsXLDhxZH6h-ylRNZF91rYAE_yyKxjIFE'; // Sua chave anon
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Elementos do DOM
const tableBody = document.getElementById('sectors-tbody');
const addForm = document.getElementById('add-form');
const countSpan = document.getElementById('count');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const cancelEditBtn = document.getElementById('cancel-edit');

// --- CRUD ---

async function fetchSectors() {
    const { data, error } = await _supabase
        .from('setores')
        .select('*')
        .order('nome', { ascending: true });

    if (error) {
        console.error('Erro:', error);
        return;
    }
    renderTable(data);
}

addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newSector = {
        nome: document.getElementById('nome').value,
        ramal: document.getElementById('ramal').value,
        cilindro: document.getElementById('cilindro').value,
        toner: parseInt(document.getElementById('toner').value)
    };

    const { error } = await _supabase.from('setores').insert([newSector]);
    if (error) alert('Erro: ' + error.message);
    else {
        addForm.reset();
        fetchSectors(); // Força atualização caso o Realtime demore
    }
});

// Expondo funções para o escopo global (necessário para o onclick do HTML)
window.deleteSector = async (id) => {
    if (confirm('Deseja excluir?')) {
        const { error } = await _supabase.from('setores').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchSectors();
    }
};

window.openEditModal = (id, nome, ramal, cilindro, toner) => {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-nome').value = nome;
    document.getElementById('edit-ramal').value = ramal;
    document.getElementById('edit-cilindro').value = cilindro;
    document.getElementById('edit-toner').value = toner;
    editModal.classList.remove('hidden');
};

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
    if (error) alert(error.message);
    else {
        closeModal();
        fetchSectors();
    }
});

function renderTable(sectors) {
    tableBody.innerHTML = '';
    countSpan.innerText = `(${sectors.length})`;
    
    // Variáveis para acumular os totais
    let totalToner = 0;
    let totalCilindro = 0;
    
    sectors.forEach(item => {
        // Somar os valores (convertendo para número para garantir)
        // Se o cilindro for texto (ex: "DR-123"), a soma de cilindros pode não ser numérica.
        // Se cilindro for quantidade, use: totalCilindro += parseInt(item.cilindro) || 0;
        totalToner += parseInt(item.toner) || 0;
        
        // Se o seu campo "cilindro" for apenas o NOME do modelo, ignore a linha abaixo.
        // Se for a QUANTIDADE de cilindros, mantenha:
        totalCilindro += parseInt(item.cilindro) || 0;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 border-b";
        tr.innerHTML = `
            <td class="p-4">${item.nome}</td>
            <td class="p-4">${item.ramal}</td>
            <td class="p-4">${item.cilindro}</td>
            <td class="p-4 font-semibold text-blue-600">${item.toner}</td>
            <td class="p-4 flex gap-3">
                <button onclick="openEditModal('${item.id}', '${item.nome}', '${item.ramal}', '${item.cilindro}', ${item.toner})" class="text-blue-500 hover:underline">Editar</button>
                <button onclick="deleteSector('${item.id}')" class="text-red-500 hover:underline">Excluir</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Atualiza os elementos de total no dashboard
    document.getElementById('total-toner').innerText = totalToner;
    document.getElementById('total-cilindro').innerText = totalCilindro;
}

function closeModal() {
    editModal.classList.add('hidden');
}

cancelEditBtn.onclick = closeModal;

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    fetchSectors();
    
    // Ativa o Realtime
    _supabase.channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'setores' }, () => {
        fetchSectors();
    }).subscribe();
});
