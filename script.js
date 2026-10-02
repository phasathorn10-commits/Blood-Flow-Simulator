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
// ==========================================
// 1. ตัวแปรอ้างอิง และการสร้าง Chart.js
// ==========================================
const chartCtx = document.getElementById('flowChart').getContext('2d');

// สร้างกราฟเริ่มต้น (Line Chart)
const flowChart = new Chart(chartCtx, {
  type: 'line',
  data: {
    labels: [], // ค่า r (0.5 ถึง 3.0)
    datasets: [
      {
        label: 'Flow Rate (Q) vs Radius (r)',
        data: [], // ค่า Q ที่คำนวณได้
        borderColor: '#ef4444', // สีเส้นกราฟ (แดง)
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4, // ความโค้งของเส้น
        borderWidth: 2,
        pointRadius: 0 // ซ่อนจุดบนเส้นเพื่อความลื่นไหล
      },
      {
        label: 'Current State', // จุดแสดงตำแหน่งปัจจุบันที่ผู้ใช้เลือก
        data: [],
        borderColor: '#38bdf8', // สีจุด (ฟ้า)
        backgroundColor: '#38bdf8',
        pointRadius: 6,
        pointHoverRadius: 8,
        showLine: false // แสดงเฉพาะจุด ไม่ลากเส้น
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#f8fafc' } // สีข้อความกำกับ
      },
      tooltip: {
        callbacks: {
          label: (context) => ` Q: ${context.parsed.y.toFixed(2)} mL/s`
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Radius (r) [mm]',
          color: '#f8fafc'
        },
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' }
      },
      y: {
        title: {
          display: true,
          text: 'Flow Rate (Q) [mL/s]',
          color: '#f8fafc'
        },
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' }
      }
    }
  }
});

// ==========================================
// 2. ฟังก์ชันสำหรับคำนวณและอัปเดตข้อมูลในกราฟ
// ==========================================
function updateChart(currentR, dP, mu, L) {
  const rLabels = [];
  const qData = [];

  // จำลองคำนวณค่า Q เมื่อ r เปลี่ยนตั้งแต่ 0.5 ถึง 3.0 mm (แบ่งเป็น 25 จุด)
  for (let r = 0.5; r <= 3.0; r += 0.1) {
    const Q = (Math.PI * Math.pow(r, 4) * dP) / (8 * mu * L);
    rLabels.push(r.toFixed(1));
    qData.push(Q);
  }

  // คำนวณค่า Q ณ จุดปัจจุบันที่ผู้ใช้ปรับสไลเดอร์อยู่
  const currentQ = (Math.PI * Math.pow(currentR, 4) * dP) / (8 * mu * L);

  // สร้างอาร์เรย์สำหรับจุดปัจจุบัน (ให้ตรงกับตำแหน่ง X ของค่า currentR)
  const currentPointData = rLabels.map(rStr => {
    return parseFloat(rStr) === parseFloat(currentR.toFixed(1)) ? currentQ : null;
  });

  // อัปเดตข้อมูลเข้า Chart.js
  flowChart.data.labels = rLabels;
  flowChart.data.datasets[0].data = qData; // เส้นกราฟทฤษฎี $r^4$
  flowChart.data.datasets[1].data = currentPointData; // จุดปัจจุบัน

  // สั่งให้กราฟวาดใหม่โดยไม่ต้องทำ Animation ซ้ำซ้อน (เพื่อความลื่นไหล)
  flowChart.update('none');
}

// ==========================================
// 3. เรียกใช้งานฟังก์ชันภายใน updateSimulation
// ==========================================
// ให้เพิ่มคำสั่งนี้ไว้ในฟังก์ชัน updateSimulation() เดิมของคุณ:
/* 
function updateSimulation() {
  const r = parseFloat(radiusInput.value);
  const dP = parseFloat(pressureInput.value);
  const mu = parseFloat(viscosityInput.value);
  const L = parseFloat(lengthInput.value);

  // ... โค้ดคำนวณเดิมของคุณ ...

  // 🟢 อัปเดตกราฟ Chart.js
  updateChart(r, dP, mu, L);
}
*/
// ==========================================
// 1. ตั้งค่า Chart.js สำหรับ Dynamic Curve
// ==========================================
const chartCtx = document.getElementById('flowChart').getContext('2d');

