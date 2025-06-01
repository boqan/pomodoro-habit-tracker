
# Smart Pomodoro 2.0 - Anti-Procrastination Edition

A modern, feature-rich Pomodoro timer designed to combat procrastination with proven psychological techniques, gamification, and seamless offline functionality.

## 🎯 Features

### Core Timer
- **Customizable Focus/Break Periods**: Adjust focus (1-60 min) and break (1-30 min) durations
- **Visual Countdown**: Beautiful circular progress indicator with smooth animations
- **Audio & Vibration**: Session completion notifications (where supported)
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

### Anti-Procrastination Hacks
1. **Intent Prompt**: Forces you to clarify your session purpose before starting
2. **2-Minute Rule Quick Start**: Pre-defined micro-tasks to overcome starting friction
3. **Streak-Based Habits**: Visual habit tracking with loss-aversion psychology
4. **XP & Leveling System**: Gamified progress with confetti celebrations
5. **Distraction Shield**: Optional full-screen focus mode (exit with ESC)

### Task & Habit Management
- **Task List**: Add, complete, and delete tasks with progress tracking
- **Daily Habits**: Track streaks with beautiful ring progress indicators
- **Session Integration**: Link tasks and habits to focus sessions

### PWA & Performance
- **Offline First**: Works completely offline with service worker caching
- **Installable**: Add to home screen on mobile/desktop
- **Fast Loading**: Optimized for 90+ Lighthouse Performance score
- **Local Storage**: All data persists locally using browser storage

### Accessibility & SEO
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **SEO Optimized**: Structured data, meta tags, and sitemap
- **Color Contrast**: WCAG AA compliant color schemes

## 🚀 Quick Start

### Local Development
```bash
# Clone and install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Browser Support
- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Mobile browsers with PWA support

## 🎮 How to Use

1. **Set Timer**: Adjust focus and break durations to your preference
2. **Enable Shield**: Toggle distraction shield for full-screen focus mode
3. **Start Session**: Click "Start Focus" and set your session intent
4. **Track Progress**: Add tasks and habits to track alongside your sessions
5. **Earn XP**: Complete sessions to gain experience points and level up
6. **Build Streaks**: Maintain daily habits for visual streak rewards

### Quick Start Tips
- Use the "Quick Start" button for common 2-minute tasks
- Enable distraction shield for important work sessions
- Check off habits immediately after completing them
- Set specific, actionable intents for better focus

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: Custom React hooks
- **Data Persistence**: Browser localStorage
- **PWA**: Service Worker + Web App Manifest
- **Build Tool**: Vite

### Key Components
- `SmartPomodoro`: Main app container with timer logic
- `TaskManager`: CRUD operations for task list
- `HabitTracker`: Streak tracking with visual indicators
- `SessionCompleteModal`: Post-session habit marking and XP display
- `DistractionShield`: Full-screen focus overlay
- `Confetti`: Celebration animation for level-ups

### Hooks
- `useTimer`: Timer state and countdown logic
- `useDatabase`: Local data persistence and CRUD operations

## 📱 PWA Installation

### Desktop
1. Visit the app in Chrome/Edge
2. Click the install button in the address bar
3. Or use the floating "Install App" button

### Mobile
1. Open in mobile browser
2. Tap "Add to Home Screen" from browser menu
3. App will work offline and feel native

## 🎨 Design Philosophy

### Color Psychology
- **Blue Gradients**: Promote focus and calm
- **Green Accents**: Positive reinforcement for completed actions
- **Orange/Yellow**: Energy and motivation for streaks/XP

### Micro-Interactions
- **Smooth Transitions**: 200-300ms easing for all state changes
- **Visual Feedback**: Hover states, button ripples, progress animations
- **Confetti Celebrations**: Dopamine hits for major achievements
- **Streak Rings**: Satisfying visual progress for habit building

## 🔒 Privacy & Data

- **100% Local**: No data leaves your device
- **No Analytics**: No tracking or telemetry
- **No Accounts**: No sign-up required
- **Offline First**: Works without internet connection

## 📈 Performance Targets

- **Lighthouse Performance**: 90+ score
- **First Contentful Paint**: < 1.5s
- **Bundle Size**: < 150KB gzipped
- **Time to Interactive**: < 3s

## 🤝 Contributing

This project uses standard React/TypeScript patterns:

1. Components in `/src/components/`
2. Hooks in `/src/hooks/`
3. Styles with Tailwind CSS
4. Type safety with TypeScript

## 📄 License

MIT License - feel free to use and modify for personal or commercial projects.

---

**Built with ❤️ for better focus and productivity**
