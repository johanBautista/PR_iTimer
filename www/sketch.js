import { Haptics, ImpactStyle } from "@capacitor/haptics";

let timer; // Segundos totales
let workMinutes = 25;
let running = false;
let paused = false;
let lastTime = 0;
let cubeSize = 100;
let angleY = 0;
let fadeOut = false;
let fadeStart = 0;
let isBreak = false; // Nueva variable para controlar el estado
let breakMinutes = 5; // Valor por defecto
let soundEffect;
let HapticsAvailable = false;

function preload() {
  try {
    soundEffect = loadSound("assets/lofi.mp3");
  } catch (e) {}
}

function vibrateTick() {
  console.log("[HAPTICS] tick final:", timer);

  if (window.Capacitor && Capacitor.isNativePlatform()) {
    try {
      Capacitor.Plugins.Haptics.impact({
        style: "LIGHT",
      });
    } catch (e) {
      console.warn("Haptics no disponible", e);
    }
  }
}

function setup() {
  let cnv = createCanvas(windowWidth * 0.8, windowWidth * 0.8, WEBGL);
  cnv.parent("p5-container");

  // Cargar ajustes guardados
  workMinutes = parseInt(localStorage.getItem("workTime")) || 25;
  breakMinutes = parseInt(localStorage.getItem("breakTime")) || 5;

  document.getElementById("workTime").value = workMinutes;
  document.getElementById("breakTime").value = breakMinutes;

  resetPomodoro();

  document.getElementById("startBtn").addEventListener("click", () => {
    if (!running && !fadeOut) {
      startPomodoro();
    } else {
      paused = !paused;
      lastTime = millis();
      document.getElementById("startBtn").innerText = paused
        ? "Reanudar"
        : "Pausar";
    }
  });
}

function draw() {
  background(15, 23, 42); // Match CSS --bg-color

  if (running && !paused) {
    let currentMillis = millis();
    if (currentMillis - lastTime >= 1000) {
      timer--;
      lastTime = currentMillis;
      actualizarUI();

      //vibrar en los últimos 10 segundos
      let lastVibrationSecond = null;
      if (timer <= 10 && timer > 0 && timer !== lastVibrationSecond) {
        vibrateTick();
        lastVibrationSecond = timer;
      }
    }
  }

  if (timer <= 0 && running) finalizar();

  if (fadeOut) {
    let elapsed = millis() - fadeStart;
    cubeSize = elapsed < 2000 ? map(elapsed, 0, 2000, 100, 0) : 0;
    if (elapsed >= 2000) {
      fadeOut = false;
      resetPomodoro();
    }
  }

  dibujarEscena();
}

function showScreen(screenId) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}

function actualizarUI() {
  let mins = Math.floor(timer / 60);
  let secs = timer % 60;
  let timeString = `${nf(mins, 2)}:${nf(secs, 2)}`;
  document.getElementById("timer").innerText = timeString;
  document.getElementById("timer").style.color =
    timer <= 10 ? "#ef4444" : "#ffffff";
}

function startPomodoro() {
  running = true;
  paused = false;
  lastTime = millis();
  document.getElementById("startBtn").innerText = "Pausar";
}

function finalizar() {
  running = false;
  fadeOut = true;
  fadeStart = millis();

  // Lógica de cambio de estado
  if (!isBreak) {
    // Si terminamos de trabajar, pasamos a descanso
    isBreak = true;
    timer = breakMinutes * 60;

    document.getElementById("timer-label").innerText = "Descanso";
    document.getElementById("timer-label").style.color = "#4ade80"; // Verde

    if (soundEffect && !soundEffect.isPlaying()) soundEffect.loop();
  } else {
    // Si terminamos el descanso, volviendo a trabajar
    isBreak = false;
    timer = workMinutes * 60;
    document.getElementById("timer-label").innerText = "Trabajo";
    // ⏹️ Parar música
    if (soundEffect && soundEffect.isPlaying()) {
      soundEffect.stop();
    }
  }

  document.getElementById("startBtn").innerText =
    "Iniciar " + (isBreak ? "Descanso" : "Trabajo");
}

function resetPomodoro() {
  // timer = workMinutes * 60;
  timer = (isBreak ? breakMinutes : workMinutes) * 60;
  running = false;
  paused = false;
  fadeOut = false;
  cubeSize = 100;
  actualizarUI();
  document.getElementById("startBtn").innerText = "Iniciar";
}

function saveSettings() {
  workMinutes = parseInt(document.getElementById("workTime").value);
  breakMinutes = parseInt(document.getElementById("breakTime").value);
  localStorage.setItem("workTime", workMinutes);
  localStorage.setItem("breakTime", breakMinutes);

  resetPomodoro();
  alert("¡Ajustes actualizados!");
  showScreen("screen-welcome");
}

function dibujarEscena() {
  push();
  rotateX(-PI / 8);
  rotateY(angleY);
  if ((running && !paused) || fadeOut) angleY += 0.02;

  // Estilo del cubo
  noFill();
  strokeWeight(2);

  // COLOR DINÁMICO SEGÚN EL ESTADO
  if (fadeOut) {
    stroke(255); // Blanco al desvanecer
  } else if (isBreak) {
    stroke(74, 222, 128); // Verde para el descanso
  } else {
    stroke(timer <= 10 && running ? [239, 68, 68] : [56, 189, 248]); // Rojo/Azul trabajo
  }

  box(cubeSize + 5);
  pop();
}

function addTask() {
  let val = document.getElementById("taskInput").value;
  if (!val) return;
  let li = document.createElement("li");
  li.innerHTML = `<span>${val}</span> <button onclick="this.parentElement.remove()" style="background:none; color:#ef4444;">✕</button>`;

  document.getElementById("taskList").appendChild(li);
  document.getElementById("taskInput").value = "";
}
