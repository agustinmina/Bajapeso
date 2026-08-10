import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// 2. NAVEGACIÓN ENTRE PANTALLAS (Actualizada con el Calendario de Hábitos)
const btnChat = document.getElementById('btn-pantalla-chat');
const btnRegistro = document.getElementById('btn-pantalla-registro');
const btnHabitos = document.getElementById('btn-pantalla-habitos');

const screenChat = document.getElementById('pantalla-chat');
const screenRegistro = document.getElementById('pantalla-registro');
const screenHabitos = document.getElementById('pantalla-habitos');

function cambiarPantalla(activa) {
    btnChat.classList.toggle('active', activa === 'chat');
    btnRegistro.classList.toggle('active', activa === 'registro');
    if(btnHabitos) btnHabitos.classList.toggle('active', activa === 'habitos');

    screenChat.style.display = (activa === 'chat') ? 'block' : 'none';
    screenRegistro.style.display = (activa === 'registro') ? 'block' : 'none';
    if(screenHabitos) screenHabitos.style.display = (activa === 'habitos') ? 'block' : 'none';
}

btnChat.addEventListener('click', () => cambiarPantalla('chat'));
btnRegistro.addEventListener('click', () => cambiarPantalla('registro'));
if(btnHabitos) btnHabitos.addEventListener('click', () => cambiarPantalla('habitos'));

// 3. IA DEL COACH (VARIADA, FLUIDA Y CON CONTEXTO)
const GEMINI_API_KEY = "AQ.Ab8RN6KALx3FFt5tliXpnzVy9Q05LXlEMkJ1GWqx-Djf6UCZXA"; 

async function consultarIA(mensajeUsuario, historialBitacora) {
    try {
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        let contextoBitacora = "Sin registros recientes.";
        if (historialBitacora && historialBitacora.length > 0) {
            const ultimo = historialBitacora[0];
            contextoBitacora = `Último registro -> Fecha: ${ultimo.fecha}, Peso: ${ultimo.peso ? ultimo.peso + ' kg' : 'N/A'}, Nota: "${ultimo.nota}"`;
        }

        const promptPersonalidad = `Eres un coach de disciplina dinámico, cercano y motivador para Agustín (Guty). Su meta es bajar de peso (empezó en 94kg) usando Nike Run Club y ejercicios en casa. 
        Contexto actual de su bitácora: [ ${contextoBitacora} ].
        REGLAS IMPORTANTES: Sé muy natural, fluido y conversacional, cambia tus palabras en cada respuesta (evita sonar repetitivo o robótico), ten buen juicio humano, motívalo con firmeza pero con una plática más suelta, como un mentor real que lo apoya en su día a día. Si te da instrucciones nuevas, adáptate a ellas.
        Mensaje de Guty: "${mensajeUsuario}"`;

        const respuesta = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptPersonalidad }] }] })
        });
        
        const datos = await respuesta.json();
        if (datos.error) return `Aviso: ${datos.error.message}`;
        return datos.candidates[0].content.parts[0].text;
    } catch (error) {
        return "Error de conexión con la IA.";
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

    let registrosActuales = JSON.parse(localStorage.getItem('peso_local')) || [];
    const respuestaIA = await consultarIA(texto, registrosActuales);
    
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

// 5. REGISTRO DE BITÁCORA Y EVIDENCIA FOTOGRÁFICA
const guardarBtn = document.getElementById('guardar-btn');
const pesoInput = document.getElementById('peso-input');
const notaInput = document.getElementById('nota-input');
const imagenInput = document.getElementById('imagen-input');
const historyList = document.getElementById('history-list');

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    cargarHabitosHoy();
});

