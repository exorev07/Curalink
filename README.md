# Hospital Bed Occupancy Management Dashboard

A modern React-based dashboard for managing hospital bed occupancy with real-time Firebase integration.

## 🏥 Features

- **Real-time bed status tracking** with color-coded indicators
- **Ward classification** (ICU, Maternity, General)
- **Patient assignment system** with 30-minute auto-timer
- **Supervisor override system** with secure authentication
- **6-digit patient ID validation** 
- **Firebase Authentication** for secure access
- **Firebase Realtime Database** for live data synchronization
- **Responsive dashboard** with bed grid layout
- **Ward and status filtering** 
- **History tracking** with detailed change logs
- **Visual statistics** overview
- **Modern UI** built with TailwindCSS

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: TailwindCSS
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Auth
- **State Management**: React Context API

## 📊 Bed Status Types

- 🟢 **Unoccupied** - Bed is available for new patients
- 🔴 **Occupied** - Bed is currently occupied by a patient
- 🟠 **Occupied + Cleaning** - Bed is occupied and requires cleaning
- 🟣 **Unoccupied + Cleaning** - Bed is empty but needs cleaning

## 🏥 Ward Classifications

- 🔴 **ICU Ward** - Intensive Care Unit beds
- 🩷 **Maternity Ward** - Maternity and obstetrics beds  
- 🔵 **General Ward** - Standard patient care beds

## � Documentation

- **[🤝 Collaboration Guide](docs/COLLABORATION.md)** - Team workflow and setup
- **[🛠️ Development Guide](docs/DEVELOPMENT.md)** - Development workflow and guidelines  
- **[🚀 Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions

## �🚀 Getting Started

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
│   ├── BedCard.jsx          # Individual bed status card
│   ├── Dashboard.jsx        # Main dashboard component
│   ├── HistoryTable.jsx     # Change history table
│   ├── LoginPage.jsx        # Authentication page
│   └── Navbar.jsx           # Navigation bar
├── contexts/
│   └── AuthContext.jsx      # Authentication context
├── firebase/
│   ├── config.js            # Firebase configuration
│   └── seedData.js          # Sample data seeding
├── App.jsx                  # Main app component
├── main.jsx                 # App entry point
└── index.css                # TailwindCSS imports
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

- **View bed status** in the color-coded grid layout organized by ward
- **Filter beds** by status (All, Occupied, Available, Unoccupied, Cleaning) or by ward (ICU, Maternity, General)
- **Assign patients** with 6-digit patient ID validation and 30-minute timer
- **Monitor changes** in the history table at the bottom

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
- 6 sample beds with different statuses
- Sample history entries
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
