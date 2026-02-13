// Particle Animation for Background using HTML5 Canvas
const canvas = document.getElementById("particles-canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray;

// Create particle
class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.directionX = (Math.random() - 0.5) * 0.4; // Slower speed
    this.directionY = (Math.random() - 0.5) * 0.4;
    this.size = Math.random() * 2 + 0.5; // Smaller stars
    this.color = "rgba(255, 255, 255, 0.6)";
  }

  // Method to draw individual particle
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  // Check particle position, check mouse position, move the particle, draw the particle
  update() {
    // Determine window boundaries
    if (this.x > canvas.width || this.x < 0) {
      this.directionX = -this.directionX;
    }
    if (this.y > canvas.height || this.y < 0) {
      this.directionY = -this.directionY;
    }

    // Move particle
    this.x += this.directionX;
    this.y += this.directionY;

    // Draw particle
    this.draw();
  }
}

// Create particle array
function init() {
  particlesArray = [];
  let numberOfParticles = (canvas.height * canvas.width) / 12000;
  for (let i = 0; i < numberOfParticles; i++) {
    particlesArray.push(new Particle());
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  for (let i = 0; i < particlesArray.length; i++) {
    particlesArray[i].update();
  }
  connect();
}

// Check if particles are close enough to draw line between them
function connect() {
  let opacityValue = 1;
  for (let a = 0; a < particlesArray.length; a++) {
    for (let b = a; b < particlesArray.length; b++) {
      let distance =
        (particlesArray[a].x - particlesArray[b].x) *
        (particlesArray[a].x - particlesArray[b].x) +
        (particlesArray[a].y - particlesArray[b].y) *
        (particlesArray[a].y - particlesArray[b].y);
      if (distance < (canvas.width / 7) * (canvas.height / 7)) {
        opacityValue = 1 - distance / 20000;
        if (opacityValue > 0) {
          ctx.strokeStyle = "rgba(255, 255, 255," + opacityValue * 0.1 + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
          ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
          ctx.stroke();
        }
      }
    }
  }
}

// Resize event
window.addEventListener("resize", function () {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  init();
});

// Start animation
init();
animate();

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});
