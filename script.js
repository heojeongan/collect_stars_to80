// 파이어베이스 공식 CDN 모듈 직접 임포트
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCGp9lweDMFJfzK9fk2atWyyYrR_YloeEM",
  authDomain: "collect-stars-d06bc.firebaseapp.com",
  projectId: "collect-stars-d06bc",
  storageBucket: "collect-stars-d06bc.firebasestorage.app",
  messagingSenderId: "584449062456",
  appId: "1:584449062456:web:391778c5a62537bd9bd8cd",
  measurementId: "G-L8C53QKJ6Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const TOTAL = 80;
let completed = new Set();

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

  onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data().completed;
      if (Array.isArray(data)) {
        completed = new Set(data);
        update();
      }
    } else {
      save();
    }
  });
}

async function save() {
  if (!db) return;
  try {
    const docRef = doc(db, "stars", "progressData");
    await setDoc(docRef, { completed: [...completed] });
  } catch (e) {
    console.error("저장 실패:", e);
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

// 백업 파일 다운로드
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
