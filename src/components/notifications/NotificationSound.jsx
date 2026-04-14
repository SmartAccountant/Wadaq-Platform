import React from 'react';

class NotificationSoundManager {
  constructor() {
    this.enabled = localStorage.getItem('notification_sound') !== 'false';
    this.context = null;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem('notification_sound', enabled ? 'true' : 'false');
  }

  isEnabled() {
    return this.enabled;
  }

  async playSound(type = 'default') {
    if (!this.enabled) return;

    try {
      // Initialize audio context
      if (!this.context) {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
      }

      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);

      // Different sounds for different notification types
      const sounds = {
        default: { freq: 800, duration: 0.1 },
        success: { freq: 600, duration: 0.15 },
        warning: { freq: 400, duration: 0.2 },
        error: { freq: 200, duration: 0.3 },
      };

      const sound = sounds[type] || sounds.default;

      oscillator.frequency.value = sound.freq;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + sound.duration);

      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + sound.duration);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }
}

export const notificationSound = new NotificationSoundManager();

export default function NotificationSoundToggle() {
  const [enabled, setEnabled] = React.useState(notificationSound.isEnabled());

  const toggleSound = () => {
    const newState = !enabled;
    setEnabled(newState);
    notificationSound.setEnabled(newState);
    
    // Play test sound
    if (newState) {
      notificationSound.playSound('success');
    }
  };

  return (
    <button
      onClick={toggleSound}
      className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      title={enabled ? 'تعطيل الصوت' : 'تفعيل الصوت'}
    >
      {enabled ? '🔔' : '🔕'}
    </button>
  );
}