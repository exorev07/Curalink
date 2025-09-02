# 🚀 Deployment Guide

## Production Deployment

### 1. **Firebase Setup**
Before deploying, ensure you have:
- Firebase project created
- Realtime Database enabled
- Authentication configured
- Firebase config updated in `src/firebase/config.js`

### 2. **Environment Variables**
Create `.env.production` with your Firebase credentials:
```
VITE_FIREBASE_API_KEY=your-production-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. **Build for Production**
```bash
npm run build
```

### 4. **Deployment Options**

#### **Option A: Firebase Hosting**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

#### **Option B: Vercel**
```bash
npm install -g vercel
vercel
```

#### **Option C: Netlify**
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### 5. **Post-Deployment**
- Test all authentication flows
- Verify Firebase connection
- Check mobile responsiveness
- Test bed status updates
- Validate history tracking

## Security Considerations
- Enable Firebase security rules
- Set up proper CORS policies
- Configure authentication domains
- Enable Firebase App Check
