const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files
app.use(express.static(__dirname));

// Game rooms
const rooms = {};

io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    // Create a new game room
    socket.on('createRoom', () => {
        const roomId = generateRoomId();
        rooms[roomId] = {
            id: roomId,
            players: [{ id: socket.id, mark: 'X' }],
            gameState: ['', '', '', '', '', '', '', '', ''],
            currentPlayer: 'X',
            gameActive: true
        };
        
        socket.join(roomId);
        socket.emit('roomCreated', { roomId, playerMark: 'X' });
        console.log(`Room created: ${roomId} by player ${socket.id}`);
    });

    // Join an existing room
    socket.on('joinRoom', (roomId) => {
        const room = rooms[roomId];
        
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        
        if (room.players.length >= 2) {
            socket.emit('error', { message: 'Room is full' });
            return;
        }
        
        room.players.push({ id: socket.id, mark: 'O' });
        socket.join(roomId);
        
        socket.emit('roomJoined', { roomId, playerMark: 'O', gameState: room.gameState });
        io.to(roomId).emit('gameStart', { gameState: room.gameState, currentPlayer: room.currentPlayer });
        
        console.log(`Player ${socket.id} joined room ${roomId}`);
    });

    // Handle player moves
    socket.on('makeMove', ({ roomId, cellIndex }) => {
        const room = rooms[roomId];
        
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        
        const player = room.players.find(p => p.id === socket.id);
        
        if (!player) {
            socket.emit('error', { message: 'Player not found in room' });
            return;
        }
        
        if (!room.gameActive || room.currentPlayer !== player.mark || room.gameState[cellIndex] !== '') {
            return;
        }
        
        // Update game state
        room.gameState[cellIndex] = player.mark;
        
        // Check for win or draw
        const gameResult = checkGameResult(room);
        
        if (gameResult.status === 'win') {
            room.gameActive = false;
            io.to(roomId).emit('gameUpdate', { 
                gameState: room.gameState, 
                result: { status: 'win', winner: player.mark } 
            });
        } else if (gameResult.status === 'draw') {
            room.gameActive = false;
            io.to(roomId).emit('gameUpdate', { 
                gameState: room.gameState, 
                result: { status: 'draw' } 
            });
        } else {
            // Switch player
            room.currentPlayer = room.currentPlayer === 'X' ? 'O' : 'X';
            io.to(roomId).emit('gameUpdate', { 
                gameState: room.gameState, 
                currentPlayer: room.currentPlayer 
            });
        }
    });

    // Handle restart game
    socket.on('restartGame', (roomId) => {
        const room = rooms[roomId];
        
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        
        room.gameState = ['', '', '', '', '', '', '', '', ''];
        room.currentPlayer = 'X';
        room.gameActive = true;
        
        io.to(roomId).emit('gameRestarted', { 
            gameState: room.gameState, 
            currentPlayer: room.currentPlayer 
        });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Find and clean up any rooms the player was in
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            
            if (playerIndex !== -1) {
                io.to(roomId).emit('playerDisconnected');
                delete rooms[roomId];
                console.log(`Room ${roomId} deleted after player ${socket.id} disconnected`);
                break;
            }
        }
    });
});

// Helper functions
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function checkGameResult(room) {
    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (room.gameState[a] && room.gameState[a] === room.gameState[b] && room.gameState[a] === room.gameState[c]) {
            return { status: 'win' };
        }
    }
    
    if (!room.gameState.includes('')) {
        return { status: 'draw' };
    }
    
    return { status: 'ongoing' };
}

// Add a route for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Use environment variable for port or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 