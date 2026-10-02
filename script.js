// ดึง DOM Elements
const radiusInput = document.getElementById('radius');
const pressureInput = document.getElementById('pressure');
const viscosityInput = document.getElementById('viscosity');
const lengthInput = document.getElementById('length');

const rVal = document.getElementById('r-val');
const pVal = document.getElementById('p-val');
const muVal = document.getElementById('mu-val');
const lVal = document.getElementById('l-val');

const qVal = document.getElementById('q-val');
const resVal = document.getElementById('res-val');
const shearVal = document.getElementById('shear-val');
const reVal = document.getElementById('re-val');

const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

// ตัวแปรสำหรับ Particle System (เม็ดเลือดแดง)
let particles = [];
const numParticles = 120;

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    // สุ่มตำแหน่ง y ตามจุดศูนย์กลางแบบ Parabolic
    this.yRel = (Math.random() - 0.5) * 2; // -1 ถึง 1
    this.size = Math.random() * 2 + 3;
  }

  update(radiusPx, maxSpeed) {
    // คำนวณความเร็วแบบ Laminar flow (กึ่งกลางเร็วกว่าขอบ)
    const velocityFactor = 1 - Math.pow(this.yRel, 2);
    this.x += maxSpeed * velocityFactor;

    // หากหลุดขอบขวา ให้กลับไปเริ่มซ้ายสุด
    if (this.x > canvas.width) {
      this.x = 0;
      this.yRel = (Math.random() - 0.5) * 2;
    }
  }

  draw(ctx, centerY, radiusPx) {
    const actualY = centerY + this.yRel * (radiusPx - 5);
    ctx.beginPath();
    ctx.arc(this.x, actualY, this.size, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.closePath();
  }
}

// สร้างอาร์เรย์เม็ดเลือด
for (let i = 0; i < numParticles; i++) {
  particles.push(new Particle());
}

// ฟังก์ชันคำนวณและอัปเดตการแสดงผล
function updateSimulation() {
  const r = parseFloat(radiusInput.value); // mm
  const dP = parseFloat(pressureInput.value); // mmHg
  const mu = parseFloat(viscosityInput.value); // cP
  const L = parseFloat(lengthInput.value); // cm

  // อัปเดตข้อความ UI
  rVal.textContent = r;
  pVal.textContent = dP;
  muVal.textContent = mu;
  lVal.textContent = L;

  // 1. คำนวณตามสูตร Hagen–Poiseuille
  // Q = (pi * r^4 * dP) / (8 * mu * L)
  const Q = (Math.PI * Math.pow(r, 4) * dP) / (8 * mu * L);
  
  // 2. คำนวณ Vessel Resistance (R_res = 8 * mu * L / (pi * r^4))
  const Resistance = (8 * mu * L) / (Math.PI * Math.pow(r, 4));

  // 3. Wall Shear Stress (tau = 4 * mu * Q / (pi * r^3))
  const Shear = (4 * mu * Q) / (Math.PI * Math.pow(r, 3));

  // 4. Reynolds Number (Re = 2 * rho * Q / (pi * r * mu)) 
  const density = 1.06; // g/cm3 (ความหนาแน่นเลือด)
  const Re = (2 * density * Q) / (Math.PI * r * mu);

  // อัปเดตตัวเลขผลลัพธ์
  qVal.textContent = Q.toFixed(2) + " mL/s";
  resVal.textContent = Resistance.toFixed(2) + " mmHg·s/mL";
  shearVal.textContent = Shear.toFixed(2) + " Pa";
  reVal.textContent = Re.toFixed(0) + (Re > 2000 ? " (Turbulent)" : " (Laminar)");

  // วาดภาพเคลื่อนไหวบน Canvas
  drawCanvas(r, Q);
}

function drawCanvas(r, Q) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerY = canvas.height / 2;
  // แปลงรัศมีเป็น พิกเซล เพื่อแสดงผล
  const radiusPx = r * 30; 

  // วาดผนังหลอดเลือด (Vessel Wall)
  ctx.fillStyle = '#475569';
  // ผนังบน
  ctx.fillRect(0, 0, canvas.width, centerY - radiusPx);
  // ผนังล่าง
  ctx.fillRect(0, centerY + radiusPx, canvas.width, canvas.height - (centerY + radiusPx));

  // วาดขอบหลอดเลือด
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, centerY - radiusPx);
  ctx.lineTo(canvas.width, centerY - radiusPx);
  ctx.moveTo(0, centerY + radiusPx);
  ctx.lineTo(canvas.width, centerY + radiusPx);
  ctx.stroke();

  // แปลง Q เป็นความเร็วสำหรับแอนิเมชัน
  const maxSpeed = Math.min(Math.max(Q * 0.05, 0.5), 20);

  // อัปเดตและวาดเม็ดเลือด
  particles.forEach(p => {
    p.update(radiusPx, maxSpeed);
    p.draw(ctx, centerY, radiusPx);
  });
}

// Loop สำหรับทำ Animation
function animate() {
  const r = parseFloat(radiusInput.value);
  const dP = parseFloat(pressureInput.value);
  const mu = parseFloat(viscosityInput.value);
  const L = parseFloat(lengthInput.value);
  
  const Q = (Math.PI * Math.pow(r, 4) * dP) / (8 * mu * L);
  drawCanvas(r, Q);
  
  requestAnimationFrame(animate);
}

// Event Listeners
[radiusInput, pressureInput, viscosityInput, lengthInput].forEach(input => {
  input.addEventListener('input', updateSimulation);
});

// Render สูตรคณิตศาสตร์ KaTeX เมื่อโหลดเสร็จ
window.addEventListener('DOMContentLoaded', () => {
  if (window.katex) {
    katex.render("Q = \\frac{\\pi r^4 \\Delta P}{8 \\mu L}", document.getElementById('formula'), {
      throwOnError: false,
      displayMode: true
    });
  }
  updateSimulation();
  animate();
});
