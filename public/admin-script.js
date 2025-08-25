// Socket.IO connection
const socket = io();

// DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const currentRound = document.getElementById('currentRound');
const buzzerStatus = document.getElementById('buzzerStatus');
const participantCount = document.getElementById('participantCount');
const liveResults = document.getElementById('liveResults');
const participantsList = document.getElementById('participantsList');
const roundHistory = document.getElementById('roundHistory');
const totalParticipants = document.getElementById('totalParticipants');
const totalRounds = document.getElementById('totalRounds');
const avgResponseTime = document.getElementById('avgResponseTime');

// State
let isBuzzerActive = false;
let currentResults = [];
let participants = [];
let roundHistoryData = [];
let roundStartTime = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupSocketListeners();
});

function setupEventListeners() {
    startBtn.addEventListener('click', startBuzzer);
    stopBtn.addEventListener('click', stopBuzzer);
    resetBtn.addEventListener('click', resetBuzzer);
    
    // Touch support for buttons (prevents double-tap zoom)
    const buttons = [startBtn, stopBtn, resetBtn];
    buttons.forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
    });
    
    // Keyboard shortcuts for admin controls
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    if (!isBuzzerActive) startBuzzer();
                    break;
                case 'x':
                    e.preventDefault();
                    if (isBuzzerActive) stopBuzzer();
                    break;
                case 'r':
                    e.preventDefault();
                    resetBuzzer();
                    break;
            }
        }
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            // Refresh layout after orientation change
            window.scrollTo(0, 0);
        }, 100);
    });
}

function setupSocketListeners() {
    // Connection events
    socket.on('connect', () => {
        console.log('Admin connected to server');
        showNotification('Admin panel connected!', 'success');
    });

    socket.on('disconnect', () => {
        console.log('Admin disconnected from server');
        showNotification('Connection lost. Trying to reconnect...', 'warning');
    });

    // Current state
    socket.on('currentState', (data) => {
        isBuzzerActive = data.isActive;
        participants = data.participants;
        currentResults = data.results.filter(r => r.round === data.currentRound);
        updateUI();
    });

    // Buzzer control events
    socket.on('buzzerStarted', (data) => {
        isBuzzerActive = true;
        roundStartTime = new Date();
        currentResults = [];
        showNotification(`Round ${data.round} started!`, 'success');
        updateUI();
    });

    socket.on('buzzerStopped', () => {
        isBuzzerActive = false;
        if (currentResults.length > 0) {
            // Save round to history
            const roundData = {
                round: parseInt(currentRound.textContent),
                results: [...currentResults],
                participantCount: participants.length,
                duration: roundStartTime ? Math.round((new Date() - roundStartTime) / 1000) : 0
            };
            roundHistoryData.push(roundData);
            updateRoundHistory();
        }
        showNotification('Round ended!', 'info');
        updateUI();
    });

    socket.on('buzzerReset', () => {
        isBuzzerActive = false;
        currentResults = [];
        participants = [];
        roundHistoryData = [];
        showNotification('System reset!', 'info');
        updateUI();
    });

    // Participant events
    socket.on('participantJoined', (participant) => {
        showNotification(`${participant.name} joined!`, 'info');
    });

    socket.on('updateParticipants', (participantsList) => {
        participants = participantsList;
        updateParticipantsList();
    });

    // Result events
    socket.on('buzzerResult', (result) => {
        currentResults.push(result);
        updateLiveResults();
        
        // Calculate response time
        if (roundStartTime) {
            const responseTime = Math.round((new Date(result.timestamp) - roundStartTime) / 1000);
            result.responseTime = responseTime;
        }
        
        showNotification(`${result.participantName} pressed ${result.position}${getOrdinalSuffix(result.position)}!`, 'info');
    });

    socket.on('updateResults', (results) => {
        currentResults = results;
        updateLiveResults();
    });
}

function startBuzzer() {
    socket.emit('startBuzzer');
    showNotification('Starting new round...', 'info');
}

function stopBuzzer() {
    socket.emit('stopBuzzer');
    showNotification('Stopping round...', 'info');
}

