/**
 * Notification Sound Manager
 * Plays notification sounds based on settings
 */

class NotificationSoundManager {
    constructor() {
        this.settings = null;
        this.loadSettings();
    }

    async loadSettings() {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();

            if (data.success && data.data?.notifications) {
                this.settings = data.data.notifications;
            }
        } catch (error) {
            console.error('Failed to load notification settings:', error);
        }
    }

    playSound(type = 'chat') {
        if (!this.settings) {
            console.warn('Notification settings not loaded');
            return;
        }

        let soundConfig;

        switch (type) {
            case 'chat':
                soundConfig = this.settings.chatNotificationSound;
                break;
            case 'exam':
                soundConfig = this.settings.examNotificationSound;
                break;
            case 'warning':
                soundConfig = this.settings.warningSound;
                break;
            default:
                soundConfig = this.settings.chatNotificationSound;
        }

        if (!soundConfig || !soundConfig.enabled) {
            return;
        }

        try {
            const audio = new Audio(soundConfig.soundFile);
            audio.volume = soundConfig.volume || 0.7;
            audio.play().catch(e => {
                console.warn('Audio play blocked by browser:', e);
            });
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    }

    playChatNotification() {
        this.playSound('chat');
    }

    playExamNotification() {
        this.playSound('exam');
    }

    playWarningNotification() {
        this.playSound('warning');
    }
}

// Create singleton instance
const notificationSound = new NotificationSoundManager();

export default notificationSound;
