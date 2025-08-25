// Restore player name from storage and guard route
const storedName = localStorage.getItem('playerName');
if (!storedName) {
    window.location.replace('/');
}

// Socket connection
let socket;
try {
    if (typeof io !== 'undefined') {
        socket = io(window.SOCKET_SERVER_URL || undefined, {
            transports: ['websocket', 'polling']
        });
    } else {
        throw new Error('Socket.IO client not loaded');
    }
} catch (err) {
    console.warn('Socket disabled:', err && err.message ? err.message : err);
    socket = { on: () => {}, emit: () => {} };
}

// DOM
const playerNameDisplay = document.getElementById('playerNameDisplay');
const buzzerBtn = document.getElementById('buzzerBtn');
const statusText = document.getElementById('statusText');
const resultsList = document.getElementById('resultsList');
const participantsList = document.getElementById('participantsList');
const participantCount = document.getElementById('participantCount');

// State
let isBuzzerActive = false;
let currentResults = [];
let participants = [];

document.addEventListener('DOMContentLoaded', () => {
    playerNameDisplay.textContent = storedName || '';
    setupEventListeners();
    setupSocketListeners();
    // Register with server when connected
});

function setupEventListeners() {
    buzzerBtn.addEventListener('click', handleBuzzerPress);

    buzzerBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (isBuzzerActive && buzzerBtn.disabled === false) {
            handleBuzzerPress();
        }
    }, { passive: false });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && isBuzzerActive && buzzerBtn.disabled === false) {
            e.preventDefault();
            handleBuzzerPress();
        }
    });
}

function setupSocketListeners() {
    socket.on('connect', () => {
        socket.emit('register', { name: storedName });
    });

    socket.on('currentState', (data) => {
        isBuzzerActive = data.isActive;
        participants = data.participants;
        currentResults = data.results.filter(r => r.round === data.currentRound);
        updateUI();
    });

    socket.on('buzzerStarted', (data) => {
        isBuzzerActive = true;
        currentResults = [];
        updateUI();
    });

    socket.on('buzzerStopped', () => {
        isBuzzerActive = false;
        updateUI();
    });

    socket.on('buzzerReset', () => {
        isBuzzerActive = false;
        currentResults = [];
        participants = [];
        updateUI();
    });

    socket.on('updateParticipants', (list) => {
        participants = list;
        updateParticipantsList();
    });

    socket.on('buzzerResult', (result) => {
        currentResults.push(result);
        updateResultsList();
    });

    socket.on('updateResults', (results) => {
        currentResults = results;
        updateResultsList();
    });
}

function handleBuzzerPress() {
    if (!isBuzzerActive || buzzerBtn.disabled) return;
    buzzerBtn.disabled = true;
    buzzerBtn.style.opacity = '0.5';
    socket.emit('buzzerPressed', {});
    buzzerBtn.style.transform = 'scale(0.95)';
    setTimeout(() => { buzzerBtn.style.transform = 'scale(1)'; }, 150);
}

function updateUI() {
    buzzerBtn.disabled = !isBuzzerActive;
    buzzerBtn.style.opacity = isBuzzerActive ? '1' : '0.5';
    statusText.textContent = isBuzzerActive ? '🎯 Round Active - Press the buzzer!' : '⏳ Waiting for round to start...';
    statusText.style.color = isBuzzerActive ? '#ffd700' : '#fff';
    updateResultsList();
    updateParticipantsList();
}

function updateResultsList() {
    if (currentResults.length === 0) {
        resultsList.innerHTML = '<div class="no-results">No results yet...</div>';
        return;
    }
    resultsList.innerHTML = currentResults
        .sort((a, b) => a.position - b.position)
        .map(r => `<div class="result-item"><span class="position">${r.position}${getOrdinalSuffix(r.position)}</span><span class="name">${r.participantName}</span></div>`)
        .join('');
}

function updateParticipantsList() {
    participantCount.textContent = participants.length;
    if (participants.length === 0) {
        participantsList.innerHTML = '<div class="no-participants">No participants yet...</div>';
        return;
    }
    participantsList.innerHTML = participants
        .map(p => `<div class="participant-item"><span class="name">${p.name}</span></div>`)
        .join('');
}

function getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
}


