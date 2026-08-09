// Importar Firebase desde los CDNs oficiales para la web
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuración de tu proyecto en Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB2VTYw7MvCIQC6vh0HGl3R0FBEmKl9Km4",
  authDomain: "bajapeso-c4216.firebaseapp.com",
  projectId: "bajapeso-c4216",
  storageBucket: "bajapeso-c4216.firebasestorage.app",
  messagingSenderId: "461113411163",
  appId: "1:461113411163:web:ae8f8c113eced78044217e"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencias de la interfaz
const guardarBtn = document.getElementById('guardar-btn');
const pesoInput = document.getElementById('peso-input');
const notaInput = document.getElementById('nota-input');
const historyList = document.getElementById('history-list');

// Cargar registros al abrir la página
document.addEventListener('DOMContentLoaded', cargarRegistros);

guardarBtn.addEventListener('click', async () => {
    const peso = pesoInput.value.trim();
    const nota = notaInput.value.trim();
    
    if (!peso && !nota) {
        alert("Escribe al menos tu peso o una nota de tu entrenamiento.");
        return;
    }

    guardarBtn.textContent = "Guardando en la nube...";
    guardarBtn.disabled = true;

    try {
        await addDoc(collection(db, "registros_peso"), {
            peso: peso ? parseFloat(peso) : null,
            nota: nota || "Sin comentarios",
            fecha: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
            timestamp: Date.now()
        });

        alert("¡Guardado correctamente en la nube!");
        pesoInput.value = '';
        notaInput.value = '';
        cargarRegistros();
    } catch (e) {
        console.error("Error al guardar: ", e);
        alert("Hubo un error al guardar los datos.");
    } finally {
        guardarBtn.textContent = "Guardar Registro en la Nube";
        guardarBtn.disabled = false;
    }
});

async function cargarRegistros() {
    historyList.innerHTML = '<li class="history-item">Cargando registros...</li>';
    try {
        const q = query(collection(db, "registros_peso"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        historyList.innerHTML = '';
        if (querySnapshot.empty) {
            historyList.innerHTML = '<li class="history-item">Aún no hay registros en la nube.</li>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const li = document.createElement('li');
            li.classList.add('history-item');
            li.innerHTML = `<span>[${data.fecha}]</span> - <strong>Peso:</strong> ${data.peso ? data.peso + ' kg' : 'N/A'} <br> <em>${data.nota}</em>`;
            historyList.appendChild(li);
        });
    } catch (e) {
        console.error("Error al cargar historial: ", e);
        historyList.innerHTML = '<li class="history-item">Error al conectar con la base de datos.</li>';
    }
}
