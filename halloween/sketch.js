// sketch.js
// p5.js sketch that uses MediaPipe Face Mesh to detect mouth opening
// and spawn Halloween-themed particles to simulate digital toothbrushing.

// --- Configurable globals ---
let video;
let canvasW = 1280;
let canvasH = 720;

let faceMesh;      // MediaPipe FaceMesh object
let cameraUtils;   // MediaPipe Camera helper
let landmarks = null;

let loadingOverlay;
let isModelReady = false;
let hasStarted = false;

// UI elements
let startButton, thresholdSlider, sizeSlider, statusDiv;
let threshold = 0.03;
let particleSize = 8;

let particles = [];
let maxParticles = 800;

// Sound & assets
let spookySound;

// Mouth open tracking
let mouthOpen = false;
let mouthOpenStart = 0; // millis
let brushIntensity = 0; // grows with open time

// Font
let titleFont;

// --- Particle class ---
class Particle {
  constructor(x, y, size, color, life, type = 'spark') {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(0.3, 2.5));
    if (type === 'brush') this.vel.mult(0.6);
    this.size = size * random(0.6, 1.4);
    this.color = color;
    this.life = life;
    this.age = 0;
    this.type = type;
    this.angle = random(TWO_PI);
    this.spin = random(-0.1, 0.1);
  }
  update() {
    this.pos.add(this.vel);
    // gravity-ish
    if (this.type === 'spark') this.vel.y += 0.03;
    this.age++;
    this.angle += this.spin;
  }
  draw() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);
    noStroke();
    if (this.type === 'spark') {
      fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], map(this.age, 0, this.life, 255, 0));
      ellipse(0, 0, this.size);
    } else if (this.type === 'brush') {
      // brush stroke
      fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], 180);
      rectMode(CENTER);
      rect(0, 0, this.size * 2.2, this.size * 0.7, 6);
    }
    pop();
  }
  isDead() {
    return this.age > this.life;
  }
}

// --- p5 preload ---
function preload() {
  // Load sound if present
  if (document.getElementById('spookySound')) {
    try {
      spookySound = loadSound('assets/spooky.mp3');
    } catch (e) {
      console.warn('No spooky sound loaded (assets/spooky.mp3).');
      spookySound = null;
    }
  }
  // Try to load title-like font (fallback is system font)
  titleFont = loadFont('https://fonts.gstatic.com/s/creepster/v11/8QINdiTq6nYcE8pnhqf7Fh0.woff2', () => {}, () => {});
}

// --- p5 setup ---
function setup() {
  // create canvas sized to 16:9 1280x720
  createCanvas(canvasW, canvasH);
  pixelDensity(1);
  // createCapture returns a DOM video element we can feed to MediaPipe
  video = createCapture(VIDEO, function() {
    // ready
  });
  video.size(canvasW, canvasH);
  video.elt.setAttribute('playsinline', 'true');
  video.hide(); // we'll draw video on the canvas

  // DOM UI
  startButton = select('#startButton');
  thresholdSlider = select('#thresholdSlider');
  sizeSlider = select('#sizeSlider');
  statusDiv = select('#status');

  startButton.mousePressed(startExperience);
  thresholdSlider.input(() => threshold = Number(thresholdSlider.value()));
  sizeSlider.input(() => particleSize = Number(sizeSlider.value()));

  loadingOverlay = select('#loading');

  // Initialize MediaPipe Face Mesh (but we only start camera after pressing start)
  initFaceMesh();
}

// Initialize MediaPipe Face Mesh
async function initFaceMesh() {
  // face_mesh is loaded via CDN script -> global FaceMesh
  faceMesh = new FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });

  faceMesh.onResults(onFaceResults);

  // Model is "ready" once FaceMesh created — hide loading only when start pressed and camera started
  isModelReady = true;
  statusDiv.html('Status: model ready — press Start Experience');
  // keep loading overlay until user presses start (per requirement to require user interaction)
}

// Start experience triggered by user
function startExperience() {
  if (!isModelReady) {
    statusDiv.html('Status: model not ready yet...');
    return;
  }
  if (hasStarted) return;
  hasStarted = true;
  select('#loading').style('display', 'flex');

  // Use MediaPipe Camera helper to feed p5 video element frames to FaceMesh.
  // We pass the underlying video element (video.elt) to Camera helper.
  const mpCamera = new Camera(video.elt, {
    onFrame: async () => {
      await faceMesh.send({ image: video.elt });
    },
    width: canvasW,
    height: canvasH
  });
  mpCamera.start();

  // hide loading overlay after a short delay to let first frames paint
  setTimeout(() => {
    select('#loading').style('display', 'none');
    statusDiv.html('Status: running — open your mouth!');
  }, 1200);
}

