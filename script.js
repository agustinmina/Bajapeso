const sendBtn = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const historyList = document.getElementById('history-list');

// Cargar historial guardado al iniciar
document.addEventListener('DOMContentLoaded', loadHistory);

sendBtn.addEventListener('click', handleUserMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserMessage();
});

function handleUserMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Agregar mensaje del usuario a la pantalla
    appendMessage(text, 'user');
    saveToHistory(text);
    userInput.value = '';

    // Respuesta simulada de la IA directa en el navegador
    setTimeout(() => {
        let reply = "¡Registrado con éxito! Buen trabajo, Guty. Mantén el ritmo y la disciplina.";
        if (text.toLowerCase().includes('peso')) {
            reply = "Anotado tu avance de peso. Recuerda que empezamos en los 94 kg, ¡a darle con todo!";
        } else if (text.toLowerCase().includes('corrí') || text.toLowerCase().includes('nike')) {
            reply = "¡Excelente sesión en Nike Run Club! La constancia en el cardio hace la diferencia.";
        } else if (text.toLowerCase().includes('ejercicio') || text.toLowerCase().includes('casa')) {
            reply = "¡Bien hecho completando los ejercicios en casa! Paso a paso fortalecemos el cuerpo.";
        }
        appendMessage(reply, 'ai');
    }, 600);
}

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function saveToHistory(text) {
    const date = new Date().toLocaleDateString();
    const record = `[${date}] ${text}`;
    
    let history = JSON.parse(localStorage.getItem('peso_history')) || [];
    history.unshift(record); // Agregar al inicio
    localStorage.setItem('peso_history', JSON.stringify(history));
    
    renderHistory();
}

function loadHistory() {
    let history = JSON.parse(localStorage.getItem('peso_history')) || [];
    historyList.innerHTML = '';
    history.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        historyList.appendChild(li);
    });
}

function renderHistory() {
    loadHistory();
}
