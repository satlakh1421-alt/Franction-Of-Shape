/**
 * ============================================================================
 * FRACTION LAB: SHAPE SHIFTER - SCRIPT
 * Cambridge Maths: "Fraction of Shape" - Estimating and Rounding (Floor 1)
 * Platform Standard: Root DOM Access, Canvas Graphics, WebAudio Synth, rAF Loop
 * ============================================================================
 */

(() => {
  'use strict';

  // --- PLATFORM ROOT DOM ACCESS ---
  const rootNode = typeof root !== 'undefined' ? root : document;
  const $ = (id) => (rootNode.getElementById ? rootNode.getElementById(id) : rootNode.querySelector('#' + id));
  const $$ = (sel) => rootNode.querySelectorAll(sel);

  // --- AUDIO SYNTHESIZER & BGM SYSTEM (WebAudio, zero external files) ---
  let audioCtx = null;
  let isMuted = false;
  let isAudioUnlocked = false;
  let bgmStep = 0;
  let bgmInterval = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (audioCtx && audioCtx.state === 'running') {
      isAudioUnlocked = true;
    }
  }

  // Global user gesture unlock listener
  function unlockAudio() {
    initAudio();
    if (audioCtx && audioCtx.state === 'running' && !isMuted && !bgmInterval) {
      startBgm();
    }
  }
  ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(ev => {
    window.addEventListener(ev, unlockAudio, { passive: true });
    document.addEventListener(ev, unlockAudio, { passive: true });
  });

  function playTone(freq, durationMs, type = 'sine', vol = 0.22, delaySec = 0) {
    if (isMuted) return;
    initAudio();
    if (!audioCtx || audioCtx.state !== 'running') return;
    try {
      const t = audioCtx.currentTime + delaySec;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(t);
      osc.stop(t + durationMs / 1000);
    } catch (e) {}
  }

  function sfxTap() {
    initAudio();
    playTone(587.33, 45, 'triangle', 0.18);
  }

  function sfxCorrect(streak = 0) {
    initAudio();
    const base = 523.25 + Math.min(streak * 30, 240); // C5 upwards
    playTone(base, 90, 'sine', 0.25, 0);
    playTone(base * 1.2599, 100, 'sine', 0.25, 0.08); // Major 3rd (E5)
    playTone(base * 1.4983, 140, 'triangle', 0.28, 0.16); // 5th (G5)
    playTone(base * 2.0, 200, 'sine', 0.30, 0.24); // Octave (C6)
  }

  function sfxWrong() {
    initAudio();
    playTone(260, 110, 'sawtooth', 0.20, 0);
    playTone(196, 160, 'sawtooth', 0.22, 0.08);
    playTone(146.8, 220, 'triangle', 0.24, 0.16);
  }

  function sfxLevelUp() {
    initAudio();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      playTone(freq, 120, 'triangle', 0.25, idx * 0.09);
    });
  }

  function sfxStar(index) {
    initAudio();
    const notes = [659.25, 783.99, 1046.5];
    const n = notes[index] || 880;
    playTone(n, 200, 'sine', 0.3, 0);
    playTone(n * 1.5, 260, 'triangle', 0.25, 0.08);
  }

  function sfxPourTick() {
    initAudio();
    playTone(380 + Math.random() * 260, 35, 'sine', 0.08);
  }

  // --- PROCEDURAL BGM ENGINE (Happy, Energetic Math Theme) ---
  const BGM_MELODY = [
    523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 523.25, 392.00,
    440.00, 523.25, 659.25, 523.25, 587.33, 493.88, 523.25, 0,
    659.25, 783.99, 880.00, 783.99, 659.25, 587.33, 523.25, 440.00,
    523.25, 587.33, 659.25, 783.99, 880.00, 783.99, 1046.5, 0
  ];
  const BGM_BASS = [
    130.81, 0, 130.81, 0, 174.61, 0, 174.61, 0,
    196.00, 0, 196.00, 0, 130.81, 0, 130.81, 0,
    130.81, 0, 130.81, 0, 174.61, 0, 174.61, 0,
    196.00, 0, 196.00, 0, 130.81, 0, 261.63, 0
  ];

  function startBgm() {
    if (bgmInterval) return;
    initAudio();
    bgmStep = 0;
    bgmInterval = setInterval(() => {
      if (isMuted || !audioCtx || audioCtx.state !== 'running') return;
      const mNote = BGM_MELODY[bgmStep % BGM_MELODY.length];
      const bNote = BGM_BASS[bgmStep % BGM_BASS.length];

      if (mNote > 0) {
        playTone(mNote, 130, 'sine', 0.08);
      }
      if (bNote > 0) {
        playTone(bNote, 160, 'triangle', 0.09);
      }
      bgmStep++;
    }, 220);
  }

  function stopBgm() {
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
  }

  function toggleMute() {
    initAudio();
    isMuted = !isMuted;
    const iconEl = $('sound-icon');
    if (iconEl) {
      iconEl.textContent = isMuted ? '🔇' : '🔊';
    }
    if (isMuted) {
      stopBgm();
    } else {
      startBgm();
    }
  }

  // --- FULLSCREEN CONTROLS ---
  function toggleFullscreen() {
    initAudio();
    sfxTap();
    const doc = document;
    const container = $('game-container') || doc.documentElement;
    const isFull = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

    if (!isFull) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  }

  function updateFullscreenIcon() {
    const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    const icon = $('fullscreen-icon');
    if (icon) {
      icon.textContent = isFull ? '🗗' : '⛶';
    }
    const btn = $('btn-fullscreen-toggle');
    if (btn) {
      btn.title = isFull ? 'Exit Full Screen' : 'Full Screen';
    }
  }

  // --- GAME CONFIG & STATE ---
  const MAX_CONFIG_POINTS = (typeof game !== 'undefined' && game.config && game.config.maxPoints) ? game.config.maxPoints : 100;
  const GAME_DURATION_SEC = 60;

  const state = {
    screen: 'start',
    running: false,
    pausedForFeedback: false,
    startMs: 0,
    timeRemaining: GAME_DURATION_SEC,
    score: 0,
    correctCount: 0,
    totalAttempted: 0,
    streak: 0,
    maxStreak: 0,
    lives: 3,
    level: 1,
    currentQuestion: null,
    currentPourVal: 0.5,
    isDraggingSlider: false,
    particles: [],
    endCalled: false
  };

  // --- BENCHMARK FRACTION DEFINITIONS ---
  const FRACTIONS = [
    { label: '0', val: 0, name: 'Zero' },
    { label: '¼', val: 0.25, name: 'One Quarter' },
    { label: '⅓', val: 0.333, name: 'One Third' },
    { label: '½', val: 0.5, name: 'One Half' },
    { label: '⅔', val: 0.667, name: 'Two Thirds' },
    { label: '¾', val: 0.75, name: 'Three Quarters' },
    { label: '1', val: 1, name: 'One Whole' }
  ];

  // --- QUESTIONS & LEVEL GENERATOR ---
  function generateQuestion(level) {
    const shapeTypes = ['flask', 'circle', 'rectangle', 'gem'];
    const chosenShape = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];

    if (level === 1) {
      // Level 1: Halves & Wholes (0, 1/2, 1) + 1/4 introduction
      const targets = [
        { actualFill: 0.03, targetFrac: FRACTIONS[0], prompt: 'Estimate the shaded fraction:' },
        { actualFill: 0.48, targetFrac: FRACTIONS[3], prompt: 'Estimate the shaded fraction:' },
        { actualFill: 0.52, targetFrac: FRACTIONS[3], prompt: 'Estimate the shaded fraction:' },
        { actualFill: 0.96, targetFrac: FRACTIONS[6], prompt: 'Estimate the shaded fraction:' },
        { actualFill: 0.26, targetFrac: FRACTIONS[1], prompt: 'Estimate the shaded fraction:' }
      ];
      const t = targets[Math.floor(Math.random() * targets.length)];
      const choices = [FRACTIONS[0], FRACTIONS[1], FRACTIONS[3], FRACTIONS[6]];
      return {
        mode: 'choice',
        level: 1,
        badge: 'Level 1: Halves & Wholes',
        shape: chosenShape,
        fill: t.actualFill,
        correct: t.targetFrac,
        choices: shuffle(choices),
        prompt: t.prompt,
        explanation: `The shape is about ${Math.round(t.actualFill * 100)}% filled, which is closest to ${t.targetFrac.label} (${t.targetFrac.name}).`
      };
    } else if (level === 2) {
      // Level 2: Quarters & Thirds (1/4, 1/3, 1/2, 2/3, 3/4)
      const targets = [
        { actualFill: 0.24, targetFrac: FRACTIONS[1], prompt: 'Which benchmark fraction is this closest to?' },
        { actualFill: 0.76, targetFrac: FRACTIONS[5], prompt: 'Which benchmark fraction is this closest to?' },
        { actualFill: 0.34, targetFrac: FRACTIONS[2], prompt: 'Estimate the shaded potion volume:' },
        { actualFill: 0.68, targetFrac: FRACTIONS[4], prompt: 'Estimate the shaded potion volume:' },
        { actualFill: 0.51, targetFrac: FRACTIONS[3], prompt: 'Which benchmark fraction is this closest to?' }
      ];
      const t = targets[Math.floor(Math.random() * targets.length)];
      // Pick 4 realistic options
      const distPool = FRACTIONS.filter(f => f.val !== t.targetFrac.val);
      const chosenDist = shuffle(distPool).slice(0, 3);
      const choices = shuffle([t.targetFrac, ...chosenDist]);

      return {
        mode: 'choice',
        level: 2,
        badge: 'Level 2: Quarters & Thirds',
        shape: chosenShape,
        fill: t.actualFill,
        correct: t.targetFrac,
        choices: choices,
        prompt: t.prompt,
        explanation: `With ~${Math.round(t.actualFill * 100)}% shaded, the closest benchmark fraction is ${t.targetFrac.label} (${t.targetFrac.name}).`
      };
    } else if (level === 3) {
      // Level 3: Active Pour / Slider Construction!
      const targets = [
        { targetFrac: FRACTIONS[3], label: '½ (Half)', fillGoal: 0.5 },
        { targetFrac: FRACTIONS[1], label: '¼ (One Quarter)', fillGoal: 0.25 },
        { targetFrac: FRACTIONS[5], label: '¾ (Three Quarters)', fillGoal: 0.75 },
        { targetFrac: FRACTIONS[4], label: '⅔ (Two Thirds)', fillGoal: 0.667 }
      ];
      const t = targets[Math.floor(Math.random() * targets.length)];
      return {
        mode: 'slider',
        level: 3,
        badge: 'Level 3: Potion Crafter (Pour & Estimate)',
        shape: 'flask',
        targetGoal: t.fillGoal,
        targetLabel: t.label,
        prompt: `Drag the slider to pour about ${t.label} of magic potion!`,
        explanation: `Goal was ${t.label} (~${Math.round(t.fillGoal * 100)}%). Remember the benchmark lines!`
      };
    } else {
      // Level 4 / Endless: Rounding Nearest Benchmark Challenge
      const randomPct = Math.floor(Math.random() * 85) + 8; // 8% to 92%
      const actualFill = randomPct / 100;
      // Find closest benchmark from [1/4, 1/2, 3/4, 1]
      const benchmarks = [FRACTIONS[0], FRACTIONS[1], FRACTIONS[3], FRACTIONS[5], FRACTIONS[6]];
      let closest = benchmarks[0];
      let minDiff = 999;
      benchmarks.forEach(b => {
        const diff = Math.abs(b.val - actualFill);
        if (diff < minDiff) {
          minDiff = diff;
          closest = b;
        }
      });

      const choices = shuffle([
        closest,
        ...shuffle(benchmarks.filter(b => b.val !== closest.val)).slice(0, 3)
      ]);

      return {
        mode: 'choice',
        level: 4,
        badge: 'Level 4: Master Rounding',
        shape: chosenShape,
        fill: actualFill,
        correct: closest,
        choices: choices,
        prompt: `This shape is ${randomPct}% filled. Round to nearest fraction:`,
        explanation: `${randomPct}% rounds to ${closest.label} (${closest.name}) because it is closest to it!`
      };
    }
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // --- SCREEN NAVIGATION SYSTEM ---
  function showScreen(screenId) {
    state.screen = screenId;
    $$('.screen').forEach(s => s.classList.remove('active'));
    const target = $(`screen-${screenId}`);
    if (target) target.classList.add('active');
  }

  // --- START SCREEN BANNER ANIMATION ---
  let startCanvasAnim = null;
  function initStartCanvas() {
    const canvas = $('canvas-start-preview');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    function renderStart() {
      if (state.screen !== 'start') return;
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 10;
      const t = frame * 0.04;

      // Glow circle background
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 70);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 70, 0, Math.PI * 2);
      ctx.fill();

      // Draw mini flask
      drawFlask(ctx, cx, cy - 10, 110, 100, 0.5 + Math.sin(t) * 0.2, '#38bdf8', true);

      // Sparkles
      for (let i = 0; i < 3; i++) {
        const sx = cx + Math.sin(t + i * 2) * 55;
        const sy = cy + Math.cos(t + i * 2) * 35;
        ctx.fillStyle = '#fbbf24';
        ctx.font = '14px sans-serif';
        ctx.fillText('✨', sx - 7, sy);
      }

      startCanvasAnim = requestAnimationFrame(renderStart);
    }

    if (startCanvasAnim) cancelAnimationFrame(startCanvasAnim);
    startCanvasAnim = requestAnimationFrame(renderStart);
  }

  // --- COUNTDOWN & GAME LAUNCH ---
  function triggerCountdown() {
    initAudio();
    sfxTap();

    // Auto-enter fullscreen on Play tap if supported
    const isFull = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    if (!isFull) {
      const container = $('game-container') || document.documentElement;
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
    }

    showScreen('countdown');
    const numEl = $('countdown-number');
    let count = 3;
    numEl.textContent = count;
    playTone(440, 120, 'sine', 0.2);

    const startTs = Date.now();
    function tickCountdown() {
      const elapsed = Math.floor((Date.now() - startTs) / 1000);
      const remaining = 3 - elapsed;
      if (remaining <= 0) {
        playTone(880, 250, 'triangle', 0.25);
        startGame();
        return;
      }
      if (remaining !== count) {
        count = remaining;
        numEl.textContent = count;
        playTone(440, 120, 'sine', 0.2);
      }
      requestAnimationFrame(tickCountdown);
    }
    requestAnimationFrame(tickCountdown);
  }

  // --- GAME START & RESET ---
  function startGame() {
    state.running = true;
    state.pausedForFeedback = false;
    state.startMs = Date.now();
    state.timeRemaining = GAME_DURATION_SEC;
    state.score = 0;
    state.correctCount = 0;
    state.totalAttempted = 0;
    state.streak = 0;
    state.maxStreak = 0;
    state.lives = 3;
    state.level = 1;
    state.particles = [];
    state.endCalled = false;

    showScreen('game');
    updateHud();
    showLevelBanner('Level 1: Halves & Wholes!');
    loadNewQuestion();

    if (!isMuted) {
      startBgm();
    }

    requestAnimationFrame(gameLoop);
  }

  function showLevelBanner(text) {
    const banner = $('level-banner');
    const textEl = $('level-banner-text');
    if (banner && textEl) {
      textEl.textContent = text;
      banner.classList.add('show');
      setTimeout(() => {
        banner.classList.remove('show');
      }, 2000);
    }
  }

  // --- QUESTION MANAGEMENT ---
  function loadNewQuestion() {
    state.currentQuestion = generateQuestion(state.level);
    const q = state.currentQuestion;

    $('question-badge').textContent = q.badge;
    $('question-text').textContent = q.prompt;

    const choiceGrid = $('choice-buttons-grid');
    const sliderZone = $('slider-control-zone');

    if (q.mode === 'choice') {
      choiceGrid.style.display = 'grid';
      sliderZone.style.display = 'none';
      renderChoiceButtons(q.choices);
    } else {
      choiceGrid.style.display = 'none';
      sliderZone.style.display = 'flex';
      setupSliderQuestion(q);
    }
  }

  // Helper for 100% reliable click/touch response without double firing
  function addBtnListener(el, callback) {
    if (!el) return;
    el.addEventListener('click', (e) => {
      callback(e);
    });
  }

  function renderChoiceButtons(choices) {
    const grid = $('choice-buttons-grid');
    if (!grid) return;
    grid.innerHTML = '';

    choices.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'fraction-choice-btn';
      btn.setAttribute('type', 'button');

      const labelSpan = document.createElement('span');
      labelSpan.className = 'btn-fraction-label';
      labelSpan.textContent = c.label;

      const subSpan = document.createElement('span');
      subSpan.className = 'btn-sub-label';
      subSpan.textContent = c.name;

      btn.appendChild(labelSpan);
      btn.appendChild(subSpan);

      addBtnListener(btn, (e) => {
        handleChoiceAnswer(c, btn);
      });

      grid.appendChild(btn);
    });
  }

  function setupSliderQuestion(q) {
    state.currentPourVal = 0.5;
    updateSliderVisual(0.5);
    const valIndicator = $('slider-val-indicator');
    if (valIndicator) {
      valIndicator.textContent = `50% (½)`;
    }
  }

  // --- ANSWER EVALUATION ---
  function handleChoiceAnswer(chosenFraction, btnElement) {
    if (!state.running || state.pausedForFeedback) return;

    state.totalAttempted++;
    const q = state.currentQuestion;
    const isCorrect = (chosenFraction.val === q.correct.val);

    if (isCorrect) {
      btnElement.classList.add('correct-glow');
      handleSuccess();
    } else {
      btnElement.classList.add('wrong-glow');
      handleFailure(q.explanation);
    }
  }

  function handleSliderSubmit() {
    if (!state.running || state.pausedForFeedback) return;

    state.totalAttempted++;
    const q = state.currentQuestion;
    const diff = Math.abs(state.currentPourVal - q.targetGoal);
    // Allow generous tolerance for Stage 1/Floor 1 (+/- 12%)
    const isCorrect = diff <= 0.14;

    if (isCorrect) {
      handleSuccess();
    } else {
      const explanation = `You poured ~${Math.round(state.currentPourVal * 100)}%. The target ${q.targetLabel} is about ${Math.round(q.targetGoal * 100)}%!`;
      handleFailure(explanation);
    }
  }

  function handleSuccess() {
    state.correctCount++;
    state.streak++;
    if (state.streak > state.maxStreak) {
      state.maxStreak = state.streak;
    }

    // Dynamic scoring: 10 base points + streak bonus + time bonus
    const earnedPoints = 10 + Math.min(state.streak * 2, 10);
    state.score += earnedPoints;
    state.timeRemaining = Math.min(state.timeRemaining + 2, 75); // bonus time

    sfxCorrect(state.streak);
    spawnFloatingFeedback(`+${earnedPoints}`);
    const canvas = $('game-canvas');
    const burstX = canvas ? canvas.width / 2 : 230;
    const burstY = canvas ? canvas.height / 2 : 130;
    createParticleBurst(burstX, burstY, '#10b981');

    updateHud();
    checkLevelProgression();

    // Small delay before next question for pleasant game feel
    setTimeout(() => {
      if (state.running && !state.pausedForFeedback) {
        loadNewQuestion();
      }
    }, 450);
  }

  function handleFailure(explanationText) {
    state.streak = 0;
    state.lives--;
    sfxWrong();
    const canvas = $('game-canvas');
    const burstX = canvas ? canvas.width / 2 : 230;
    const burstY = canvas ? canvas.height / 2 : 130;
    createParticleBurst(burstX, burstY, '#f43f5e');
    updateHud();

    if (state.lives <= 0) {
      finishGame();
      return;
    }

    // Show micro-explanation overlay (Reading is free / Paused)
    state.pausedForFeedback = true;
    const overlay = $('explanation-overlay');
    const textEl = $('explanation-text');
    if (overlay && textEl) {
      textEl.textContent = explanationText || 'Keep an eye on the benchmark fractions!';
      overlay.classList.add('active');
    }
  }

  function dismissExplanation() {
    sfxTap();
    const overlay = $('explanation-overlay');
    if (overlay) overlay.classList.remove('active');
    state.pausedForFeedback = false;
    loadNewQuestion();
  }

  // --- LEVEL ADVANCEMENT ---
  function checkLevelProgression() {
    // Progress level every 3 correct answers up to Level 4, then endless mode
    const oldLevel = state.level;
    if (state.correctCount >= 9) {
      state.level = 4;
    } else if (state.correctCount >= 6) {
      state.level = 3;
    } else if (state.correctCount >= 3) {
      state.level = 2;
    }

    if (state.level > oldLevel) {
      sfxLevelUp();
      const levelNames = [
        '',
        'Level 1: Halves & Wholes',
        'Level 2: Quarters & Thirds!',
        'Level 3: Potion Pouring!',
        'Level 4: Master Rounding!'
      ];
      showLevelBanner(levelNames[state.level] || 'Endless Master Wave!');
    }
  }

  // --- HUD UPDATES ---
  function updateHud() {
    $('hud-score').textContent = state.score;
    $('hud-level-text').textContent = `${state.level}/4`;

    const livesContainer = $('hud-lives');
    if (livesContainer) {
      const hearts = livesContainer.querySelectorAll('.heart');
      hearts.forEach((h, idx) => {
        if (idx < state.lives) {
          h.classList.remove('lost');
        } else {
          h.classList.add('lost');
        }
      });
    }
  }

  // --- GAME LOOP & RAF TIMER ---
  function gameLoop() {
    if (!state.running) return;

    if (!state.pausedForFeedback) {
      // Wall-clock delta timer
      const elapsed = Math.floor((Date.now() - state.startMs) / 1000);
      const remain = Math.max(0, state.timeRemaining - elapsed);
      const timerEl = $('hud-timer');
      if (timerEl) {
        timerEl.textContent = `${remain}s`;
        if (remain <= 10) {
          timerEl.style.color = '#f43f5e';
        } else {
          timerEl.style.color = '#f59e0b';
        }
      }

      if (remain <= 0) {
        finishGame();
        return;
      }
    }

    renderGameCanvas();
    requestAnimationFrame(gameLoop);
  }

  // --- CANVAS RENDERING FOR QUESTION SHAPES ---
  function renderGameCanvas() {
    const canvas = $('game-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const q = state.currentQuestion;
    if (!q) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const fillAmount = (q.mode === 'slider') ? state.currentPourVal : q.fill;
    const minDim = Math.min(canvas.width, canvas.height);

    // Draw chosen shape scaled proportionally
    if (q.shape === 'flask') {
      const fw = Math.min(canvas.width * 0.44, 180);
      const fh = Math.min(canvas.height * 0.72, 190);
      drawFlask(ctx, cx, cy, fw, fh, fillAmount, '#06b6d4', q.mode === 'slider');
    } else if (q.shape === 'circle') {
      const radius = Math.min(minDim * 0.38, 95);
      drawPieShape(ctx, cx, cy, radius, fillAmount);
    } else if (q.shape === 'rectangle') {
      const rw = Math.min(canvas.width * 0.65, 260);
      const rh = Math.min(canvas.height * 0.42, 105);
      drawBarShape(ctx, cx, cy, rw, rh, fillAmount);
    } else if (q.shape === 'gem') {
      const radius = Math.min(minDim * 0.4, 98);
      drawGemShape(ctx, cx, cy, radius, fillAmount);
    }

    // Render particles
    renderParticles(ctx);
  }

  // 1. FLASK / BEAKER DRAWING
  function drawFlask(ctx, x, y, w, h, fillPct, liquidColor = '#38bdf8', isInteractive = false) {
    ctx.save();
    const neckW = w * 0.35;
    const neckH = h * 0.3;
    const bodyW = w * 0.85;
    const topY = y - h / 2;
    const botY = y + h / 2;

    // Path for Flask Outline
    ctx.beginPath();
    ctx.moveTo(x - neckW / 2, topY);
    ctx.lineTo(x + neckW / 2, topY);
    ctx.lineTo(x + neckW / 2, topY + neckH);
    ctx.lineTo(x + bodyW / 2, botY - 12);
    ctx.quadraticCurveTo(x + bodyW / 2, botY, x + bodyW / 2 - 12, botY);
    ctx.lineTo(x - bodyW / 2 + 12, botY);
    ctx.quadraticCurveTo(x - bodyW / 2, botY, x - bodyW / 2, botY - 12);
    ctx.lineTo(x - neckW / 2, topY + neckH);
    ctx.closePath();

    // Background Glass Tint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fill();

    // Clip to Flask for liquid fill
    ctx.save();
    ctx.clip();

    // Liquid fill rectangle
    const liquidH = (h - 10) * Math.max(0, Math.min(1, fillPct));
    const liquidTop = botY - liquidH;

    const grad = ctx.createLinearGradient(0, liquidTop, 0, botY);
    grad.addColorStop(0, liquidColor);
    grad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = grad;
    ctx.fillRect(x - w, liquidTop, w * 2, liquidH + 20);

    // Liquid Surface Wave
    if (fillPct > 0.02) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.ellipse(x, liquidTop, bodyW * 0.45 * Math.min(1, fillPct * 1.5), 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bubbles inside liquid
    if (fillPct > 0.1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      const t = Date.now() * 0.003;
      for (let i = 0; i < 4; i++) {
        const bx = x + Math.sin(t + i * 1.8) * (bodyW * 0.25);
        const by = botY - ((t * 20 + i * 25) % Math.max(10, liquidH - 10));
        ctx.beginPath();
        ctx.arc(bx, by, 3 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Flask Glass Stroke
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Benchmark Measuring Ticks on the Side
    const benchmarks = [
      { p: 0.25, label: '¼' },
      { p: 0.50, label: '½' },
      { p: 0.75, label: '¾' }
    ];
    benchmarks.forEach(bm => {
      const ty = botY - (h - 10) * bm.p;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + bodyW * 0.25, ty);
      ctx.lineTo(x + bodyW * 0.38, ty);
      ctx.stroke();

      if (isInteractive) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(bm.label, x + bodyW * 0.42, ty + 4);
      }
    });

    ctx.restore();
  }

  // 2. PIE / CIRCLE DRAWING
  function drawPieShape(ctx, x, y, radius, fillPct) {
    ctx.save();
    // Unshaded circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Shaded Sector
    if (fillPct > 0) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + fillPct * Math.PI * 2);
      ctx.closePath();
      const grad = ctx.createRadialGradient(x, y, 5, x, y, radius);
      grad.addColorStop(0, '#a855f7');
      grad.addColorStop(1, '#6366f1');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Benchmark Dotted Lines (Quarters)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Vertical line (1/2)
    ctx.moveTo(x, y - radius); ctx.lineTo(x, y + radius);
    // Horizontal line (1/4 & 3/4)
    ctx.moveTo(x - radius, y); ctx.lineTo(x + radius, y);
    ctx.stroke();

    ctx.restore();
  }

  // 3. RECTANGULAR BAR DRAWING
  function drawBarShape(ctx, x, y, w, h, fillPct) {
    ctx.save();
    const rx = x - w / 2;
    const ry = y - h / 2;

    // Outer Container
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.roundRect(rx, ry, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Shaded Fill
    if (fillPct > 0) {
      ctx.save();
      ctx.roundRect(rx, ry, w, h, 12);
      ctx.clip();
      const grad = ctx.createLinearGradient(rx, ry, rx + w, ry);
      grad.addColorStop(0, '#10b981');
      grad.addColorStop(1, '#34d399');
      ctx.fillStyle = grad;
      ctx.fillRect(rx, ry, w * fillPct, h);
      ctx.restore();
    }

    // Grid divider ticks (Quarters)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    [0.25, 0.5, 0.75].forEach(p => {
      ctx.beginPath();
      ctx.moveTo(rx + w * p, ry);
      ctx.lineTo(rx + w * p, ry + h);
      ctx.stroke();
    });

    ctx.restore();
  }

  // 4. GEMSTONE / HEXAGON DRAWING
  function drawGemShape(ctx, x, y, radius, fillPct) {
    ctx.save();
    const sides = 6;
    const points = [];
    for (let i = 0; i < sides; i++) {
      const a = (i * 2 * Math.PI) / sides - Math.PI / 2;
      points.push({ x: x + radius * Math.cos(a), y: y + radius * Math.sin(a) });
    }

    // Outer Hexagon
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < sides; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Shaded Fill clipped to gem
    if (fillPct > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < sides; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.closePath();
      ctx.clip();

      const topY = y - radius;
      const botY = y + radius;
      const fillH = (botY - topY) * fillPct;

      const grad = ctx.createLinearGradient(0, botY - fillH, 0, botY);
      grad.addColorStop(0, '#fbbf24');
      grad.addColorStop(1, '#d97706');
      ctx.fillStyle = grad;
      ctx.fillRect(x - radius, botY - fillH, radius * 2, fillH);
      ctx.restore();
    }

    // Midline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x - radius, y);
    ctx.lineTo(x + radius, y);
    ctx.stroke();

    ctx.restore();
  }

  // --- PARTICLE SYSTEM ---
  function createParticleBurst(x, y, color) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.2;
      const speed = 2 + Math.random() * 4;
      state.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: color,
        size: 3 + Math.random() * 4
      });
    }
  }

  function renderParticles(ctx) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity
      p.life -= 0.03;

      if (p.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function spawnFloatingFeedback(text) {
    const layer = $('feedback-layer');
    if (!layer) return;
    const tag = document.createElement('div');
    tag.className = 'float-score-tag';
    tag.textContent = text;
    tag.style.left = '50%';
    tag.style.top = '40%';
    tag.style.transform = 'translate(-50%, -50%)';
    layer.appendChild(tag);
    setTimeout(() => {
      tag.remove();
    }, 900);
  }

  // --- SLIDER INTERACTIVE CONTROLS (TOUCH + POINTER) ---
  function setupSliderEvents() {
    const track = $('slider-track');
    if (!track) return;

    function handlePointer(e) {
      const rect = track.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      let pct = (clientX - rect.left) / rect.width;
      pct = Math.max(0, Math.min(1, pct));
      state.currentPourVal = pct;
      updateSliderVisual(pct);
      sfxPourTick();
    }

    track.addEventListener('pointerdown', (e) => {
      state.isDraggingSlider = true;
      track.setPointerCapture(e.pointerId);
      handlePointer(e);
    });

    track.addEventListener('pointermove', (e) => {
      if (state.isDraggingSlider) {
        handlePointer(e);
      }
    });

    const endDrag = (e) => {
      if (state.isDraggingSlider) {
        state.isDraggingSlider = false;
        try { track.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    };

    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    const submitBtn = $('btn-submit-pour');
    if (submitBtn) {
      submitBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        handleSliderSubmit();
      });
    }
  }

  function updateSliderVisual(pct) {
    const fill = $('slider-fill');
    const thumb = $('slider-thumb');
    const label = $('slider-val-indicator');
    const displayPct = Math.round(pct * 100);

    if (fill) fill.style.width = `${displayPct}%`;
    if (thumb) thumb.style.left = `${displayPct}%`;

    if (label) {
      let benchmarkTag = '';
      if (Math.abs(pct - 0.25) < 0.05) benchmarkTag = ' (~¼)';
      else if (Math.abs(pct - 0.50) < 0.05) benchmarkTag = ' (~½)';
      else if (Math.abs(pct - 0.75) < 0.05) benchmarkTag = ' (~¾)';
      label.textContent = `${displayPct}%${benchmarkTag}`;
    }
  }

  // --- GAME END & RESULTS SCREEN ---
  function finishGame() {
    if (!state.running) return;
    state.running = false;
    stopBgm();

    const accuracy = state.totalAttempted > 0
      ? Math.round((state.correctCount / state.totalAttempted) * 100)
      : 0;

    // Scale score to MAX_CONFIG_POINTS
    // 100 base score target for ~8 correct
    const rawScore = state.score;
    const scaledScore = Math.min(MAX_CONFIG_POINTS, Math.round((rawScore / 80) * MAX_CONFIG_POINTS));

    // Calculate Stars (0 - 3)
    let stars = 0;
    if (scaledScore >= MAX_CONFIG_POINTS * 0.85) stars = 3;
    else if (scaledScore >= MAX_CONFIG_POINTS * 0.60) stars = 2;
    else if (scaledScore >= MAX_CONFIG_POINTS * 0.35) stars = 1;

    showScreen('result');

    // Populate Results
    $('result-score-val').textContent = `${scaledScore} / ${MAX_CONFIG_POINTS}`;
    $('result-accuracy-val').textContent = `${accuracy}%`;
    $('result-streak-val').textContent = `${state.maxStreak} 🔥`;

    const titleEl = $('result-title');
    const msgEl = $('result-message');
    const trophyEl = $('result-trophy');

    if (stars === 3) {
      trophyEl.textContent = '🏆';
      titleEl.textContent = 'Master Alchemist!';
      msgEl.textContent = 'Incredible work! You mastered every fraction shape!';
    } else if (stars >= 2) {
      trophyEl.textContent = '🌟';
      titleEl.textContent = 'Great Effort!';
      msgEl.textContent = 'Solid math skills! You understand shape fractions well!';
    } else {
      trophyEl.textContent = '🧪';
      titleEl.textContent = 'Good Practice!';
      msgEl.textContent = 'Keep practicing with benchmark halves and quarters!';
    }

    // Animate Stars with audio chimes
    const starSlots = [$('star-1'), $('star-2'), $('star-3')];
    starSlots.forEach((slot, i) => {
      slot.classList.remove('earned');
      if (i < stars) {
        setTimeout(() => {
          slot.classList.add('earned');
          sfxStar(i);
        }, (i + 1) * 350);
      }
    });

    state.finalResult = {
      score: scaledScore,
      maxScore: MAX_CONFIG_POINTS,
      stars: stars,
      success: stars >= 1,
      timeTaken: Date.now() - state.startMs,
      meta: {
        accuracy: accuracy,
        maxStreak: state.maxStreak,
        levelReached: state.level
      }
    };
  }

  // --- EVENT LISTENERS & WIRING ---
  function wireEvents() {
    // Fullscreen Toggle
    const fsBtn = $('btn-fullscreen-toggle');
    if (fsBtn) addBtnListener(fsBtn, toggleFullscreen);

    // Fullscreen Change Listeners
    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(ev => {
      document.addEventListener(ev, updateFullscreenIcon);
    });

    // Sound Toggle
    const soundBtn = $('btn-sound-toggle');
    if (soundBtn) addBtnListener(soundBtn, toggleMute);

    // Play Button on Start Screen
    const playBtn = $('btn-play');
    if (playBtn) addBtnListener(playBtn, triggerCountdown);

    // Instructions Button
    const instrBtn = $('btn-instructions');
    if (instrBtn) addBtnListener(instrBtn, () => {
      sfxTap();
      showScreen('instructions');
    });

    // Start from Instructions
    const startFromInstrBtn = $('btn-start-from-instructions');
    if (startFromInstrBtn) addBtnListener(startFromInstrBtn, triggerCountdown);

    // Back to Menu from Instructions
    const backBtn = $('btn-back-to-menu');
    if (backBtn) addBtnListener(backBtn, () => {
      sfxTap();
      showScreen('start');
      initStartCanvas();
    });

    // Restart HUD Button
    const restartHudBtn = $('btn-restart-hud');
    if (restartHudBtn) addBtnListener(restartHudBtn, () => {
      sfxTap();
      stopBgm();
      showScreen('start');
      initStartCanvas();
    });

    // Dismiss Explanation Overlay
    const dismissBtn = $('btn-dismiss-explanation');
    if (dismissBtn) addBtnListener(dismissBtn, dismissExplanation);

    // Try Again Button on Result Screen
    const tryAgainBtn = $('btn-try-again');
    if (tryAgainBtn) addBtnListener(tryAgainBtn, () => {
      sfxTap();
      showScreen('start');
      initStartCanvas();
    });

    // Submit Score Button (Calls game.end)
    const submitScoreBtn = $('btn-submit-score');
    if (submitScoreBtn) addBtnListener(submitScoreBtn, () => {
      sfxTap();
      if (!state.endCalled) {
        state.endCalled = true;
        if (typeof game !== 'undefined' && game.end) {
          game.end(state.finalResult || {
            score: state.score,
            maxScore: MAX_CONFIG_POINTS,
            stars: 1,
            success: true
          });
        }
        submitScoreBtn.disabled = true;
        submitScoreBtn.textContent = 'Submitted! ✅';
      }
    });

    setupSliderEvents();
  }

  // --- INITIALIZATION ---
  function init() {
    wireEvents();
    initStartCanvas();
    showScreen('start');
  }

  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
