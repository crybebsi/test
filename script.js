const startButton = document.getElementById("start-ar-button");
const arScene = document.getElementById("ar-scene");
const questionText = document.getElementById("ar-question");
const answersContainer = document.getElementById("ar-answers");
const timerBar = document.getElementById("ar-timer-bar");
const progressText = document.getElementById("question-progress");
const resultScreen = document.getElementById("result-screen");
const resultText = document.getElementById("result-text");

const sounds = {
  correct: document.getElementById("sound-correct"),
  wrong: document.getElementById("sound-wrong"),
};

let currentQuestion = 0, correctAnswers = 0, timerInterval, timerStart;
const totalTime = 10000;

const quizData = [
  // Leicht
  {
    question: "Was bedeutet das Wort 'Dinosaurier'?",
    answers: ["Riesenechse", "Urzeitmonster", "Schuppentier", "Knochenläufer"],
    correctIndex: 0
  },
  {
    question: "Woraus schlüpften Dinosaurier?",
    answers: ["Steine", "Eier", "Bäume", "Kristalle"],
    correctIndex: 1
  },
  {
    question: "Welcher Dino hatte drei Hörner im Gesicht?",
    answers: ["T-Rex", "Triceratops", "Brachiosaurus", "Velociraptor"],
    correctIndex: 1
  },
  // Mittel
  {
    question: "Wie haben Dinosaurier vermutlich kommuniziert?",
    answers: ["Durch Singen wie Vögel", "Durch Brüllen und Körperbewegungen", "Durch Schreiben auf Steinen", "Durch Rauchzeichen"],
    correctIndex: 1
  },
  {
    question: "In welcher Zeit lebten die meisten Dinosaurier?",
    answers: ["Mittelalter", "Tertiär", "Kreidezeit", "Quartär"],
    correctIndex: 2
  },
  {
    question: "Wie nennt man Forscher, die sich mit Dinos beschäftigen?",
    answers: ["Dinoologen", "Architekten", "Paläontologen", "Terraristen"],
    correctIndex: 2
  },
  // Schwer
  {
    question: "Welcher dieser Dinosaurier war ein Pflanzenfresser?",
    answers: ["Velociraptor", "Stegosaurus", "Tyrannosaurus Rex", "Spinosaurus"],
    correctIndex: 1
  },
  {
    question: "Wo wurden die meisten Dinosaurier-Fossilien gefunden?",
    answers: ["Europa", "Nordamerika", "Afrika", "Australien"],
    correctIndex: 1
  },
  {
    question: "Warum starben die Dinosaurier vermutlich aus?",
    answers: ["Ein Virus", "Ein Meteoriteneinschlag", "Dinosaurier-Krieg", "Mangel an Wasser"],
    correctIndex: 1
  },
  {
    question: "Welches heutige Tier ist mit Dinos verwandt?",
    answers: ["Krokodil", "Chamäleon", "Huhn", "Schlange"],
    correctIndex: 2
  }
];

const dinoImages = [
  "dino_bebis/bebi_1.png",
  "dino_bebis/bebi_2.png",
  "dino_bebis/bebi_3.png",
  "dino_bebis/bebi_4.png",
  "dino_bebis/bebi_5.png",
  "dino_bebis/bebi_6.png",
  "dino_bebis/bebi_7.png",
  "dino_bebis/bebi_8.png",
  "dino_bebis/bebi_9.png",
  "dino_bebis/bebi_10.png"
];

let lastDinoIndex = -1; // -1 bedeutet: noch keiner gezeigt
let shuffledDinoImages = [];

function getNextDinoIndex() {
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * dinoImages.length);
  } while (newIndex === lastDinoIndex);
  lastDinoIndex = newIndex;
  return newIndex;
}

