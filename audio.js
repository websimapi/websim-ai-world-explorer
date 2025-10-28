export class AudioController {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 0.5; // Start with half volume
        this.gainNode.connect(this.audioContext.destination);
        this.currentSource = null;
        this.isInitialized = false;
    }

    async _unlockAudio() {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    async playInitialAmbience() {
        if (this.isInitialized) return;
        await this._unlockAudio();
        // Play a silent buffer to ensure the audio context is fully active
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.gainNode);
        source.start(0);

        // Fetch and play the default ambience
        try {
            const response = await fetch('./ambience.mp3');
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.currentSource = this.audioContext.createBufferSource();
            this.currentSource.buffer = audioBuffer;
            this.currentSource.loop = true;
            this.currentSource.connect(this.gainNode);
            this.currentSource.start();
            this.isInitialized = true;
        } catch(e) {
            console.error("Error playing initial ambience:", e);
        }
    }

    async updateAmbience(soundDescription) {
        if (!this.isInitialized) return;
        await this._unlockAudio();

        try {
            const ttsResult = await websim.textToSpeech({
                text: `(ambience) ${soundDescription}`, // Add context for the TTS model
                voice: 'en-male' 
            });

            const response = await fetch(ttsResult.url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // Fade out current sound
            this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);

            // Stop the old source after fade out
            if (this.currentSource) {
                this.currentSource.stop(this.audioContext.currentTime + 0.6);
            }

            // Create and start new source
            this.currentSource = this.audioContext.createBufferSource();
            this.currentSource.buffer = audioBuffer;
            this.currentSource.loop = true;
            this.currentSource.connect(this.gainNode);
            this.currentSource.start(this.audioContext.currentTime + 0.5);

            // Fade in new sound
            this.gainNode.gain.exponentialRampToValueAtTime(0.5, this.audioContext.currentTime + 1.5);

        } catch (error) {
            console.error("Failed to update ambience:", error);
            // If new sound fails, fade back in the old one if it's still playing
            this.gainNode.gain.exponentialRampToValueAtTime(0.5, this.audioContext.currentTime + 1.0);
        }
    }
}

