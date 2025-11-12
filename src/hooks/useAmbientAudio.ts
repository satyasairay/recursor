import { useEffect, useRef, useState } from 'react';
import { AudioEngine, AudioEngineParams } from '@/lib/audioEngine';

/**
 * React hook for managing ambient audio engine.
 * 
 * Provides audio control and automatic parameter updates.
 */
export const useAmbientAudio = () => {
  const engineRef = useRef<AudioEngine | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [volume, setVolumeState] = useState(0.15);

  // Initialize audio engine
  useEffect(() => {
    const initEngine = async () => {
      if (!engineRef.current) {
        engineRef.current = new AudioEngine();
        await engineRef.current.init();
        setIsInitialized(true);
      }
    };

    initEngine();

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  // Enable/disable audio
  const toggleAudio = () => {
    if (!engineRef.current || !isInitialized) return;

    if (isEnabled) {
      engineRef.current.stop();
      setIsEnabled(false);
    } else {
      engineRef.current.start();
      setIsEnabled(true);
    }
  };

  // Update audio parameters
  const updateParams = (params: AudioEngineParams) => {
    if (engineRef.current && isEnabled) {
      engineRef.current.updateAudio(params);
    }
  };

  // Set volume
  const setVolume = (newVolume: number) => {
    if (engineRef.current) {
      engineRef.current.setVolume(newVolume);
      setVolumeState(newVolume);
    }
  };

  return {
    isEnabled,
    isInitialized,
    volume,
    toggleAudio,
    updateParams,
    setVolume,
  };
};
