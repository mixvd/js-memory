class MemoryGame {
    /**
     * Initialize game state and DOM elements
     * Sets up initial game configuration and loads game history
     */
    constructor() {
        // Game state variables
        this.cards = [];
        this.score = 0;
        this.clicks = 0;
        this.firstCard = null;
        this.secondCard = null;
        this.canClick = true;
        this.startTime = null;
        this.timerInterval = null;
        this.gameStarted = false;

        // DOM elements
        this.grid = document.getElementById('grid');
        this.scoreDisplay = document.getElementById('score');
        this.clicksDisplay = document.getElementById('clicks');
        this.timeDisplay = document.getElementById('time');

        // Load game history from localStorage
        this.gameHistory = JSON.parse(localStorage.getItem('memoryGameHistory')) || [];
        this.currentGameNumber = this.gameHistory.length + 1;

        /** console.log('Memory Game initialized', {
            gameNumber: this.currentGameNumber,
            historyLength: this.gameHistory.length
        });
        */

        this.initGame();
    }

    /**
     * Initialize the game board
     * Creates and shuffles card pairs, resets game state
     * and renders the initial board
     */
    initGame() {
        // Game symbols configuration
        const symbols = ['🌟', '🎈', '🎨', '🎭', '🎪', '🎯', '🎲', '🎮'];
        const cardPairs = [...symbols, ...symbols];

        // Shuffle and create card objects
        this.cards = cardPairs
            .sort(() => Math.random() - 0.5)
            .map((symbol, index) => ({
                id: index,
                symbol: symbol,
                isFlipped: false,
                isMatched: false
            }));

        // console.log('Game board initialized with shuffled cards');

        this.renderBoard();
        this.updateScore(0);
        this.updateClicks(0);

        if (this.timeDisplay) {
            this.timeDisplay.textContent = '00:00';
        }

        this.updateHistoryDisplay();
    }

    /**
     * Start game timer
     * Initializes and updates the game timer display
     * Only starts if the game hasn't already begun
     */
    startTimer() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.startTime = Date.now();
            // console.log('Game timer started');

            this.timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                if (this.timeDisplay) {
                    this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
            }, 1000);
        }
    }

    /**
     * Render the game board
     * Creates and displays all card elements with their
     * event listeners and initial state
     */
    renderBoard() {
        this.grid.innerHTML = '';
        this.cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.dataset.id = card.id;
            cardElement.innerHTML = `
                <div class="card-inner">
                    <div class="card-front"></div>
                    <div class="card-back">${card.symbol}</div>
                </div>
            `;
            cardElement.addEventListener('click', () => this.handleCardClick(cardElement));
            this.grid.appendChild(cardElement);
        });
    }

    /**
     * Update click counter
     * Updates the click count display and internal state
     */
    updateClicks(newClicks) {
        this.clicks = newClicks;
        if (this.clicksDisplay) {
            this.clicksDisplay.textContent = this.clicks;
        }
        // console.log('Clicks updated:', this.clicks);
    }

    /**
     * Handle card click event
     * Manages card flipping logic and game state updates
     */
    handleCardClick(cardElement) {
        // Prevent clicking if not allowed
        if (!this.canClick) return;
        if (cardElement.classList.contains('flipped')) return;
        if (cardElement === this.firstCard) return;

        // Start timer on first click
        if (!this.gameStarted) {
            this.startTimer();
        }

        this.updateClicks(this.clicks + 1);
        cardElement.classList.add('flipped');

        /** console.log('Card clicked:', {
            cardId: cardElement.dataset.id,
            isFirstCard: !this.firstCard
        });
        */

        if (!this.firstCard) {
            this.firstCard = cardElement;
        } else {
            this.secondCard = cardElement;
            this.canClick = false;
            this.checkMatch();
        }
    }

    /**
     * Check if selected cards match
     * Compares the symbols of the two selected cards
     * and triggers appropriate handling
     */
    checkMatch() {
        const firstCardId = parseInt(this.firstCard.dataset.id);
        const secondCardId = parseInt(this.secondCard.dataset.id);

        const isMatch = this.cards[firstCardId].symbol === this.cards[secondCardId].symbol;

        /** console.log('Checking match:', {
        firstCard: this.cards[firstCardId].symbol,
            secondCard: this.cards[secondCardId].symbol,
            isMatch
        });
        */

        if (isMatch) {
            this.handleMatch();
        } else {
            this.handleMismatch();
        }
    }

    /**
     * Handle matching cards
     * Updates game state and score when cards match
     * Checks if game is complete after successful match
     */
    handleMatch() {
        this.firstCard.classList.add('matched');
        this.secondCard.classList.add('matched');

        const clickBonus = Math.max(20 - Math.floor(this.clicks / 2), 5);
        this.updateScore(this.score + clickBonus);

        this.resetTurn();

        if (this.checkGameComplete()) {
            this.endGame();
        }
    }

    /**
     * Handle mismatched cards
     * Flips cards back after a delay when they don't match
     */
    handleMismatch() {
        setTimeout(() => {
            this.firstCard.classList.remove('flipped');
            this.secondCard.classList.remove('flipped');
            this.resetTurn();
        }, 1000);
    }

    /**
     * Reset turn state
     * Resets card selection and enables clicking for next turn
     */
    resetTurn() {
        this.firstCard = null;
        this.secondCard = null;
        this.canClick = true;
    }

    /**
     * Update score display
     * Updates the score counter in the UI
     */
    updateScore(newScore) {
        this.score = newScore;
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = this.score;
        }
    }

    /**
     * Check if game is complete
     * Verifies if all cards have been matched
     */
    checkGameComplete() {
        return this.cards.every(card =>
            document.querySelector(`[data-id="${card.id}"]`).classList.contains('matched')
        );
    }

    /**
     * Calculate final score
     * Computes final score based on time, clicks and matches
     */
    calculateFinalScore() {
        if (!this.startTime) return this.score;
        const timeBonus = Math.max(300 - Math.floor((Date.now() - this.startTime) / 1000), 0);
        const clickPenalty = Math.floor(this.clicks / 2);
        return this.score + timeBonus - clickPenalty;
    }

    /**
     * End game handling
     * Stops timer, saves score, and displays end screen
     */
    endGame() {
        clearInterval(this.timerInterval);
        this.saveToHistory();
        const finalScore = this.calculateFinalScore();
        const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);

        setTimeout(() => {
            document.getElementById('gameScreen').classList.add('hidden');
            document.getElementById('endScreen').classList.remove('hidden');

            document.getElementById('finalScore').textContent = finalScore;
            document.getElementById('finalClicks').textContent = this.clicks;
            document.getElementById('finalTime').textContent =
                `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`;
        }, 500);
    }

    /**
     * Cleanup game state
     * Resets timer and game state for new game
     */
    cleanup() {
        clearInterval(this.timerInterval);
        this.gameStarted = false;
    }

    /**
     * Save game to history
     * Stores current game results in localStorage
     */
    saveToHistory() {
        const gameResult = {
            gameNumber: this.currentGameNumber,
            score: this.calculateFinalScore(),
            clicks: this.clicks,
            time: Math.floor((Date.now() - this.startTime) / 1000),
            date: new Date().toLocaleDateString()
        };

        this.gameHistory.unshift(gameResult);
        if (this.gameHistory.length > 20) {
            this.gameHistory.pop();
        }

        localStorage.setItem('memoryGameHistory', JSON.stringify(this.gameHistory));
        this.updateHistoryDisplay();
    }

    /**
     * Update history display
     * Renders the game history in the UI
     */
    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';

        this.gameHistory.forEach(game => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="game-number">Partie #${game.gameNumber}</div>
                <div class="history-stat">
                    <span>Score:</span>
                    <span class="stat-value">${game.score}</span>
                </div>
                <div class="history-stat">
                    <span>Clics:</span>
                    <span class="stat-value">${game.clicks}</span>
                </div>
                <div class="history-stat">
                    <span>Temps:</span>
                    <span class="stat-value">${Math.floor(game.time / 60)}m ${game.time % 60}s</span>
                </div>
                <div class="history-stat">
                    <span>Date:</span>
                    <span class="stat-value">${game.date}</span>
                </div>
            `;
            historyList.appendChild(historyItem);
        });
    }
}

/**
 * DOM Load Event Handler
 * Initializes the game when the DOM is fully loaded
 */
window.addEventListener('DOMContentLoaded', () => {
    // console.log('DOM loaded, initializing game');
    let game = new MemoryGame();

    // Handle play again button
    document.getElementById('playAgain').addEventListener('click', () => {
        // console.log('Starting new game');
        game.cleanup();
        document.getElementById('gameScreen').classList.remove('hidden');
        document.getElementById('endScreen').classList.add('hidden');
        game = new MemoryGame();
    });

    // Debug: Clear localStorage if needed
    // localStorage.clear();
});
