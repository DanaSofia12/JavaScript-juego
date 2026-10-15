const PLANTAS = [
  { id: "cactus", nombre: "Cactus" },
  { id: "tulipan", nombre: "Tulipán" },
  { id: "girasol", nombre: "Girasol" },
  { id: "suculenta", nombre: "Suculenta" },
  { id: "rosa", nombre: "Rosa" },
  { id: "margarita", nombre: "Margarita" },
  { id: "trebol", nombre: "Trébol" },
  { id: "sakura", nombre: "Sakura" },
  { id: "lavanda", nombre: "Lavanda" },
  { id: "plantita", nombre: "Plantita" }
];

const NIVELES = {
  facil: { pares: 6, columnas: 4 },
  normal: { pares: 8, columnas: 4 },
  dificil: { pares: 10, columnas: 5 }
};

const SONIDOS = {
  voltear: new Audio("sonidos/voltear.wav"),
  acierto: new Audio("sonidos/acierto.wav"),
  error: new Audio("sonidos/error.wav"),
  inicio: new Audio("sonidos/inicio.wav"),
  victoria: new Audio("sonidos/victoria.wav")
};

// Elementos del DOM
const tablero = document.getElementById("tablero");
const textoMovimientos = document.getElementById("movimientos");
const textoTiempo = document.getElementById("tiempo");
const textoPares = document.getElementById("pares");
const textoRecord = document.getElementById("record");
const mensaje = document.getElementById("mensaje");
const coleccion = document.getElementById("coleccion");
const avatar = document.getElementById("avatar");
const pantallaInicio = document.getElementById("pantallaInicio");
const modalVictoria = document.getElementById("modalVictoria");
const modalAyuda = document.getElementById("modalAyuda");
const btnSonido = document.getElementById("btnSonido");

// Estado del juego
let nivel = "normal";
let primeraCarta = null;
let segundaCarta = null;
let bloqueado = false;
let movimientos = 0;
let paresEncontrados = 0;
let segundos = 0;
let temporizador = null;
let sonidoActivo = true;

function reproducir(nombre) {
  if (!sonidoActivo) return;
  const sonido = SONIDOS[nombre];
  sonido.currentTime = 0;
  sonido.play().catch(() => {});
}

// Algoritmo Fisher-Yates para mezclar
function mezclar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function crearCarta(planta) {
  const carta = document.createElement("button");
  carta.className = "carta";
  carta.dataset.id = planta.id;
  carta.setAttribute("aria-label", "Carta oculta");
  carta.innerHTML = `
    <span class="carta__interior">
      <span class="carta__cara carta__dorso"></span>
      <span class="carta__cara carta__frente">
        <img src="img/${planta.id}.svg" alt="${planta.nombre}">
      </span>
    </span>`;
  return carta;
}

function iniciarJuego() {
  const { pares, columnas } = NIVELES[nivel];
  const elegidas = mezclar(PLANTAS).slice(0, pares);
  const cartas = mezclar([...elegidas, ...elegidas]);

  detenerTemporizador();
  primeraCarta = segundaCarta = null;
  bloqueado = false;
  movimientos = paresEncontrados = segundos = 0;

  tablero.innerHTML = "";
  coleccion.innerHTML = "";
  tablero.style.setProperty("--columnas", columnas);
  cartas.forEach((planta) => tablero.appendChild(crearCarta(planta)));

  actualizarMarcador();
  mostrarRecord();
  mostrarMensaje("¡Encuentra todas las parejas de plantitas! ✿");
}

function voltearCarta(carta) {
  if (bloqueado || carta === primeraCarta || carta.classList.contains("encontrada")) return;

  if (!temporizador) iniciarTemporizador();
  reproducir("voltear");
  carta.classList.add("volteada");
  carta.setAttribute("aria-label", carta.querySelector("img").alt);

  if (!primeraCarta) {
    primeraCarta = carta;
    return;
  }

  segundaCarta = carta;
  movimientos++;
  actualizarMarcador();
  comprobarPareja();
}

function comprobarPareja() {
  const esPareja = primeraCarta.dataset.id === segundaCarta.dataset.id;
  esPareja ? marcarPareja() : ocultarCartas();
}

function marcarPareja() {
  const planta = PLANTAS.find((p) => p.id === primeraCarta.dataset.id);
  [primeraCarta, segundaCarta].forEach((c) => {
    c.classList.add("encontrada");
    c.disabled = true;
  });

  paresEncontrados++;
  reproducir("acierto");
  agregarAColeccion(planta);
  avatar.src = `img/${planta.id}.svg`;
  avatar.alt = planta.nombre;
  mostrarMensaje(`¡Bien! Encontraste: ${planta.nombre} ♡`);
  actualizarMarcador();
  reiniciarSeleccion();

  if (paresEncontrados === NIVELES[nivel].pares) setTimeout(ganar, 600);
}

function ocultarCartas() {
  bloqueado = true;
  reproducir("error");
  primeraCarta.classList.add("error");
  segundaCarta.classList.add("error");
  mostrarMensaje("Ups, no son iguales. ¡Intenta otra vez!");

  setTimeout(() => {
    [primeraCarta, segundaCarta].forEach((c) => {
      c.classList.remove("volteada", "error");
      c.setAttribute("aria-label", "Carta oculta");
    });
    reiniciarSeleccion();
  }, 900);
}

