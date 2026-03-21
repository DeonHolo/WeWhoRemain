class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private bufferCache: Record<string, AudioBuffer> = {};

  constructor() {
    // Initialize on first user interaction to comply with browser autoplay policies
    const initAudio = () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };

    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
  }

  public toggleSound(enabled: boolean) {
    this.enabled = enabled;
  }

  private async loadSound(url: string): Promise<AudioBuffer | null> {
    if (this.bufferCache[url]) return this.bufferCache[url];
    if (!this.audioContext) return null;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.bufferCache[url] = audioBuffer;
      return audioBuffer;
    } catch (e) {
      console.error(`Failed to load sound: ${url}`, e);
      return null;
    }
  }

  private async playBuffer(url: string, volume: number = 0.5) {
    if (!this.enabled) return;

    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        return;
      }
    }

    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        // Ignore resume errors
      }
    }

    const buffer = await this.loadSound(url);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    source.start();
  }

  // UI sounds from provided files

  public playThud() {
    this.playBuffer('/ui-sounds/switch-01.wav', 0.6);
  }

  public playClick() {
    this.playBuffer('/ui-sounds/small-button-click-01.wav', 0.4);
  }

  public playRustle() {
    this.playBuffer('/ui-sounds/switch-04.wav', 0.3);
  }

  public playSuccess() {
    this.playBuffer('/ui-sounds/task-complete-01.wav', 0.5);
  }

  public playFailure() {
    this.playBuffer('/ui-sounds/morale-damaged-03.wav', 0.5);
  }

  // Attribute specific sounds
  public playMight() {
    this.playBuffer('/ui-sounds/interface-skill-passiveFYS-03-01.wav', 0.6);
  }

  public playIntellect() {
    this.playBuffer('/ui-sounds/interface-skill-passiveINT-04-01.wav', 0.6);
  }

  public playPresence() {
    this.playBuffer('/ui-sounds/interface-skill-passivePSY-04-02.wav', 0.6);
  }

  public playWillpower() {
    this.playBuffer('/ui-sounds/interface-skill-passivePSY-04-02.wav', 0.6);
  }

  public playFortitude() {
    this.playBuffer('/ui-sounds/interface-skill-passiveMOT-04-01.wav', 0.6);
  }

  public playAgility() {
    this.playBuffer('/ui-sounds/interface-skill-passiveMOT-04-01.wav', 0.6);
  }

  public playAttributeSound(attribute: string) {
    switch (attribute) {
      case 'Might': this.playMight(); break;
      case 'Intellect': this.playIntellect(); break;
      case 'Presence': this.playPresence(); break;
      case 'Willpower': this.playWillpower(); break;
      case 'Fortitude': this.playFortitude(); break;
      case 'Agility': this.playAgility(); break;
      default: this.playThud(); break;
    }
  }
}

export const soundManager = new SoundManager();
