"use client";
import { useEffect, useRef } from "react";

export default function Page() {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window === undefined) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
  }, []);

  return (
    <main>
      <h1>Example 2. Audio Sequencer</h1>
      <section></section>
    </main>
  );
}
