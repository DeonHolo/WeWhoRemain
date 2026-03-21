import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '../store';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { soundManager } from '../lib/sounds';

export function GlobalSettings() {
  const resetGame = useGameStore((state) => state.resetGame);
  const [isOpen, setIsOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleSound = () => {
    const newSound = !isSoundEnabled;
    setIsSoundEnabled(newSound);
    soundManager.toggleSound(newSound);
    if (newSound) soundManager.playClick();
  };

  const handleReset = () => {
    resetGame();
    window.location.reload();
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <Button variant="outline" size="icon" className="bg-background/50 backdrop-blur-sm border-border" onClick={() => {
          soundManager.playClick();
          setIsOpen(!isOpen);
        }}>
          <SettingsIcon size={20} />
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 right-4 z-50"
          >
            <Card className="w-64 bg-card/90 backdrop-blur-md border-border shadow-2xl">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-sm font-bold text-foreground tracking-widest uppercase">Settings</h3>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={toggleSound}
                >
                  {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  {isSoundEnabled ? "Sound: On" : "Sound: Off"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    soundManager.playClick();
                    toggleTheme();
                  }}
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  {isDark ? "Light Mode" : "Dark Mode"}
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={() => {
                    soundManager.playClick();
                    setIsOpen(false);
                    setIsResetModalOpen(true);
                  }}
                >
                  Reset Progress
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isResetModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <Card className="w-80 bg-card border-border shadow-2xl">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-foreground">Reset Progress?</h3>
                <p className="text-sm text-muted-foreground">Are you sure you want to reset your progress? This cannot be undone.</p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => {
                    soundManager.playClick();
                    setIsResetModalOpen(false);
                  }}>Cancel</Button>
                  <Button variant="destructive" onClick={() => {
                    soundManager.playThud();
                    handleReset();
                  }}>Reset</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