const flowChart = new Chart(chartCtx, {
  type: 'line',
  data: {
    labels: [], // เก็บค่า r (รัศมีหลอดเลือด เช่น 0.5 ถึง 3.0 mm)
    datasets: [
      {
        label: 'r⁴ Flow Curve (Q)',
        data: [], // ค่า Q ที่คำนวณใหม่ตามสูตร r^4
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        fill: true,
        tension: 0.4, // ทำให้เส้นโค้งมนสมูท
        borderWidth: 2.5,
        pointRadius: 0 // ซ่อนจุดบนเส้นเพื่อความสวยงาม
      },
      {
        label: 'Current State',
        data: [], // จุดเน้นตำแหน่งปัจจุบันที่ผู้ใช้เลื่อนสไลเดอร์อยู่
        borderColor: '#38bdf8',
        backgroundColor: '#38bdf8',
        pointRadius: 6,
        pointHoverRadius: 8,
        showLine: false
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // ปิด animation เพื่อให้การลากสไลเดอร์ตอบสนองทันทีแบบ Real-time
    plugins: {
      legend: { labels: { color: '#f8fafc' } },
      tooltip: {
        callbacks: {
          label: (context) => ` Q: ${context.parsed.y.toFixed(2)} mL/s`
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Radius (r) [mm]', color: '#f8fafc' },
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' }
      },
      y: {
        title: { display: true, text: 'Flow Rate (Q) [mL/s]', color: '#f8fafc' },
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' }
      }
    }
  }
});

// ==========================================
// 2. ฟังก์ชันคำนวณและวาด Dynamic Curve ใหม่
// ==========================================
function updateDynamicCurve(currentR, dP, mu, L) {
  const rLabels = [];
  const qCurveData = [];
  
  const minRadius = 0.5; // ค่ารัศมีต่ำสุดบนแกน X
  const maxRadius = 3.0; // ค่ารัศมีสูงสุดบนแกน X
  const step = 0.1;      // ความละเอียดของจุดคำนวณ

  // 🔄 วนลูปคำนวณรูปทรงเส้นโค้ง r^4 ใหม่ ณ ค่า dP, mu, L ปัจจุบัน
  for (let r = minRadius; r <= maxRadius; r += step) {
    const rFixed = r.toFixed(1);
    
    // คำนวณตามสูตร Hagen–Poiseuille: Q = (π * r^4 * ΔP) / (8 * μ * L)
    const Q = (Math.PI * Math.pow(r, 4) * dP) / (8 * mu * L);
    
    rLabels.push(rFixed);
    qCurveData.push(Q);
  }

  // คำนวณตำแหน่งจุดปัจจุบัน (Current State Indicator)
  const currentQ = (Math.PI * Math.pow(currentR, 4) * dP) / (8 * mu * L);
  const currentPointData = rLabels.map(rStr => {
    return parseFloat(rStr) === parseFloat(currentR.toFixed(1)) ? currentQ : null;
  });

  // ⚡ อัปเดตข้อมูลชุดใหม่เข้า Chart.js
  flowChart.data.labels = rLabels;
  flowChart.data.datasets[0].data = qCurveData;     // วาดเส้นโค้งใหม่
  flowChart.data.datasets[1].data = currentPointData; // ย้ายจุดปัจจุบัน

  // สั่งให้กราฟวาดซ้ำทันที
  flowChart.update();
}

// ==========================================
// 3. ตัวอย่างการดึงค่าจาก Input Sliders มาสั่งทำงาน
// ==========================================
const radiusInput = document.getElementById('radius');
const pressureInput = document.getElementById('pressure');
const viscosityInput = document.getElementById('viscosity');
const lengthInput = document.getElementById('length');

function onInputChange() {
  const r = parseFloat(radiusInput.value);   // mm
  const dP = parseFloat(pressureInput.value); // mmHg
  const mu = parseFloat(viscosityInput.value); // cP
  const L = parseFloat(lengthInput.value);   // cm

  // เรียกคำนวณสร้างเส้นโค้งใหม่ทันทีที่มีการขยับสไลเดอร์ตัวใดตัวหนึ่ง
  updateDynamicCurve(r, dP, mu, L);
}

// ผูก Event Listener เข้ากับสไลเดอร์ทั้งหมด
[radiusInput, pressureInput, viscosityInput, lengthInput].forEach(input => {
  input.addEventListener('input', onInputChange);
});

// เรียกทำงานครั้งแรกเมื่อโหลดหน้าเว็บ
onInputChange();

const atheroToggle = document.getElementById('atheroToggle');
const plaqueSeverityInput = document.getElementById('plaqueSeverity');
const plaqueVal = document.getElementById('plaqueVal');

// สลับการแสดงผลเมนูควบคุม Plaque
atheroToggle.addEventListener('change', () => {
  document.getElementById('plaqueControl').style.display = atheroToggle.checked ? 'block' : 'none';
  updateSimulation();
});

plaqueSeverityInput.addEventListener('input', () => {
  plaqueVal.textContent = plaqueSeverityInput.value;
  updateSimulation();
});

// ฟังก์ชันคำนวณและวาดรูปบน Canvas
function drawVesselWithPlaque(baseRadiusPx, flowRate) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const centerY = canvas.height / 2;
  const isAthero = atheroToggle.checked;
  const plaquePercent = isAthero ? parseFloat(plaqueSeverityInput.value) : 0;

  // รัศมีจริงบริเวณที่มีคราบไขมันตีบแคบลง
  const EffectiveRadiusPx = baseRadiusPx * (1 - plaquePercent / 100);

  // 1. วาดผนังหลอดเลือดปกติ
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, canvas.width, centerY - baseRadiusPx);
  ctx.fillRect(0, centerY + baseRadiusPx, canvas.width, canvas.height - (centerY + baseRadiusPx));

  // 2. ถ้าเปิดโหมดตีบ ให้วาดก้อนคราบไขมัน (Plaque) เป็นส่วนโค้งนูนขึ้นมาจากผนังทั้งบนและล่างตรงกลางหลอดเลือด
  if (isAthero && plaquePercent > 0) {
    const plaqueWidth = 150; // ความยาวของก้อนไขมัน
    const startX = (canvas.width - plaqueWidth) / 2;
    const endX = startX + plaqueWidth;
    const plaqueHeight = baseRadiusPx - EffectiveRadiusPx;

    ctx.fillStyle = '#facc15'; // สีเหลืองจำลองคราบไขมัน/คอเลสเตอรอล

    // คราบไขมันผนังบน
    ctx.beginPath();
    ctx.moveTo(startX, centerY - baseRadiusPx);
    ctx.quadraticCurveTo(canvas.width / 2, centerY - EffectiveRadiusPx, endX, centerY - baseRadiusPx);
    ctx.fill();

    // คราบไขมันผนังล่าง
    ctx.beginPath();
    ctx.moveTo(startX, centerY + baseRadiusPx);
    ctx.quadraticCurveTo(canvas.width / 2, centerY + EffectiveRadiusPx, endX, centerY + baseRadiusPx);
    ctx.fill();
  }

  // 3. วาดและอัปเดตเม็ดเลือดแดง (ให้ชะลอความเร็วเมื่อวิ่งผ่านจุดตีบ)
  particles.forEach(p => {
    // เช็กว่าเม็ดเลือดวิ่งอยู่ตรงช่วงคราบไขมันหรือไม่
    const inPlaqueZone = p.x > (canvas.width - 150) / 2 && p.x < (canvas.width + 150) / 2;
    const currentRadius = (isAthero && inPlaqueZone) ? EffectiveRadiusPx : baseRadiusPx;
    
    // ความเร็วชะลอลงตามรัศมีที่ตีบแคบลง
    const localSpeed = Math.max(flowRate * 0.05 * Math.pow(currentRadius / baseRadiusPx, 2), 0.2);
    
    p.update(currentRadius, localSpeed);
    p.draw(ctx, centerY, currentRadius);
  });
}
