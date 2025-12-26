"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function Home() {
  const src = "/sounds/kintsugi.mp3";

  const audioContext = useMemo(() => new AudioContext(), []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);

  const [gain, setGain] = useState<number>(1);
  const [pan, setPan] = useState<number>(0);

  useEffect(() => {
    if (!audioRef.current) return;

    if (!gainNodeRef.current) {
      gainNodeRef.current = audioContext.createGain();
      gainNodeRef.current.gain.value = gain;
    }

    if (!pannerNodeRef.current) {
      const pannerOptions: StereoPannerOptions = {
        pan,
      };
      pannerNodeRef.current = new StereoPannerNode(audioContext, pannerOptions);
    }

    const track = audioContext.createMediaElementSource(audioRef.current);

    track
      .connect(gainNodeRef.current)
      .connect(pannerNodeRef.current)
      .connect(audioContext.destination);

    return () => {
      track.disconnect();
    };
  }, [audioContext, gain, pan]);

  const handleGainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);

    setGain(value);

    if (!gainNodeRef.current) return;

    gainNodeRef.current.gain.setValueAtTime(value, audioContext.currentTime);
  };

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);

    setPan(value);

    if (!pannerNodeRef.current) return;

    pannerNodeRef.current.pan.setValueAtTime(value, audioContext.currentTime);
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  return (
    <div>
      <h1>Web Audio API</h1>

      <audio ref={audioRef} src={src} />

      <label>
        Gain: {gain.toFixed(2)}
        <input
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={gain}
          onChange={handleGainChange}
        />
      </label>
      <label>
        Pan: {pan.toFixed(2)}
        <input
          type="range"
          min={-1}
          max={1}
          value={pan}
          step={0.01}
          onChange={handlePanChange}
        />
      </label>

      <button onClick={togglePlay}>Play / Pause</button>
    </div>
  );
}
