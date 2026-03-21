import { useEffect, useState, useRef } from 'react';
import { useGameStore } from './store';
import { startGame, sendMessage, resumeGame } from './gemini';
import { parseGMResponse } from './parser';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, Text, Edges, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Terminal, Heart, Zap, Activity, Database, Swords, Send, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { LeftSidebar } from './components/LeftSidebar';
import { GlobalSettings } from './components/GlobalSettings';

const ATTRIBUTE_COLORS: Record<string, string> = {
  Might: 'text-[#c13b51]',
  Agility: 'text-[#b9bf3b]',
  Fortitude: 'text-[#8c5d28]',
  Intellect: 'text-[#415aa5]',
  Willpower: 'text-[#3f893d]',
  Presence: 'text-[#974594]',
};

const KEYWORD_COLORS: Record<string, string> = {
  ...ATTRIBUTE_COLORS,
  HP: 'text-red-400 font-bold',
  Mana: 'text-blue-400 font-bold',
  Corrupted: 'text-red-800 font-bold',
  Outsider: 'text-teal-400 font-bold',
  System: 'text-cyan-400 font-bold',
  XP: 'text-yellow-200 font-bold',
  Level: 'text-yellow-500 font-bold',
};

const ATTRIBUTE_COLORS_HEX: Record<string, string> = {
  Might: '#c13b51',
  Agility: '#b9bf3b',
  Fortitude: '#8c5d28',
  Intellect: '#415aa5',
  Willpower: '#3f893d',
  Presence: '#974594',
};

