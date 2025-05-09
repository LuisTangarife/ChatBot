/// Función para generar la respuesta del bot usando contenido-uam.json
async function getBotResponse(userInput) {
  try {
    const response = await fetch('contenido-uam.json');
    const data = await response.json();

    const input = userInput.toLowerCase();

    // 🟦 1. Verificar si es un saludo
    const saludos = ["hola", "buenas", "buenos días", "buen día", "hello", "hi", "saludos"];
    if (saludos.some(s => input.includes(s))) {
      return `
        <div class="mensaje-bienvenida" style="line-height: 1.2; text-align: left; margin: 0; padding: 0; font-size: 15px;">
          <p style="margin: 4px 0;"><strong>👋 ¡Hola! Soy AdmiRegBot</strong>, tu asistente virtual 🤖
          <p style="margin: 4px 0;">Puedes preguntarme por:</p>
            • 🧾 Reglamento<br>
            • 📄 Pagos<br>
            • ✅ Validación<br>
            • 📘 Reglamento<br>
            • 📥 Certificados<br>
            • ...y más.
          <p style="margin: 4px 0;">Haz clic en un botón o escribe tu duda. ¡Estoy aquí para ayudarte!</p>
        </div>
      `;
    }
    
    
    
    

    // 🟦 2. Sinónimos por tema
    const sinonimos = {
      "matrícula": ["matricula", "inscripción", "inscribirme", "registrarme"],
      "homologación de inglés": ["homologar inglés", "homologación", "nivelación", "reconocimiento de inglés"],
      "validación de inglés": ["validar inglés", "validación", "examen de validación"],
      "cancelar materia": ["retirar asignatura", "cancelar asignatura", "anular materia"],
      "reglamento estudiantil": ["reglamento", "normas", "normativa", "manual del estudiante"],
      "certificado académico": ["certificado", "notas", "historial académico", "boletín"],
      "becas": ["beca", "apoyo financiero", "financiación"],
      "biblioteca": ["libros", "lectura", "bases de datos", "prestamo"],
      "inscripciones": ["inscribirme", "inscribirse", "nuevos estudiantes"]
    };

    for (const [tema, palabras] of Object.entries(sinonimos)) {
      if (palabras.some(p => input.includes(p))) {
        const resultado = data.find(item => item.tema.toLowerCase() === tema.toLowerCase());
        if (resultado) {
          return `
            <div class="bot-respuesta">
              🤖 <strong>${resultado.tema}</strong><br>
              ${resultado.descripcion}<br>
              🌐 <a href="${resultado.url}" target="_blank">Ver más</a>
            </div>
          `;
        }
      }
    }

    // 🟦 3. Coincidencia exacta del tema (mejorada)
const limpiarTexto = (texto) => {
  return texto.toLowerCase().replace(/[¿?]/g, '').trim();
};

const inputLimpio = limpiarTexto(userInput);

const resultado = data.find(item =>
  inputLimpio.includes(limpiarTexto(item.tema))
);
    if (resultado) {
      return `
        <div class="bot-respuesta">
          🤖 <strong>${resultado.tema}</strong><br>
          ${resultado.descripcion}<br>
          🌐 <a href="${resultado.url}" target="_blank">Ver más</a>
        </div>
      `;
    } else {
      return `
        <div class="bot-respuesta">
         No encontré información relacionada. Puedes preguntar por: matrícula, biblioteca, becas, certificados, etc.
        </div>
      `;
    }

  } catch (error) {
    console.error('Error al cargar contenido-uam.json:', error);
    return `
      <div class="bot-respuesta">
        Ocurrió un error al consultar la base de datos del bot.
      </div>
    `;
  }
}


// Mostrar el mensaje en pantalla y guardarlo en historial
function appendMessage(text, sender) {
  const chatBox = document.getElementById("chat-box");
  const messageDiv = document.createElement("div");
  messageDiv.className = sender === "user" ? "user-message" : "bot-message";
  messageDiv.innerHTML = sender === "user" ? text : text;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Guardar en localStorage
  const historial = JSON.parse(localStorage.getItem("chatHistorial")) || [];
  historial.push({ sender, text });
  localStorage.setItem("chatHistorial", JSON.stringify(historial));
}