startButton.addEventListener("click", () => {
  // Fixiere die aktuelle Bildschirmorientierung
  if (screen.orientation && screen.orientation.lock) {
    const currentOrientation = screen.orientation.type.startsWith('landscape') ? 'landscape' : 'portrait';
    screen.orientation.lock(currentOrientation).catch(() => {
      console.warn("Bildschirmorientierung konnte nicht fixiert werden.");
    });
  }

  // Zeige die AR-Szene an und verstecke den Startbildschirm
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("ar-scene").style.display = "block";

  // Mische die Dino-Liste
  shuffledDinoImages = shuffle([...dinoImages]);

  // Audio vorbereiten durch leises Abspielen + sofort pausieren
  Object.values(sounds).forEach(audio => {
    const originalVolume = audio.volume;
    audio.volume = 0;
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = originalVolume;
    }).catch(() => {});
  });

  loadQuestion();
});

let answerSelected = false; // Neue Variable, um Mehrfachauswahl zu verhindern
let hoverTimer = null;

function loadQuestion() {
  clearInterval(timerInterval);
  answerSelected = false; // Zurücksetzen für die neue Frage
  const current = quizData[currentQuestion];
  shuffleAnswers(current);
  setupProgress();
  setupQuestionText(current.question);
  setupAnswers(current.answers);
  startTimer();
}

function setupProgress() {
  progressText.setAttribute("troika-text", {
    value: `Frage ${currentQuestion + 1} von ${quizData.length}`,
    align: "right",
    fontSize: 0.06,     // kleinerer Fortschrittstext
    maxWidth: 1.2,
    color: "#333"
  });
}

function setupQuestionText(text) {
  questionText.setAttribute("troika-text", {
    value: text,
    align: "center",
    fontSize: 0.08,     // vorher 0.1
    maxWidth: 2.0       // kleiner für kompakteren Text
  });
}

function setupAnswers(answers) {
  answersContainer.innerHTML = "";
  const spacing = 0.35; // vorher 0.5
  const startY = 0.4;   // vorher 0.6
  answers.forEach((a, i) => {
    const group = document.createElement("a-entity");
    const y = startY - i * spacing;

    // Hintergrund für die Antwort
    const bg = document.createElement("a-plane");
    bg.setAttribute("position", `0 ${y} 0`);
    bg.classList.add("answer-block");
    bg.setAttribute("width", "1.2"); // vorher 1.8
    bg.setAttribute("height", "0.3"); // vorher 0.4

    // Text für die Antwort
    const text = document.createElement("a-entity");
    text.setAttribute("troika-text", {
      value: a,
      align: "center",
      color: "#1b5e20",
      fontSize: 0.075,     // vorher 0.1
      maxWidth: 1.1        // vorher 1.6
    });
    text.setAttribute("position", `0 ${y} 0.01`);

    group.append(bg, text);
    answersContainer.append(group);

    bg.addEventListener("mouseenter", () => {
      if (answerSelected) return;

      // Highlight die Antwort
      bg.setAttribute("color", "#ffeb3b");

      // Starte den Timer für die automatische Auswahl
      hoverTimer = setTimeout(() => {
        if (!answerSelected) {
          selectAnswer(i); // Antwort wird nach 1.5 Sekunden ausgewählt
        }
      }, 1500);
    });

    bg.addEventListener("mouseleave", () => {
      if (answerSelected) return;

      // Entferne das Highlight
      bg.setAttribute("color", "#ffffff");

      // Stoppe den Timer, wenn der Cursor die Antwort verlässt
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    });
  });

  const timerY = startY - answers.length * spacing - 0.3;
  timerBar.setAttribute("position", `0 ${timerY} -2`);
  timerBar.setAttribute("width", "1.2");     // vorher 1.8
  timerBar.setAttribute("height", "0.03");   // vorher 0.05
  timerBar.setAttribute("scale", "1 1 1");
  timerBar.setAttribute("material", "color: #8bc34a");
}

function startTimer() {
  timerStart = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - timerStart;
    const prog = 1 - elapsed / totalTime;
    timerBar.setAttribute("scale", `${Math.max(prog, 0)} 1 1`);
    if (elapsed >= totalTime) {
      // Wenn der Timer abläuft, wird automatisch eine falsche Antwort eingeloggt
      selectAnswer(null, true);
    } else if (elapsed >= totalTime - 3000) {
      // Timer-Farbe ändern, wenn weniger als 3 Sekunden übrig sind
      timerBar.setAttribute("material", "color: #ff9800");
    }
  }, 50);
}

