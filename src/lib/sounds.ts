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

    // Resolve path relative to BASE_URL
    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
    const baseUrl = (import.meta as any).env.BASE_URL || '/';
    const finalUrl = baseUrl.endsWith('/') ? `${baseUrl}${cleanPath}` : `${baseUrl}/${cleanPath}`;

    try {
      const response = await fetch(finalUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.bufferCache[url] = audioBuffer;
      return audioBuffer;
    } catch (e) {
      console.error(`Failed to load sound: ${finalUrl}`, e);
      return null;
    }
  }

  private async playBuffer(url: string, volume: number = 0.5) {
    if (!this.enabled) {
      console.log(`Sound disabled, skipping: ${url}`);
      return;
    }

    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('AudioContext initialized');
      } catch (e) {
        console.error('Failed to initialize AudioContext', e);
        return;
      }
    }

    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('AudioContext resumed');
      } catch (e) {
        console.error('Failed to resume AudioContext', e);
      }
    }

    const buffer = await this.loadSound(url);
    if (!buffer) {
      console.error(`No buffer for sound: ${url}`);
      return;
    }

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();
      console.log(`Playing sound: ${url}`);
    } catch (e) {
      console.error(`Failed to play sound: ${url}`, e);
    }
  }

  // UI sounds from provided files

  public playThud() {
    this.playBuffer('/sounds/switch-01.wav', 0.6);
  }

  public playClick() {
    this.playBuffer('/sounds/small-button-click-01.wav', 0.4);
  }

  public playRustle() {
    this.playBuffer('/sounds/switch-04.wav', 0.3);
  }

  public playSuccess() {
    this.playBuffer('/sounds/task-complete-01.wav', 0.5);
  }

  public playFailure() {
    this.playBuffer('/sounds/morale-damaged-03.wav', 0.5);
  }

  // Attribute specific sounds
  public playMight() {
    this.playBuffer('/sounds/interface-skill-passiveFYS-03-01.wav', 0.6);
  }

  public playIntellect() {
    this.playBuffer('/sounds/interface-skill-passiveINT-04-01.wav', 0.6);
  }

  public playPresence() {
    this.playBuffer('/sounds/interface-skill-passivePSY-04-02.wav', 0.6);
  }

  public playWillpower() {
    this.playBuffer('/sounds/interface-skill-passivePSY-04-02.wav', 0.6);
  }

  public playFortitude() {
    this.playBuffer('/sounds/interface-skill-passiveMOT-04-01.wav', 0.6);
  }

  public playAgility() {
    this.playBuffer('/sounds/interface-skill-passiveMOT-04-01.wav', 0.6);
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
