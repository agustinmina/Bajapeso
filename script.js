import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// 1. FIREBASE
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
} catch (e) { console.error("Error Firebase:", e); }

// 2. NAVEGACIÓN ENTRE PANTALLAS
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

// 3. IA REAL DEL COACH (MODELO ACTUALIZADO)
const GEMINI_API_KEY = "AQ.Ab8RN6KALx3FFt5tliXpnzVy9Q05LXlEMkJ1GWqx-Djf6UCZXA"; 
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function consultarIA(mensajeUsuario) {
    try {
        // Usamos gemini-2.5-flash que es el modelo vigente y activo
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const promptPersonalidad = `Eres un coach de disciplina implacable para Agustín (Guty). Su objetivo es bajar de peso (inició en 94kg) usando Nike Run Club y ejercicios en casa. Responde a su mensaje de forma clara, directa y dura, sin rodeos, sin hacerle sentir mal pero no le dejes pasar excusas. No seas repetitivo. Mensaje de Guty: "${mensajeUsuario}"`;

        const result = await model.generateContent(promptPersonalidad);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Detalle del error IA:", error);
        return `Error al conectar con el Coach: ${error.message}`;
    }
}

// 4. LÓGICA DEL CHAT
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const enviarChatBtn = document.getElementById('enviar-chat-btn');

enviarChatBtn.addEventListener('click', manejarEnvioChat);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') manejarEnvioChat(); });

async function manejarEnvioChat() {
    const texto = chatInput.value.trim();
    if (!texto) return;
    
    agregarBurbuja(texto, 'user');
    chatInput.value = '';
    enviarChatBtn.textContent = "Pensando...";
    enviarChatBtn.disabled = true;

    const respuestaIA = await consultarIA(texto);
    
    agregarBurbuja(respuestaIA, 'coach');
    enviarChatBtn.textContent = "Enviar Mensaje";
    enviarChatBtn.disabled = false;
}

function agregarBurbuja(txt, tipo) {
    const div = document.createElement('div');
    div.classList.add('msg', tipo);
    div.innerHTML = txt.replace(/\n/g, '<br>').replace(/\*\*/g, ''); 
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 5. REGISTRO FIREBASE Y LOCAL
const guardarBtn = document.getElementById('guardar-btn');
const pesoInput = document.getElementById('peso-input');
const notaInput = document.getElementById('nota-input');
const historyList = document.getElementById('history-list');

document.addEventListener('DOMContentLoaded', cargarDatos);

guardarBtn.addEventListener('click', () => {
    const peso = pesoInput.value.trim();
    const nota = notaInput.value.trim();
    if (!peso && !nota) { alert("Ingresa tu peso o una nota."); return; }

    guardarBtn.textContent = "Guardando...";
    guardarBtn.disabled = true;

    const fechaStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    const itemData = { peso: peso ? parseFloat(peso) : null, nota: nota || "Sin notas", fecha: fechaStr, timestamp: Date.now() };

    if (db) {
        addDoc(collection(db, "registros_peso"), itemData)
            .catch(e => console.warn("Firebase bloqueado."));
    }

    let local = JSON.parse(localStorage.getItem('peso_local')) || [];
    local.unshift(itemData);
    localStorage.setItem('peso_local', JSON.stringify(local));

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
    } catch (e) { console.warn("Leyendo local."); }

    if (items.length === 0) items = JSON.parse(localStorage.getItem('peso_local')) || [];

    historyList.innerHTML = '';
    if (items.length === 0) { historyList.innerHTML = '<li class="history-item">Aún no hay registros.</li>'; return; }

    items.forEach(d => {
        const li = document.createElement('li');
        li.classList.add('history-item');
        li.innerHTML = `<span>[${d.fecha}]</span> - <strong>Peso:</strong> ${d.peso ? d.peso + ' kg' : 'N/A'} <br><em>${d.nota}</em>`;
        historyList.appendChild(li);
    });
}
