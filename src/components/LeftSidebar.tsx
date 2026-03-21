
import React from 'react';
import { motion } from 'motion/react';
import { Activity, Heart, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { soundManager } from '../lib/sounds';

const ATTRIBUTE_COLORS: Record<string, string> = {
  Might: 'text-[#c13b51]',
  Agility: 'text-[#b9bf3b]',
  Fortitude: 'text-[#8c5d28]',
  Intellect: 'text-[#415aa5]',
  Willpower: 'text-[#3f893d]',
  Presence: 'text-[#974594]',
};

export function LeftSidebar({ hp, maxHp, mana, maxMana, level, xp, attributes, backstory, inventory, isOpen, setIsOpen }: any) {
  return (
    <>
      <motion.div
        initial={false}
        animate={{ width: isOpen ? 300 : 60 }}
        className="bg-card border-r border-border flex flex-col shadow-xl z-20 relative shrink-0"
      >
        <button 
          onClick={() => {
            soundManager.playRustle();
            setIsOpen(!isOpen);
          }} 
          className="absolute -right-3 top-6 p-1 bg-accent hover:bg-accent/80 rounded-full border border-border transition-colors z-30"
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {isOpen ? (
            <div className="space-y-6">
              <div className="text-xl font-black tracking-widest text-foreground">WE WHO REMAIN</div>
              
              <div className="flex items-center gap-2 text-sm font-bold text-yellow-500">
                <Activity size={16}/> LVL {level} <span className="text-muted-foreground">({xp} / {level * 100} XP)</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold tracking-wider">
                  <span className="text-red-500 flex items-center gap-1"><Heart size={14}/> HP</span>
                  <span className="text-foreground">{hp} / {maxHp || 50}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden border border-border/50">
                  <div className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]" style={{ width: `${maxHp ? (hp/maxHp)*100 : 0}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold tracking-wider">
                  <span className="text-blue-500 flex items-center gap-1"><Zap size={14}/> MANA</span>
                  <span className="text-foreground">{mana} / {maxMana || 30}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden border border-border/50">
                  <div className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ width: `${maxMana ? (mana/maxMana)*100 : 0}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.entries(attributes).map(([attr, val]) => (
                  <div key={attr} className="flex flex-col items-center bg-muted/50 border border-border rounded p-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${ATTRIBUTE_COLORS[attr]}`}>{attr}</span>
                    <span className="text-sm font-mono text-foreground font-bold">{val as React.ReactNode}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Inventory</div>
                <div className="flex flex-col gap-2">
                  {inventory && inventory.length > 0 ? (
                    inventory.map((item: any, i: number) => (
                      <div key={i} className="flex flex-col bg-muted/50 border border-border rounded px-2 py-1.5 shadow-sm">
                        <span className="text-sm font-bold text-foreground">{item.name}</span>
                        {item.description && (
                          <span className="text-[11px] text-muted-foreground leading-tight mt-0.5">{item.description}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground italic">Empty</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Backstory</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{backstory || "No backstory yet."}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 pt-4">
               <Activity size={20} className="text-yellow-500"/>
               <Heart size={20} className="text-red-500"/>
               <Zap size={20} className="text-blue-500"/>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
