# Proyecto 2 · Ejercicio 3 — Transformaciones lineales en p5.js

**Autora:** Kris Darias  
**Asignatura:** Programación Creativa (UOC)  
**Librería:** [p5.js](https://p5js.org/)  
**Fecha:** Octubre 2025  

---

## 🎯 Descripción

Este programa aplica **transformaciones espaciales lineales** sobre una imagen digital utilizando **convoluciones 3×3** implementadas en JavaScript con la biblioteca **p5.js**.  
El proyecto toma como referencia los materiales:

- *Módulo 2. Transformaciones espaciales lineales*  
- *Visualización, análisis y procesamiento de imágenes en HTML5 y JavaScript*

---

## ⚙️ Funcionamiento

Al cargar la página, se muestra la **imagen original**.  
El usuario puede mantener pulsadas determinadas teclas para aplicar filtros temporales:

| Tecla | Transformación | Descripción |
|-------|----------------|--------------|
| **K** | Detección de contornos | Aplica el operador **Sobel**, una transformación lineal que realza los bordes detectando cambios bruscos de intensidad. |
| **D** | Realce de contornos | Aplica un **kernel de enfoque 3×3**, basado en la suma ponderada de los píxeles vecinos (convolución lineal). |

Cuando se suelta la tecla, la imagen vuelve automáticamente al estado original.

---

## 🧠 Principios aplicados

Ambas transformaciones se basan en la **convolución lineal**:

\[
I'(x,y) = \sum_{i=-1}^{1}\sum_{j=-1}^{1} I(x+i, y+j) \cdot K(i,j)
\]

Donde `K` es el **kernel** o máscara de la operación.

- **Sobel** utiliza dos matrices (Gx, Gy) para calcular el gradiente horizontal y vertical, combinados para generar los contornos.  
- **Sharpen (enfoque)** utiliza una máscara con valor central positivo y valores negativos en sus vecinos para resaltar los límites.

---

## 💻 Tecnologías utilizadas

- HTML5  
- JavaScript  
- p5.js (v1.9.0)  
- CSS para el diseño y tipografía  
- Algoritmos propios de convolución y detección de bordes (sin librerías externas)

---

## 🖼️ Imagen utilizada

La imagen empleada en el programa fue **generada con inteligencia artificial mediante la plataforma NanoBanana AI**, bajo condiciones de uso **educativo y sin restricciones de copyright**.  
Se garantiza que la imagen **no contiene marca de agua** ni vulnera derechos de autor.

```js
imgOrig = loadImage('assets/mi_imagen.jpg');
