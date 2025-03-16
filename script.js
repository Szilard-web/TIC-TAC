document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const setupSection = document.getElementById('setup-section');
    const gameSection = document.getElementById('game-section');
    const createRoomBtn = document.getElementById('create-room');
    const joinRoomBtn = document.getElementById('join-room');
    const roomIdInput = document.getElementById('room-id');
    const roomCodeDisplay = document.getElementById('room-code');
    const playerMarkDisplay = document.getElementById('player-mark');
    const waitingMessage = document.getElementById('waiting-message');
    const localModeMessage = document.getElementById('local-mode-message');
    const statusDisplay = document.getElementById('status');
    const cells = document.querySelectorAll('.cell');
    const restartButton = document.getElementById('restart');
    const newGameButton = document.getElementById('new-game');
    const notificationElement = document.getElementById('notification');
    
    // Game variables
    let socket;
    let roomId = null;
    let playerMark = null;
    let currentPlayer = 'X';
    let gameActive = false;
    let gameState = ['', '', '', '', '', '', '', '', ''];
    let isLocalMode = false;
    
    // Connect to Socket.IO server
    function initializeSocket() {
        try {
            // For local development without server
            if (typeof io === 'undefined') {
                console.log('Socket.IO not available - running in local mode');
                isLocalMode = true;
                return;
            }
            
            socket = io();
            
            socket.on('connect', () => {
                console.log('Connected to server with ID:', socket.id);
                isLocalMode = false;
            });
            
            socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                showNotification('Failed to connect to server - running in local mode');
                isLocalMode = true;
            });
            
            // Socket event listeners
            socket.on('roomCreated', handleRoomCreated);
            socket.on('roomJoined', handleRoomJoined);
            socket.on('gameStart', handleGameStart);
            socket.on('gameUpdate', handleGameUpdate);
            socket.on('gameRestarted', handleGameRestarted);
            socket.on('playerDisconnected', handlePlayerDisconnected);
            socket.on('error', handleError);
        } catch (error) {
            console.error('Error initializing socket:', error);
            showNotification('Error connecting to server - running in local mode');
            isLocalMode = true;
        }
    }
    
    // Initialize the game
    function init() {
        initializeSocket();
        addEventListeners();
    }
    
    // Add event listeners
    function addEventListeners() {
        createRoomBtn.addEventListener('click', createRoom);
        joinRoomBtn.addEventListener('click', joinRoom);
        cells.forEach(cell => cell.addEventListener('click', handleCellClick));
        restartButton.addEventListener('click', restartGame);
        newGameButton.addEventListener('click', goToSetup);
    }
    
    // Create a new game room
    function createRoom() {
        if (isLocalMode || !socket || !socket.connected) {
            // Fallback for local play without server
            roomId = generateLocalRoomId();
            playerMark = 'X';
            
            roomCodeDisplay.textContent = roomId;
            playerMarkDisplay.textContent = playerMark;
            
            setupSection.style.display = 'none';
            gameSection.style.display = 'block';
            
            // Start local game immediately
            startLocalGame();
            return;
        }
        
        socket.emit('createRoom');
    }
    
    // Generate a local room ID when server is not available
    function generateLocalRoomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    // Start a local game (without server)
    function startLocalGame() {
        gameActive = true;
        currentPlayer = 'X';
        gameState = ['', '', '', '', '', '', '', '', ''];
        
        waitingMessage.style.display = 'none';
        localModeMessage.style.display = 'block';
        statusDisplay.textContent = `${currentPlayer}'s turn`;
        
        updateBoard();
    }
    
    // Join an existing room
    function joinRoom() {
        const roomIdValue = roomIdInput.value.trim().toUpperCase();
        
        if (!roomIdValue) {
            showNotification('Please enter a room code');
            return;
        }
        
        if (isLocalMode || !socket || !socket.connected) {
            showNotification('Cannot join room - server not available');
            return;
        }
        
        socket.emit('joinRoom', roomIdValue);
    }
    
    // Handle room created event
    function handleRoomCreated(data) {
        roomId = data.roomId;
        playerMark = data.playerMark;
        
        roomCodeDisplay.textContent = roomId;
        playerMarkDisplay.textContent = playerMark;
        waitingMessage.style.display = 'block';
        
        setupSection.style.display = 'none';
        gameSection.style.display = 'block';
    }
    
    // Handle room joined event
    function handleRoomJoined(data) {
        roomId = data.roomId;
        playerMark = data.playerMark;
        gameState = data.gameState;
        
        roomCodeDisplay.textContent = roomId;
        playerMarkDisplay.textContent = playerMark;
        
        setupSection.style.display = 'none';
        gameSection.style.display = 'block';
        
        updateBoard();
    }
    
    // Handle game start event
    function handleGameStart(data) {
        gameActive = true;
        currentPlayer = data.currentPlayer;
        gameState = data.gameState;
        
        waitingMessage.style.display = 'none';
        statusDisplay.textContent = `${currentPlayer}'s turn`;
        
        updateBoard();
    }
    
    // Handle game update event
    function handleGameUpdate(data) {
        gameState = data.gameState;
        
        if (data.result) {
            gameActive = false;
            
            if (data.result.status === 'win') {
                statusDisplay.textContent = `Player ${data.result.winner} has won!`;
            } else if (data.result.status === 'draw') {
                statusDisplay.textContent = 'Game ended in a draw!';
            }
        } else {
            currentPlayer = data.currentPlayer;
            statusDisplay.textContent = `${currentPlayer}'s turn`;
        }
        
        updateBoard();
    }
    
    // Handle game restarted event
    function handleGameRestarted(data) {
        gameActive = true;
        currentPlayer = data.currentPlayer;
        gameState = data.gameState;
        
        statusDisplay.textContent = `${currentPlayer}'s turn`;
        
        updateBoard();
    }
    
    // Handle player disconnected event
    function handlePlayerDisconnected() {
        gameActive = false;
        showNotification('Opponent disconnected');
        statusDisplay.textContent = 'Opponent disconnected. Please start a new game.';
    }
    
    // Handle error event
    function handleError(data) {
        showNotification(data.message);
    }
    
    // Handle cell click
    function handleCellClick(event) {
        const clickedCell = event.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-cell-index'));
        
        // Local game mode (no server)
        if (isLocalMode || !socket || !socket.connected) {
            if (!gameActive || gameState[clickedCellIndex] !== '') {
                return;
            }
            
            // Update game state locally
            gameState[clickedCellIndex] = currentPlayer;
            
            // Check for win or draw
            if (checkWin()) {
                gameActive = false;
                statusDisplay.textContent = `Player ${currentPlayer} has won!`;
            } else if (checkDraw()) {
                gameActive = false;
                statusDisplay.textContent = 'Game ended in a draw!';
            } else {
                // Switch player
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
                statusDisplay.textContent = `${currentPlayer}'s turn`;
            }
            
            updateBoard();
            return;
        }
        
        // Online mode
        // Check if it's player's turn and cell is empty
        if (!gameActive || currentPlayer !== playerMark || gameState[clickedCellIndex] !== '') {
            return;
        }
        
        // Emit move to server
        socket.emit('makeMove', { roomId, cellIndex: clickedCellIndex });
    }
    
    // Check for win (local game)
    function checkWin() {
        const winningConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
                return true;
            }
        }
        
        return false;
    }
    
    // Check for draw (local game)
    function checkDraw() {
        return !gameState.includes('');
    }
    
    // Update the board based on game state
    function updateBoard() {
        cells.forEach((cell, index) => {
            cell.textContent = gameState[index];
            cell.classList.remove('x', 'o');
            
            if (gameState[index] === 'X') {
                cell.classList.add('x');
            } else if (gameState[index] === 'O') {
                cell.classList.add('o');
            }
        });
    }
    
    // Restart the game
    function restartGame() {
        if (!isLocalMode && socket && socket.connected && roomId) {
            socket.emit('restartGame', roomId);
        } else {
            // Local restart
            startLocalGame();
        }
    }
    
    // Go back to setup screen
    function goToSetup() {
        gameSection.style.display = 'none';
        setupSection.style.display = 'block';
        
        // Reset game state
        roomId = null;
        playerMark = null;
        gameActive = false;
        gameState = ['', '', '', '', '', '', '', '', ''];
        
        // Clear input
        roomIdInput.value = '';
    }
    
    // Show notification
    function showNotification(message) {
        notificationElement.textContent = message;
        notificationElement.classList.add('show');
        
        setTimeout(() => {
            notificationElement.classList.remove('show');
        }, 3000);
    }
    
    // Initialize the game
    init();
}); 