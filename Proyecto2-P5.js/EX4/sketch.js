// Proyecto 4a — Transformaciones geométricas con p5.js
// Autora: Kris Darias

let img;
let angle = 0;
let scaleFactor = 1;
let posX, posY;

function preload() { // imagen que se va a transformar
  img = loadImage("img/Kris_Darias_Rodríguez_A_hyperrealistic_cinematic_shot_of_a_woman_with_short_hair_riding_28da27a6-9061-42a2-a751-7efa2bbb441e.jpg"); // cambia por el nombre de tu imagen
}

function setup() {
  createCanvas(windowWidth, windowHeight); // tamaño del canvas. WindowWidth y WindowHeight son las dimensiones de la ventana del navegador
  imageMode(CENTER); // para que la imagen se dibuje desde el centro
  posX = width / 2; // posición inicial en el centro del canvas
  posY = height / 2; // posición inicial en el centro del canvas
}

function draw() {
  background(247); // color de fondo
  push(); // guarda el estado actual de transformación
  translate(posX, posY); // mueve el origen de coordenadas a (posX, posY)
  rotate(radians(angle)); // rota el sistema de coordenadas
  scale(scaleFactor); // escala el sistema de coordenadas
  image(img, 0, 0); // dibuja la imagen en el origen de coordenadas transformado
  pop(); // restaura el estado de transformación previo
  // el uso de push() y pop() permite aislar las transformaciones aplicadas a la imagen del resto del canvas
  // sería especialmente útil si se dibujaran otros elementos en el canvas que no debieran verse afectados por las transformaciones aplicadas a la imagen
  // no es el caso aquí, pero es buena práctica usar push() y pop() cuando se aplican transformaciones
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
function mousePressed() {
  // Genera valores aleatorios para cada transformación
  posX = random(width);
  posY = random(height);
  angle = random(0, 360);
  scaleFactor = random(0.5, 2); // entre mitad y doble de tamaño
}

