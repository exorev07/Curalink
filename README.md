# 🏥 CuraLink - Smart Hospital Bed Management System

A comprehensive IoT-enabled hospital bed occupancy management system with real-time hardware integration, ML-powered predictions, and intelligent dashboard monitoring for efficient healthcare resource management.

## 🏥 System Components

### 1. Smart Bed Monitoring Hardware
- ESP8266-based intelligent bed monitoring
- Temperature and weight-based occupancy detection
- RFID staff verification system
- Real-time status indication via LCD and LED
- Automated cleaning status management

### 2. Real-time Dashboard
- Modern React-based web interface
- Real-time bed status monitoring
- Staff authentication and access control
- Comprehensive bed management features

## 🚀 Features

- **🔧 Hardware Integration**
  - ESP8266 + MLX90614 temperature sensor + FSR pressure sensor
  - Real-time occupancy detection with body heat and weight sensing
  - 12-second connection timeout with automatic offline detection
  - Hardware status logging (online/offline transitions)
  - Temperature and pressure data display on dashboard

- **📊 Smart Dashboard**
  - Real-time bed status with color-coded indicators
  - Ward-wise organization (ICU, Maternity, General)
  - Advanced filtering system (Available, Occupied, Unoccupied, Cleaning, By Ward)
  - Supervisor override system with persistent state management
  - Patient assignment with 6-digit ID validation and 30-minute timer
  - Responsive design with collapsible ward sections
  - Status summary cards with counts by type

- **📈 Analytics & History**
  - Recent changes display (limited to 5 entries with "View All" option)
  - Full history page with statistics and comprehensive logging
  - Hardware connection status tracking in history
  - ML-powered hourly patient predictions (26 expected patients)
  - Real-time status change notifications

- **🔐 Security & Authentication**
  - Firebase Authentication with persistent login
  - Supervisor override with dual authentication (Employee ID + Password)
  - Comprehensive audit logging with timestamps and staff IDs
  - Secure real-time database with Firebase rules

- **🎨 User Experience**
  - Modern TailwindCSS styling with consistent color scheme
  - Smooth animations and hover effects
  - Navbar with Dashboard, Analytics, and Logs navigation
  - Auto-scroll to top on page navigation
  - Compact sensor data display for space efficiency

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS
- **Database**: Firebase Realtime Database + Authentication
- **Hardware**: ESP8266 + MLX90614 (Temperature) + FSR (Pressure)
- **Backend**: Python Flask + scikit-learn (ML Predictions)
- **State Management**: React Context API + Firebase Listeners
- **Deployment**: Node.js environment with real-time synchronization

## 📊 Bed Status Types

- 🟢 **Unoccupied** - Patient assigned but temporarily away from bed
- 🔴 **Occupied** - Patient currently on the bed  
- 🟠 **Occupied (Cleaning)** - Patient on bed that requires cleaning
- 🟡 **Unoccupied (Cleaning)** - Empty bed that needs cleaning
- ⚫ **Unassigned** - Bed available for new patient assignment
- 🔘 **Hardware Offline** - ESP8266 sensor disconnected (Bed 1 only)

## 🏥 Ward Classifications

- 🔴 **ICU Ward** - Intensive Care Unit beds with hardware integration for Bed 1
- 💛 **Maternity Ward** - Maternity and obstetrics beds with custom status tracking
- 🔵 **General Ward** - Standard patient care beds with automated cleaning status

## 📚 Documentation

- **[🤝 Collaboration Guide](docs/COLLABORATION.md)** - Team workflow and setup
- **[🛠️ Development Guide](docs/DEVELOPMENT.md)** - Development workflow and guidelines  
- **[🚀 Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[⚡ Hardware Setup](docs/HARDWARE.md)** - Hardware assembly and configuration

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project with Realtime Database enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bed-occupancy-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable **Authentication** with Email/Password provider
   - Enable **Realtime Database** in test mode
   - Get your Firebase configuration from Project Settings

4. **Configure Firebase**
   - Open `src/firebase/config.js`
   - Replace the placeholder values with your actual Firebase config:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-actual-api-key",
     authDomain: "your-project-id.firebaseapp.com",
     databaseURL: "https://your-project-id-default-rtdb.firebaseio.com/",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "your-messaging-sender-id",
     appId: "your-app-id"
   };
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/
│   ├── Analytics.jsx        # Analytics and predictions page
│   ├── BedCard.jsx          # Individual bed status card with hardware integration
│   ├── Dashboard.jsx        # Main dashboard with filtering and ward management
│   ├── FullHistory.jsx      # Complete history page with statistics
│   ├── HistoryTable.jsx     # Recent changes table component
│   ├── LoginPage.jsx        # Authentication page
│   ├── Navbar.jsx           # Navigation bar with Dashboard/Analytics/Logs
│   └── PredictionBox.jsx    # ML prediction display component
├── contexts/
│   └── AuthContext.jsx      # Authentication context with persistent login
├── firebase/
│   ├── bedManager.js        # Bed status management and logging functions
│   ├── config.js            # Firebase configuration
│   ├── seedData.js          # Sample data seeding utilities
│   └── statusResolver.js    # Status resolution and validation
├── services/
│   └── PredictionService.js # ML prediction API integration
├── utils/
│   ├── bedUtils.js          # Bed status utilities and color mappings
│   ├── hardwareBed.js       # ESP8266 hardware integration and monitoring
│   └── statusMapping.js     # Status conversion and mapping utilities
├── App.jsx                  # Main app with navigation routing
├── main.jsx                 # App entry point
└── index.css                # TailwindCSS imports and custom styles
backend/
├── app.py                   # Flask ML prediction server
├── ml_model.pkl             # Trained scikit-learn model
└── requirements.txt         # Python dependencies
hardware/
├── ESP8266 Code/
│   ├── code.cpp            # Main ESP8266 firmware with sensor integration
│   └── hardware_only_code.cpp # Hardware-only version
└── Schematic/
    ├── Curalink.fzz        # Fritzing schematic file
    └── Curalink_schematic.png # Circuit diagram
