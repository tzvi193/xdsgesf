let word_to_guess = wordList[Math.floor(Math.random() * wordList.length)];
let currentRow = 0;
let liveInput = "";
let gameOver = false;
let restart_ = false;
let hint_amount = 3;
let allowFakeWords = false;
let clearFakeWords = false;
let won = false;
let dailyMode = false;
let previousInputLength = 0;
let gameStats = {
    random: {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        bestStreak: 0,
        guessDistribution: [0, 0, 0, 0, 0, 0, 0],
        hintsUsed: 0,
        totalGuesses: 0
    },
    daily: {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        bestStreak: 0,
        guessDistribution: [0, 0, 0, 0, 0, 0, 0],
        hintsUsed: 0,
        totalGuesses: 0
    },
    currentMode: 'random' // Tracks which mode is active
};

let roundRevealed = false;

async function enableDailyMode() {

    document.getElementById("coming_soon").classList.add("reveal"); // Placeholder for future functionality
    setTimeout(() => document.getElementById("coming_soon").classList.remove("reveal"),750)
    /*

    if (dailyMode == false) {
        document.getElementById('daily_mode').innerText = "Random";
        try {
            // Use a relative path if serving from the same origin
            const response = await fetch('https://wordle-server-2piu.onrender.com/word');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            word_to_guess = data.word.toLowerCase();
            currentRow = 0;
            liveInput = "";
            gameOver = false;
            won = false;
            revealed_letters = [];
            resetGrid();
            resetKeyboard();
            
            // Set to daily mode and update stats display
            dailyMode = true;
            gameStats.currentMode = 'daily';
            updateStatsDisplay();
            document.getElementById("random_stats").style.backgroundColor = "var(--bar-default-bg)";
            document.getElementById("daily_stats").style.backgroundColor = "var(--primary-color)";
            
        } catch (error) {
            console.error('Error fetching daily word:', error);
            alert('Could not fetch daily word. Using random word instead.');
            dailyMode = false;
            document.getElementById('daily_mode').classList.remove('active');
            document.getElementById('reveal_word').disabled = false;
            yes();
        }
    }
    else {
        document.getElementById('daily_mode').innerText = "Daily mode";
        dailyMode = false;
        gameStats.currentMode = 'random';
        updateStatsDisplay();
        document.getElementById("random_stats").style.backgroundColor = "var(--primary-color)";
        document.getElementById("daily_stats").style.backgroundColor = "var(--bar-default-bg)";
        yes();
    }
    */
}


function backspace() {
    // Prevent action if the game has ended
    if (gameOver) return;

    // Remove the last character from the liveInput string
    liveInput = liveInput.slice(0, -1);

    // Update the grid to reflect the change.
    // The updateBoxes() function already handles everything visually.
    updateBoxes();
}

function clear_fake() {
    const clear_checkbox = document.getElementById("clear_fake_words");
    clearFakeWords = clear_checkbox.checked;
    localStorage.setItem("clearFakeWords", clearFakeWords);
}

function allow_fake() {
    const checkbox = document.getElementById("allow_fake_words");
    allowFakeWords = checkbox.checked;
    localStorage.setItem("allowFakeWords", allowFakeWords);
}

function how_to(){
    const helpBox = document.getElementById("how_to_play_box");
    helpBox.classList.toggle("showing");
    document.getElementById("overlay_help").classList.toggle("active");
}

function reveal() {
    document.getElementById("reveal_word").innerText = word_to_guess;
    setTimeout(() => document.getElementById("reveal_word").innerText = "Reveal word", 1000);
    roundRevealed = true;
}

function toggleStats() {
    const statsBox = document.getElementById("stats_box");
    const overlay = document.getElementById("stats_overlay");
    
    statsBox.classList.toggle("showing");
    overlay.classList.toggle("active");
    
    if (statsBox.classList.contains("showing")) {
        updateStatsDisplay();
    }
}

function updateStatsDisplay() {
    const stats = gameStats[gameStats.currentMode];
    
    document.getElementById("games-played").textContent = stats.gamesPlayed;
    document.getElementById("win-rate").textContent = stats.gamesPlayed > 0 ? 
        Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
    document.getElementById("current-streak").textContent = stats.currentStreak;
    document.getElementById("best-streak").textContent = stats.bestStreak;
    
    const maxGuesses = Math.max(...stats.guessDistribution);
    
    for (let i = 0; i < 7; i++) {
        const count = stats.guessDistribution[i];
        const bar = document.getElementById(`bar-${i + 1}`);
        const countEl = document.getElementById(`count-${i + 1}`);
        
        countEl.textContent = count;
        
        if (count === 0) {
            bar.style.background = "var(--bar-default-bg)";
        } else if (maxGuesses > 0) {
            const percentage = (count / maxGuesses) * 100;
            bar.style.background = `linear-gradient(to right, var(--primary-color) ${percentage}%, var(--bar-default-bg) ${percentage}%)`;
        }
    }
}

