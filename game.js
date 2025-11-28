// Fibonacci sequence starting from the game needs (5, 8, 13...)
const FIB = [5, 8, 13, 21, 34, 55, 89, 144];

const game = {
    dict: {},

    // State
    metaLevel: 1,
    subLevel: 0, // 0, 1, 2 (corresponds to levels within meta)

    // Derived config
    N: 4,
    M: 2,
    targetCount: 5,

    // Board Data
    grid: [],
    tiles: [],
    solutions: new Set(),
    found: new Set(),

    // Drag state
    isDragging: false,
    touchStartPos: { x: 0, y: 0 },
    DRAG_THRESHOLD: 5,

    // Trophy tracking
    trophies: [],

    // Special word emojis
    specialWords: {
        'cats': '🐈‍⬛',
        'kitten': '🐈‍⬛',
        'meow': '🐈‍⬛',
        'dogs': '🐕',
        'bark': '🐕',
        'dog': '🐕',
        'wool': '🧶',
        'clock': '🕐'
    },

    // Debug mode
    debugMode: new URLSearchParams(window.location.search).has('debug'),

    async init() {
        try {
            const res = await fetch('dict/dictionary.json');
            this.dict = await res.json();
            this.calcLevelConfig(); // Set initial config
            this.startRound();
        } catch(e) {
            document.body.innerHTML = '<h3 style="padding:20px;color:red">Error: dict/dictionary.json not found.</h3>';
        }
    },

    // --- Progression Logic ---

    calcLevelConfig() {
        // Update N, M based on Meta Level
        // Meta 1: 4+2
        // Meta 2: 4+3
        // Meta 3: 5+2
        // Meta 4: 5+3
        // ...

        // Logic:
        // If metaLevel is odd: N = 3 + (meta+1)/2, M = 2
        // If metaLevel is even: N = 3 + meta/2, M = 3

        if (this.metaLevel % 2 !== 0) {
            this.N = 3 + (this.metaLevel + 1) / 2;
            this.M = 2;
        } else {
            this.N = 3 + this.metaLevel / 2;
            this.M = 3;
        }

        // Calculate Target from Fibonacci
        // Meta 1 starts at index 0 (5)
        // Meta 2 starts at index 1 (8)
        // Meta 3 starts at index 2 (13)
        // Formula: index = (metaLevel - 1) + subLevel
        const fibIndex = (this.metaLevel - 1) + this.subLevel;
        this.targetCount = FIB[fibIndex] || FIB[FIB.length-1];

        // Calculate sequential level number for display
        const sequentialLevel = (this.metaLevel - 1) * 3 + (this.subLevel + 1);

        // UI Updates
        document.getElementById('lbl-level').innerText = sequentialLevel;
        document.getElementById('lbl-req').innerText = this.targetCount;
    },

    nextLevel() {
        // Award trophy before moving to next level
        const totalWords = this.solutions.size;
        const foundWords = this.found.size;
        const sequentialLevel = (this.metaLevel - 1) * 3 + (this.subLevel + 1);

        if (foundWords === totalWords) {
            this.trophies.push({ level: sequentialLevel, words: foundWords, type: 'gold' });
        } else if (foundWords === totalWords - 1) {
            this.trophies.push({ level: sequentialLevel, words: foundWords, type: 'silver' });
        } else if (foundWords === totalWords - 2) {
            this.trophies.push({ level: sequentialLevel, words: foundWords, type: 'bronze' });
        }

        this.updateTrophyDisplay();

        this.subLevel++;
        if (this.subLevel > 2) {
            this.subLevel = 0;
            this.metaLevel++;
        }
        this.calcLevelConfig();
        this.startRound();
    },

    updateTrophyDisplay() {
        const container = document.getElementById('trophy-display');
        container.innerHTML = '';

        if (this.trophies.length === 0) return;

        this.trophies.forEach((trophy, idx) => {
            const trophyEl = document.createElement('div');

            if (trophy.type === 'emoji') {
                trophyEl.className = 'trophy trophy-emoji';
                trophyEl.textContent = trophy.emoji;
                trophyEl.dataset.level = trophy.level;
                trophyEl.dataset.word = trophy.word;
            } else {
                trophyEl.className = `trophy trophy-${trophy.type}`;
                trophyEl.innerHTML = '<i class="iconoir-trophy"></i>';
                trophyEl.dataset.level = trophy.level;
                trophyEl.dataset.words = trophy.words;
                trophyEl.dataset.total = trophy.words + (trophy.type === 'gold' ? 0 : trophy.type === 'silver' ? 1 : 2);
            }

            // Mobile-friendly: tap to show info
            trophyEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showTrophyInfo(trophy, trophyEl);
            });

            container.appendChild(trophyEl);
        });
    },

    showTrophyInfo(trophy, element) {
        // Remove any existing tooltip
        document.querySelectorAll('.trophy-tooltip').forEach(el => el.remove());

        const tooltip = document.createElement('div');
        tooltip.className = 'trophy-tooltip';

        if (trophy.type === 'emoji') {
            tooltip.textContent = `Level ${trophy.level}: "${trophy.word}"`;
        } else {
            const total = trophy.words + (trophy.type === 'gold' ? 0 : trophy.type === 'silver' ? 1 : 2);
            tooltip.textContent = `Level ${trophy.level}: ${trophy.words}/${total} words`;
        }

        element.appendChild(tooltip);

        // Remove tooltip after 2 seconds or on next click
        setTimeout(() => tooltip.remove(), 2000);
        document.addEventListener('click', () => tooltip.remove(), { once: true });
    },

    // --- Round Generation ---

    startRound() {
        document.getElementById('btn-next').style.display = 'none';
        document.getElementById('found-words').innerHTML = '';
        document.getElementById('progress').style.width = '0%';
        document.getElementById('progress').classList.remove('complete');
        document.getElementById('lbl-found').textContent = '0';
        this.found.clear();

        // Retry loop to find a board with enough solutions
        // Aim for at least targetCount + targetCount/2 solutions
        const idealSolutions = this.targetCount + Math.floor(this.targetCount / 2);
        let attempts = 0;
        let bestChars = null;
        let maxSols = 0;

        const keys = Object.keys(this.dict).filter(k => k.length === this.N);
        if (keys.length === 0) { alert("Config Error: No words length "+this.N); return; }

        while(attempts < 100) {
            this.solutions.clear();

            // 1. Pick Base
            const baseKey = keys[Math.floor(Math.random() * keys.length)];
            let chars = baseKey.split('');

            // 2. Add M (with vowel bias)
            const vowels = ['a','e','i','o','u'];
            const existingVowels = chars.filter(c => vowels.includes(c)).length;
            let needed = Math.max(0, 2 - existingVowels);
            if (needed > this.M) needed = this.M;

            for(let i=0; i<needed; i++) chars.push(vowels[Math.floor(Math.random() * 5)]);
            const alpha = "eariotnslcudpmhgbfywkvxzjq";
            for(let i=0; i < (this.M - needed); i++) chars.push(alpha[Math.floor(Math.random() * 26)]);

            // 3. Solve
            this.solveInternal(chars);

            // Accept if we hit the ideal target
            if (this.solutions.size >= idealSolutions) {
                bestChars = chars;
                break;
            }

            // Keep track of best effort just in case
            if (this.solutions.size > maxSols) {
                maxSols = this.solutions.size;
                bestChars = chars;
            }
            attempts++;
        }

        // If we failed to find enough words after 50 tries, use the best we found
        // and cap the target so the level is passable.
        if (this.solutions.size < this.targetCount) {
            // Recalculate solutions for the bestChars to restore state
            this.solutions.clear();
            this.solveInternal(bestChars);
            this.targetCount = this.solutions.size;
            document.getElementById('lbl-req').innerText = this.targetCount;
        }

        this.setupBoard(bestChars);
    },

    solveInternal(chars) {
        // STRICTLY length N combinations
        const getCombos = (arr, k) => {
            if (k === 0) return [[]];
            if (arr.length === 0) return [];
            const [first, ...rest] = arr;
            return [...getCombos(rest, k-1).map(c => [first, ...c]), ...getCombos(rest, k)];
        };

        const combos = getCombos(chars, this.N);
        combos.forEach(c => {
            const k = c.sort().join('');
            if (this.dict[k]) this.dict[k].forEach(w => this.solutions.add(w));
        });
    },

    setupBoard(chars) {
        document.getElementById('lbl-total').innerText = this.solutions.size;

        // Debug mode: show all solutions
        if (this.debugMode) {
            console.log('=== DEBUG MODE ===');
            console.log('All solutions for this level:', Array.from(this.solutions).sort());
            console.log('Total solutions:', this.solutions.size);
        }

        const total = this.N + this.M;
        this.grid = new Array(total).fill(null);
        this.tiles = chars.map((c, i) => ({ id: 't'+i, char: c.toUpperCase() }));

        const indices = Array.from({length: total}, (_, i) => i).sort(() => Math.random() - 0.5);
        this.tiles.forEach((t, i) => this.grid[indices[i]] = t.id);

        this.render();
    },

    // --- Render & Interaction ---

    render() {
        const zT = document.getElementById('zone-target');
        const zP = document.getElementById('zone-pool');
        zT.innerHTML = ''; zP.innerHTML = '';

        this.grid.forEach((tileId, idx) => {
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.dataset.idx = idx;

            if (tileId) {
                const t = this.tiles.find(x => x.id === tileId);
                const el = document.createElement('div');
                el.className = 'tile';
                el.id = t.id;
                el.textContent = t.char;
                el.onclick = (e) => this.handleTileClick(e, idx);
                el.onmousedown = (e) => this.dragStart(e, idx);
                el.ontouchstart = (e) => this.touchStart(e, idx);
                slot.appendChild(el);
            }
            if (idx < this.N) zT.appendChild(slot); else zP.appendChild(slot);
        });
    },

    check() {
        const wordIds = this.grid.slice(0, this.N);
        if (wordIds.includes(null)) return;

        const word = wordIds.map(id => this.tiles.find(t => t.id === id).char).join('').toLowerCase();

        if (this.solutions.has(word) && !this.found.has(word)) {
            this.found.add(word);

            const tag = document.createElement('div');
            tag.className = 'tag';

            const wordSpan = document.createElement('span');
            wordSpan.textContent = word.toUpperCase();

            const infoIcon = document.createElement('i');
            infoIcon.className = 'iconoir-info-circle';
            infoIcon.title = 'Search definition';
            infoIcon.onclick = (e) => {
                e.stopPropagation();
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`define "${word}"`)}`;
                window.open(searchUrl, '_blank');
            };

            tag.appendChild(wordSpan);
            tag.appendChild(infoIcon);
            document.getElementById('found-words').prepend(tag); // Newest first

            // Check for special word emoji trophy
            if (this.specialWords[word]) {
                const sequentialLevel = (this.metaLevel - 1) * 3 + (this.subLevel + 1);
                const emoji = this.specialWords[word];

                // Check if we already have this emoji from this level
                const alreadyHas = this.trophies.some(t => t.type === 'emoji' && t.emoji === emoji && t.level === sequentialLevel);
                if (!alreadyHas) {
                    this.trophies.push({
                        level: sequentialLevel,
                        word: word,
                        type: 'emoji',
                        emoji: emoji
                    });
                    this.updateTrophyDisplay();
                }
            }

            // Animate target zone border
            const targetZone = document.getElementById('zone-target');
            targetZone.classList.add('correct');
            setTimeout(() => targetZone.classList.remove('correct'), 1000);

            this.updateStats();
        }
    },

    updateStats() {
        const count = this.found.size;
        document.getElementById('lbl-found').textContent = count;

        // Progress Bar
        const pct = Math.min(100, (count / this.targetCount) * 100);
        const bar = document.getElementById('progress');
        bar.style.width = pct + '%';

        if (count >= this.targetCount) {
            bar.classList.add('complete');
            document.getElementById('btn-next').style.display = 'block';
        }
    },

    handleTileClick(e, idx) {
        if (this.isDragging) return;

        // Trigger haptic on tap
        if (typeof triggerHaptic === 'function') {
            triggerHaptic(50);
        }
    },

    touchStart(e, srcIdx) {
        const touch = e.touches[0];
        this.touchStartPos = { x: touch.clientX, y: touch.clientY };
        this.isDragging = false;
        this.dragStart(e, srcIdx);
    },

    dragStart(e, srcIdx) {
        e.preventDefault();
        const tileEl = e.target;
        const rect = tileEl.getBoundingClientRect();

        const clone = tileEl.cloneNode(true);
        clone.classList.add('dragging');
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';
        document.body.appendChild(clone);

        const move = (ev) => {
            const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
            const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;

            // Check drag threshold on touch devices
            if (ev.touches && !this.isDragging) {
                const dx = cx - this.touchStartPos.x;
                const dy = cy - this.touchStartPos.y;
                if (Math.abs(dx) > this.DRAG_THRESHOLD || Math.abs(dy) > this.DRAG_THRESHOLD) {
                    this.isDragging = true;
                    // Trigger haptic when drag actually starts
                    if (typeof triggerHaptic === 'function') {
                        triggerHaptic(50);
                    }
                }
            }

            clone.style.left = (cx - rect.width/2) + 'px';
            clone.style.top = (cy - rect.height/2) + 'px';
        };
        move(e);

        const end = (ev) => {
            document.removeEventListener('mousemove', move); document.removeEventListener('touchmove', move);
            document.removeEventListener('mouseup', end); document.removeEventListener('touchend', end);
            clone.remove();

            // Reset drag state
            this.isDragging = false;

            const cx = ev.changedTouches ? ev.changedTouches[0].clientX : ev.clientX;
            const cy = ev.changedTouches ? ev.changedTouches[0].clientY : ev.clientY;
            const slotBelow = document.elementFromPoint(cx, cy)?.closest('.slot');

            if (slotBelow) {
                const dstIdx = parseInt(slotBelow.dataset.idx);
                if (dstIdx !== srcIdx) {
                    const tmp = this.grid[srcIdx];
                    this.grid[srcIdx] = this.grid[dstIdx];
                    this.grid[dstIdx] = tmp;
                    this.render();
                    this.check();
                }
            }
        };
        document.addEventListener('mousemove', move); document.addEventListener('touchmove', move, {passive: false});
        document.addEventListener('mouseup', end); document.addEventListener('touchend', end);
    }
};

game.init();

// Info modal handlers
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('info-modal');
    const openBtn = document.getElementById('dict-info-btn');
    const closeBtn = document.getElementById('info-modal-close');

    openBtn.addEventListener('click', () => {
        if (typeof triggerHaptic === 'function') {
            triggerHaptic(50);
        }
        modal.classList.add('visible');
    });

    closeBtn.addEventListener('click', () => {
        if (typeof triggerHaptic === 'function') {
            triggerHaptic(50);
        }
        modal.classList.remove('visible');
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (typeof triggerHaptic === 'function') {
                triggerHaptic(50);
            }
            modal.classList.remove('visible');
        }
    });
});
