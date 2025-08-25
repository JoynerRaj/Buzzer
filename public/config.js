// Configure your Socket.IO server URL here. Examples:
// window.SOCKET_SERVER_URL = 'https://your-buzzer-server.example.com';
// window.SOCKET_SERVER_URL = 'https://my-app.onrender.com';
// Leave undefined to use same-origin (requires socket server at deployed origin)
window.SOCKET_SERVER_URL = window.SOCKET_SERVER_URL || undefined;

// Optional: surface a visible warning if not configured in production
(function() {
    var isProd = typeof window !== 'undefined' &&
        location.hostname !== 'localhost' &&
        location.hostname !== '127.0.0.1';
    if (isProd && typeof window !== 'undefined' && typeof window.SOCKET_SERVER_URL === 'undefined') {
        var note = document.createElement('div');
        note.style.cssText = 'position:fixed;bottom:10px;left:10px;background:#e74c3c;color:#fff;padding:8px 12px;border-radius:6px;z-index:9999;font:14px sans-serif;';
        note.textContent = 'Socket server URL not configured. Set window.SOCKET_SERVER_URL in public/config.js';
        document.addEventListener('DOMContentLoaded', function(){
            document.body.appendChild(note);
            setTimeout(function(){ if (note.parentNode) note.parentNode.removeChild(note); }, 6000);
        });
    }
})();


