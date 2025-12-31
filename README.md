# 📱 iTimer – MVP Pomodoro con Capacitor y p5.js

## 📌 Descripción general

iTimer es una aplicación móvil híbrida desarrollada como MVP académico cuyo objetivo es implementar un temporizador tipo Pomodoro con feedback visual, sonoro y háptico.
La aplicación se desarrolla utilizando tecnologías web y se empaqueta como app Android mediante Capacitor.

---

## 🧱 Tecnologías utilizadas

- **HTML / CSS / JavaScript**
- **p5.js** – renderizado visual y loop de animación
- **p5.sound** – reproducción de audio durante los descansos
- **Capacitor** – acceso a APIs nativas
- **Android Studio** – compilación y ejecución en Android
- **Haptics API (Capacitor)** – vibración nativa
- **LocalStorage** – persistencia de configuración
- **Preferences API (Capacitor)** – persistencia de datos nativa

---

## 🔁 Flujo general de la aplicación

1. El usuario define:

   - Tiempo de trabajo (minutos)
   - Tiempo de descanso (minutos)

2. La configuración se guarda de forma persistente usando Preferences de Capacitor
3. El temporizador alterna automáticamente entre:

   - **Trabajo**
   - **Descanso**

4. El estado actual se refleja mediante:

   - Texto
   - Color
   - Animación 3D
   - Sonido (solo en descanso)
   - Vibración (últimos 10 segundos)

---

## 💾 Persistencia de datos (Preferences – Capacitor)

Inicialmente la persistencia se planteó mediante localStorage, pero al tratarse de una aplicación empaquetada como app nativa, se migró a la API Preferences de Capacitor, que ofrece una solución más adecuada y alineada con el entorno móvil.

**¿Por qué Preferences?**

- Funciona tanto en web como en Android/iOS
- Utiliza almacenamiento nativo del sistema
- Evita depender del contexto del navegador
- Es la solución recomendada por Capacitor para persistencia simple

**Guardado de configuración**

```js
await Preferences.set({
  key: "workTime",
  value: workMinutes.toString(),
});

await Preferences.set({
  key: "breakTime",
  value: breakMinutes.toString(),
});
```

**_Carga de configuración al iniciar la app_**

```js
const work = await Preferences.get({ key: "workTime" });
const rest = await Preferences.get({ key: "breakTime" });

workMinutes = work.value ? parseInt(work.value) : 25;
breakMinutes = rest.value ? parseInt(rest.value) : 5;
```

Esta lógica permite que la configuración del usuario persista correctamente entre sesiones, incluso tras cerrar la aplicación.

## ⏱️ Lógica del temporizador

- El temporizador se gestiona en segundos
- Se actualiza cada 1000 ms usando `millis()` de p5.js
- Estados:

  - `running`
  - `paused`
  - `isBreak`

---

## 🔊 Sonido

- Se reproduce **únicamente durante el descanso**
- Se detiene automáticamente al volver a trabajo
- Implementado con `p5.sound`

```js
if (isBreak) {
  soundEffect.loop();
} else {
  soundEffect.stop();
}
```

---

## 📳 Vibración (Haptics)

### Comportamiento

- El dispositivo vibra durante los **últimos 10 segundos**
- Aplica tanto a trabajo como a descanso
- Vibración corta (100 ms) cada segundo

```js
if (timer <= 10 && timer > 0) {
  Haptics.vibrate({ duration: 100 });
}
```

### Consideraciones importantes

- El emulador de Android **no tiene hardware de vibración**
- La ejecución se valida mediante **logs en Logcat**
- En dispositivos reales Android, la vibración funciona correctamente

---

## 🧪 Debug y validación

### Evidencia en Logcat:

```
Capacitor/Plugin: pluginId: Haptics, methodName: vibrate
methodData: {"duration":100}
```

Esto confirma que:

- El código JavaScript llama al plugin
- Capacitor enruta correctamente la llamada
- Android ejecuta la vibración

---

## 📦 Empaquetado con Capacitor

1. Build del proyecto web
2. `npx cap add android`
3. `npx cap sync`
4. Apertura del proyecto en Android Studio
5. Ejecución en emulador o dispositivo real

---

## ⚠️ Limitaciones conocidas

- El feedback háptico no es perceptible en emuladores
- Algunas funcionalidades requieren hardware real para validación completa

---

## 📬 Dispositivos

- Las pruebas de las funcionalidades nativas se han realizado utilizando un dispositivo físico **Samsung Galaxy A16 5G con Android 14**, conectado por USB al ordenador.
  Durante el desarrollo y para el resto de pruebas se ha utilizado un emulador virtual en Android Studio, modelo **Medium Phone API 36.1** (Android 15).

---

## ✅ Conclusión

Este MVP demuestra la integración efectiva entre tecnologías web y APIs nativas mediante Capacitor, cumpliendo los objetivos funcionales del temporizador y validando la viabilidad del enfoque híbrido para aplicaciones móviles.
