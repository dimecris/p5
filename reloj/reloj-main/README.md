# p5 Interaccióm
# 🕰️ Reloj Gaza — Kris Darias

**Reloj Gaza** es una pieza visual desarrollada en **p5.js** como parte del aprendizaje de programación creativa en el contexto del grado de Multimedia (UOC, 2025).  
Combina datos, tiempo y forma para representar el paso de los segundos, minutos y horas mediante tres columnas:  
- 🕐 **Izquierda:** segundos  
- ⏱️ **Centro:** minutos (líneas onduladas)  
- ☀️ **Derecha:** horas y movimiento del “sol”

La obra toma como referencia conceptual el 2 de noviembre de 1917 —fecha de la Declaración Balfour— y calcula en tiempo real los **días, horas y minutos transcurridos** desde ese momento histórico hasta el presente.  

---

## 💡 Concepto

El reloj no busca mostrar la hora de forma práctica, sino **representar visualmente la persistencia del tiempo**.  
El paso de los segundos se inscribe en una columna lateral, mientras los minutos se dibujan como líneas irregulares, “a mano”, que aluden al gesto humano en la medición del tiempo.  
El sol de la derecha sube y baja siguiendo las horas del día, “tocando suelo” a las 8h (configurable en `HOURS_GROUND`).

---

## 🧩 Tecnologías utilizadas

- **p5.js** — biblioteca de JavaScript para arte generativo e interacción visual.  
- **JavaScript (ES6)**  
- **HTML / CSS** (entorno básico)  
- **Fuentes locales:** Barlow (Google Fonts)  

---

## ⚙️ Estructura del proyecto
Reloj-Gaza/
├─ index.html
├─ sketch.js
└─ assets/
└─ Barlow/
└─ Barlow-Regular.ttf


---

## 🚀 Ejecución

1. Instala la extensión **p5.js Addon** o **Live Server** en Visual Studio Code.  
2. Abre la carpeta del proyecto.  
3. Ejecuta `index.html` en el navegador.  
4. El reloj se ajusta automáticamente al tamaño de la ventana.

También puedes abrir directamente el archivo `index.html` con doble clic o usar un servidor local simple (por ejemplo con `python3 -m http.server` en la terminal).

---

## ⌨️ Controles de interacción

| Tecla / Acción | Función |
|----------------|----------|
| ↑ / ↓ | Cambia la **hora** manualmente |
| → / ← | Cambia los **minutos** manualmente |
| 🖱️ Doble clic | Restaura la hora del sistema |
| 🔄 Redimensionar ventana | Recalcula el layout |

---

## 🧮 Cálculo del tiempo transcurrido 

La función `drawElapsedSince()` calcula el tiempo desde una fecha base (`1917-11-02T05:30:00`) hasta el momento actual y muestra:

- Días totales  
- Horas y minutos restantes  
- Fecha inicial formateada

Ejemplo del texto generado:
39 421 DÍAS
6 HORAS, 15 MINUTOS
2 NOV 1917

---

## 🎨 Paleta cromática

| Color | Uso principal |
|--------|----------------|
| `#f7f7f7` | Fondo general |
| `#111111` | Texto y trazos principales |
| `#e4312b` | Acento / Sol / Segundo activo |
| `#149954` | Suelo (zona inferior) |
| `#b9b7b7` | Gris informativo |

---

## 🪶 Créditos

**Autoría:** Kris Darias  
**Licencia:** [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)  
**Año:** 2025  

> *"Anagnórisis: reconocimiento de la identidad por otros."*  
> — Visualización del paso del tiempo desde una mirada simbólica.

---

## 🧠 Notas técnicas

- El sketch usa arrays `Float32Array` para los offsets de las líneas, simulando trazos “a mano”.  
- `randomSeed(12345)` garantiza que el dibujo sea **reproducible** (sin vibraciones frame a frame).  
- Todo el sistema de layout (`computeLayout()`) se adapta de forma responsiva al ancho y alto de la ventana.  
- Para evitar conflictos, se renombró la variable `step` por `gridStep` (ya que `p5.step()` existe internamente).  
- Funciona en modo 2D (`createCanvas(windowWidth, windowHeight)`), no usa `WEBGL`.

---

## 📷 Captura de ejemplo

*(Añade aquí una imagen del reloj en ejecución si lo deseas)*  
Ejemplo:  
![Reloj Gaza](assets/screenshot.png)

---

## 🧩 Enlaces útiles

- [p5.js — documentación oficial](https://p5js.org/reference/)  
- [Guía de color y diseño de interfaces p5.js](https://p5js.org/learn/color.html)

---

✨ *Proyecto desarrollado con fines académicos y de experimentación creativa. No se trata de un reloj funcional sino de una metáfora visual del tiempo y la historia.*