guardarBtn.addEventListener('click', () => {
    const peso = pesoInput.value.trim();
    const nota = notaInput.value.trim();
    const archivoImg = imagenInput.files[0];

    if (!peso && !nota && !archivoImg) { 
        alert("Ingresa al menos tu peso, una nota o una imagen de evidencia."); 
        return; 
    }

    guardarBtn.textContent = "Guardando...";
    guardarBtn.disabled = true;

    const procesarGuardado = (imgUrl = null) => {
        const fechaStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
        const itemData = { 
            peso: peso ? parseFloat(peso) : null, 
            nota: nota || "Sin notas", 
            imagen: imgUrl,
            fecha: fechaStr, 
            timestamp: Date.now() 
        };

        if (db) {
            addDoc(collection(db, "registros_peso"), itemData).catch(e => console.warn("Firebase pendiente."));
        }

        let local = JSON.parse(localStorage.getItem('peso_local')) || [];
        local.unshift(itemData);
        localStorage.setItem('peso_local', JSON.stringify(local));

        pesoInput.value = '';
        notaInput.value = '';
        imagenInput.value = '';
        guardarBtn.textContent = "Guardar Registro";
        guardarBtn.disabled = false;
        cargarDatos();
        alert("¡Registro y evidencia guardados con éxito!");
    };

    // Si subió foto, la convertimos a formato seguro para guardar en la app
    if (archivoImg) {
        const reader = new FileReader();
        reader.onloadend = function () {
            procesarGuardado(reader.result);
        };
        reader.readAsDataURL(archivoImg);
    } else {
        procesarGuardado(null);
    }
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
        let imgHtml = d.imagen ? `<br><img src="${d.imagen}" style="max-width:100%; border-radius:6px; margin-top:5px;">` : '';
        li.innerHTML = `<span>[${d.fecha}]</span> - <strong>Peso:</strong> ${d.peso ? d.peso + ' kg' : 'N/A'} <br><em>${d.nota}</em>${imgHtml}`;
        historyList.appendChild(li);
    });
}

// 6. CALENDARIO Y HÁBITOS (CERO REFRESCO / CERO CHUCHERÍAS)
const guardarHabitosBtn = document.getElementById('guardar-habitos-btn');
const sinRefrescoCheck = document.getElementById('sin-refresco');
const sinChucheriasCheck = document.getElementById('sin-chucherias');
const habitosHistorial = document.getElementById('habitos-historial');

guardarHabitosBtn.addEventListener('click', () => {
    const hoy = new Date().toLocaleDateString();
    const habitosDia = {
        fecha: hoy,
        sinRefresco: sinRefrescoCheck.checked,
        sinChucherias: sinChucheriasCheck.checked,
        timestamp: Date.now()
    };

    let habitosLog = JSON.parse(localStorage.getItem('habitos_local')) || [];
    // Reemplazar si ya existe el de hoy
    habitosLog = habitosLog.filter(h => h.fecha !== hoy);
    habitosLog.unshift(habitosDia);
    localStorage.setItem('habitos_local', JSON.stringify(habitosLog));

    alert("¡Hábitos de hoy guardados correctamente!");
    cargarHabitosHistorial();
});

function cargarHabitosHoy() {
    const hoy = new Date().toLocaleDateString();
    let habitosLog = JSON.parse(localStorage.getItem('habitos_local')) || [];
    const registroHoy = habitosLog.find(h => h.fecha === hoy);

    if (registroHoy) {
        sinRefrescoCheck.checked = registroHoy.sinRefresco;
        sinChucheriasCheck.checked = registroHoy.sinChucherias;
    }
    cargarHabitosHistorial();
}

function cargarHabitosHistorial() {
    let habitosLog = JSON.parse(localStorage.getItem('habitos_local')) || [];
    habitosHistorial.innerHTML = '';

    if (habitosLog.length === 0) {
        habitosHistorial.innerHTML = '<li class="history-item">Aún no hay registros de hábitos.</li>';
        return;
    }

    habitosLog.forEach(h => {
        const li = document.createElement('li');
        li.classList.add('history-item');
        li.innerHTML = `<span>[${h.fecha}]</span><br>
            🥤 Sin Refresco: <strong>${h.sinRefresco ? '✅ Sí cumplió' : '❌ No'}</strong><br>
            🥜 Sin Chucherías (Sabritas/Cacahuates): <strong>${h.sinChucherias ? '✅ Sí cumplió' : '❌ No'}</strong>`;
        habitosHistorial.appendChild(li);
    });
}