function selectAnswer(index, timeout = false) {
  if (answerSelected) return;
  answerSelected = true;

  clearInterval(timerInterval);

  const correctIdx = quizData[currentQuestion].correctIndex;
  const isCorrect = index === correctIdx;

  // Sound abspielen
  sounds[isCorrect ? "correct" : "wrong"].play();

  // Antworten einfärben
  Array.from(answersContainer.children).forEach((c, i) => {
    const plane = c.querySelector("a-plane");
    plane.setAttribute("color", i === correctIdx ? "#4caf50" : (i === index ? "#f44336" : "#ccc"));
  });

  if (isCorrect) correctAnswers++;

  // Dino nur bei richtiger Antwort anzeigen
  if (isCorrect) {
    showDino().then(() => {
      answerSelected = false;
      nextStep();
    });
  } else {
    // Bei falscher Antwort oder Timeout direkt weiter
    setTimeout(() => {
      answerSelected = false;
      nextStep();
    }, 2000);
  }
}

function nextStep() {
  currentQuestion++;
  if (currentQuestion < quizData.length) {
    loadQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  arScene.style.display = "none";
  resultScreen.classList.remove("hidden");
  resultText.textContent = `Du hast ${correctAnswers} von ${quizData.length} Fragen richtig beantwortet.`;
  document.getElementById("restart-button").classList.remove("hidden");
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function shuffleAnswers(q) {
  const correct = q.answers[q.correctIndex];
  q.answers = shuffle(q.answers);
  q.correctIndex = q.answers.indexOf(correct);
}

let lastDinoShownIndex = -1;
let currentDinoEl = null;
let dinoTimeout = null;

async function showDino() {
  const dino = document.getElementById("ar-dino");

  // Wähle Dino basierend auf der aktuellen Frage
  const dinoUrl = shuffledDinoImages[currentQuestion];
  dino.setAttribute("material", `src: ${dinoUrl}; transparent: true; alphaTest: 0.5`);

  // Positionierung vor dem Blickfeld
  const camera = document.querySelector("a-camera");
  const camObj = camera.getObject3D("camera");
  const camPos = new THREE.Vector3();
  const camDir = new THREE.Vector3();

  camObj.getWorldPosition(camPos);
  camObj.getWorldDirection(camDir);
  const spawnPos = camPos.clone().add(camDir.multiplyScalar(1.5));

  dino.setAttribute("position", `${spawnPos.x} ${spawnPos.y} ${spawnPos.z}`);
  dino.setAttribute("scale", "0.5 0.5 0.5");
  dino.setAttribute("look-at", "[camera]");
  dino.setAttribute("visible", true);

  // Sanft einblenden
  await fadeInDino(dino);

  // 2 Sekunden warten
  await new Promise(r => setTimeout(r, 2000));

  // Sanft ausblenden
  await fadeOutDino(dino);

  dino.setAttribute("visible", false);
}

function fadeInDino(dino) {
  return new Promise(resolve => {
    let opacity = 0;
    const fadeIn = () => {
      opacity += 0.05;
      if (opacity >= 1) {
        dino.setAttribute("material", "opacity", 1);
        resolve();
      } else {
        dino.setAttribute("material", "opacity", opacity);
        requestAnimationFrame(fadeIn);
      }
    };
    fadeIn();
  });
}

function fadeOutDino(dino) {
  return new Promise(resolve => {
    let opacity = 1;
    const fadeOut = () => {
      opacity -= 0.05;
      if (opacity <= 0) {
        dino.setAttribute("material", "opacity", 0);
        resolve();
      } else {
        dino.setAttribute("material", "opacity", opacity);
        requestAnimationFrame(fadeOut);
      }
    };
    fadeOut();
  });
}