function reiniciarSeleccion() {
  primeraCarta = segundaCarta = null;
  bloqueado = false;
}

function agregarAColeccion(planta) {
  const item = document.createElement("li");
  const img = document.createElement("img");
  img.src = `img/${planta.id}.svg`;
  img.alt = planta.nombre;
  item.title = planta.nombre;
  item.appendChild(img);
  coleccion.appendChild(item);
}

function actualizarMarcador() {
  textoMovimientos.textContent = movimientos;
  textoPares.textContent = `${paresEncontrados}/${NIVELES[nivel].pares}`;
  textoTiempo.textContent = formatoTiempo(segundos);
}

function mostrarMensaje(texto) {
  mensaje.textContent = texto;
  mensaje.classList.remove("pop");
  void mensaje.offsetWidth; // reinicia la animación
  mensaje.classList.add("pop");
}

function formatoTiempo(total) {
  const min = String(Math.floor(total / 60)).padStart(2, "0");
  const seg = String(total % 60).padStart(2, "0");
  return `${min}:${seg}`;
}

function iniciarTemporizador() {
  temporizador = setInterval(() => {
    segundos++;
    textoTiempo.textContent = formatoTiempo(segundos);
  }, 1000);
}

function detenerTemporizador() {
  clearInterval(temporizador);
  temporizador = null;
}

// Récord por nivel guardado en el navegador
function leerRecord() {
  try {
    return JSON.parse(localStorage.getItem(`record-${nivel}`));
  } catch {
    return null;
  }
}

function guardarRecord() {
  const record = leerRecord();
  const esMejor = !record || movimientos < record.movimientos ||
    (movimientos === record.movimientos && segundos < record.segundos);
  if (!esMejor) return false;
  try {
    localStorage.setItem(`record-${nivel}`, JSON.stringify({ movimientos, segundos }));
  } catch {}
  return true;
}

function mostrarRecord() {
  const record = leerRecord();
  textoRecord.textContent = record ? `${record.movimientos} mov` : "--";
}

// 3 estrellas si usas pocos movimientos extra
function calcularEstrellas() {
  const extra = movimientos - NIVELES[nivel].pares;
  if (extra <= NIVELES[nivel].pares / 2) return 3;
  if (extra <= NIVELES[nivel].pares * 1.5) return 2;
  return 1;
}

function ganar() {
  detenerTemporizador();
  reproducir("victoria");
  const nuevoRecord = guardarRecord();
  mostrarRecord();

  const estrellas = calcularEstrellas();
  document.getElementById("estrellas").innerHTML =
    "★".repeat(estrellas) + `<span class="vacia">${"★".repeat(3 - estrellas)}</span>`;
  document.getElementById("resumen").textContent =
    `Lo lograste en ${movimientos} movimientos y ${formatoTiempo(segundos)}.` +
    (nuevoRecord ? " ¡Nuevo récord! ✨" : "");

  mostrarMensaje("¡Jardín completo! Eres increíble ✿");
  abrirModal(modalVictoria);
}

function abrirModal(modal) {
  modal.hidden = false;
}

function cerrarModal(modal) {
  modal.hidden = true;
}

function cambiarNivel(boton) {
  document.querySelectorAll(".nivel").forEach((b) => b.classList.remove("activo"));
  boton.classList.add("activo");
  nivel = boton.dataset.nivel;
  iniciarJuego();
}

function empezar() {
  pantallaInicio.classList.add("oculto");
  reproducir("inicio");
  iniciarJuego();
}

function volverAlInicio() {
  detenerTemporizador();
  pantallaInicio.classList.remove("oculto");
  mostrarMensaje("Dale a Press Start para comenzar ♡");
}

// Eventos
tablero.addEventListener("click", (e) => {
  const carta = e.target.closest(".carta");
  if (carta) voltearCarta(carta);
});

document.querySelectorAll(".nivel").forEach((boton) => {
  boton.addEventListener("click", () => cambiarNivel(boton));
});

document.getElementById("btnStart").addEventListener("click", empezar);
document.getElementById("btnReiniciar").addEventListener("click", iniciarJuego);
document.getElementById("btnReiniciarTop").addEventListener("click", iniciarJuego);
document.getElementById("btnAyuda").addEventListener("click", () => abrirModal(modalAyuda));

document.getElementById("btnOtraVez").addEventListener("click", () => {
  cerrarModal(modalVictoria);
  iniciarJuego();
});

document.querySelectorAll(".menu__item").forEach((item) => {
  item.addEventListener("click", () => {
    item.dataset.accion === "ayuda" ? abrirModal(modalAyuda) : volverAlInicio();
  });
});

btnSonido.addEventListener("click", () => {
  sonidoActivo = !sonidoActivo;
  btnSonido.classList.toggle("apagado", !sonidoActivo);
  btnSonido.title = sonidoActivo ? "Silenciar sonido" : "Activar sonido";
});

// Cierra modales con la X o tocando fuera
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-cerrar]")) cerrarModal(modal);
  });
});

iniciarJuego();
