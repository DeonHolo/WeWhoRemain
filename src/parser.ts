export function parseGMResponse(responseText: string) {
  let narrative = responseText;
  const systemMemories: string[] = [];
  const combatLogs: string[] = [];
  const choices: { text: string; attribute: string; dc?: string }[] = [];
  let diceRoll: { stat: string; statValue: number; targetDC: number } | null = null;
  let stateUpdate: any = null;

  // Extract STATE
  const stateRegex = /<STATE\s+([^>]+)\s*\/>/g;
  const stateMatch = stateRegex.exec(narrative);
  if (stateMatch) {
    const attrsString = stateMatch[1];
    const getAttr = (name: string) => {
      const match = new RegExp(`${name}="(\\d+)"`).exec(attrsString);
      return match ? parseInt(match[1], 10) : 0;
    };
    
    stateUpdate = {
      hp: getAttr('hp'),
      maxHp: getAttr('maxHp'),
      mana: getAttr('mana'),
      maxMana: getAttr('maxMana'),
      xp: getAttr('xp'),
      level: getAttr('level'),
      attributes: {
        Might: getAttr('Might'),
        Agility: getAttr('Agility'),
        Fortitude: getAttr('Fortitude'),
        Intellect: getAttr('Intellect'),
        Willpower: getAttr('Willpower'),
        Presence: getAttr('Presence'),
      }
    };
    narrative = narrative.replace(stateRegex, '');
  }

  // Extract SYSTEM_MEMORY
  const sysMemRegex = /<SYSTEM_MEMORY>(.*?)<\/SYSTEM_MEMORY>/gs;
  let match;
  while ((match = sysMemRegex.exec(narrative)) !== null) {
    systemMemories.push(match[1].trim());
  }
  narrative = narrative.replace(sysMemRegex, '');

  // Extract COMBAT_LOG
  const combatLogRegex = /<COMBAT_LOG>(.*?)<\/COMBAT_LOG>/gs;
  while ((match = combatLogRegex.exec(narrative)) !== null) {
    combatLogs.push(match[1].trim());
  }
  narrative = narrative.replace(combatLogRegex, '');

  // Extract DICE_ROLL
  const diceRollRegex = /<DICE_ROLL\s+stat=["']([^"']+)["']\s+statValue=["'](\d+)["']\s+targetDC=["'](\d+)["']\s*\/>/g;
  const diceMatch = diceRollRegex.exec(narrative);
  if (diceMatch) {
    diceRoll = {
      stat: diceMatch[1],
      statValue: parseInt(diceMatch[2], 10),
      targetDC: parseInt(diceMatch[3], 10),
    };
    narrative = narrative.replace(diceRollRegex, '');
  }

  // Extract Choices
  const choiceRegex1 = /(?:^|\n)\s*(?:(?:[*>-]|\d+\.)\s*)?\[(Might|Agility|Fortitude|Intellect|Willpower|Presence)(?:\s*\|\s*DC\s*(\d+))?\]\s*([^\n]+)/g;
  while ((match = choiceRegex1.exec(narrative)) !== null) {
    choices.push({ attribute: match[1], dc: match[2], text: match[3].trim() });
  }
  narrative = narrative.replace(choiceRegex1, '');

  const choiceRegex2 = /(?:^|\n)\s*(?:(?:[*>-]|\d+\.)\s*)?(["“])([^"”]+)\1\s*\((Might|Agility|Fortitude|Intellect|Willpower|Presence)\)/g;
  while ((match = choiceRegex2.exec(narrative)) !== null) {
    choices.push({ text: match[2].trim(), attribute: match[3] });
  }
  narrative = narrative.replace(choiceRegex2, '');

  return {
    narrative: narrative.trim(),
    systemMemories,
    combatLogs,
    choices,
    diceRoll,
    stateUpdate,
  };
}