function sendMessage() {
  const userInput = document.getElementById("user-input").value.trim();
  if (!userInput) return;

  const chatBox = document.getElementById("chat-box");

  // Mensaje del usuario
  const userMessage = document.createElement("div");
  userMessage.className = "user-message";
  userMessage.innerText = userInput;
  chatBox.appendChild(userMessage);

  document.getElementById("user-input").value = "";

  // ✅ Respuesta del bot con voz
  getBotResponse(userInput).then(botReply => {
    const botMessage = document.createElement("div");
    botMessage.className = "bot-message";
    botMessage.innerHTML = botReply;
    chatBox.appendChild(botMessage);
    chatBox.scrollTop = chatBox.scrollHeight;

    hablar(botReply); // 🗣️ Aquí habla el bot
  });
}


// ✅ HACER FUNCIONAR LOS BOTONES
function quickReply(text) {
  document.getElementById("user-input").value = text;
  sendMessage();
}

// ⚡ Cargar historial al abrir la página
window.addEventListener("DOMContentLoaded", cargarHistorial);
function limpiarHistorial() {
  localStorage.removeItem("chatHistorial");
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = "<p>👋 ¡Hola! ¿En qué puedo ayudarte hoy?</p>";
}
// 🗣️ Hablar respuesta del bot
function hablar(textoHTML, tipo = "general") {
  // 🧼 Limpiar HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = textoHTML;
  let textoPlano = tempDiv.textContent || tempDiv.innerText || "";

  textoPlano = textoPlano.replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim(); // sin emojis

  // 🎙️ Crear voz
  const speech = new SpeechSynthesisUtterance(textoPlano);

  // ✅ Configuración por tipo de mensaje
  switch (tipo) {
    case "saludo":
      speech.pitch = 1.4;
      speech.rate = 0.95;
      break;
    case "reglamento":
      speech.pitch = 0.9;
      speech.rate = 0.88;
      break;
    case "urgente":
      speech.pitch = 1;
      speech.rate = 1.1;
      break;
    default:
      speech.pitch = 1.1;
      speech.rate = 0.95;
  }

  speech.volume = 1;
  speech.lang = 'es-ES';

  // 🔊 Intentar usar voz masculina si está disponible
  const voces = speechSynthesis.getVoices();
  const vozMasculina = voces.find(v => v.lang.startsWith('es') && v.name.toLowerCase().includes("male"));
  const vozAlternativa = voces.find(v => v.lang.startsWith('es') && !v.name.toLowerCase().includes("female"));

  speech.voice = vozMasculina || vozAlternativa || voces[0];

  window.speechSynthesis.cancel(); // detener voz anterior si sigue hablando
  window.speechSynthesis.speak(speech);
}
function cargarGuia(tipo) {
  const contenedor = document.getElementById("contenedor-guia");
  contenedor.classList.remove("oculto"); // 👈 Ocultar con clase
  contenedor.style.display = "block";    // 👈 Mostrar contenedor

  let src = "";
  switch (tipo) {
    case "Estudiante":
      src = "https://preguntasfrecuentes.autonoma.edu.co/";
      break;
    case "Docente":
      src = "https://preguntasfrecuentes.autonoma.edu.co/";
      break;
    case "Trabajador":
      src = "https://preguntasfrecuentes.autonoma.edu.co/";
      break;
    case "Comunidad Externa":
      src = "https://preguntasfrecuentes.autonoma.edu.co/";
      break;
  }
  contenedor.innerHTML = `
    <button class="btn-cerrar-guia" onclick="cerrarGuia()">❌</button>
    <iframe src="${src}" allowfullscreen title="Guía Interactiva"></iframe>
  `;
}
function cerrarGuia() {
  const contenedor = document.getElementById("contenedor-guia");
  contenedor.classList.add("oculto");   // 👈 Agrega clase de ocultar
  setTimeout(() => {
    contenedor.style.display = "none";  // 👈 Oculta después de transición
    contenedor.innerHTML = "";          // 🧼 Limpia contenido
  }, 300); // Duración de la transición en `.guia-container`
}
function mostrarOpcionesRapidas(opciones) {
  const quickButtons = document.getElementById('quick-buttons');
  quickButtons.innerHTML = ''; // Limpia botones anteriores

  opciones.forEach(opcion => {
    const button = document.createElement('button');
    button.innerHTML = opcion.icono + ' ' + opcion.texto;
    button.className = 'boton-rapido';
    button.onclick = function() {
      quickReply(opcion.texto); // O manda al flujo que tú quieras
      quickButtons.innerHTML = ''; // Limpia botones después de seleccionar
    };
    quickButtons.appendChild(button);
  });
}


