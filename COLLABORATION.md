## 🎯 **Repository Information**

- **GitHub Repository:** https://github.com/exorev07/Hospital-Bed-management-System
- **Owner:** exorev07 (ekansharohi1305@gmail.com)
- **Clone URL:** `git clone https://github.com/exorev07/Hospital-Bed-management-System.git`

## 👥 **Adding Collaborators**

1. Go to: https://github.com/exorev07/Hospital-Bed-management-System/settings/access
2. Click **"Add people"**
3. Enter your teammate's GitHub username or email
4. Select **"Write"** permission level
5. Send invitation

## 🤝 Collaboration Guide

## Getting Started for Your Teammate

### 1. **Clone the Repository**
Your teammate can clone the repository with:
```bash
git clone https://github.com/exorev07/Hospital-Bed-management-System.git
cd Hospital-Bed-management-System
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Start Development Server**
```bash
npm run dev
```

### 4. **Open in Browser**
Navigate to `http://localhost:5173`

## 🔥 Firebase Setup (Optional)

### For Real Firebase Integration:
1. **Create Firebase Project** at [console.firebase.google.com](https://console.firebase.google.com)
2. **Enable Services:**
   - Authentication (Email/Password)
   - Realtime Database
3. **Get Configuration:**
   - Go to Project Settings → General
   - Scroll to "Your apps" → Web app
   - Copy the configuration object
4. **Update Config:**
   - Replace values in `src/firebase/config.js`
   - Commit and push changes

### Environment Variables (Recommended):
Create `.env.local` file:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_DATABASE_URL=your-database-url
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 🚀 Development Workflow

### **Daily Workflow:**
```bash
# Start work session
git pull origin main              # Get latest changes
npm run dev                       # Start dev server

# During development
git add .                         # Stage changes
git commit -m "descriptive message"  # Commit changes
git push origin main              # Push to shared repo
```

### **Feature Development:**
```bash
# Create feature branch
git checkout -b feature/add-patient-info
# Work on feature...
git add .
git commit -m "Add patient information to bed cards"
git push origin feature/add-patient-info
# Create Pull Request on GitHub
```

## 📋 Task Division Suggestions

### **Frontend Tasks:**
- 🎨 **UI/UX Improvements:** Better styling, animations, responsive design
- 📱 **Mobile Optimization:** Touch-friendly controls, mobile layouts
- 🔍 **Search & Filters:** Advanced filtering, search by nurse/staff
- 📊 **Charts & Analytics:** Occupancy trends, usage statistics
- 🖨️ **Reports:** Printable reports, export features

### **Backend/Data Tasks:**
- 🔥 **Firebase Features:** Real-time notifications, user roles
- 🏥 **Hospital Features:** Patient info, medical records integration
- 📈 **Analytics:** Usage tracking, performance metrics
- 🔒 **Security:** Better authentication, role-based access
- 🔄 **Data Management:** Backup, data validation, bulk operations

### **DevOps/Quality Tasks:**
- 🧪 **Testing:** Unit tests, integration tests, E2E tests
- 🚀 **Deployment:** Hosting setup, CI/CD pipelines
- 📝 **Documentation:** API docs, user guides, setup instructions
- 🔧 **Tooling:** Development tools, code quality, linting

## 🛠️ Recommended Extensions

### **VS Code Extensions:**
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Firebase Explorer
- GitLens
- Prettier - Code formatter
- Auto Rename Tag

## 📞 Communication Tools

### **Recommended:**
- **Discord/Slack:** Daily communication
- **GitHub Issues:** Track bugs and features
- **GitHub Projects:** Project management
- **Figma:** UI/UX design collaboration

## 🎯 Current Project Status

### **✅ Completed:**
- React + Vite setup with TailwindCSS
- Firebase configuration (demo mode)
- Authentication system
- Dashboard with bed management
- Status tracking and history
- Responsive design

### **🔄 In Progress:**
- Real Firebase integration
- Enhanced error handling

### **📝 TODO:**
- Patient information integration
- Advanced filtering options
- Notification system
- Mobile app version
- Admin panel

## 🚨 Important Notes

- **Always pull before starting work:** `git pull origin main`
- **Use descriptive commit messages**
- **Test before pushing:** Make sure `npm run dev` works
- **Don't commit sensitive data:** Use `.env.local` for API keys
- **Communicate changes:** Let teammate know about major changes
