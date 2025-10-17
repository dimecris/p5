# Proyecto 2 – Filtros con p5.js

Este proyecto consiste en un programa desarrollado con **p5.js** que aplica diferentes transformaciones a una imagen mediante la función `filter()`.  
Cada transformación se activa al pulsar una tecla específica (según las letras del apellido de la autora).

---

## 🖼️ Descripción general

El programa carga una imagen y permite aplicar varios filtros visuales utilizando el teclado.  
En todo momento se muestra **una sola imagen**: la original o la filtrada.

Cada filtro se aplica **siempre sobre la imagen original**, nunca sobre una imagen previamente modificada.

---

## 🧠 Filtros asignados

| Letra | Transformación | Descripción |
|:------|:----------------|:-------------|
| **D** | Erosión | Aplica el filtro `ERODE`, que reduce las zonas claras de la imagen. |
| **A** | Posterización (nivel 4) | Reduce la cantidad de colores, creando un efecto de ilustración. |
| **R** | Binarización (umbral 130) | Convierte la imagen a blanco y negro según un umbral de brillo. |
| **I** | Negativo | Invierte los colores de la imagen, creando un efecto de negativo fotográfico. |

> Cualquier otra tecla devuelve la imagen original.

---

## ⚙️ Funcionamiento

1. Al abrir la página, se muestra la **imagen original**.
2. Al pulsar una de las teclas indicadas (`D`, `A`, `R`, `I`), se aplica el filtro correspondiente.
3. Si se pulsa cualquier otra tecla, la imagen vuelve a su estado original.
4. El programa muestra en todo momento un pequeño **manual de uso** con las letras y los filtros asociados.

---

## 🧩 Tecnologías utilizadas

- **HTML5**
- **JavaScript**
- **p5.js** (versión 1.9.2)

---

## 📁 Estructura de archivos

