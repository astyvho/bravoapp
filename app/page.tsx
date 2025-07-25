'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ================================
// Type Definitions
// ================================

type TimerMode = 'manual' | 'study' | 'break';
type Theme = 'blue' | 'green' | 'purple';
type SoundType = 'basic' | 'ding' | 'success' | 'victory';

// ================================
// Constants
// ================================

const STICKER_EMOJIS = [
  '🏆', '🚀', '🌟', '⚡', '🎯', '🔥', '💎', '🎖️', '🏅', '🎪', 
  '🎭', '🎨', '🦄', '🐉', '🦅', '🌈', '⭐', '✨', '💫', '🎊'
];

const THEME_COLORS = {
  blue: {
    manual: 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900',
    study: 'bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-900',
    break: 'bg-gradient-to-br from-orange-900 via-amber-800 to-orange-900'
  },
  green: {
    manual: 'bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900',
    study: 'bg-gradient-to-br from-teal-900 via-cyan-800 to-teal-900',
    break: 'bg-gradient-to-br from-amber-900 via-yellow-800 to-amber-900'
  },
  purple: {
    manual: 'bg-gradient-to-br from-purple-900 via-indigo-800 to-purple-900',
    study: 'bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900',
    break: 'bg-gradient-to-br from-pink-900 via-rose-800 to-pink-900'
  }
};

const SOUND_OPTIONS = [
  { value: 'basic', label: 'Basic', file: '/sound/alarm.mp3' },
  { value: 'ding', label: 'Ding', file: '/sound/ding.mp3' },
  { value: 'success', label: 'Success', file: '/sound/success.mp3' },
  { value: 'victory', label: 'Victory', file: '/sound/victory.mp3' }
];

// ================================
// Circular Progress Component
// ================================

