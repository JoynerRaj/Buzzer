# 🎭 UnlockTheWishes - Aladdin Buzzer System

A beautiful, real-time buzzer system for college events with an UnlockTheWishes theme. Students can log in with their names and compete to press the buzzer first, with live leaderboards and admin controls.

## ✨ Features

- **🎨 UnlockTheWishes Theme**: Beautiful desert-inspired design with magic carpet and lamp animations
- **👥 Student Login**: Students enter their names to join the competition
- **⚡ Real-time Buzzer**: Instant buzzer response with live updates
- **🏆 Live Leaderboard**: Shows 1st, 2nd, 3rd, etc. in real-time
- **🎮 Admin Panel**: Complete control panel for event organizers
- **📊 Statistics**: Track participants, rounds, and response times
- **📱 Responsive**: Works on desktop, tablet, and mobile devices
- **⌨️ Keyboard Support**: Spacebar to press buzzer

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Access the system:**
   - **Participants**: Open `http://localhost:3000` in multiple browser tabs
   - **Admin Panel**: Open `http://localhost:3000/admin` in a separate tab

## 🎯 How to Use

### For Students (Participants)

1. **Join the Game:**
   - Open the participant URL in your browser
   - Enter your name in the login screen
   - Click "Join the Magic"

2. **Press the Buzzer:**
   - Wait for the round to start (admin will control this)
   - When active, click the red buzzer button or press Spacebar
   - See your position in the live leaderboard

3. **View Results:**
   - Watch the live leaderboard for current round results
   - See who pressed 1st, 2nd, 3rd, etc.
   - View all connected participants

### For Event Organizers (Admin)

1. **Access Admin Panel:**
   - Open `http://localhost:3000/admin`
   - Monitor connected participants

2. **Control Rounds:**
   - **Start Round**: Click "Start Round" to begin a new buzzer round
   - **Stop Round**: Click "Stop Round" to end the current round
   - **Reset System**: Click "Reset System" to clear all data

3. **Monitor Activity:**
   - View live results as they happen
   - See participant list and statistics
   - Track round history and response times

## 🎮 Admin Controls

### Button Controls
- **Start Round**: Begins a new buzzer round
- **Stop Round**: Ends the current round
- **Reset System**: Clears all participants and results

### Keyboard Shortcuts
- `Ctrl/Cmd + S`: Start round
- `Ctrl/Cmd + X`: Stop round  
- `Ctrl/Cmd + R`: Reset system

### Statistics Tracked
- **Total Participants**: Unique participants across all rounds
- **Rounds Completed**: Number of finished rounds
- **Average Response Time**: Average time to press buzzer

## 🎨 Theme Elements

- **Magic Lamp**: Animated lamp on login screen
- **Magic Carpet**: Floating carpet above buzzer button
- **Desert Colors**: Gold, orange, and blue gradient backgrounds
- **Genie Smoke**: Animated smoke effect from lamp
- **Star Background**: Twinkling stars in the background

## 📱 Device Support

- **Desktop**: Full experience with all features
- **Tablet**: Optimized layout for touch interaction
- **Mobile**: Responsive design for smartphones

## 🔧 Technical Details

### Technology Stack
- **Backend**: Node.js with Express
- **Real-time**: Socket.IO for live updates
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Custom CSS with animations

### File Structure
```
Buzzer/
├── server.js              # Main server file
├── package.json           # Dependencies
├── public/
│   ├── index.html         # Participant interface
│   ├── admin.html         # Admin panel
│   ├── styles.css         # Participant styles
│   ├── admin-styles.css   # Admin styles
│   ├── script.js          # Participant JavaScript
│   └── admin-script.js    # Admin JavaScript
└── README.md              # This file
```

## 🎪 Event Setup Tips

### Before the Event
1. **Test the System**: Run a test with a few participants
2. **Network Setup**: Ensure stable internet connection
3. **Device Preparation**: Have admin panel ready on organizer's device

### During the Event
1. **Welcome Participants**: Share the participant URL with students
2. **Monitor Connections**: Watch participant count in admin panel
3. **Manage Rounds**: Start/stop rounds as needed
4. **Announce Results**: Use the live leaderboard for announcements

### Best Practices
- **Clear Instructions**: Explain the buzzer system to participants
- **Fair Play**: Ensure all participants have equal access
- **Backup Plan**: Have alternative buzzer method ready
- **Engagement**: Use the Aladdin theme to create excitement

## 🐛 Troubleshooting

### Common Issues

**Participants can't connect:**
- Check if server is running (`npm start`)
- Verify correct URL (`http://localhost:3000`)
- Check network connectivity

**Buzzer not responding:**
- Ensure round is active (green status in admin)
- Check if participant is logged in
- Try refreshing the page

**Admin panel not working:**
- Access correct URL (`http://localhost:3000/admin`)
- Check browser console for errors
- Restart server if needed

### Performance Tips
- **Limit Participants**: System works best with 50+ participants
- **Stable Network**: Use wired connection for admin device
- **Browser Compatibility**: Use modern browsers (Chrome, Firefox, Safari)

## 🎉 Customization

### Changing Theme
- Modify colors in `styles.css` and `admin-styles.css`
- Update animations and effects
- Customize fonts and images

### Adding Features
- Extend server functionality in `server.js`
- Add new UI elements in HTML files
- Implement additional statistics

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to contribute improvements, bug fixes, or new features!

---

**🎭 Ready to create some magic at your college event!** ✨ 