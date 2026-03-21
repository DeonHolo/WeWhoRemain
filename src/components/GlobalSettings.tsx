import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useGameStore } from '../store';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function GlobalSettings() {
  const resetGame = useGameStore((state) => state.resetGame);
  const [isOpen, setIsOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleReset = () => {
    resetGame();
    window.location.reload();
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <Button variant="outline" size="icon" className="bg-background/50 backdrop-blur-sm border-border" onClick={() => setIsOpen(!isOpen)}>
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
                <h3 className="text-sm font-bold text-white tracking-widest uppercase">Settings</h3>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={() => {
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
                <h3 className="text-lg font-bold text-white">Reset Progress?</h3>
                <p className="text-sm text-muted-foreground">Are you sure you want to reset your progress? This cannot be undone.</p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsResetModalOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleReset}>Reset</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