function resetBuzzer() {
    if (confirm('Are you sure you want to reset the entire system? This will clear all participants and results.')) {
        socket.emit('resetBuzzer');
        showNotification('Resetting system...', 'info');
    }
}

function updateUI() {
    // Update button states
    startBtn.disabled = isBuzzerActive;
    stopBtn.disabled = !isBuzzerActive;
    
    // Update status
    buzzerStatus.textContent = isBuzzerActive ? 'Active' : 'Inactive';
    buzzerStatus.style.color = isBuzzerActive ? '#27ae60' : '#e74c3c';
    
    // Update participant count
    participantCount.textContent = participants.length;
    
    // Update lists
    updateLiveResults();
    updateParticipantsList();
    updateStats();
}

function updateLiveResults() {
    if (currentResults.length === 0) {
        liveResults.innerHTML = '<div class="no-results">No results yet...</div>';
        return;
    }
    
    liveResults.innerHTML = currentResults
        .sort((a, b) => a.position - b.position)
        .map(result => `
            <div class="result-item">
                <span class="result-position">${result.position}${getOrdinalSuffix(result.position)}</span>
                <span class="result-name">${result.participantName}</span>
                ${result.responseTime ? `<span class="result-time">${result.responseTime}s</span>` : ''}
            </div>
        `).join('');
}

function updateParticipantsList() {
    if (participants.length === 0) {
        participantsList.innerHTML = '<div class="no-participants">No participants connected...</div>';
        return;
    }
    
    participantsList.innerHTML = participants
        .map(participant => `
            <div class="participant-item">
                <div class="participant-status"></div>
                <span class="participant-name">${participant.name}</span>
            </div>
        `).join('');
}

function updateRoundHistory() {
    if (roundHistoryData.length === 0) {
        roundHistory.innerHTML = '<div class="no-history">No rounds completed yet...</div>';
        return;
    }
    
    roundHistory.innerHTML = roundHistoryData
        .slice(-5) // Show last 5 rounds
        .reverse()
        .map(round => `
            <div class="round-item">
                <div class="round-header">
                    <span class="round-number">Round ${round.round}</span>
                    <span class="round-participants">${round.participantCount} participants • ${round.duration}s</span>
                </div>
                <div class="round-results">
                    ${round.results
                        .sort((a, b) => a.position - b.position)
                        .slice(0, 6) // Show top 6 results
                        .map(result => `
                            <div class="round-result">
                                <span style="color: #ffd700; font-weight: 700; margin-right: 10px;">
                                    ${result.position}${getOrdinalSuffix(result.position)}
                                </span>
                                <span>${result.participantName}</span>
                            </div>
                        `).join('')}
                </div>
            </div>
        `).join('');
}

function updateStats() {
    // Total participants (unique across all rounds)
    const uniqueParticipants = new Set();
    roundHistoryData.forEach(round => {
        round.results.forEach(result => {
            uniqueParticipants.add(result.participantName);
        });
    });
    totalParticipants.textContent = uniqueParticipants.size;
    
    // Total rounds
    totalRounds.textContent = roundHistoryData.length;
    
    // Average response time
    const allResponseTimes = [];
    roundHistoryData.forEach(round => {
        round.results.forEach(result => {
            if (result.responseTime) {
                allResponseTimes.push(result.responseTime);
            }
        });
    });
    
    if (allResponseTimes.length > 0) {
        const avgTime = Math.round(allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length);
        avgResponseTime.textContent = `${avgTime}s`;
    } else {
        avgResponseTime.textContent = '0s';
    }
}

function getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 1000;
        font-weight: 500;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation keyframes
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Keyboard shortcuts for admin
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 's':
                e.preventDefault();
                if (!isBuzzerActive) {
                    startBuzzer();
                }
                break;
            case 'x':
                e.preventDefault();
                if (isBuzzerActive) {
                    stopBuzzer();
                }
                break;
            case 'r':
                e.preventDefault();
                resetBuzzer();
                break;
        }
    }
});

// Add some visual feedback for button clicks
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('control-btn')) {
        e.target.style.transform = 'scale(0.95)';
        setTimeout(() => {
            e.target.style.transform = '';
        }, 150);
    }
}); 