function saveStats() {
    localStorage.setItem('wordleStats', JSON.stringify(gameStats));
}

function loadStats() {
    const saved = localStorage.getItem('wordleStats');
    if (saved) {
        gameStats = JSON.parse(saved);
    }
}

function up_hints() {
    if (hint_amount < 5){
        hint_amount += 1;
        document.getElementById("number_hint").innerText = hint_amount;
        localStorage.setItem("hint_amount", hint_amount);
    }
}

function down_hints() {
    if (hint_amount > 0){
        hint_amount -= 1;
        document.getElementById("number_hint").innerText = hint_amount;
        localStorage.setItem("hint_amount", hint_amount);
    }
}

let revealed_letters = [];

function getGuessedLetters() {
    const guessedLetters = new Set();
    const rows = document.querySelectorAll(".grid");
    
    // Go through each completed row
    for (let rowIndex = 0; rowIndex < currentRow; rowIndex++) {
        const boxes = rows[rowIndex].querySelectorAll(".box");
        boxes.forEach(box => {
            if (box.innerText) {
                guessedLetters.add(box.innerText.toLowerCase());
            }
        });
    }
    
    return guessedLetters;
}

// Updated hint function
function hint() {
    const hintBtn = document.getElementById("Hints");
    if (hint_amount < 1) {
        hintBtn.textContent = "No hints left";
    } else {
        const word_to_guess_list = word_to_guess.split("");
        const guessedLetters = getGuessedLetters();
        let hint_letter;
        let availableLetters = [];
        
        // Find letters in the word that haven't been guessed or revealed as hints
        for (let letter of word_to_guess_list) {
            if (!guessedLetters.has(letter) && !revealed_letters.includes(letter)) {
                availableLetters.push(letter);
            }
        }
        
        // If no new letters are available, show a message
        if (availableLetters.length === 0) {
            hintBtn.textContent = "No more letters";
        } else {
            // Pick a random available letter
            hint_letter = availableLetters[Math.floor(Math.random() * availableLetters.length)];
            revealed_letters.push(hint_letter);
            hintBtn.textContent = "Contains: " + hint_letter.toUpperCase();
            hint_amount--;
            gameStats.hintsUsed++;
            saveStats();
        }
    }

    hintBtn.classList.add("expanded");
    setTimeout(() => {
        hintBtn.classList.remove("expanded");
        hintBtn.innerHTML = '<img id="light_bulb" src="output-onlinepngtools.png">';
    }, 1500);
}


function toggleSettings() {
    const settingsBox = document.getElementById("settings_box");
    const overlay = document.getElementById("settings_overlay");
    
    settingsBox.classList.toggle("showing");
    overlay.classList.toggle("active");
}

function restart() {
        document.getElementById("restartDIV").innerHTML = '<button id="restart_no" onclick="no()">\
        No</button><button onclick="yes()" id="restart_yes">Yes</button>'
}

function resetGrid() {
    const boxes = document.querySelectorAll('.box');
    boxes.forEach(box => {
        box.innerText = '';
        box.style.backgroundColor = '';
        box.style.border = 'var(--box-border)';
        box.style.color = '';
    });
}

function resetKeyboard() {
    const keys = document.querySelectorAll('.keys');
    keys.forEach(key => {
        key.style.backgroundColor = '';
        key.style.color = '';
    });
}

function yes() {
    saveStats();
    resetGame();
}

function resetGame() {
    // Pick a new word
    word_to_guess = wordList[Math.floor(Math.random() * wordList.length)];
    currentRow = 0;
    liveInput = "";
    gameOver = false;
    restart_ = false;
    won = false;
    previousInputLength = 0;
    revealed_letters = [];
    // Reset grid and keyboard
    resetGrid();
    resetKeyboard();
    // Hide overlays and boxes
    document.getElementById("win_box_parent").classList.remove("showing");
    document.getElementById("lose_box_parent").classList.remove("lost");
    document.getElementById("word_reveal").innerHTML = "";
    // Restore top buttons
    const topParent = document.getElementById("top_parent");
    topParent.innerHTML = `
        <button class="top_buttons" id="reveal_word" onclick="reveal()">Reveal word</button>
        <button class="top_buttons" id="daily_mode" onclick="enableDailyMode()">Daily mode</button>
        <div id="restartDIV">
            <button class="top_buttons" onclick="restart()">New word</button>
        </div>
    `;
}