function RichText({ text }: { text: string }) {
  // Unescape any AI-escaped asterisks and replace bullet points
  let cleanText = text.replace(/\\\*/g, '*');
  cleanText = cleanText.replace(/(^|\n)\s*[*-]\s+/g, '$1• ');
  
  // Fix unmatched bold at the start of a line (e.g. "**Option 1: Marcus" -> "**Option 1: Marcus**")
  cleanText = cleanText.replace(/(^|\n)(\*\*)([^\n*]+)(?:\n|$)/g, '$1$2$3**\n');

  const tokens = [];
  let current = 0;
  
  while (current < cleanText.length) {
    const animateMatch = cleanText.slice(current).match(/^(<ANIMATE type="([^"]+)">([\s\S]*?)<\/ANIMATE>)/);
    if (animateMatch) {
      tokens.push({ type: 'animate', animType: animateMatch[2], content: animateMatch[3] });
      current += animateMatch[1].length;
      continue;
    }
    
    // Headers: ### text
    const headerMatch = cleanText.slice(current).match(/^(?:\n\s*)?#{1,6}\s+([^\n]+)/);
    if (headerMatch) {
      // Strip bold tags from headers to prevent unmatched ** artifacts
      let headerText = headerMatch[1].replace(/\*\*/g, '');
      tokens.push({ type: 'header', content: headerText });
      current += headerMatch[0].length;
      continue;
    }
    
    // Bold-Italic: ***text***
    const boldItalicMatch = cleanText.slice(current).match(/^\*\*\*(\S|\S[\s\S]*?\S)\*\*\*/);
    if (boldItalicMatch) {
      tokens.push({ type: 'bold-italic', content: boldItalicMatch[1] });
      current += boldItalicMatch[0].length;
      continue;
    }
    
    // Bold: **text**
    const boldMatch = cleanText.slice(current).match(/^\*\*(\S|\S[\s\S]*?\S)\*\*/);
    if (boldMatch) {
      tokens.push({ type: 'bold', content: boldMatch[1] });
      current += boldMatch[0].length;
      continue;
    }
    
    // Italic: *text*
    const italicMatch = cleanText.slice(current).match(/^\*(\S|\S[\s\S]*?\S)\*/);
    if (italicMatch) {
      tokens.push({ type: 'italic', content: italicMatch[1] });
      current += italicMatch[0].length;
      continue;
    }
    
    const nextSpecial = cleanText.slice(current).search(/<ANIMATE|\*|\n\s*#/);
    if (nextSpecial === 0) {
      tokens.push({ type: 'text', content: cleanText[current] });
      current += 1;
    } else if (nextSpecial > 0) {
      tokens.push({ type: 'text', content: cleanText.slice(current, current + nextSpecial) });
      current += nextSpecial;
    } else {
      tokens.push({ type: 'text', content: cleanText.slice(current) });
      current = cleanText.length;
    }
  }

  const renderContent = (content: string) => {
    const keywordRegex = /\b(Might|Agility|Fortitude|Intellect|Willpower|Presence|HP|Mana|Corrupted|Outsider|System|XP|Level)\b/g;
    const subParts = content.split(keywordRegex);
    return subParts.map((sub, j) => {
      if (KEYWORD_COLORS[sub]) {
        return <span key={j} className={KEYWORD_COLORS[sub]}>{sub}</span>;
      }
      return <span key={j}>{sub}</span>;
    });
  };

  return (
    <div className="whitespace-pre-wrap leading-relaxed">
      {tokens.map((token, i) => {
        if (token.type === 'animate') {
          if (token.animType === 'shakey') {
            return (
              <motion.span
                key={i}
                className="inline-block mx-1 font-black text-white text-2xl uppercase tracking-widest drop-shadow-lg"
                animate={{ x: [-1.5, 1.5, -1.5, 1.5, 0], y: [-1.5, 1.5, -1.5, 1.5, 0] }}
                transition={{ duration: 0.2, repeat: Infinity, repeatType: "mirror" }}
              >
                {token.content}
              </motion.span>
            );
          }
          return (
            <motion.span key={i} className="inline-block mx-1">
              {token.content?.split('').map((char: string, idx: number) => (
                <motion.span
                  key={idx}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.05, ease: "easeInOut" }}
                  className="inline-block font-black text-white text-2xl uppercase tracking-widest drop-shadow-lg"
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </motion.span>
          );
        }
        if (token.type === 'header') {
          return <h3 key={i} className="text-xl font-bold text-white mt-4 mb-2">{renderContent(token.content)}</h3>;
        }
        if (token.type === 'bold-italic') {
          return <strong key={i} className="font-bold italic text-white">{renderContent(token.content)}</strong>;
        }
        if (token.type === 'bold') {
          return <strong key={i} className="font-bold text-white">{renderContent(token.content)}</strong>;
        }
        if (token.type === 'italic') {
          return <em key={i} className="italic text-gray-300">{renderContent(token.content)}</em>;
        }
        return <span key={i} className="text-gray-300">{renderContent(token.content)}</span>;
      })}
    </div>
  );
}

function StoryDisplay({ text, onComplete }: { text: string, onComplete?: () => void }) {
  const blocks = text.split('\n\n').filter(block => block.trim() !== '');
  const [visibleBlocks, setVisibleBlocks] = useState(1);

  useEffect(() => {
    if (blocks.length === 0 && onComplete) {
      onComplete();
    } else if (visibleBlocks >= blocks.length && onComplete) {
      onComplete();
    }
  }, [visibleBlocks, blocks.length, onComplete]);

  return (
    <div className="space-y-6">
      {blocks.slice(0, visibleBlocks).map((block, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <RichText text={block} />
        </motion.div>
      ))}
      {visibleBlocks < blocks.length && (
        <div className="flex justify-center pt-8">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setVisibleBlocks(prev => prev + 1)}
            className="px-10 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg font-black tracking-widest uppercase hover:scale-105 transition-transform shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] border border-white/10"
          >
            Continue
          </motion.button>
        </div>
      )}
    </div>
  );
}

function Dice({ stat, targetDC, statValue, onComplete }: { stat: string, targetDC: number, statValue: number, onComplete: (roll: number) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [rolling, setRolling] = useState(true);
  const [rollResult, setRollResult] = useState<number | null>(null);

  useFrame((state, delta) => {
    if (rolling && meshRef.current) {
      meshRef.current.rotation.x += delta * 15;
      meshRef.current.rotation.y += delta * 20;
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const result = Math.floor(Math.random() * 20) + 1;
      setRollResult(result);
      setRolling(false);
      if (meshRef.current) {
        meshRef.current.rotation.set(0.5, 0.5, 0);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <group>
      <Icosahedron ref={meshRef} args={[2, 0]}>
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
        <Edges scale={1.05} threshold={15} color={ATTRIBUTE_COLORS_HEX[stat] || "white"} />
      </Icosahedron>
      {!rolling && rollResult !== null && (
        <group>
          <Text position={[0, 0, 2.1]} fontSize={1.5} color="white" anchorX="center" anchorY="middle">
            {rollResult.toString()}
          </Text>
          <Html position={[0, -3, 0]} center>
            <div className="flex flex-col items-center gap-4">
              <div className="text-2xl font-bold text-white bg-black/50 p-4 rounded-lg backdrop-blur-sm">
                Result: {rollResult + statValue} (Roll {rollResult} + Mod {statValue}) vs DC {targetDC}
              </div>
              <button
                onClick={() => onComplete(rollResult)}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors"
              >
                Continue
              </button>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

function CreationUI({ messages, currentChoices, handleChoice, isLoading }: any) {
  const lastModelMessage = [...messages].reverse().find(m => m.role === 'model');
  const [isStoryFinished, setIsStoryFinished] = useState(false);

  useEffect(() => {
    setIsStoryFinished(false);
  }, [lastModelMessage]);

  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center p-2 md:p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-background to-background" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl w-full z-10 flex flex-col h-full py-2 md:py-4"
      >
        <div className="text-center space-y-2 mb-4 shrink-0">
          <h1 className="text-2xl md:text-4xl font-black tracking-widest text-white/90 drop-shadow-lg">WE WHO REMAIN</h1>
          <Separator className="w-24 bg-red-900/50 mx-auto" />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 pr-1 md:pr-2">
          <Card className="bg-card/40 backdrop-blur-md border-border shadow-2xl min-h-full">
            <CardContent className="p-4 md:p-6 text-sm md:text-base leading-snug">
              {lastModelMessage ? <StoryDisplay text={lastModelMessage.content} onComplete={() => setIsStoryFinished(true)} /> : "Initializing The System..."}
              
              {!isLoading && isStoryFinished && currentChoices.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-muted-foreground font-bold tracking-widest uppercase mb-2">Select Your Path:</div>
                  {currentChoices.map((c: any, i: number) => (
                    <div
                      key={i}
                      onClick={() => handleChoice(`"${c.text}"`)}
                      className="flex items-start gap-3 group cursor-pointer p-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-primary mt-0.5"><ChevronRight size={16} /></span>
                      <span className="text-base md:text-lg text-white/80 group-hover:text-white transition-colors leading-snug">
                        {c.attribute ? (
                          <>
                            <span className={`font-bold ${ATTRIBUTE_COLORS[c.attribute] || 'text-muted-foreground'}`}>
                              [{c.attribute}{c.dc ? ` | DC ${c.dc}` : ''}]
                            </span>{' '}
                            {c.text}
                          </>
                        ) : (
                          `"${c.text}"`
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="shrink-0">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-pulse text-muted-foreground flex items-center gap-2 text-base">
                <Terminal size={20} /> Processing...
              </div>
            </div>
          ) : (
            <div className="relative max-w-5xl mx-auto">
              <Input
                type="text"
                placeholder={currentChoices.length > 0 ? "Or type a custom choice..." : "Enter your choice..."}
                className="w-full bg-input/50 border-border rounded-xl p-4 text-base h-auto focus-visible:ring-primary/50 text-white placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    handleChoice(e.currentTarget.value.trim());
                    e.currentTarget.value = '';
                  }
                }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Send size={18} />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function PlayingUI({
  hp, maxHp, mana, maxMana, level, xp, backstory, attributes,
  systemMemory, combatLog, messages, currentChoices, isLoading,
  handleChoice, chatContainerRef
}: any) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [isLastMessageFinished, setIsLastMessageFinished] = useState(false);

  useEffect(() => {
    setIsLastMessageFinished(false);
  }, [messages]);

  return (
    <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden selection:bg-primary/20">
      <LeftSidebar 
        hp={hp} maxHp={maxHp} mana={mana} maxMana={maxMana} level={level} xp={xp} attributes={attributes} backstory={backstory}
        isOpen={leftSidebarOpen} setIsOpen={setLeftSidebarOpen}
      />
      
      <div className="flex-1 flex relative overflow-hidden">
        {/* Center: Chat & Story */}
        <div className="flex-1 flex flex-col relative bg-background/95 items-center">
          <div className="w-full max-w-6xl flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar" ref={chatContainerRef}>
            <div className="space-y-8 pb-8">
              {messages.slice(4).map((m: any, i: number) => {
                const isLast = i === messages.slice(4).length - 1;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[90%] md:max-w-[85%] p-5 rounded-2xl text-lg ${m.role === 'user' ? 'bg-muted text-muted-foreground border border-border rounded-br-sm' : 'bg-transparent'}`}>
                      {m.role === 'user' ? m.content : <StoryDisplay text={m.content} onComplete={isLast ? () => setIsLastMessageFinished(true) : undefined} />}
                    </div>
                  </motion.div>
                );
              })}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground flex items-center gap-3 p-4">
                  <Terminal size={18} className="animate-pulse" /> <span className="animate-pulse tracking-wider text-sm">The System is processing...</span>
                </motion.div>
              )}

              {/* Inline Choices */}
              {!isLoading && isLastMessageFinished && currentChoices.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 space-y-3 px-4"
                >
                  <div className="text-sm text-muted-foreground font-bold tracking-widest uppercase mb-4">The Council Demands:</div>
                  {currentChoices.map((c: any, i: number) => (
                    <div
                      key={i}
                      onClick={() => handleChoice(`"${c.text}"`)}
                      className="flex items-start gap-4 group cursor-pointer p-3 -mx-3 rounded-lg hover:bg-accent/50 transition-colors pointer-events-auto"
                    >
                      <span className="text-primary mt-1"><ChevronRight size={18} /></span>
                      <span className="text-lg md:text-xl text-white/80 group-hover:text-white transition-colors leading-relaxed">
                        {c.attribute ? (
                          <>
                            <span className={`font-bold ${ATTRIBUTE_COLORS[c.attribute] || 'text-muted-foreground'}`}>
                              [{c.attribute}{c.dc ? ` | DC ${c.dc}` : ''}]
                            </span>{' '}
                            {c.text}
                          </>
                        ) : (
                          `"${c.text}"`
                        )}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="w-full max-w-6xl p-4 md:p-6 bg-background shrink-0">
            <div className="relative">
              <Input
                type="text"
                placeholder={currentChoices.length > 0 ? "Or take a different action..." : "What do you do?"}
                className="w-full bg-input/30 border-border rounded-xl p-4 text-lg h-auto focus-visible:ring-primary/50 text-white placeholder:text-muted-foreground shadow-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    handleChoice(e.currentTarget.value.trim());
                    e.currentTarget.value = '';
                  }
                }}
                disabled={isLoading}
              />
              <Send size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Right Sidebar: Logs (Collapsible) */}
        <motion.div 
          initial={false}
          animate={{ width: rightSidebarOpen ? 320 : 0 }}
          className="bg-card border-l border-border flex flex-col shadow-xl z-20 relative shrink-0"
        >
          <div className="flex-1 overflow-y-auto w-80 p-6 border-b border-border custom-scrollbar">
            <div className="text-xs text-muted-foreground font-bold tracking-widest mb-6 flex items-center gap-2">
              <Database size={16}/> SYSTEM MEMORY
            </div>
            <div className="space-y-4 pb-4">
              <AnimatePresence>
                {systemMemory.map((mem: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-sm text-cyan-100/90 bg-cyan-950/30 p-3 rounded-lg border border-cyan-900/50 leading-relaxed shadow-sm"
                  >
                    {mem}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto w-80 p-6 custom-scrollbar">
            <div className="text-xs text-muted-foreground font-bold tracking-widest mb-6 flex items-center gap-2">
              <Swords size={16}/> COMBAT LOG
            </div>
            <div className="space-y-3 pb-4">
              <AnimatePresence>
                {combatLog.map((log: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-red-300/90 font-mono bg-red-950/20 p-2 rounded border border-red-900/30"
                  >
                    &gt; {log}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StartMenu({ onStart }: { onStart: () => void }) {
  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-background to-background" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 text-center space-y-8"
      >
        <h1 className="text-5xl md:text-7xl font-black tracking-widest text-white/90 drop-shadow-lg">WE WHO REMAIN</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">A text-based apocalyptic LitRPG.</p>
        <button
          onClick={onStart}
          className="px-12 py-4 bg-primary text-primary-foreground rounded-lg font-black tracking-widest uppercase hover:scale-105 transition-transform shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] border border-white/10"
        >
          Enter The System
        </button>
      </motion.div>
    </div>
  );
}

export default function App() {
  const {
    hp, maxHp, mana, maxMana, level, xp, backstory, attributes,
    systemMemory, combatLog, messages, currentChoices, isRolling, hasStarted,
    addMessage, setChoices, addSystemMemory, addCombatLog, updateState, setRolling
  } = useGameStore();

  const [isLoading, setIsLoading] = useState(false);
  const [pendingParsed, setPendingParsed] = useState<any>(null);
  const [showStartMenu, setShowStartMenu] = useState(messages.length === 0);
  const initialized = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0 && !initialized.current) {
      initialized.current = true;
      resumeGame(messages);
    }
  }, [messages]);

  const handleStartGame = async () => {
    setShowStartMenu(false);
    if (initialized.current) return;
    initialized.current = true;
    setIsLoading(true);
    try {
      const response = await startGame();
      const parsed = parseGMResponse(response);
      applyParsedResponse(parsed);
    } catch (e) {
      console.error(e);
      addMessage({ role: 'model', content: "Failed to initialize The System." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const applyParsedResponse = (parsed: any) => {
    addMessage({ role: 'model', content: parsed.narrative });
    if (parsed.systemMemories.length) addSystemMemory(parsed.systemMemories);
    if (parsed.combatLogs.length) addCombatLog(parsed.combatLogs);
    if (parsed.choices.length) setChoices(parsed.choices);
    if (parsed.stateUpdate) updateState(parsed.stateUpdate);
  };

  const handleChoice = async (text: string) => {
    if (isLoading) return;
    setIsLoading(true);
    addMessage({ role: 'user', content: text });
    setChoices([]);

    try {
      const response = await sendMessage(text);
      const parsed = parseGMResponse(response);

      if (parsed.diceRoll) {
        setPendingParsed(parsed);
        setRolling(true);
      } else {
        applyParsedResponse(parsed);
      }
    } catch (e) {
      console.error(e);
      addMessage({ role: 'model', content: "System Error: Connection to the Game Master lost." });
    } finally {
      setIsLoading(false);
    }
  };

  const onDiceComplete = () => {
    setRolling(false);
    if (pendingParsed) {
      applyParsedResponse(pendingParsed);
      setPendingParsed(null);
    }
  };

  return (
    <>
      <GlobalSettings />
      <AnimatePresence mode="wait">
        {showStartMenu ? (
          <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }}>
            <StartMenu onStart={handleStartGame} />
          </motion.div>
        ) : !hasStarted ? (
          <motion.div key="creation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }}>
            <CreationUI
              messages={messages}
              currentChoices={currentChoices}
              handleChoice={handleChoice}
              isLoading={isLoading}
            />
          </motion.div>
        ) : (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <PlayingUI
              hp={hp} maxHp={maxHp} mana={mana} maxMana={maxMana} level={level} xp={xp} backstory={backstory} attributes={attributes}
              systemMemory={systemMemory} combatLog={combatLog} messages={messages} currentChoices={currentChoices}
              isLoading={isLoading} handleChoice={handleChoice} chatContainerRef={chatContainerRef}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dice Overlay */}
      <AnimatePresence>
        {isRolling && pendingParsed?.diceRoll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <div className="text-3xl font-black text-white mb-8 tracking-widest drop-shadow-lg">
              ROLLING <span className={ATTRIBUTE_COLORS[pendingParsed.diceRoll.stat]}>{pendingParsed.diceRoll.stat.toUpperCase()}</span>
            </div>
            <div className="w-64 h-64">
              <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Dice
                  stat={pendingParsed.diceRoll.stat}
                  targetDC={pendingParsed.diceRoll.targetDC}
                  statValue={pendingParsed.diceRoll.statValue}
                  onComplete={onDiceComplete}
                />
              </Canvas>
            </div>
            <div className="text-muted-foreground mt-8 font-mono text-xl">
              TARGET DC: <span className="text-white">{pendingParsed.diceRoll.targetDC}</span> | MODIFIER: <span className="text-white">+{pendingParsed.diceRoll.statValue}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
