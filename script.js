const TOTAL = 80;

let completed = new Set();
let db, doc, getDoc, setDoc, onSnapshot;

// 파이어베이스 모듈이 로드될 때까지 잠시 기다렸다가 실행
function initFirebase() {
  if (window.db && window.firebaseModules) {
    db = window.db;
    const modules = window.firebaseModules;
    doc = modules.doc;
    getDoc = modules.getDoc;
    setDoc = modules.setDoc;
    onSnapshot = modules.onSnapshot;

    setupRealtimeSync();
  } else {
    setTimeout(initFirebase, 100);
  }
}

const grid = document.getElementById("grid");

for (let i = 0; i < TOTAL; i++) {
  const star = document.createElement("button");
  star.className = "star";
  star.textContent = "☆";
  star.setAttribute("aria-label", `${i + 1}번째 별`);
  star.addEventListener("click", () => toggleStar(i));
  grid.appendChild(star);
}

// 실시간으로 파이어베이스 데이터와 동기화
function setupRealtimeSync() {
  const docRef = doc(db, "stars", "progressData");

  // 실시간 감지 (폰이나 컴퓨터 어디서든 누르면 즉시 반영됨)
  onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data().completed;
      if (Array.isArray(data)) {
        completed = new Set(data);
        update();
      }
    } else {
      // 문서가 아직 없으면 초기 생성
      save();
    }
  });
}

async function save() {
  if (!db) {
    console.log("❌ 데이터베이스(db) 객체가 연결되지 않았습니다!");
    return;
  }
  try {
    console.log("🔄 파이어베이스에 저장 시도 중...");
    const docRef = doc(db, "stars", "progressData");
    await setDoc(docRef, { completed: [...completed] });
    console.log("✅ 파이어베이스에 성공적으로 저장됨!");
  } catch (e) {
    console.error("❌ 저장 중 에러 발생:", e);
  }
}

function update() {
  document.querySelectorAll(".star").forEach((star, i) => {
    const done = completed.has(i);
    star.classList.toggle("done", done);
    star.textContent = done ? "★" : "☆";
  });

  document.getElementById("count").textContent = completed.size;
  document.getElementById("fill").style.width =
    (completed.size / TOTAL * 100) + "%";
}

function toggleStar(i) {
  const wasComplete = completed.size === TOTAL;

  if (completed.has(i)) {
    completed.delete(i);
  } else {
    completed.add(i);
  }

  save();
  update();

  if (!wasComplete && completed.size === TOTAL) {
    celebrate();
  }
}

// 백업 파일 다운로드 (여전히 로컬 백업용으로 유지)
function backup() {
  const data = JSON.stringify([...completed], null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "heaven80-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

// 백업 파일 불러오기
document.getElementById("restoreFile").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data)) throw new Error("형식 오류");

    completed = new Set(data.filter(n => Number.isInteger(n) && n >= 0 && n < TOTAL));
    await save();
    update();
    alert("백업을 불러왔습니다.");

    if (completed.size === TOTAL) celebrate();
  } catch (err) {
    alert("올바른 백업 JSON 파일이 아닙니다.");
  }
  e.target.value = "";
});

async function resetProgress() {
  if (!confirm("모든 진행 상황을 초기화할까요?")) return;
  completed.clear();
  await save();
  update();
}

function celebrate() {
  document.getElementById("celebration").style.display = "flex";
  startFireworks();
}

function closeCelebration() {
  document.getElementById("celebration").style.display = "none";
  stopFireworks();
}

document.getElementById("backupBtn").addEventListener("click", backup);
document.getElementById("restoreBtn").addEventListener("click", () => document.getElementById("restoreFile").click());
document.getElementById("resetBtn").addEventListener("click", resetProgress);
document.getElementById("closeCelebration").addEventListener("click", closeCelebration);

// 불꽃놀이 효과 코드
const canvas = document.getElementById("fireworks");
const ctx = canvas.getContext("2d");
let particles = [];
let animationId;
let lastBurst = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function burst() {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height * 0.65;
  const colors = ["#ffe58a", "#ff9ed2", "#9eeaff", "#ffffff"];

  for (let i = 0; i < 65; i++) {
    const angle = Math.PI * 2 * i / 65;
    const speed = Math.random() * 4 + 1;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 90,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

function animate(time) {
  animationId = requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (time - lastBurst > 650) {
    burst();
    lastBurst = time;
  }

  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.025;
    p.life--;

    ctx.globalAlpha = p.life / 90;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function startFireworks() {
  stopFireworks();
  particles = [];
  lastBurst = 0;
  animationId = requestAnimationFrame(animate);
}

function stopFireworks() {
  if (animationId) cancelAnimationFrame(animationId);
  animationId = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 실행 시작
initFirebase();
