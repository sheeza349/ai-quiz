const BACKEND_URL = "https://backend-0c16cd27.fastapicloud.dev";

const setupCard = document.getElementById("setup-card");
const quizCard = document.getElementById("quiz-card");
const resultCard = document.getElementById("result-card");
const loading = document.getElementById("loading");
const setupError = document.getElementById("setup-error");

const topicInput = document.getElementById("topic");
const numQuestionsSelect = document.getElementById("num-questions");
const difficultySelect = document.getElementById("difficulty");
const generateBtn = document.getElementById("generate-btn");

const quizTopicTitle = document.getElementById("quiz-topic-title");
const progressEl = document.getElementById("progress");
const questionContainer = document.getElementById("question-container");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const submitBtn = document.getElementById("submit-btn");

const scoreText = document.getElementById("score-text");
const reviewContainer = document.getElementById("review-container");
const restartBtn = document.getElementById("restart-btn");

let quizData = null;
let currentIndex = 0;
let userAnswers = [];

function showOnly(el) {
  [setupCard, quizCard, resultCard].forEach((c) => (c.hidden = c !== el));
}

generateBtn.addEventListener("click", generateQuiz);
prevBtn.addEventListener("click", () => renderQuestion(currentIndex - 1));
nextBtn.addEventListener("click", () => renderQuestion(currentIndex + 1));
submitBtn.addEventListener("click", showResult);
restartBtn.addEventListener("click", () => {
  quizData = null;
  currentIndex = 0;
  userAnswers = [];
  showOnly(setupCard);
});

async function generateQuiz() {
  const topic = topicInput.value.trim();
  setupError.hidden = true;

  if (!topic) {
    setupError.textContent = "Pehle koi topic likhein.";
    setupError.hidden = false;
    return;
  }

  loading.hidden = false;
  generateBtn.disabled = true;

  try {
    const res = await fetch(`${BACKEND_URL}/api/generate-quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        num_questions: parseInt(numQuestionsSelect.value, 10),
        difficulty: difficultySelect.value,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || `Server error (${res.status})`);
    }

    quizData = await res.json();
    userAnswers = new Array(quizData.questions.length).fill(null);
    currentIndex = 0;
    quizTopicTitle.textContent = quizData.topic;
    showOnly(quizCard);
    renderQuestion(0);
  } catch (err) {
    setupError.textContent = "Quiz nahi ban saka: " + err.message;
    setupError.hidden = false;
  } finally {
    loading.hidden = true;
    generateBtn.disabled = false;
  }
}

function renderQuestion(index) {
  if (!quizData) return;
  currentIndex = Math.max(0, Math.min(index, quizData.questions.length - 1));

  const q = quizData.questions[currentIndex];
  progressEl.textContent = `${currentIndex + 1} / ${quizData.questions.length}`;

  const block = document.createElement("div");
  block.className = "question-block";

  const qText = document.createElement("div");
  qText.className = "q-text";
  qText.textContent = q.question;
  block.appendChild(qText);

  q.options.forEach((opt, i) => {
    const label = document.createElement("label");
    label.className = "option" + (userAnswers[currentIndex] === i ? " selected" : "");
    label.innerHTML = `<input type="radio" name="opt" ${
      userAnswers[currentIndex] === i ? "checked" : ""
    } /> ${escapeHtml(opt)}`;
    label.addEventListener("click", () => {
      userAnswers[currentIndex] = i;
      renderQuestion(currentIndex);
    });
    block.appendChild(label);
  });

  questionContainer.innerHTML = "";
  questionContainer.appendChild(block);

  prevBtn.hidden = currentIndex === 0;
  const isLast = currentIndex === quizData.questions.length - 1;
  nextBtn.hidden = isLast;
  submitBtn.hidden = !isLast;
}

function showResult() {
  let score = 0;
  reviewContainer.innerHTML = "";

  quizData.questions.forEach((q, i) => {
    const isCorrect = userAnswers[i] === q.correct_index;
    if (isCorrect) score++;

    const item = document.createElement("div");
    item.className = "review-item";
    item.innerHTML = `
      <div class="q-text">${i + 1}. ${escapeHtml(q.question)}</div>
      <div class="${isCorrect ? "correct-answer" : "your-answer"}">
        Aapka jawab: ${userAnswers[i] !== null ? escapeHtml(q.options[userAnswers[i]]) : "Skip kiya"}
      </div>
      ${!isCorrect ? `<div class="correct-answer">Sahi jawab: ${escapeHtml(q.options[q.correct_index])}</div>` : ""}
      ${q.explanation ? `<div class="explanation">${escapeHtml(q.explanation)}</div>` : ""}
    `;
    reviewContainer.appendChild(item);
  });

  scoreText.textContent = `${score} / ${quizData.questions.length} sahi jawab 🎉`;
  showOnly(resultCard);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
