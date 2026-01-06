"use client";
import { useRef, useState } from "react";
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
  const [attackTime, setAttackTime] = useState<number>(0.2);
  const [releaseTime, setReleaseTime] = useState<number>(0.5);
  const [frequency, setFrequency] = useState<number>(100);
  const [tempo, setTempo] = useState<number>(60);
  const [sweepBar, setSweepBar] = useState<boolean[]>(EMPTY_BAR);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const waveRef = useRef<PeriodicWave | null>(null);
  const tempoRef = useRef(tempo);
  const currentNoteRef = useRef(0);
  const nextNoteTimeRef = useRef(0);
  const notesInQueue = useRef<NoteQueueItem[]>([]);
  const timerIDRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attackRef = useRef(attackTime);
  const releaseRef = useRef(releaseTime);
  const frequencyRef = useRef(frequency);

  const playSweep = (time: number): void => {
    const audioCtx = audioContextRef.current;
    const wave = waveRef.current;

    if (!audioCtx || !wave) return;

    const osc = new OscillatorNode(audioCtx, {
      frequency: frequencyRef.current,
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
  // event handlers
  const handleAttackChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseFloat(e.target.value);

    setAttackTime(value);
    attackRef.current = value;
  };

  const handleReleaseChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = parseFloat(e.target.value);

    setReleaseTime(value);
    releaseRef.current = value;
  };

  const handleBPMChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseFloat(e.target.value);

    setTempo(value);
    tempoRef.current = value;
  };

  const handleFrequencyChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = parseFloat(e.target.value);

    setFrequency(value);
    frequencyRef.current = value;
  };

  const handlePlayButtonClick = (): void => {
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
  };
  const playButtonLabel = isPlaying ? "STOP" : "START";

  return (
    <main>
      <h1 className="text-2xl font-bold">Example 2. Audio Sequencer</h1>
      <article>
        {/**
         * SWEEP CONTROLS
         */}
        <section className="flex flex-col mt-5">
          <div className="flex space-x-5">
            <h3 className="text-2xl">Sweep Controls</h3>
            <div className="flex flex-col">
              <label>
                <p>Att</p>
                <input
                  name="attack"
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={attackTime}
                  onChange={handleAttackChange}
                  className="ml-3"
                />
              </label>

              <label className="m-1">
                <p>Rel</p>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={releaseTime}
                  onChange={handleReleaseChange}
                />
              </label>

              <label>
                <p>Frq</p>
                <input
                  type="range"
                  min={0}
                  max={400}
                  step={10}
                  value={frequency}
                  onChange={handleFrequencyChange}
                />
              </label>
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
          </div>
        </section>

        {/**
         * BPM
         */}
        <section>
          <div>
            <label htmlFor="bpm">BPM: {tempo}</label>
            <input
              name="bpm"
              type="range"
              min={60}
              max={200}
              step={1}
              value={tempo}
              onChange={handleBPMChange}
            />
          </div>
        </section>

        {/**Play Button */}
        <div>
          <label className="bg-blue-500">
            <p className={isPlaying ? "text-red-700" : "text-blue-700"}>
              {playButtonLabel}
            </p>
            <input type="button" onClick={handlePlayButtonClick} />
          </label>
        </div>
      </article>
    </main>
  );
}
