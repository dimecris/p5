# Proyecto 2 · Ejercicio 3 — Transformaciones lineales en p5.js

**Autora:** Kris Darias  
**Asignatura:** Programación Creativa (UOC)  
**Librería:** [p5.js](https://p5js.org/)  
**Fecha:** Octubre 2025  

---

# 🌀 Transformaciones geométricas con p5.js

Ejercicio que muestra una imagen y aplica **transformaciones geométricas simultáneas** (traslación, rotación y escalado) cada vez que el usuario hace clic sobre la ventana.

---

## 🎯 Objetivo del ejercicio

Implementar un programa en **p5.js** que:
1. Muestre una única imagen en la página web.
2. Aplique **todas las transformaciones a la vez** al hacer clic:
   - **Traslación:** mueve la imagen a una posición aleatoria.
   - **Rotación:** gira la imagen entre 0 y 360 grados.
   - **Escalado:** cambia su tamaño entre la mitad y el doble del original.
3. Restablezca el fondo y vuelva a dibujar solo una imagen transformada cada vez.

---

## 📁 Archivos del proyecto

index4a.html
sketch4a.js
imagen.jpg
README.md

yaml
Copiar código

- **index4a.html** → contiene la estructura base y la carga de la librería p5.js.  
- **sketch4a.js** → contiene el código del programa.  
- **imagen.jpg** → imagen utilizada (puede reemplazarse por cualquier otra).  

---

## ⚙️ Cómo funciona

- La función `mousePressed()` genera nuevos valores aleatorios cada vez que el usuario hace clic:
  ```js
  posX = random(width);
  posY = random(height);
  angle = random(0, 360);
  scaleFactor = random(0.5, 2);
translate(), rotate() y scale() aplican las transformaciones geométricas a la imagen.

imageMode(CENTER) asegura que la rotación y el escalado se realicen desde el centro.

🚀 Ejecución
Abre el archivo index4a.html en un navegador web.

Al hacer clic sobre la ventana, la imagen se moverá, rotará y cambiará de tamaño aleatoriamente.

🧩 Tecnologías utilizadas
HTML5

JavaScript

p5.js v1.10.0

✨ Autora
Kris Darias
🎨 estudillimona.com · 🐙 GitHub

yaml
Copiar código

---

¿Quieres que te lo deje con un pequeño bloque de código embebido (el `sketch4a.js` completo) dentro del README para que se vea directamente en GitHub también?