```

## 🔥 Firebase Database Structure

```json
{
  "beds": {
    "bed1": {
      "status": "unoccupied",
      "lastUpdate": "2025-09-02T14:00:00",
      "assignedNurse": "",
      "cleaningStaff": ""
    },
    "bed2": {
      "status": "occupied",
      "lastUpdate": "2025-09-02T13:30:00",
      "assignedNurse": "NURSE45",
      "cleaningStaff": ""
    }
  },
  "history": {
    "entry1": {
      "bedId": "bed1",
      "status": "occupied",
      "assignedNurse": "NURSE45",
      "cleaningStaff": "",
      "timestamp": "2025-09-02T14:00:00"
    }
  }
}
```

## 🎯 Usage

### First Time Setup

1. **Create an account** or sign in using the login page
2. **Seed sample data** by clicking the "Seed Sample Data" button when prompted
3. **Explore the dashboard** to see bed statuses and statistics

### Managing Beds

- **View bed status** in color-coded cards organized by ward with real-time updates
- **Filter beds** using the priority-ordered dropdown: All → Available → Occupied → Unoccupied → Cleaning
- **Filter by ward** (ICU, Maternity, General) with collapsible sections
- **Assign patients** with 6-digit ID validation and 30-minute auto-expiration timer
- **Monitor hardware** - Bed 1 shows live temperature, pressure, and connection status
- **View recent changes** (last 5) with "View All Changes" button for complete history
- **Navigate** between Dashboard, Analytics, and Logs using the top navigation

### Hardware Integration (Bed 1)

- **Real-time monitoring** with ESP8266 + MLX90614 temperature + FSR pressure sensors
- **Connection status** - Shows "🟢 Connected" or "🔴 Hardware Not Connected"
- **Sensor data display** - Temperature (°C) and pressure values with detection indicators
- **Automatic offline detection** - 12-second timeout with "Hardware Offline" status
- **Status logging** - All hardware connect/disconnect events logged in history

### 🔐 Supervisor Override

The system includes a secure supervisor override feature for authorized personnel:

**Valid Supervisor Credentials:**
- **Employee ID:** `220306` or `130506`
- **Password:** `admin@123`

**Features:**
- Always-visible supervisor override buttons on every bed
- Employee ID must be exactly 6 digits
- Real-time validation with error messages
- Comprehensive audit logging with Employee ID and timestamp
- Manual bed status changes for emergency situations

### Status Changes

All status changes are automatically:
- ✅ Saved to Firebase Realtime Database
- ✅ Logged in the history table
- ✅ Updated across all connected clients in real-time

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🚧 Development Notes

### Sample Data

The app includes a `seedData.js` file that provides:
- 6 sample beds across 3 wards:
  - ICU Ward (Beds 1-2): Bed 1 with hardware integration
  - Maternity Ward (Beds 3-4): Standard monitoring
  - General Ward (Beds 5-6): Standard monitoring
- Automatic status synchronization for hardware-integrated bed
- Sample history entries with timestamps
- Easy data seeding function for testing

### Real-time Updates

The dashboard uses Firebase Realtime Database listeners to provide:
- Instant updates across all connected clients
- Automatic synchronization of bed status changes
- Live history updates

### Authentication

- Simple email/password authentication
- Persistent login state
- Secure access to dashboard features

## 🔒 Security Considerations

For production deployment:

1. **Configure Firebase Security Rules**
2. **Enable Firebase App Check**
3. **Set up proper CORS policies**
4. **Use environment variables** for sensitive config
5. **Implement proper user roles** and permissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Firebase connection errors**
   - Verify your Firebase config is correct
   - Check if Realtime Database is enabled
   - Ensure authentication is set up

2. **Build errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility

3. **CSS not loading**
   - Verify TailwindCSS configuration
   - Check PostCSS config is correct

### Support

If you encounter any issues, please check the console for error messages and ensure all Firebase services are properly configured.
