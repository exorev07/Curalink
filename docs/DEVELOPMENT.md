# 🛠️ Development Guide

## Project Structure

```
src/
├── components/          # React components
│   ├── BedCard.jsx     # Individual bed status card
│   ├── Dashboard.jsx   # Main dashboard component
│   ├── HistoryTable.jsx # Change history table
│   ├── LoginPage.jsx   # Authentication page
│   └── Navbar.jsx      # Navigation component
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication context
├── firebase/           # Firebase configuration
│   ├── config.js       # Firebase setup
│   └── seedData.js     # Sample data utilities
├── App.jsx            # Main app component
├── main.jsx           # App entry point
└── index.css          # Global styles
```

## Development Workflow

### **Setting Up Development Environment**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

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
