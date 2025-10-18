/* 
Proyecto 4a — Transformaciones geométricas con p5.js
Autora: Kris Darias

Este ejercicio forma parte de la asignatura de Visualización, análisis y procesamiento de imágenes (UOC).
El objetivo es aplicar tres transformaciones geométricas —traslación, rotación y escalado—
a una imagen cargada en p5.js, de forma simultánea y con valores aleatorios en cada clic.
*/

// ---------------------------------------------
// VARIABLES GLOBALES
// ---------------------------------------------

let img;            // variable para guardar la imagen original que se transformará
let angle = 0;      // ángulo inicial de rotación (en grados)
let scaleFactor = 1;// factor de escala inicial (1 = tamaño original)
let posX, posY;     // coordenadas donde se dibuja la imagen


// ---------------------------------------------
// FUNCIÓN PRELOAD
// ---------------------------------------------
function preload() {
  // Carga la imagen antes de iniciar el programa.
  // Esto evita que la imagen se intente dibujar antes de estar disponible.
  img = loadImage("img/seleccion_kd.jpg"); 
}


// ---------------------------------------------
// FUNCIÓN SETUP
// ---------------------------------------------
function setup() {
  // Crea un canvas del mismo tamaño que la ventana del navegador.
  // Así la imagen puede moverse libremente por toda la pantalla.
  createCanvas(windowWidth, windowHeight);

  // Define que la referencia para dibujar la imagen sea su centro,
  // y no la esquina superior izquierda (que es el valor por defecto).
  imageMode(CENTER);

  // Posiciona la imagen en el centro del canvas al iniciar el programa.
  posX = width / 2;
  posY = height / 2;
}


// ---------------------------------------------
// FUNCIÓN DRAW
// ---------------------------------------------
function draw() {
  // Dibuja un fondo gris muy claro en cada frame (para limpiar la pantalla).
  background(247); 

  // push() guarda el estado actual de las transformaciones.
  // Es buena práctica usarlo siempre antes de aplicar transformaciones
  // porque así no afectan a otros posibles elementos del canvas.
  push();

  // Mueve el sistema de coordenadas al punto (posX, posY)
  // donde se va a dibujar la imagen.
  translate(posX, posY);

  // Rota el sistema de coordenadas según el ángulo definido.
  // radians() convierte los grados en radianes, que es lo que usa p5.js internamente.
  rotate(radians(angle));

  // Escala el sistema de coordenadas multiplicando por el factor definido.
  // Un valor menor que 1 reduce la imagen, y mayor que 1 la amplía.
  scale(scaleFactor);

  // Dibuja la imagen en el origen del sistema transformado.
  // Como imageMode(CENTER), se dibuja desde el centro.
  image(img, 0, 0);

  // pop() restaura el estado del canvas al que había antes del push().
  // Es decir, deshace las transformaciones para no afectar al resto del dibujo.
  pop();

  // Aunque en este ejercicio solo hay una imagen,
  // usar push() y pop() demuestra una buena práctica estructural,
  // muy útil cuando se trabaja con múltiples objetos o capas.
}


// ---------------------------------------------
// FUNCIÓN windowResized
// ---------------------------------------------
function windowResized() {
  // Si el usuario cambia el tamaño de la ventana,
  // el canvas se ajusta automáticamente a las nuevas dimensiones.
  resizeCanvas(windowWidth, windowHeight);
}


// ---------------------------------------------
// FUNCIÓN mousePressed
// ---------------------------------------------
function mousePressed() {
  // Cada vez que el usuario hace clic sobre la ventana,
  // se generan nuevos valores aleatorios para las tres transformaciones:

  // Traslación: la imagen se mueve a cualquier punto del canvas.
  posX = random(width);
  posY = random(height);

  // Rotación: el ángulo se elige aleatoriamente entre 0 y 360 grados.
  angle = random(0, 360);

  // Escalado: se cambia el tamaño entre la mitad (0.5)
  // y el doble (2) del tamaño original.
  scaleFactor = random(0.5, 2);
}