function no(){
    document.getElementById("restartDIV").innerHTML = '<button class="top_buttons" onclick="restart()">\
    New word</button>'
}

function updateBoxes() {
    const rows = document.querySelectorAll(".grid");
    const boxes = rows[currentRow].querySelectorAll(".box");
    // Update all boxes with current letters
    for (let i = 0; i < 5; i++) {
        boxes[i].innerText = liveInput[i] || "";
    }
    // Only pulse if a new letter was added (not when removing letters)
    if (liveInput.length > previousInputLength && liveInput.length > 0) {
        const newLetterIndex = liveInput.length - 1;
        const newLetterBox = boxes[newLetterIndex];
        
        newLetterBox.classList.add("pulse");
        setTimeout(() => {
            newLetterBox.classList.remove("pulse");
        }, 100);
    }
    
    // Update the previous length for next comparison
    previousInputLength = liveInput.length;
}
function updateActiveThemeIndicator(activeTheme) {
    document.querySelectorAll('.theme-option').forEach(option => {
        option.style.border = option.getAttribute('data-theme') === activeTheme 
            ? 'var(--theme-indicator)' 
            : '';
    });
}

function resetStats() {
    document.getElementById("resetStatsDIV").innerHTML = 
        '<button id="reset_no" class="stats_button" onclick="noReset()">No</button>' +
        '<button id="reset_yes" class="stats_button" onclick="yesReset()">Yes</button>';
}

function yesReset() {
    gameStats = {
        random: {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            bestStreak: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0, 0],
            hintsUsed: 0,
            totalGuesses: 0
        },
        daily: {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            bestStreak: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0, 0],
            hintsUsed: 0,
            totalGuesses: 0
        },
        currentMode: 'random'
    };

    saveStats();
    updateStatsDisplay();

    document.getElementById("random_stats").style.backgroundColor = "var(--primary-color)";
    document.getElementById("daily_stats").style.backgroundColor = "var(--bar-default-bg)";
    
    document.getElementById("resetStatsDIV").innerHTML = 
        '<button class="stats_button" onclick="resetStats()">Reset Statistics</button>';
}

function noReset() {
    // Reset the button back to original state without doing anything
    document.getElementById("resetStatsDIV").innerHTML = 
        '<button class="stats_button" onclick="resetStats()">Reset Statistics</button>';
}

