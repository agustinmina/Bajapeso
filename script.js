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

// Inicializar Firebase con manejo de errores para evitar bloqueos
let db = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error("Error al inicializar Firebase:", error);
}

// Referencias de la interfaz
const guardarBtn = document.getElementById('guardar-btn');
const pesoInput = document.getElementById('peso-input');
const notaInput = document.getElementById('nota-input');
const historyList = document.getElementById('history-list');

// Cargar registros al abrir la página
document.addEventListener('DOMContentLoaded', () => {
    if (db) {
        cargarRegistros();
    } else {
        historyList.innerHTML = '<li class="history-item">Modo local: Firebase no configurado o sin conexión activa.</li>';
    }
});

guardarBtn.addEventListener('click', async () => {
    const peso = pesoInput.value.trim();
    const nota = notaInput.value.trim();
    
    if (!peso && !nota) {
        alert("Escribe al menos tu peso o una nota de tu entrenamiento.");
        return;
    }

    guardarBtn.textContent = "Guardando...";
    guardarBtn.disabled = true;

    // Generar respuesta del Coach Virtual basada en lo que escribiste
    let respuestaCoach = "Anotado, Guty. La disciplina se construye todos los días.";
    if (peso) {
        respuestaCoach = `Registré tus ${peso} kg. Recuerda de dónde partimos (94 kg); no hay tregua, mantén el enfoque.`;
    }
    if (nota.toLowerCase().includes('no hice') || nota.toLowerCase().includes('mañana')) {
        respuestaCoach = `Entendido. Descansas hoy, pero mañana sin falta se cumple con el ejercicio. Cero pretextos.`;
    } else if (nota.toLowerCase().includes('corrí') || nota.toLowerCase().includes('ejercicio')) {
        respuestaCoach = `¡Excelente esfuerzo! Así se hace, el movimiento diario es el que trae resultados reales.`;
    }

    const registroTexto = `[${new Date().toLocaleDateString()}] Peso: ${peso ? peso + ' kg' : 'N/A'} - ${nota} | 🤖 Coach: "${respuestaCoach}"`;

    try {
        if (db) {
            await addDoc(collection(db, "registros_peso"), {
                peso: peso ? parseFloat(peso) : null,
                nota: nota || "Sin comentarios",
                coachRespuesta: respuestaCoach,
                fecha: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
                timestamp: Date.now()
            });
            await cargarRegistros();
        } else {
            // Respaldo local si Firebase falla para que nunca se quede trabado el botón
            let localHist = JSON.parse(localStorage.getItem('peso_backup')) || [];
            localHist.unshift(registroTexto);
            localStorage.setItem('peso_backup', JSON.stringify(localHist));
            mostrarHistorialLocal(localHist);
        }

        alert("¡Guardado con éxito!\n\n🤖 Coach Virtual:\n" + respuestaCoach);
        pesoInput.value = '';
        notaInput.value = '';
    } catch (e) {
        console.error("Error al guardar en Firestore: ", e);
        alert("Ocurrió un detalle al guardar en la nube, pero revisa tu historial local.");
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
            historyList.innerHTML = '<li class="history-item">Aún no hay registros en la nube. ¡Escribe el primero!</li>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const li = document.createElement('li');
            li.classList.add('history-item');
            li.innerHTML = `<span>[${data.fecha}]</span><br><strong>Peso:</strong> ${data.peso ? data.peso + ' kg' : 'N/A'} <br><em>Nota:</em> ${data.nota}<br>🤖 <strong>Coach:</strong> "${data.coachRespuesta || 'Constancia y disciplina.'}"`;
            historyList.appendChild(li);
        });
    } catch (e) {
        console.error("Error al cargar historial:", e);
        historyList.innerHTML = '<li class="history-item">Error al sincronizar con la base de datos.</li>';
    }
}

function mostrarHistorialLocal(historial) {
    historyList.innerHTML = '';
    historial.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('history-item');
        li.textContent = item;
        historyList.appendChild(li);
    });
}
