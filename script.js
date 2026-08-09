import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB2VTYw7MvCIQC6vh0HGl3R0FBEmKl9Km4",
  authDomain: "bajapeso-c4216.firebaseapp.com",
  projectId: "bajapeso-c4216",
  storageBucket: "bajapeso-c4216.firebasestorage.app",
  messagingSenderId: "461113411163",
  appId: "1:461113411163:web:ae8f8c113eced78044217e"
};

let db = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase err:", e);
}

// Navegación entre pestañas
const btnChat = document.getElementById('btn-pantalla-chat');
const btnRegistro = document.getElementById('btn-pantalla-registro');
const screenChat = document.getElementById('pantalla-chat');
const screenRegistro = document.getElementById('pantalla-registro');

btnChat.addEventListener('click', () => {
    btnChat.classList.add('active');
    btnRegistro.classList.remove('active');
    screenChat.classList.add('active');
    screenRegistro.classList.remove('active');
});

btnRegistro.addEventListener('click', () => {
    btnRegistro.classList.add('active');
    btnChat.classList.remove('active');
    screenRegistro.classList.add('active');
    screenChat.classList.remove('active');
});

// Elementos de Chat
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const enviarChatBtn = document.getElementById('enviar-chat-btn');

enviarChatBtn.addEventListener('click', enviarChat);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') enviarChat(); });

function enviarChat() {
    const texto = chatInput.value.trim();
    if (!texto) return;
    agregarBurbuja(texto, 'user');
    chatInput.value = '';

    setTimeout(() => {
        let resp = "Entendido, Guty. Claridad y constancia sin pretextos.";
        const t = texto.toLowerCase();
        if (t.includes('biblia') || t.includes('versiculo') || t.includes('cita')) {
            resp = `"Todo lo puedo en Cristo que me fortalece." — Filipenses 4:13`;
        } else if (t.includes('como voy') || t.includes('peso')) {
            resp = `Partimos de 94 kg. Revisa tu pestaña de bitácora para ver tus avances guardados.`;
        } else if (t.includes('hola') || t.includes('buenos dias')) {
            resp = `¡Hola Guty! Listo para dar resultados hoy. ¿Qué entrenamos?`;
        }
        agregarBurbuja(resp, 'coach');
    }, 400);
}

function agregarBurbuja(txt, tipo) {
    const div = document.createElement('div');
    div.classList.add('msg', tipo);
    div.textContent = txt;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Elementos de Registro
const guardarBtn = document.getElementById('guardar-btn');
const pesoInput = document.getElementById('peso-input');
const notaInput = document.getElementById('nota-input');
const historyList = document.getElementById('history-list');

document.addEventListener('DOMContentLoaded', cargarDatos);

guardarBtn.addEventListener('click', async () => {
    const peso = pesoInput.value.trim();
    const nota = notaInput.value.trim();
    if (!peso && !nota) {
        alert("Escribe al menos tu peso o una nota.");
        return;
    }

    guardarBtn.textContent = "Guardando...";
    guardarBtn.disabled = true;

    const fechaStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    const itemData = { 
        peso: peso ? parseFloat(peso) : null, 
        nota: nota || "Sin notas", 
        fecha: fechaStr, 
        timestamp: Date.now() 
    };

    try {
        if (db) {
            await addDoc(collection(db, "registros_peso"), itemData);
        }
    } catch (e) {
        console.warn("Firebase guardado demorado, usando respaldo local:", e);
    }

    // Guardar siempre en almacenamiento local para respuesta instantánea en el celular
    let local = JSON.parse(localStorage.getItem('peso_local')) || [];
    local.unshift(itemData);
    localStorage.setItem('peso_local', JSON.stringify(local));

    alert("¡Guardado correctamente!");
    pesoInput.value = '';
    notaInput.value = '';
    guardarBtn.textContent = "Guardar Registro";
    guardarBtn.disabled = false;
    cargarDatos();
});

async function cargarDatos() {
    historyList.innerHTML = '<li class="history-item">Cargando...</li>';
    let items = [];
    
    try {
        if (db) {
            const q = query(collection(db, "registros_peso"), orderBy("timestamp", "desc"));
            const snap = await getDocs(q);
            snap.forEach(d => items.push(d.data()));
        }
    } catch (e) {
        console.warn("Leyendo de respaldo local por red móvil.");
    }

    if (items.length === 0) {
        items = JSON.parse(localStorage.getItem('peso_local')) || [];
    }

    historyList.innerHTML = '';
    if (items.length === 0) {
        historyList.innerHTML = '<li class="history-item">Aún no hay registros guardados.</li>';
        return;
    }

    items.forEach(d => {
        const li = document.createElement('li');
        li.classList.add('history-item');
        li.innerHTML = `<span>[${d.fecha}]</span> - <strong>Peso:</strong> ${d.peso ? d.peso + ' kg' : 'N/A'} <br><em>${d.nota}</em>`;
        historyList.appendChild(li);
    });
}
