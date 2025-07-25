# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Comprehensive timer application built with Next.js 14 (App Router) and Tailwind CSS, designed for students. Features gamification elements, customizable themes, multiple timer modes, and extensive educational commenting for coding beginners.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Project Structure

```
timerapp/
├── app/
│   ├── page.tsx        # Main timer component with all features
│   ├── layout.tsx      # Root layout
│   └── globals.css     # Global styles with Tailwind
├── public/
│   └── sound/
│       ├── alarm.mp3   # Basic alarm sound
│       ├── ding.mp3    # Ding sound effect
│       ├── success.mp3 # Success sound effect
│       └── victory.mp3 # Victory sound effect
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── next.config.js
```

## Complete Feature Set

### Core Timer Functionality
- **Manual Timer**: Custom countdown timer with minutes/seconds input (0-59 range validation)
- **Pomodoro Mode**: Configurable study sessions (1-60 min) + breaks (1-30 min), default 25/5
- **Three Timer Modes**: Manual, Study, Break with distinct behaviors and tracking

### Gamification & Motivation
- **Level System**: 10 exp per 10 minutes of usage, 100 exp per level
- **Experience Bar**: Visual progress indicator with smooth animations
- **Sticker Collection**: 20 different emoji rewards (🏆🚀🌟⚡🎯🔥💎🎖️🏅🎪🎭🎨🦄🐉🦅🌈⭐✨💫🎊)
- **Level-up Notifications**: 3-second animated celebration with new sticker reveal
- **Collection Modal**: Grid view of all earned stickers with empty state

### Study Tracking & Analytics
- **Daily Study Time**: Persistent tracking by date in localStorage
- **Session Recording**: Automatic logging of completed study sessions
- **Progress Display**: Real-time study time counter at bottom of screen

### Customization & Personalization
- **3 Theme Options**: Blue (classic), Green (nature), Purple (creative)
- **Dynamic Backgrounds**: 9 different gradient combinations (3 themes × 3 modes)
- **4 Alarm Sounds**: Basic, Ding, Success, Victory with individual file paths
- **Sound Testing**: Preview button for each alarm option
- **Settings Persistence**: All preferences saved to localStorage

### User Interface & Experience
- **Glass Morphism Design**: Translucent cards with backdrop blur effects
- **Responsive Layout**: Mobile-first design with Flexbox/Grid
- **Smooth Transitions**: 500ms color changes, 300ms progress bar animations
- **Modal System**: Overlay modals for stickers and settings with escape functionality
- **Input Validation**: Min/max constraints on all number inputs with error prevention

### Technical Implementation
- **State Management**: React hooks with 15+ state variables for complete functionality
- **Data Persistence**: localStorage for settings, progress, and daily tracking
- **Audio Management**: Dynamic source switching with error handling
- **Timer Logic**: Precise interval management with cleanup on unmount
- **TypeScript**: Full type safety with custom types for modes, themes, and sounds

## Code Structure & Architecture

### Component Organization
- **Single File Component**: All functionality in `app/page.tsx` for educational clarity
- **Comprehensive Commenting**: 200+ lines of detailed English comments explaining every section
- **Logical Sections**: Code organized into clear sections (Types, Constants, State, Logic, Rendering)
- **Beginner-Friendly**: Extensive explanations suitable for coding newcomers

### State Management Strategy
- **React Hooks Only**: No external state management libraries
- **Grouped State**: Related states grouped logically (timer, gamification, customization)
- **Ref Usage**: Proper useRef for DOM manipulation and value persistence
- **Effect Management**: Clean useEffect patterns with proper dependencies and useCallback optimization

### Data Persistence Architecture
- **localStorage Keys**: Organized naming convention (timerLevel, timerTheme, studyTime_${date})
- **Date-based Tracking**: Daily study time with automatic date key generation
- **JSON Serialization**: Complex data (stickers array) properly serialized
- **Error Handling**: Graceful fallbacks when localStorage is unavailable

### Performance Considerations
- **Interval Management**: Proper cleanup of setInterval to prevent memory leaks
- **Conditional Rendering**: Efficient DOM updates with conditional JSX
- **Transition Optimization**: CSS transitions for smooth UI changes
- **Audio Preloading**: Sound files loaded once and reused
- **useCallback Optimization**: Prevents unnecessary re-renders and function recreations

### TypeScript Implementation
- **Custom Types**: TimerMode, Theme, SoundType for type safety
- **Proper Typing**: All useState and useRef properly typed
- **Type Guards**: Safe type casting with proper validation
- **Interface Design**: Clean separation of data structures

## Key Features Summary

- **Timer Functions**: Manual timer, 25/5 Pomodoro mode, pause/resume/reset
- **Gamification**: Level system, experience points, sticker collection with 20 emoji rewards
- **Customization**: 3 color themes, 4 sound options, persistent settings
- **Tracking**: Daily study time tracking with localStorage persistence
- **UI/UX**: Responsive glass morphism design, smooth animations, modal dialogs
- **Audio**: Multiple alarm sounds with preview functionality
- **Code Quality**: Full TypeScript, comprehensive commenting, optimized performance