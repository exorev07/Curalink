# 🛠️ Development Guide

## Project Structure

```
project-root/
├── src/                # Frontend React application
│   ├── components/     # React components
│   │   ├── Analytics.jsx    # ML predictions display
│   │   ├── BedCard.jsx     # Individual bed status card
│   │   ├── Dashboard.jsx   # Main dashboard component
│   │   ├── HistoryTable.jsx # Change history table
│   │   ├── LoginPage.jsx   # Authentication page
│   │   ├── Navbar.jsx      # Navigation component
│   │   └── PredictionBox.jsx # ML predictions component
│   ├── contexts/      # React contexts
│   │   └── AuthContext.jsx # Authentication context
│   ├── firebase/      # Firebase configuration
│   │   ├── config.js  # Firebase setup
│   │   └── seedData.js # Sample data utilities
│   ├── utils/         # Utility functions
│   │   ├── bedUtils.js # Bed status utilities
│   │   └── hardwareBed.js # Hardware integration
│   ├── App.jsx       # Main app component
│   ├── main.jsx      # App entry point
│   └── index.css     # Global styles
├── backend/          # Python ML backend
│   ├── app.py       # Flask server
│   ├── ml_model.pkl # Trained prediction model
│   └── requirements.txt # Python dependencies
└── hardware/        # ESP8266 firmware
    └── code.cpp    # Hardware control code
```

## Development Workflow

### **Setting Up Development Environment**
```bash
# Install frontend dependencies
npm install

# Install Python backend dependencies
cd backend
pip install -r requirements.txt
cd ..

# Start backend server (in one terminal)
cd backend
python app.py

# Start frontend development server (in another terminal)
npm run dev

# Open browser to http://localhost:5173
```

### **Hardware Development Setup**
1. Install Arduino IDE
2. Install ESP8266 board support
3. Install required libraries:
   - MFRC522 (RFID)
   - Firebase ESP Client
   - ArduinoJson
   - LiquidCrystal I2C

### **Code Style Guidelines**
- Use functional components with hooks
- Follow React naming conventions
- Use Tailwind for styling
- Keep components focused and reusable
- Write descriptive commit messages

### **Component Development**
- Each component should have a single responsibility
- Use PropTypes or TypeScript for type checking
- Include proper error handling
- Test components in isolation

### **State Management**
- Use React Context for global state
- Keep local state minimal
- Use custom hooks for complex logic

### **Firebase Integration**
- All Firebase operations should handle errors gracefully
- Use real-time listeners for live updates
- Implement offline fallbacks

## Testing

### **Manual Testing Checklist**
- [ ] Login/logout functionality
- [ ] Bed status changes
- [ ] Filter functionality
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Real-time updates

### **Performance Considerations**
- Optimize re-renders with React.memo
- Use lazy loading for routes
- Implement proper error boundaries
- Monitor Firebase usage

## Debugging

### **Common Issues**
1. **Firebase connection errors** - Check config values
2. **Authentication failures** - Verify Firebase Auth setup
3. **Build errors** - Check for missing dependencies
4. **Styling issues** - Verify Tailwind configuration

### **Development Tools**
- React Developer Tools
- Firebase Emulator Suite
- Chrome DevTools
- VS Code with recommended extensions
