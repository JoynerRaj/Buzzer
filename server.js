const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store buzzer data
let buzzerData = {
  isActive: false,
  participants: [],
  results: [],
  currentRound: 1,
  hasStartedBefore: false
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send current state to new connections
  socket.emit('currentState', buzzerData);

  // Handle participant registration
  socket.on('register', (data) => {
    const participant = {
      id: socket.id,
      name: data.name,
      joinedAt: new Date()
    };
    
    buzzerData.participants.push(participant);
    io.emit('participantJoined', participant);
    io.emit('updateParticipants', buzzerData.participants);
  });

  // Handle buzzer press
  socket.on('buzzerPressed', (data) => {
    if (!buzzerData.isActive) return;

    const participant = buzzerData.participants.find(p => p.id === socket.id);
    if (!participant) return;

    // Check if this participant already pressed in this round
    const alreadyPressed = buzzerData.results.some(r => 
      r.round === buzzerData.currentRound && r.participantId === socket.id
    );

    if (!alreadyPressed) {
      const result = {
        round: buzzerData.currentRound,
        participantId: socket.id,
        participantName: participant.name,
        position: buzzerData.results.filter(r => r.round === buzzerData.currentRound).length + 1,
        timestamp: new Date()
      };

      buzzerData.results.push(result);
      io.emit('buzzerResult', result);
      io.emit('updateResults', buzzerData.results.filter(r => r.round === buzzerData.currentRound));
    }
  });

  // Admin controls
  socket.on('startBuzzer', () => {
    buzzerData.isActive = true;
    
    // If this is the first time ever starting, keep as Round 1
    // If we've started before, increment to next round
    if (buzzerData.hasStartedBefore) {
      buzzerData.currentRound++;
    } else {
      buzzerData.hasStartedBefore = true;
    }
    
    // Clear results for the new round
    buzzerData.results = buzzerData.results.filter(r => r.round < buzzerData.currentRound);
    
    io.emit('buzzerStarted', { round: buzzerData.currentRound });
  });

  socket.on('stopBuzzer', () => {
    buzzerData.isActive = false;
    io.emit('buzzerStopped');
  });

  socket.on('resetBuzzer', () => {
    buzzerData = {
      isActive: false,
      participants: [],
      results: [],
      currentRound: 1,
      hasStartedBefore: false
    };
    io.emit('buzzerReset');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    buzzerData.participants = buzzerData.participants.filter(p => p.id !== socket.id);
    io.emit('updateParticipants', buzzerData.participants);
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces
server.listen(PORT, HOST, () => {
  console.log(`🎭 UnlockTheWishes Buzzer System running on port ${PORT}`);
  console.log(`📱 Participants: http://localhost:${PORT} or http://192.168.36.253:${PORT}`);
  console.log(`🎮 Admin Panel: http://localhost:${PORT}/admin or http://192.168.36.253:${PORT}/admin`);
}); 