const { Preferences, Haptics, LocalNotifications } = Capacitor.Plugins;

/* =====================
   ESTADO GLOBAL
===================== */
let timer = 0;
let workMinutes = 25;
let breakMinutes = 5;
let running = false;
let paused = false;
let isBreak = false;

let endTimestamp = null;
let lastVibrationSecond = null;

let cubeSize = 100;
let angleY = 0;
let fadeOut = false;
let fadeStart = 0;

let soundEffect;
let notificationsGranted = false;

/* =====================
   PRELOAD
===================== */
function preload() {
  try {
    soundEffect = loadSound("assets/lofi.mp3");
  } catch (e) {
    console.warn("Sonido no cargado");
  }
}

/* =====================
   NAVEGACIÓN
===================== */
window.showScreen = function (screenId) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
};

/* =====================
   TAREAS (PERSISTENTES)
===================== */
window.addTask = async function () {
  const input = document.getElementById("taskInput");
  if (!input.value) return;

  const li = document.createElement("li");
  li.innerHTML = `
    <span>${input.value}</span>
    <button onclick="this.parentElement.remove(); saveTasks()">✕</button>
  `;
  document.getElementById("taskList").appendChild(li);
  input.value = "";

  await saveTasks();
};

async function saveTasks() {
  const tasks = [...document.querySelectorAll("#taskList li span")].map(
    (el) => el.innerText
  );

  await Preferences.set({
    key: "tasks",
    value: JSON.stringify(tasks),
  });
}