// Callback MediaPipe results
function onFaceResults(results) {
  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    landmarks = results.multiFaceLandmarks[0];
  } else {
    landmarks = null;
  }
}

// Convert normalized landmark to pixel position
function landmarkToXY(landmark) {
  return createVector(landmark.x * width, landmark.y * height);
}

function draw() {
  background(10);

  // Draw camera video mirrored (so it feels like a mirror)
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  // If there are landmarks, draw elements and compute mouth open
  if (landmarks) {
    // get relevant landmarks: 13 (upper inner lip), 14 (lower inner lip)
    // Eyes: 33 (left) and 263 (right)
    let idxUpper = 13;
    let idxLower = 14;
    let idxLeftEye = 33;
    let idxRightEye = 263;

    let up = landmarkToXY(landmarks[idxUpper]);
    let down = landmarkToXY(landmarks[idxLower]);
    let leftEye = landmarkToXY(landmarks[idxLeftEye]);
    let rightEye = landmarkToXY(landmarks[idxRightEye]);

    // Mirror x positions because video is drawn mirrored
    up.x = width - up.x;
    down.x = width - down.x;
    leftEye.x = width - leftEye.x;
    rightEye.x = width - rightEye.x;

    // face scale = distance between eyes
    let faceScale = p5.Vector.dist(leftEye, rightEye);
    let mouthDist = p5.Vector.dist(up, down);
    let mouthRatio = mouthDist / max(faceScale, 1);

    // Decide mouth open with threshold
    if (mouthRatio > threshold) {
      if (!mouthOpen) {
        mouthOpen = true;
        mouthOpenStart = millis();
        // play sound at mouth open start for feedback if available
        if (spookySound && !spookySound.isPlaying()) {
          try { spookySound.play(); } catch (e) {}
        }
      }
      // compute intensity (cap)
      brushIntensity = constrain((millis() - mouthOpenStart) / 1200.0, 0, 1);
      // spawn particles around mouth center
      let mouthCenter = p5.Vector.add(up, down).mult(0.5);
      spawnParticles(mouthCenter.x, mouthCenter.y, brushIntensity);
    } else {
      if (mouthOpen) {
        mouthOpen = false;
        brushIntensity = 0;
        // stop or fade sound
        if (spookySound && spookySound.isPlaying()) {
          try { spookySound.stop(); } catch (e) {}
        }
      }
    }

    // draw a subtle mouth indicator (Halloween brush)
    strokeWeight(2);
    noFill();
    stroke(255, 180, 60, 160);
    ellipse((up.x + down.x) / 2, (up.y + down.y) / 2, faceScale * 0.34 + mouthDist * 0.6, faceScale * 0.18 + mouthDist * 0.4);

    // optionally draw small landmark points (for debugging)
    // noStroke(); fill(0,255,0); ellipse(up.x, up.y, 6); ellipse(down.x, down.y, 6);
  }

  // Update and draw particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw();
    if (p.isDead()) particles.splice(i, 1);
  }

  // Limit number of particles
  if (particles.length > maxParticles) {
    particles.splice(0, particles.length - maxParticles);
  }

  // HUD: show small status text on canvas
  noStroke();
  fill(255, 230);
  textSize(13);
  textFont('Rubik, sans-serif');
  textAlign(RIGHT);
  text(`Particles: ${particles.length}`, width - 12, height - 12);
}

// Spawn particles at (x,y) according to intensity
function spawnParticles(x, y, intensity) {
  // intensity [0..1] controls number/size
  let baseCount = lerp(2, 18, intensity);
  let extra = map(particleSize, 2, 20, 0, 6);
  let total = Math.round(baseCount + extra);

  for (let i = 0; i < total; i++) {
    // Colors Halloween palette
    let palettes = [
      color(255, 138, 0), // orange
      color(180, 60, 255), // purple
      color(255, 255, 255), // white foam
      color(60, 200, 100) // mint-ish (toothpaste)
    ];
    let c = random(palettes);
    // Some particles are brush strokes
    let typ = random() < 0.28 + intensity * 0.6 ? 'brush' : 'spark';
    let life = random(40, 110) * (1 + intensity);
    let jitterX = random(-18, 18);
    let jitterY = random(-12, 12);
    let sz = particleSize * random(0.6, 1.6) * (1 + intensity * 0.6);
    particles.push(new Particle(x + jitterX, y + jitterY, sz, c, life, typ));
  }
}

/* Optional: when window resized, keep canvas scaled */
function windowResized() {
  // keep 1280x720 fixed for kiosk optimization; do nothing
}