function CircularTimer({ 
  timeLeft, 
  totalTime, 
  size = 280,
  strokeWidth = 8,
  mode,
  preciseTimeLeft
}: {
  timeLeft: number;
  totalTime: number;
  size?: number;
  strokeWidth?: number;
  mode: TimerMode;
  preciseTimeLeft?: number;
}) {
  const radius = size / 2;
  const center = size / 2;
  
  // Use precise time if available, otherwise fall back to timeLeft
  const actualTimeLeft = preciseTimeLeft !== undefined ? preciseTimeLeft / 1000 : timeLeft;
  const progress = totalTime > 0 ? Math.max(0, Math.min(1, (totalTime - actualTimeLeft) / totalTime)) : 0;
  
  // Calculate the end angle for the remaining time (starts from top, goes clockwise)
  const angle = progress * 360;
  const startAngle = -90; // Always start from top (-90 degrees)
  const endAngle = startAngle + angle;
  const largeArcFlag = angle > 180 ? 1 : 0;
  
  // More precise trigonometric calculations
  const startX = center + radius * Math.cos((startAngle * Math.PI) / 180);
  const startY = center + radius * Math.sin((startAngle * Math.PI) / 180);
  const endX = center + radius * Math.cos((endAngle * Math.PI) / 180);
  const endY = center + radius * Math.sin((endAngle * Math.PI) / 180);

  const getProgressColor = () => {
    switch (mode) {
      case 'study': return '#10b981'; // emerald-500
      case 'break': return '#f97316'; // orange-500
      default: return '#3b82f6'; // blue-500
    }
  };

  // Generate smooth path data with better handling for small angles
  let pathData = '';
  if (progress > 0) {
    if (angle < 0.1) {
      // For very small angles, use a simple triangle to avoid rendering artifacts
      pathData = `M ${center} ${center} L ${startX} ${startY} L ${endX} ${endY} Z`;
    } else {
      // Standard arc path for larger angles
      pathData = `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
    }
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="absolute"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="rgba(255, 255, 255, 0.1)"
          className="drop-shadow-sm"
        />
        
        {/* Progress pie slice */}
        {progress > 0 && (
          <path
            d={pathData}
            fill={getProgressColor()}
            className="drop-shadow-lg"
            style={{
              filter: `drop-shadow(0 0 12px ${getProgressColor()}60)`,
              transition: 'none', // Remove CSS transitions for smoother JS animation
            }}
          />
        )}
        
        {/* Overlay circle for clean edge */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="2"
          className="drop-shadow-sm"
        />
      </svg>
    </div>
  );
}

// ================================
// Main Component
// ================================

export default function TimerApp() {
  // State Management
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>('manual');
  const [studyMinutes, setStudyMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [stickers, setStickers] = useState<string[]>([]);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [newSticker, setNewSticker] = useState<string>('');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [theme, setTheme] = useState<Theme>('blue');
  const [soundType, setSoundType] = useState<SoundType>('basic');
  const [showSettings, setShowSettings] = useState(false);
  const [initialTime, setInitialTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'timer' | 'stats' | 'settings'>('timer');

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const preciseTimeRef = useRef<number>(0);

  // Initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('timerTheme') as Theme;
      const savedSound = localStorage.getItem('timerSound') as SoundType;
      
      if (savedTheme) setTheme(savedTheme);
      if (savedSound) setSoundType(savedSound);
      
      const soundFile = SOUND_OPTIONS.find(s => s.value === (savedSound || 'basic'))?.file || '/sound/alarm.mp3';
      audioRef.current = new Audio(soundFile);
      
      const today = new Date().toDateString();
      const savedStudyTime = localStorage.getItem(`studyTime_${today}`);
      if (savedStudyTime) {
        setTotalStudyTime(parseInt(savedStudyTime));
      }
      
      const savedLevel = localStorage.getItem('timerLevel');
      const savedExp = localStorage.getItem('timerExperience');
      const savedStickers = localStorage.getItem('timerStickers');
      
      if (savedLevel) setLevel(parseInt(savedLevel));
      if (savedExp) setExperience(parseInt(savedExp));
      if (savedStickers) setStickers(JSON.parse(savedStickers));
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      const soundFile = SOUND_OPTIONS.find(s => s.value === soundType)?.file || '/sound/alarm.mp3';
      audioRef.current.src = soundFile;
    }
  }, [soundType]);

  // Gamification Logic
  const addExperience = useCallback((minutes: number) => {
    const expGained = Math.floor(minutes / 10) * 10;
    if (expGained > 0) {
      const newExp = experience + expGained;
      const newLevel = Math.floor(newExp / 100) + 1;
      
      setExperience(newExp);
      
      if (newLevel > level) {
        setLevel(newLevel);
        setShowLevelUp(true);
        
        const randomSticker = STICKER_EMOJIS[Math.floor(Math.random() * STICKER_EMOJIS.length)];
        const newStickers = [...stickers, randomSticker];
        setStickers(newStickers);
        setNewSticker(randomSticker);
        
        localStorage.setItem('timerLevel', newLevel.toString());
        localStorage.setItem('timerStickers', JSON.stringify(newStickers));
        
        setTimeout(() => {
          setShowLevelUp(false);
          setNewSticker('');
        }, 3000);
      }
      
      localStorage.setItem('timerExperience', newExp.toString());
    }
  }, [experience, level, stickers]);

  const handleTimerComplete = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        alert('Timer completed!');
      });
    }
    
    const sessionDuration = mode === 'study' ? studyMinutes : 
                           mode === 'break' ? breakMinutes : 
                           Math.floor((Date.now() - sessionStartTimeRef.current) / 60000);
    
    addExperience(sessionDuration);
    
    if (mode === 'study') {
      const studyDuration = studyMinutes;
      const newTotalTime = totalStudyTime + studyDuration;
      setTotalStudyTime(newTotalTime);
      
      const today = new Date().toDateString();
      localStorage.setItem(`studyTime_${today}`, newTotalTime.toString());
    }
  }, [mode, studyMinutes, breakMinutes, addExperience, totalStudyTime]);

  // Timer Logic with millisecond precision
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      const startTime = Date.now();
      preciseTimeRef.current = timeLeft * 1000; // Convert to milliseconds
      
      const updateTimer = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, preciseTimeRef.current - elapsed);
        
        if (remaining <= 0) {
          preciseTimeRef.current = 0;
          setTimeLeft(0);
          setIsRunning(false);
          handleTimerComplete();
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        } else {
          // Update precise time for smooth gauge animation
          preciseTimeRef.current = remaining;
          // Update display time (rounded to nearest second)
          setTimeLeft(Math.ceil(remaining / 1000));
        }
      };
      
      intervalRef.current = setInterval(updateTimer, 8); // ~120fps for ultra smooth animation
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, handleTimerComplete]);

  // Timer Control Functions
  const startStudyTimer = () => {
    const time = studyMinutes * 60;
    setMode('study');
    setTimeLeft(time);
    setInitialTime(time);
    sessionStartTimeRef.current = Date.now();
    preciseTimeRef.current = time * 1000;
    setIsRunning(true);
  };

  const startBreakTimer = () => {
    const time = breakMinutes * 60;
    setMode('break');
    setTimeLeft(time);
    setInitialTime(time);
    sessionStartTimeRef.current = Date.now();
    preciseTimeRef.current = time * 1000;
    setIsRunning(true);
  };

  const startManualTimer = () => {
    const time = minutes * 60 + seconds;
    setMode('manual');
    setTimeLeft(time);
    setInitialTime(time);
    sessionStartTimeRef.current = Date.now();
    preciseTimeRef.current = time * 1000;
    setIsRunning(true);
  };

  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // preciseTimeRef.current is already updated in the timer loop
    setTimeLeft(Math.ceil(preciseTimeRef.current / 1000));
    setIsRunning(false);
  };

  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setTimeLeft(0);
    setInitialTime(0);
    preciseTimeRef.current = 0;
    setMode('manual');
  };

  // Utility Functions
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDisplayTime = () => {
    if (timeLeft > 0) return formatTime(timeLeft);
    if (mode === 'study') return formatTime(studyMinutes * 60);
    if (mode === 'break') return formatTime(breakMinutes * 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getBackgroundClass = () => {
    return THEME_COLORS[theme][mode];
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('timerTheme', newTheme);
  };

  const handleSoundChange = (newSound: SoundType) => {
    setSoundType(newSound);
    localStorage.setItem('timerSound', newSound);
  };

  const testSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        console.log('Sound test failed');
      });
    }
  };

  const getModeTitle = () => {
    if (mode === 'study') return 'Study Time';
    if (mode === 'break') return 'Break Time';
    return 'Timer';
  };

  const getModeIcon = () => {
    if (mode === 'study') return '📚';
    if (mode === 'break') return '☕';
    return '⏰';
  };


  return (
    <div className={`min-h-screen ${getBackgroundClass()} transition-all duration-700 ease-in-out flex flex-col`}>
      
      {/* Level Up Notification */}
      {showLevelUp && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-6 py-3 rounded-2xl shadow-2xl animate-bounce">
          <div className="text-center font-bold">
            <div className="text-lg">🎉 Level {level}! 🎉</div>
            <div className="text-2xl mt-1">{newSticker}</div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'timer' && (
          <div className="min-h-full flex flex-col">
            {/* Compact Header */}
            <div className="pt-6 pb-4 px-4">
              <div className="max-w-sm mx-auto text-center">
                <h1 className="text-2xl font-bold text-white">BravoFocusTimer</h1>
              </div>
            </div>

            {/* Main Timer - Centered */}
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="w-full max-w-sm">
                
                {!isRunning && timeLeft === 0 && mode === 'manual' ? (
                  // Timer Selection Mode - Unified Interface
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 space-y-6 mb-8">
                    {/* Quick Select Buttons */}
                    <div className="grid grid-cols-4 gap-3">
                      {[5, 10, 15, 20, 25, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => {
                            setMinutes(mins);
                            setSeconds(0);
                            const time = mins * 60;
                            setTimeLeft(time);
                            setInitialTime(time);
                            sessionStartTimeRef.current = Date.now();
                            preciseTimeRef.current = time * 1000;
                            setIsRunning(true);
                          }}
                          className="bg-white/20 hover:bg-white/30 text-white font-bold py-4 px-2 rounded-xl transition-all duration-200 text-lg backdrop-blur-sm border border-white/30 hover:scale-105"
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>

                    {/* Separator */}
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 h-px bg-white/20"></div>
                      <div className="text-white/40 text-sm">or</div>
                      <div className="flex-1 h-px bg-white/20"></div>
                    </div>

                    {/* Custom Input */}
                    <div className="space-y-8">
                      <div className="flex items-center justify-center space-x-4">
                        <div className="text-center">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={minutes}
                            onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                            className="w-20 h-14 text-center text-2xl font-bold rounded-xl bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
                          />
                          <div className="text-white/60 text-sm mt-2">min</div>
                        </div>
                        <div className="text-white text-3xl font-bold mb-6">:</div>
                        <div className="text-center">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={seconds}
                            onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                            className="w-20 h-14 text-center text-2xl font-bold rounded-xl bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
                          />
                          <div className="text-white/60 text-sm mt-2">sec</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const time = minutes * 60 + seconds;
                          if (time > 0) {
                            setTimeLeft(time);
                            setInitialTime(time);
                            sessionStartTimeRef.current = Date.now();
                            preciseTimeRef.current = time * 1000;
                            setIsRunning(true);
                          }
                        }}
                        disabled={minutes === 0 && seconds === 0}
                        className="w-full bg-blue-500/90 hover:bg-blue-500 disabled:bg-white/20 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 text-lg shadow-lg"
                      >
                        Start Timer
                      </button>
                    </div>
                  </div>
                ) : (
                  // Running Timer Mode - Show Circular Timer
                  <>
                    {/* Circular Timer */}
                    <div className="relative flex items-center justify-center mb-6">
                      <CircularTimer 
                        timeLeft={timeLeft} 
                        totalTime={initialTime}
                        size={300}
                        mode={mode}
                        preciseTimeLeft={preciseTimeRef.current}
                      />
                      
                      {/* Time Display in Center */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-6xl font-mono font-black text-white mb-2 tracking-wider drop-shadow-2xl" style={{
                          textShadow: '0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.3)'
                        }}>
                          {getDisplayTime()}
                        </div>
                        <div className="text-white/70 text-base font-semibold uppercase tracking-widest">
                          {mode === 'manual' ? 'Custom' : mode}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Timer Controls */}
                {!isRunning && timeLeft === 0 ? (
                  // Start Options
                  <div className="space-y-14">
                    {/* Quick Start Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={startStudyTimer}
                        className="bg-emerald-500/90 hover:bg-emerald-500 text-white font-bold py-4 px-4 rounded-2xl transition-all duration-200 shadow-lg backdrop-blur-sm flex flex-col items-center space-y-1"
                      >
                        <span className="text-xl">📚</span>
                        <span className="text-sm">Study {studyMinutes}m</span>
                      </button>
                      <button
                        onClick={startBreakTimer}
                        className="bg-orange-500/90 hover:bg-orange-500 text-white font-bold py-4 px-4 rounded-2xl transition-all duration-200 shadow-lg backdrop-blur-sm flex flex-col items-center space-y-1"
                      >
                        <span className="text-xl">☕</span>
                        <span className="text-sm">Break {breakMinutes}m</span>
                      </button>
                    </div>
                    <div className="text-center text-white/50 text-xs">
                      Use the timer options above for custom times
                    </div>
                  </div>
                ) : (
                  // Running Controls - Larger for easy access
                  <div className="space-y-3">
                    {isRunning ? (
                      <button
                        onClick={pauseTimer}
                        className="w-full bg-yellow-500/90 hover:bg-yellow-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg backdrop-blur-sm flex items-center justify-center space-x-2 text-lg"
                      >
                        <span className="text-xl">⏸️</span>
                        <span>Pause</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsRunning(true)}
                        className="w-full bg-emerald-500/90 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg backdrop-blur-sm flex items-center justify-center space-x-2 text-lg"
                      >
                        <span className="text-xl">▶️</span>
                        <span>Resume</span>
                      </button>
                    )}
                    <button
                      onClick={resetTimer}
                      className="w-full bg-red-500/90 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-200 shadow-lg backdrop-blur-sm flex items-center justify-center space-x-2"
                    >
                      <span className="text-lg">🔄</span>
                      <span>Reset</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="p-4 pt-6">
            <div className="max-w-sm mx-auto space-y-4">
              <h2 className="text-2xl font-bold text-white text-center mb-6">Your Progress</h2>
              
              {/* Level & XP Card */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-white">Level {level}</div>
                  <div className="text-white/60">Keep going!</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-white/80">
                    <span>Experience</span>
                    <span>{experience % 100}/100 XP</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(experience % 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center">
                  <div className="text-white/60 text-sm mb-1">Today</div>
                  <div className="text-white text-xl font-bold">{totalStudyTime}m</div>
                </div>
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center">
                  <div className="text-white/60 text-sm mb-1">Stickers</div>
                  <div className="text-white text-xl font-bold">{stickers.length}</div>
                </div>
              </div>

              {/* Stickers Collection */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                <h3 className="text-white font-semibold mb-3">🏆 Collection</h3>
                {stickers.length === 0 ? (
                  <div className="text-center py-4 text-white/60">
                    <div className="text-2xl mb-2">📦</div>
                    <p className="text-sm">Study to collect stickers!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-2">
                    {stickers.map((sticker, index) => (
                      <div
                        key={index}
                        className="bg-white/20 rounded-lg p-2 text-center text-lg"
                      >
                        {sticker}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 pt-6">
            <div className="max-w-sm mx-auto space-y-4">
              <h2 className="text-2xl font-bold text-white text-center mb-6">Settings</h2>
              
              {/* Pomodoro Settings */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                <h3 className="text-white font-semibold mb-3">Pomodoro Times</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-white/80 mb-1">Study (min)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={studyMinutes}
                      onChange={(e) => setStudyMinutes(Math.max(1, Math.min(60, parseInt(e.target.value) || 25)))}
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/80 mb-1">Break (min)</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={breakMinutes}
                      onChange={(e) => setBreakMinutes(Math.max(1, Math.min(30, parseInt(e.target.value) || 5)))}
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                </div>
              </div>

              {/* Theme Selection */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                <h3 className="text-white font-semibold mb-3">Theme</h3>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(THEME_COLORS).map(([themeKey, colors]) => (
                    <button
                      key={themeKey}
                      onClick={() => handleThemeChange(themeKey as Theme)}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        theme === themeKey ? 'ring-2 ring-white scale-105' : 'hover:scale-105'
                      }`}
                    >
                      <div className={`w-full h-12 rounded-lg ${colors.manual} mb-2`}></div>
                      <div className="text-xs text-white/80 capitalize font-medium">
                        {themeKey}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Selection */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                <h3 className="text-white font-semibold mb-3">Alarm Sound</h3>
                <div className="space-y-2">
                  {SOUND_OPTIONS.map((sound) => (
                    <div key={sound.value} className="flex items-center justify-between p-2 bg-white/10 rounded-lg">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="sound"
                          value={sound.value}
                          checked={soundType === sound.value}
                          onChange={(e) => handleSoundChange(e.target.value as SoundType)}
                          className="mr-2"
                        />
                        <span className="text-white/90 text-sm">{sound.label}</span>
                      </label>
                      <button
                        onClick={testSound}
                        className="bg-blue-500/80 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs transition-colors"
                      >
                        Test
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-xl border-t border-white/20">
        <div className="flex items-center justify-around py-3 px-4 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex flex-col items-center space-y-1 py-2 px-4 rounded-xl transition-all duration-200 ${
              activeTab === 'timer' 
                ? 'bg-white/20 text-white' 
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <span className="text-xl">⏱️</span>
            <span className="text-xs font-medium">Timer</span>
          </button>
          
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center space-y-1 py-2 px-4 rounded-xl transition-all duration-200 ${
              activeTab === 'stats' 
                ? 'bg-white/20 text-white' 
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <span className="text-xl">📊</span>
            <span className="text-xs font-medium">Stats</span>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center space-y-1 py-2 px-4 rounded-xl transition-all duration-200 ${
              activeTab === 'settings' 
                ? 'bg-white/20 text-white' 
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <span className="text-xl">⚙️</span>
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}