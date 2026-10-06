import { Track } from '@music/shared';

export interface AudioDriver {
  loadTrack: (track: Track, autoPlay?: boolean) => Promise<boolean>;
  play: () => Promise<boolean>;
  pause: () => void;
  seek: (timeInSeconds: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  fadeOutAndPause: (durationMs?: number) => Promise<void>;
  getCurrentTime: () => number;
  getDuration: () => number;
}

class AudioBridge {
  private driver: AudioDriver | null = null;
  private pendingActions: Array<() => void> = [];

  public registerDriver(driver: AudioDriver): void {
    this.driver = driver;
    // Flush any pending actions once registered
    while (this.pendingActions.length > 0) {
      const action = this.pendingActions.shift();
      if (action) {
        try {
          action();
        } catch (err) {
          console.warn('Error executing pending audio action:', err);
        }
      }
    }
  }

  public unregisterDriver(): void {
    this.driver = null;
  }

  public hasDriver(): boolean {
    return this.driver !== null;
  }

  public async loadTrack(track: Track, autoPlay: boolean = true): Promise<boolean> {
    if (this.driver) {
      return this.driver.loadTrack(track, autoPlay);
    }
    return false;
  }

  public async play(): Promise<boolean> {
    if (this.driver) {
      return this.driver.play();
    }
    return false;
  }

  public pause(): void {
    if (this.driver) {
      this.driver.pause();
    }
  }

  public seek(time: number): void {
    if (this.driver) {
      this.driver.seek(time);
    } else {
      this.pendingActions.push(() => this.driver?.seek(time));
    }
  }

  public setVolume(volume: number): void {
    if (this.driver) {
      this.driver.setVolume(volume);
    }
  }

  public setMuted(muted: boolean): void {
    if (this.driver) {
      this.driver.setMuted(muted);
    }
  }

  public setPlaybackRate(rate: number): void {
    if (this.driver) {
      this.driver.setPlaybackRate(rate);
    }
  }

  public async fadeOutAndPause(durationMs: number = 2000): Promise<void> {
    if (this.driver) {
      return this.driver.fadeOutAndPause(durationMs);
    }
  }

  public getCurrentTime(): number {
    return this.driver ? this.driver.getCurrentTime() : 0;
  }

  public getDuration(): number {
    return this.driver ? this.driver.getDuration() : 0;
  }
}

export const audioBridge = new AudioBridge();
