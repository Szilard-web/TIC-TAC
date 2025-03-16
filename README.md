# Tic Tac Toe Game

A Tic Tac Toe game with both multiplayer and standalone options.

## Features

- Real-time multiplayer gameplay (when server is running)
- Local play option (two players on the same device)
- Room-based system for private games
- Visual feedback for player turns and game status
- Responsive design that works on desktop and mobile
- Notifications for game events
- Different colors for X and O players

## How to Play

### Multiplayer Mode (Requires Node.js)

1. Install Node.js if you don't have it already: [https://nodejs.org/](https://nodejs.org/)

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

5. **Create a Game**: Click "Create New Game" to start a new game room
6. **Share the Room Code**: Share the displayed room code with your friend
7. **Join a Game**: Your friend can enter the room code and click "Join Game"

### Standalone Mode (No Server Required)

If you're having trouble with the server setup or just want to play locally:

1. Open the `standalone.html` file directly in your web browser
2. Play against a friend on the same device by taking turns

## Deployment Options

### Deploy to Glitch

1. Create an account on [Glitch](https://glitch.com/)
2. Click "New Project" and select "Import from GitHub"
3. Enter your GitHub repository URL or upload your files
4. Glitch will automatically detect and install dependencies
5. Your app will be live at a URL like `https://your-project-name.glitch.me`

### Deploy to Replit

1. Create an account on [Replit](https://replit.com/)
2. Create a new Repl and select "Node.js" as the template
3. Upload your project files or import from GitHub
4. In the "Run" button configuration, set the run command to `npm start`
5. Click "Run" to start your server
6. Your app will be available at a URL like `https://repl-name.username.repl.co`

### Deploy to Render

1. Create an account on [Render](https://render.com/)
2. Create a new Web Service
3. Connect your GitHub repository or upload your files
4. Set the build command to `npm install`
5. Set the start command to `npm start`
6. Choose a free plan to start
7. Your app will be available at a URL provided by Render

## Troubleshooting

### PowerShell Execution Policy Issues

If you're on Windows and see an error like:
```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.
```

You can fix this by:

1. Opening PowerShell as Administrator
2. Running: `Set-ExecutionPolicy RemoteSigned`
3. Typing 'Y' to confirm

### Socket.IO Connection Issues

If you can't create or join rooms:

1. Make sure the server is running (`npm start`)
2. Check that you're accessing the game via `http://localhost:3000` and not by opening the HTML file directly
3. If problems persist, use the standalone version by opening `standalone.html` directly in your browser

## Technical Details

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Real-time Communication**: Socket.IO
- **Game Logic**: Implemented on both client and server for validation 