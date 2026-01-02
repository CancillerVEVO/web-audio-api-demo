"use client";
import { useEffect, useRef, useState } from "react";
import { WAVE_TABLE } from "./wavetable";
import Pad from "./components/Pad";

const SWEEP_LENGTH = 2;
const LOOKAHEAD = 25.0;
const SCHEDULED_AHEAD_TIME = 0.1;

type NoteQueueItem = {
  note: number;
  time: number;
};

const EMPTY_BAR: boolean[] = [false, false, false, false];

export default function Page() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const waveRef = useRef<PeriodicWave | null>(null);

  const [attackTime, setAttackTime] = useState<number>(0.2);
  const [releaseTime, setReleaseTime] = useState<number>(0.5);
  const [tempo, setTempo] = useState<number>(60);
  const tempoRef = useRef(tempo);
  const currentNoteRef = useRef(0);
  const nextNoteTimeRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const notesInQueue = useRef<NoteQueueItem[]>([]);

  const timerIDRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const attackRef = useRef(attackTime);
  const releaseRef = useRef(releaseTime);
  const [sweepBar, setSweepBar] = useState<boolean[]>(EMPTY_BAR);

  useEffect(() => {
    tempoRef.current = tempo;
  }, [tempo]);

  useEffect(() => {
    attackRef.current = attackTime;
  }, [attackTime]);

  useEffect(() => {
    releaseRef.current = releaseTime;
  }, [releaseTime]);

  const playSweep = (time: number): void => {
    const audioCtx = audioContextRef.current;
    const wave = waveRef.current;

    if (!audioCtx || !wave) return;

    const osc = new OscillatorNode(audioCtx, {
      frequency: 380,
      type: "custom",
      periodicWave: wave,
    });

    const sweepEnv = new GainNode(audioCtx);
    sweepEnv.gain.cancelScheduledValues(time);
    sweepEnv.gain.setValueAtTime(0, time);
    sweepEnv.gain.linearRampToValueAtTime(1, time + attackRef.current);
    sweepEnv.gain.linearRampToValueAtTime(
      0,
      time + SWEEP_LENGTH - releaseRef.current
    );

    osc.connect(sweepEnv).connect(audioCtx.destination);
    osc.start(time);
    osc.stop(time + SWEEP_LENGTH);
  };

  // TODO: Move to separate components
  const handleAttackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);

    setAttackTime(value);
  };

  const handleReleaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);

    setReleaseTime(value);
  };

  const handleBPMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);

    setTempo(value);
  };

  // TIME UTILITY FUNCTIONS

  const nextNote = () => {
    const secondsPerBeat = 60.0 / tempoRef.current;
    nextNoteTimeRef.current += secondsPerBeat;
    currentNoteRef.current = (currentNoteRef.current + 1) % 4;
  };

  const scheduleNote = (beatNumber: number, time: number) => {
    // push the note in the queue, even if we are not playing.
    notesInQueue.current.push({ note: beatNumber, time });

    if (sweepBar[beatNumber]) {
      playSweep(time);
    }
  };

  const scheduler = () => {
    const audioCtx = audioContextRef.current;
    if (!audioCtx) return;
    // While there are notes that will need to play before the next interval,
    // schedule them and advance the pointer

    while (
      nextNoteTimeRef.current <
      audioCtx.currentTime + SCHEDULED_AHEAD_TIME
    ) {
      scheduleNote(currentNoteRef.current, nextNoteTimeRef.current);
      nextNote();
    }

    timerIDRef.current = setTimeout(scheduler, LOOKAHEAD);
  };
  return (
    <main>
      <h1 className="text-2xl font-bold">Example 2. Audio Sequencer</h1>
      <article>
        {/**
         * SWEEP CONTROLS
         */}
        <section className="flex flex-col">
          <h3>Sweep Controls</h3>
          <div>
            <label htmlFor="attack">Attack: {attackTime}</label>
            <input
              name="attack"
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={attackTime}
              onChange={handleAttackChange}
            />

            <label htmlFor="release">Release: {releaseTime}</label>
            <input
              name="release"
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={releaseTime}
              onChange={handleReleaseChange}
            />
          </div>

          <div className="flex">
            <Pad
              label={"1"}
              isChecked={sweepBar[0]}
              onChange={() => {
                setSweepBar((prev) => {
                  const next = [...prev];
                  next[0] = !next[0];
                  return next;
                });
              }}
            />
            <Pad
              label={"2"}
              isChecked={sweepBar[1]}
              onChange={() => {
                setSweepBar((prev) => {
                  const next = [...prev];
                  next[1] = !next[1];
                  return next;
                });
              }}
            />
            <Pad
              label={"3"}
              isChecked={sweepBar[2]}
              onChange={() => {
                setSweepBar((prev) => {
                  const next = [...prev];
                  next[2] = !next[2];
                  return next;
                });
              }}
            />
            <Pad
              label={"4"}
              isChecked={sweepBar[3]}
              onChange={() => {
                setSweepBar((prev) => {
                  const next = [...prev];
                  next[3] = !next[3];
                  return next;
                });
              }}
            />
          </div>
        </section>

        {/**
         * BPM
         */}
        <section>
          <h3>BPM</h3>
          <div>
            <label htmlFor="bpm">BPM: {tempo}</label>
            <input
              name="bpm"
              type="range"
              min={60}
              max={120}
              step={1}
              value={tempo}
              onChange={handleBPMChange}
            />
          </div>
        </section>

        <div>
          <label>
            <span>
              {isPlaying ? (
                <p className="text-red-700">STOP</p>
              ) : (
                <p className="text-blue-700">START</p>
              )}
            </span>
            <input
              type="button"
              onClick={() => {
                if (!audioContextRef.current) {
                  audioContextRef.current = new AudioContext();
                }

                const audioCtx = audioContextRef.current;

                if (!waveRef.current) {
                  waveRef.current = audioCtx.createPeriodicWave(
                    WAVE_TABLE.real,
                    WAVE_TABLE.imag
                  );
                }

                setIsPlaying((prev) => {
                  if (!prev) {
                    if (audioCtx.state === "suspended") {
                      audioCtx.resume();
                    }

                    currentNoteRef.current = 0;
                    nextNoteTimeRef.current = audioCtx.currentTime;

                    if (!timerIDRef.current) {
                      scheduler();
                    }
                  } else {
                    if (timerIDRef.current) {
                      clearTimeout(timerIDRef.current);
                      timerIDRef.current = null;
                    }
                  }

                  return !prev;
                });
              }}
            />
          </label>
        </div>
      </article>
    </main>
  );
}
