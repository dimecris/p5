class Particle {
  constructor(x, y, size, col, life, type = 'spark') {
    this.pos = createVector(x, y);                           // posición actual
    this.vel = p5.Vector.random2D().mult(random(0.3, 2.5));  // velocidad inicial
    if (type === 'brush') this.vel.mult(0.6);                // brochazo = movimiento más suave
    this.size = size * random(0.6, 1.4);                     // tamaño con ligera variación
  // Aseguro un p5.Color válido sin depender de ensureP5Color
  // Si ya viene un p5.Color (tiene .levels), lo uso; si no, convierto o aplico un fallback
  this.color = (col && col.levels) ? col : color(col || '#FF8A00');
    this.life = life;                                        // vida total en frames
    this.age = 0;                                            // edad en frames
    this.type = type;                                        // 'spark' o 'brush'
    this.angle = random(TWO_PI);                             // orientación inicial
    this.spin = random(-0.1, 0.1);                           // giro por frame
  }
  update() {
    this.pos.add(this.vel);                  // avanza
    if (this.type === 'spark') this.vel.y += 0.03; // gravedad ligera para chispas
    this.age++;                               // envejece
    this.angle += this.spin;                  // gira
  }
  draw() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);
    noStroke();
    
  // Salvaguarda por si color se hubiese perdido: reconstruyo p5.Color si hace falta
  const col = (this.color && this.color.levels) ? this.color : color(this.color || '#FF8A00');
    if (this.type === 'spark') {
      // chispa circular con alpha que decae con la edad
      const a = map(this.age, 0, this.life, 255, 0);
      fill(red(col), green(col), blue(col), a);
      ellipse(0, 0, this.size);
    } else if (this.type === 'brush') {
      // brochazo rectangular con bordes redondeados
      fill(red(col), green(col), blue(col), 180);
      rectMode(CENTER);
      rect(0, 0, this.size * 2.2, this.size * 0.7, 6);
    }
    pop();
  }
  isDead() {
    return this.age > this.life; // marcar para eliminarse
  }
}