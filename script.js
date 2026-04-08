// Toner Control - Firebase Firestore (Production Ready)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAuc5QDmQ9K9ek9f-8L0O8a6oX4fO3gI1M",
  authDomain: "toners-ahsj.firebaseapp.com",
  projectId: "toners-ahsj",
  storageBucket: "toners-ahsj.appspot.com",
  messagingSenderId: "1088759155459",
  appId: "1:1088759155459:web:9d7b1c6e7f88e7e1b2a4c9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.getElementById('status-text').textContent = '🔥 Firebase Ready';
document.getElementById('db-status').className = 'mb-8 p-4 rounded-xl shadow-lg border-l-4 border-orange-500 bg-orange-50';

async function loadSectors() {
  try {
    const q = query(collection(db, "setores"), orderBy("id", "desc"));
    const snapshot = await getDocs(q);
    const tbody = document.getElementById('sectors-tbody');
    const count = document.getElementById('count');
    tbody.innerHTML = '';
    count.textContent = `(${snapshot.size})`;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const row = document.createElement('tr');
      row.className = 'hover:bg-orange-50 border-b transition-colors';
      row.innerHTML = `
        <td class="p-6 font-semibold">${data.nome}</td>
        <td class="p-6">${data.ramal}</td>
        <td class="p-6">${data.cilindro}</td>
        <td class="p-6 font-bold text-xl">${data.toner}</td>
        <td class="p-6">
          <button class="edit-btn bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 shadow-lg mr-3" data-id="${docSnap.id}">Editar</button>
          <button class="delete-btn bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-bold hover:from-red-600 hover:to-red-700 shadow-lg" data-id="${docSnap.id}">Excluir</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Firestore error:", error);
  }
}

function showEditModal(sectorId, sectorData) {
  document.getElementById('edit-id').value = sectorId;
  document.getElementById('edit-nome').value = sectorData.nome;
  document.getElementById('edit-ramal').value = sectorData.ramal;
  document.getElementById('edit-cilindro').value = sectorData.cilindro;
  document.getElementById('edit-toner').value = sectorData.toner;
  document.getElementById('edit-modal').classList.remove('hidden');
}

function hideEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

// Add
document.getElementById('add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await addDoc(collection(db, "setores"), {
      nome: document.getElementById('nome').value.trim(),
      ramal: document.getElementById('ramal').value.trim(),
      cilindro: document.getElementById('cilindro').value.trim(),
      toner: parseInt(document.getElementById('toner').value) || 0,
      id: Date.now()
    });
    e.target.reset();
    loadSectors();
  } catch (error) {
    alert('Erro: ' + error.message);
  }
});

// Edit
document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const id = document.getElementById('edit-id').value;
    await updateDoc(doc(db, "setores", id), {
      nome: document.getElementById('edit-nome').value.trim(),
      ramal: document.getElementById('edit-ramal').value.trim(),
      cilindro: document.getElementById('edit-cilindro').value.trim(),
      toner: parseInt(document.getElementById('edit-toner').value) || 0
    });
    loadSectors();
    hideEditModal();
  } catch (error) {
    alert('Erro: ' + error.message);
  }
});

// Events
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('edit-btn')) {
    const id = e.target.dataset.id;
    const docSnap = await getDoc(doc(db, "setores", id));
    if (docSnap.exists()) {
      showEditModal(id, docSnap.data());
    }
  }
  if (e.target.classList.contains('delete-btn')) {
    if (confirm('Excluir setor?')) {
      await deleteDoc(doc(db, "setores", e.target.dataset.id));
      loadSectors();
    }
  }
});

document.getElementById('cancel-edit').onclick = hideEditModal;
document.getElementById('edit-modal').onclick = (e) => {
  if (e.target.id === 'edit-modal') hideEditModal();
};

loadSectors();

