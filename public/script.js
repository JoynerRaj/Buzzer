// Socket.IO connection
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
    socket = {
        on: () => {},
        emit: () => {}
    };
}

// DOM elements
const loginScreen = document.getElementById('loginScreen');
const buzzerScreen = document.getElementById('buzzerScreen');
const loginForm = document.getElementById('loginForm');
const playerNameInput = document.getElementById('playerName');
const playerNameDisplay = document.getElementById('playerNameDisplay');
const buzzerBtn = document.getElementById('buzzerBtn');
const statusText = document.getElementById('statusText');
const resultsList = document.getElementById('resultsList');
const participantsList = document.getElementById('participantsList');
const participantCount = document.getElementById('participantCount');

// State
let currentPlayer = null;
let isBuzzerActive = false;
let currentResults = [];
let participants = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupSocketListeners();
});

function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    buzzerBtn.addEventListener('click', handleBuzzerPress);
    
    // Touch support for buzzer (prevents double-tap zoom on mobile)
    buzzerBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (isBuzzerActive && buzzerBtn.disabled === false) {
            handleBuzzerPress();
        }
    }, { passive: false });
    
    // Keyboard support for buzzer
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && isBuzzerActive && buzzerBtn.disabled === false) {
            e.preventDefault();
            handleBuzzerPress();
        }
    });
    
    // Prevent zoom on double-tap for input fields
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('touchstart', (e) => {
            e.target.style.fontSize = '16px'; // Prevents zoom on iOS
        });
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            // Refresh layout after orientation change
            window.scrollTo(0, 0);
            // Force reflow for iOS
            document.body.offsetHeight;
        }, 100);
    });
    
    // iOS-specific fixes
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        // Prevent zoom on double-tap
        document.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
                e.target.style.fontSize = '16px';
            }
        });
        
        // Fix viewport issues on iOS
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover, maximum-scale=1.0');
        }
        
        // Force hardware acceleration
        document.body.style.webkitTransform = 'translateZ(0)';
        document.body.style.transform = 'translateZ(0)';
    }
}

function setupSocketListeners() {
    // Connection events
    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
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
        currentResults = [];
        showNotification(`Round ${data.round} started! Press the buzzer!`, 'success');
        updateUI();
    });

    socket.on('buzzerStopped', () => {
        isBuzzerActive = false;
        showNotification('Round ended!', 'info');
        updateUI();
    });

    socket.on('buzzerReset', () => {
        isBuzzerActive = false;
        currentResults = [];
        participants = [];
        showNotification('Buzzer system reset!', 'info');
        updateUI();
    });

    // Participant events
    socket.on('participantJoined', (participant) => {
        showNotification(`${participant.name} joined the game!`, 'info');
    });

    socket.on('updateParticipants', (participantsList) => {
        participants = participantsList;
        updateParticipantsList();
    });

    // Result events
    socket.on('buzzerResult', (result) => {
        currentResults.push(result);
        updateResultsList();
        
        if (result.participantId === socket.id) {
            showNotification(`You pressed ${result.position}${getOrdinalSuffix(result.position)}!`, 'success');
        } else {
            showNotification(`${result.participantName} pressed ${result.position}${getOrdinalSuffix(result.position)}!`, 'info');
        }
    });

    socket.on('updateResults', (results) => {
        currentResults = results;
        updateResultsList();
    });
}

function handleLogin(e) {
    e.preventDefault();
    
    const playerName = playerNameInput.value.trim();
    if (!playerName) {
        showNotification('Please enter your name!', 'error');
        return;
    }

    // Persist and redirect to buzzer page
    try { localStorage.setItem('playerName', playerName); } catch (_) {}
    window.location.href = '/buzzer.html';
}

function handleBuzzerPress() {
    if (!isBuzzerActive || buzzerBtn.disabled) return;
    
    // Disable buzzer for this player
    buzzerBtn.disabled = true;
    buzzerBtn.style.opacity = '0.5';
    
    // Send buzzer press to server
    socket.emit('buzzerPressed', {});
    
    // Visual feedback
    buzzerBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        buzzerBtn.style.transform = 'scale(1)';
    }, 150);
}

function updateUI() {
    // Update buzzer button state
    buzzerBtn.disabled = !isBuzzerActive;
    buzzerBtn.style.opacity = isBuzzerActive ? '1' : '0.5';
    
    // Update status text
    if (isBuzzerActive) {
        statusText.textContent = '🎯 Round Active - Press the buzzer!';
        statusText.style.color = '#ffd700';
    } else {
        statusText.textContent = '⏳ Waiting for round to start...';
        statusText.style.color = '#fff';
    }
    
    // Update lists
    updateResultsList();
    updateParticipantsList();
}

function updateResultsList() {
    if (currentResults.length === 0) {
        resultsList.innerHTML = '<div class="no-results">No results yet...</div>';
        return;
    }
    
    // Force reflow for iOS Safari
    resultsList.style.display = 'none';
    resultsList.offsetHeight; // Trigger reflow
    
    resultsList.innerHTML = currentResults
        .sort((a, b) => a.position - b.position)
        .map(result => `
            <div class="result-item">
                <span class="position">${result.position}${getOrdinalSuffix(result.position)}</span>
                <span class="name">${result.participantName}</span>
            </div>
        `).join('');
    
    // Show the list again
    resultsList.style.display = 'block';
    
    // Additional iOS fix: ensure scroll position is correct
    if (resultsList.scrollTop > 0) {
        resultsList.scrollTop = 0;
    }
}

function updateParticipantsList() {
    participantCount.textContent = participants.length;
    
    if (participants.length === 0) {
        participantsList.innerHTML = '<div class="no-participants">No participants yet...</div>';
        return;
    }
    
    // Force reflow for iOS Safari
    participantsList.style.display = 'none';
    participantsList.offsetHeight; // Trigger reflow
    
    participantsList.innerHTML = participants
        .map(participant => `
            <div class="participant-item">
                <span class="name">${participant.name}</span>
            </div>
        `).join('');
    
    // Show the list again
    participantsList.style.display = 'block';
    
    // Additional iOS fix: ensure scroll position is correct
    if (participantsList.scrollTop > 0) {
        participantsList.scrollTop = 0;
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

// Add some magic effects
function addMagicEffect(element) {
    element.style.transition = 'all 0.3s ease';
    element.style.transform = 'scale(1.05)';
    element.style.boxShadow = '0 0 20px rgba(255,215,0,0.5)';
    
    setTimeout(() => {
        element.style.transform = 'scale(1)';
        element.style.boxShadow = '';
    }, 300);
}

// Add magic effects to buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('join-btn') || e.target.classList.contains('buzzer-button')) {
        addMagicEffect(e.target);
    }
}); 