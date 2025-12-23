let timer = 10;
let running = false;
let paused = false;
let lastTime = 0;
let cubeSize = 100;
let angleY = 0;
let soundPlayed = false;
let fadeOut = false;
let fadeStart = 0;
let soundEffect;

function preload() {
  // Asegúrate de que la ruta al sonido sea correcta
  soundEffect = loadSound("assets/lofi.mp3");
}

function setup() {
  let cnv = createCanvas(400, 400, WEBGL);
  cnv.parent("p5-container");

  document.getElementById("startBtn").addEventListener("click", () => {
    if (!running && timer === 10 && !fadeOut) {
      startPomodoro();
    } else if (running || paused) {
      paused = !paused;
      if (!paused) lastTime = millis();
      document.getElementById("startBtn").innerText = paused
        ? "Reanudar"
        : "Pausa";
    } else if (!running && timer <= 0) {
      resetPomodoro();
    }
  });
}

function draw() {
  background(18);

  // Lógica del cronómetro
  if (running && !paused) {
    let currentMillis = millis();
    if (currentMillis - lastTime >= 1000) {
      timer--;
      lastTime = currentMillis;

      // Actualizamos el número en el HTML
      let timerDisplay = document.getElementById("timer");
      timerDisplay.innerText = timer;

      // Efecto visual: Texto rojo si queda poco tiempo
      if (timer <= 3) {
        timerDisplay.style.color = "#ff4d4d";
      } else {
        timerDisplay.style.color = "#ffffff";
      }
    }
  }

  // Finalización
  if (timer <= 0 && running) {
    finalizar();
  }

  // Lógica de desvanecimiento del cubo
  if (fadeOut) {
    let elapsed = millis() - fadeStart;
    if (elapsed < 2000) {
      cubeSize = map(elapsed, 0, 2000, 100, 0);
    } else {
      cubeSize = 0;
      fadeOut = false;
    }
  }

  dibujarEscena();
}

function startPomodoro() {
  running = true;
  paused = false;
  lastTime = millis();
  timer = 10;
  cubeSize = 100;
  soundPlayed = false;
  fadeOut = false;

  document.getElementById("timer").innerText = timer;
  document.getElementById("timer").style.color = "#ffffff";
  document.getElementById("startBtn").innerText = "Pausa";
}

function finalizar() {
  if (!soundPlayed && soundEffect) {
    soundEffect.play();
  }
  soundPlayed = true;
  running = false;
  fadeOut = true;
  fadeStart = millis();
  document.getElementById("timer").innerText = "0";
  document.getElementById("startBtn").innerText = "Reiniciar";
}

function resetPomodoro() {
  timer = 10;
  running = false;
  paused = false;
  fadeOut = false;
  cubeSize = 100;
  soundPlayed = false;
  document.getElementById("timer").innerText = timer;
  document.getElementById("timer").style.color = "#ffffff";
  document.getElementById("startBtn").innerText = "Start";
}

function dibujarEscena() {
  push();
  rotateX(-PI / 6);
  rotateY(angleY);

  // El cubo gira si está activo o desapareciendo
  if ((running && !paused) || fadeOut) angleY += 0.02;

  // Color del cubo: cambia a rojo si el tiempo es bajo
  if (running && timer <= 3) {
    stroke(255, 77, 77);
  } else {
    stroke(255);
  }

  noFill();
  strokeWeight(2);
  box(cubeSize);
  pop();
}