function handle_input() {
    if (liveInput.length !== 5) {
        if (gameOver == true)
            return
        const not_enough_VAR = document.getElementById("not_enough_letters")
        not_enough_VAR.classList.add("reveal","shake")
        setTimeout(() => not_enough_VAR.classList.remove("reveal","shake"),750)
        return;
    }
    if (!wordList.includes(liveInput) && !allowFakeWords) {
        const not_in_VAR = document.getElementById("not_in_list")
        not_in_VAR.classList.add("reveal","shake")
        setTimeout(() => not_in_VAR.classList.remove("reveal","shake"),750)
        if (clearFakeWords) {
            liveInput = "";
            updateBoxes();
        }
        updateBoxes();
        return;
    }

    const boxes = document.querySelectorAll(".grid")[currentRow].querySelectorAll(".box");
    const guess = liveInput.split("");
    const answer = word_to_guess.split("");
    let letterUsed = Array(5).fill(false);
    
    const keyboardStates = {};

    for (let i = 0; i < 5; i++) {
        if (guess[i] === answer[i]) {
            letterUsed[i] = true;
            keyboardStates[guess[i].toUpperCase()] = 'correct';
        }
    }

    for (let i = 0; i < 5; i++) {
        if (guess[i] !== answer[i]) {
            let found = false;
            for (let j = 0; j < 5; j++) {
                if (!letterUsed[j] && guess[i] === answer[j]) {
                    letterUsed[j] = true;
                    found = true;

                    if (keyboardStates[guess[i].toUpperCase()] !== 'correct') {
                        keyboardStates[guess[i].toUpperCase()] = 'present';
                    }
                    break;
                }
            }

            if (!found && !keyboardStates[guess[i].toUpperCase()]) {
                keyboardStates[guess[i].toUpperCase()] = 'absent';
            }
        }
    }


    Object.keys(keyboardStates).forEach(letter => {
        document.querySelectorAll(".keys").forEach(key => {
            if (key.innerText === letter) {
                const state = keyboardStates[letter];
                if (state === 'correct') {
                    key.style.backgroundColor = "var(--correct-color)";
                    key.style.color = "var(--key-correct-text)";
                } else if (state === 'present') {
                    key.style.backgroundColor = "var(--present-color)";
                    key.style.color = "var(--key-present-text)";
                } else if (state === 'absent') {
                    // Only apply absent color if the key doesn't already have a better state
                    const currentBg = getComputedStyle(key).backgroundColor;
                    if (!currentBg.includes("104, 164, 92") && !currentBg.includes("208, 180, 84")) {
                        key.style.backgroundColor = "var(--absent-color)";
                        key.style.color = "var(--key-absent-text)";
                    }
                }
            }
        });
    });

    
    letterUsed = Array(5).fill(false);

    
    for (let i = 0; i < 5; i++) {
        if (guess[i] === answer[i]) {
            letterUsed[i] = true;
        }
    }

    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            boxes[i].classList.add("flipping");
            setTimeout(() => {
                boxes[i].innerText = guess[i];
                if (guess[i] === answer[i]) {
                    boxes[i].style.backgroundColor = "var(--correct-color)";
                } else {
                    let found = false;
                    for (let j = 0; j < 5; j++) {
                        if (!letterUsed[j] && guess[i] === answer[j]) {
                            boxes[i].style.backgroundColor = "var(--present-color)";
                            letterUsed[j] = true;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        boxes[i].style.backgroundColor = "var(--absent-color)";
                    }
                }
                boxes[i].style.border = 'none';
                boxes[i].style.color = "white";
                boxes[i].classList.remove("flipping");
            }, 275);
        }, i * 275);
    }
    // when user wins
    if (liveInput === word_to_guess) {
        if (!roundRevealed) {
            const mode = dailyMode ? 'daily' : 'random';
            const stats = gameStats[mode];
            gameOver = true;
            won = true;
            stats.gamesWon++;
            stats.currentStreak++;
            stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
            stats.guessDistribution[currentRow]++; 
            stats.totalGuesses += (currentRow + 1);
            stats.gamesPlayed++;
            // Reset the other mode's streak if this is daily mode
            if (dailyMode) {
                gameStats.random.currentStreak = 0;
            }
            saveStats();
        } else {
            gameOver = true;
            won = true;
        }
        const winningRowIndex = currentRow;

        setTimeout(() => {
            const win_box_VAR = document.getElementById("win_box_parent");

            const winningRow = document.querySelectorAll('.grid')[winningRowIndex];
            const winningBoxes = winningRow.querySelectorAll('.box');
            
            winningBoxes.forEach((box, index) => {
                setTimeout(() => {
                    box.classList.add('celebrate');

                    setTimeout(() => box.classList.remove('celebrate'), 500);
                }, index * 80); // Stagger the animations
            });
            // ...and REPLACE it with this
            setTimeout(() => {
                const topParent = document.getElementById("top_parent");
                
                // 1. Clear the old buttons
                topParent.innerHTML = ''; // Clearing is fine here, as we are building fresh.

                // 2. Create the "Next word" button
                const nextWordBtn = document.createElement('button');
                nextWordBtn.className = 'top_buttons';
                nextWordBtn.textContent = 'Next word';
                nextWordBtn.onclick = yes; // Assign the function directly

                // 3. Create the "Statistics" button
                const statsBtn = document.createElement('button');
                statsBtn.className = 'top_buttons';
                statsBtn.textContent = 'Statistics';
                statsBtn.onclick = toggleStats; // Assign the function directly

                // 4. Create the container for the next word button
                const restartDiv = document.createElement('div');
                restartDiv.id = 'restartDIV';
                restartDiv.appendChild(nextWordBtn);

                // 5. Append the new elements to the parent container
                topParent.appendChild(restartDiv);
                topParent.appendChild(statsBtn);

                // 6. Now, safely open the stats panel
                toggleStats();

            }, 750); // The delay remains the same
        }, 1500);
    }
    if (currentRow >= 5 && won == false){
        if (!roundRevealed) {
            const lose_box_VAR = document.getElementById("lose_box_parent");
            setTimeout(() => lose_box_VAR.classList.add("lost"), 1500);
            document.getElementById("word_reveal").innerHTML = "- " + word_to_guess + " -"
            gameStats.currentStreak = 0;
            gameStats.gamesPlayed++;
            gameStats.guessDistribution[6]++; // Increment the 7th bar (index 6) for failed attempts
            saveStats();
        } else {
            const lose_box_VAR = document.getElementById("lose_box_parent");
            setTimeout(() => lose_box_VAR.classList.add("lost"), 1500);
            document.getElementById("word_reveal").innerHTML = "- " + word_to_guess + " -"
        }
    }
    liveInput = "";
    currentRow++;
    roundRevealed = false;
}

