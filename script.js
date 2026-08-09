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
} catch (error) {
  console.error("Error Firebase:", error);
}

// Elementos
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const enviarChatBtn = document.getElementById('enviar-chat-btn');
const guardarBtn = document.getElementById('guardar-btn');
const pesoInput = document.getElementById('peso-input');
const notaInput = document.getElementById('nota-input');
const historyList = document.getElementById('history-list');

let memoriaRegistros = []; // Almacenará los datos leídos de Firebase para el contexto del coach

document.addEventListener('DOMContentLoaded', () => {
    if (db) cargarDatosYMemoria();
});

// Enviar mensaje al Chat con el Coach
enviarChatBtn.addEventListener('click', () => procesarMensajeChat());
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') procesarMensajeChat();
});

function procesarMensajeChat() {
    const texto = chatInput.value.trim();
    if (!texto) return;

    agregarBurbujaChat(texto, 'user');
    chatInput.value = '';

    // Generar respuesta del coach analizando lo que escribió y la memoria de Firebase
    setTimeout(() => {
        let respuesta = "Entendido, Guty. Mantén firme la disciplina y no aflojes el paso.";
        const txtLC = texto.toLowerCase();

        if (txtLC.includes('biblia') || txtLC.includes('versiculo') || txtLC.includes('cita')) {
            respuesta = `"Todo lo puedo en Cristo que me fortalece." — Filipenses 4:13. Apóyate en eso para avanzar hoy.`;
        } else if (txtLC.includes('como voy') || txtLC.includes('progreso') || txtLC.includes('historial')) {
            if (memoriaRegistros.length > 0) {
                const ultimo = memoriaRegistros[0];
                respuesta = `Revisando tu historial, tu último registro fue de ${ultimo.peso ? ultimo.peso + ' kg' : 'sin peso registrado'}. Comentario: "${ultimo.nota}". ¡Sigue adelante!`;
            } else {
                respuesta = `Aún no tienes registros guardados en la base de datos. Empezamos con una base de 94 kg, ¡a registrar tus avances!`;
            }
        } else if (txtLC.includes('triste') || txtLC.includes('cansado') || txtLC.includes('flojera')) {
            respuesta = `El cansancio pasa, la meta se queda. Sin rodeos: descansa si es necesario, pero mañana cumples con el ejercicio sin excusas.`;
        } else {
            respuesta = `Recuerda tu objetivo, Guty. Claridad y constancia. ¿Qué tal vas con Nike Run Club o los ejercicios en casa hoy?`;
        }

        agregarBurbujaChat(respuesta, 'coach');
    }, 500);
}

function agregarBurbujaChat(texto, tipo) {
    const div = document.createElement('div');
    div.classList.add('msg', tipo);
    div.textContent = texto;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Guardar Bitácora / Peso en la Nube
guardarBtn.addEventListener('click', async () => {
    const peso = pesoInput.value.trim();
    const nota = notaInput.value.trim();

    if (!peso && !nota) {
        alert("Escribe al menos tu peso o una nota.");
        return;
    }

    guardarBtn.textContent = "Guardando...";
    guardarBtn.disabled = true;

    try {
        if (db) {
            await addDoc(collection(db, "registros_peso"), {
                peso: peso ? parseFloat(peso) : null,
                nota: nota || "Sin comentarios",
                fecha: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
                timestamp: Date.now()
            });
            alert("¡Guardado en la nube con éxito!");
            pesoInput.value = '';
            notaInput.value = '';
            cargarDatosYMemoria();
        }
    } catch (e) {
        console.error("Error al guardar:", e);
        alert("Hubo un error al guardar.");
    } finally {
        guardarBtn.textContent = "Guardar en la Nube";
        guardarBtn.disabled = false;
    }
});

async function cargarDatosYMemoria() {
    historyList.innerHTML = '<li class="history-item">Sincronizando...</li>';
    try {
        const q = query(collection(db, "registros_peso"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        historyList.innerHTML = '';
        memoriaRegistros = [];

        if (querySnapshot.empty) {
            historyList.innerHTML = '<li class="history-item">Sin registros previos.</li>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            memoriaRegistros.push(data); // Guardar en memoria para que el chat lo consulte
            
            const li = document.createElement('li');
            li.classList.add('history-item');
            li.innerHTML = `<span>[${data.fecha}]</span> - <strong>Peso:</strong> ${data.peso ? data.peso + ' kg' : 'N/A'} <br><em>${data.nota}</em>`;
            historyList.appendChild(li);
        });
    } catch (e) {
        console.error("Error al cargar:", e);
        historyList.innerHTML = '<li class="history-item">Error al leer la base de datos.</li>';
    }
}