async function loadTasks() {
  const { value } = await Preferences.get({ key: "tasks" });
  if (!value) return;

  JSON.parse(value).forEach((task) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${task}</span>
      <button onclick="this.parentElement.remove(); saveTasks()">✕</button>
    `;
    document.getElementById("taskList").appendChild(li);
  });
}

/* =====================
   AJUSTES (PREFERENCES)
===================== */
async function saveSettingsNative() {
  await Preferences.set({ key: "workTime", value: workMinutes.toString() });
  await Preferences.set({ key: "breakTime", value: breakMinutes.toString() });
}

async function loadSettingsNative() {
  const work = await Preferences.get({ key: "workTime" });
  const rest = await Preferences.get({ key: "breakTime" });

  workMinutes = work.value ? parseInt(work.value) : 25;
  breakMinutes = rest.value ? parseInt(rest.value) : 5;

  document.getElementById("workTime").value = workMinutes;
  document.getElementById("breakTime").value = breakMinutes;
}

/* =====================
   NOTIFICACIONES
===================== */
async function requestNotificationPermission() {
  const perm = await LocalNotifications.requestPermissions();
  notificationsGranted = perm.display === "granted";
  if (notificationsGranted) {
    // CREAR CANAL DE ALTA IMPORTANCIA
    await LocalNotifications.createChannel({
      id: "pomodoro-channel",
      name: "Alertas de Pomodoro",
      description: "Notificaciones de fin de ciclo",
      importance: 5,
      visibility: 1,
      vibration: true,
    });
  }
}

async function schedulePomodoroNotification() {
  if (!notificationsGranted || !endTimestamp) return;

  try {
    // 1. Cancelamos cualquier notificación anterior con el mismo ID
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

    // Si estamos en TRABAJO, la notificación debe avisar que el TRABAJO ha terminado.
    const titleText = isBreak
      ? "¡Descanso terminado!"
      : "¡Tiempo de trabajo cumplido!";
    const bodyText = isBreak
      ? "Vuelve al trabajo con energía 💪"
      : "Te has ganado un descanso ☕";

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1, // ID fijo y pequeño
          title: titleText,
          body: bodyText,
          channelId: "pomodoro-channel",
          schedule: {
            at: new Date(endTimestamp),
            allowWhileIdle: true,
            repeats: false,
            every: null,
          },
          sound: null,
          attachments: null,
          extra: null,
        },
      ],
    });
    console.log(
      "🔔 Programada para:",
      new Date(endTimestamp).toLocaleTimeString()
    );
  } catch (e) {
    console.error("Error programando:", e);
  }
}

/* =====================
   HAPTICS
===================== */
function vibrateTick() {
  Haptics.impact({ style: "HEAVY" });
  Haptics.vibrate({ duration: 300 });
}

/* =====================
   P5 SETUP
===================== */
async function setup() {
  const cnv = createCanvas(windowWidth * 0.8, windowWidth * 0.8, WEBGL);
  cnv.parent("p5-container");

  ////////TESTING//////////
  // setTimeout(async () => {
  //   console.log("🔔 TEST: programando notificación en 5s");

  //   await LocalNotifications.schedule({
  //     notifications: [
  //       {
  //         title: "TEST iTimer",
  //         body: "Si ves esto flipas! ✅",
  //         id: 999,
  //         schedule: { at: new Date(Date.now() + 5000) },
  //       },
  //     ],
  //   });
  // }, 2000);
  /////////////////////////

  await loadSettingsNative();
  await loadTasks();
  await requestNotificationPermission();

  resetPomodoro();

  document.getElementById("startBtn").addEventListener("click", () => {
    if (!running) {
      startPomodoro();
    } else {
      paused = !paused;
      if (!paused) {
        endTimestamp = Date.now() + timer * 1000;
      }
      document.getElementById("startBtn").innerText = paused
        ? "Reanudar"
        : "Pausar";
    }
  });
}

/* =====================
   DRAW LOOP
===================== */
function draw() {
  background(15, 23, 42);

  if (running && !paused && endTimestamp) {
    timer = Math.max(0, Math.floor((endTimestamp - Date.now()) / 1000));
    actualizarUI();

    if (timer <= 10 && timer > 0 && timer !== lastVibrationSecond) {
      vibrateTick();
      lastVibrationSecond = timer;
    }
  }

  if (timer === 0 && running) finalizar();

  if (fadeOut) {
    const elapsed = millis() - fadeStart;
    cubeSize = elapsed < 2000 ? map(elapsed, 0, 2000, 100, 0) : 0;
    if (elapsed >= 2000) resetPomodoro();
  }

  dibujarEscena();
}

/* =====================
   TIMER LOGIC
===================== */
function startPomodoro() {
  running = true;
  paused = false;

  endTimestamp = Date.now() + timer * 1000;

  schedulePomodoroNotification();

  document.getElementById("startBtn").innerText = "Pausar";
}

function finalizar() {
  running = false;
  fadeOut = true;
  fadeStart = millis();

  isBreak = !isBreak;

  if (isBreak) {
    timer = breakMinutes * 60;
    document.getElementById("timer-label").innerText = "Descanso";
    document.getElementById("timer-label").style.color = "#4ade80";
    soundEffect?.loop();
  } else {
    timer = workMinutes * 60;
    document.getElementById("timer-label").innerText = "Trabajo";
    soundEffect?.stop();
  }

  actualizarUI();
  document.getElementById("startBtn").innerText = "Iniciar";
}

function resetPomodoro() {
  running = false;
  paused = false;
  fadeOut = false;
  cubeSize = 100;
  timer = (isBreak ? breakMinutes : workMinutes) * 60;
  actualizarUI();
  document.getElementById("startBtn").innerText = "Iniciar";
}

/* =====================
   UI
===================== */
function actualizarUI() {
  const mins = Math.floor(timer / 60);
  const secs = timer % 60;
  document.getElementById("timer").innerText = `${nf(mins, 2)}:${nf(secs, 2)}`;
  document.getElementById("timer").style.color =
    timer <= 10 ? "#ef4444" : "#ffffff";
}

/* =====================
   ESCENA
===================== */
function dibujarEscena() {
  push();
  rotateX(-PI / 8);
  rotateY(angleY);
  if (running && !paused) angleY += 0.02;

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

  box(cubeSize);
  pop();
}

/* =====================
   SETTINGS BUTTON
===================== */
window.saveSettings = async function () {
  workMinutes = parseInt(document.getElementById("workTime").value);
  breakMinutes = parseInt(document.getElementById("breakTime").value);
  await saveSettingsNative();
  resetPomodoro();
  alert("Ajustes guardados");
  showScreen("screen-welcome");
};