document.addEventListener("keydown", (event) => {
    if (gameOver) return;
    if (currentRow >= 6) return;
    const key = event.key.toLowerCase();
    if (key === "enter") {
        handle_input();
    } else if (key === "backspace") {
        liveInput = liveInput.slice(0, -1);
        updateBoxes(); // No pulse when removing letters
    } else if (/^[a-z]$/.test(key)) {
        if (liveInput.length < 5) {
            liveInput += key;
            updateBoxes(); // This will pulse the box with the new letter
        }
    }
});

function setupKeyboardLayout() {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const row2 = document.getElementById('row2');
    const row3 = document.getElementById('row3');
    const backspaceBtn = document.getElementById('backspace');
    const submitBtn = document.getElementById('submit_button');

    function handleLayoutChange(mq) {
        if (mq.matches) {
            // Mobile layout: Move submit to start of row3, backspace to end of row3
            row3.prepend(submitBtn);
            row3.appendChild(backspaceBtn);
        } else {
            // Desktop layout: Move buttons back to original positions
            row2.appendChild(backspaceBtn);
            row3.appendChild(submitBtn);
        }
    }

    // Initial check
    handleLayoutChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', handleLayoutChange);
}


document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("hint_amount") !== null) {
        hint_amount = parseInt(localStorage.getItem("hint_amount"));
        document.getElementById("number_hint").innerText = hint_amount;
    }
    document.querySelectorAll(".keys").forEach(keyDiv => {
        keyDiv.addEventListener("click", () => {
            if (gameOver) return;
            const letter = keyDiv.innerText.toLowerCase();
            if (letter === "enter") {
                handle_input();
            } else if (letter === "←") {
                liveInput = liveInput.slice(0, -1);
                updateBoxes(); // No pulse when removing letters
            }
             else if (liveInput.length < 5 && /^[a-z]$/.test(letter)) {
                liveInput += letter;
                updateBoxes(); // This will pulse the box with the new letter
            }
        });
    });
    if (localStorage.getItem("clearFakeWords") !== null) {
        clearFakeWords = localStorage.getItem("clearFakeWords") === "true";
        document.getElementById("clear_fake_words").checked = clearFakeWords;
    }
    if (localStorage.getItem("allowFakeWords") !== null) {
        allowFakeWords = localStorage.getItem("allowFakeWords") === "true";
        document.getElementById("allow_fake_words").checked = allowFakeWords;
    }
    setupThemeSwitcher();

    const savedTheme = localStorage.getItem('theme') || 'default';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateActiveThemeIndicator(savedTheme);
    loadStats();
    setupKeyboardLayout(); // Set up the dynamic keyboard

    document.getElementById("random_stats").addEventListener("click", () => {
        gameStats.currentMode = 'random';
        updateStatsDisplay();
        document.getElementById("random_stats").style.backgroundColor = "var(--primary-color)";
        document.getElementById("daily_stats").style.backgroundColor = "var(--bar-default-bg)";
    });
    
    document.getElementById("daily_stats").addEventListener("click", () => {
        gameStats.currentMode = 'daily';
        updateStatsDisplay();
        document.getElementById("daily_stats").style.backgroundColor = "var(--primary-color)";
        document.getElementById("random_stats").style.backgroundColor = "var(--bar-default-bg)";
    });
    
    // Initialize the buttons
    document.getElementById("random_stats").style.backgroundColor = "var(--primary-color)";
    document.getElementById("daily_stats").style.backgroundColor = "var(--bar-default-bg)";
});

function setupThemeSwitcher() {
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const theme = option.getAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            updateActiveThemeIndicator(theme);
        });
    });
}