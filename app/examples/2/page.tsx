"use client";
import { useEffect, useState } from "react";
import { WAVE_TABLE } from "./components/wavetable";
import Pad from "./components/Pad";
import ControlKnob from "./components/control-knob";

const SWEEP_LENGTH = 2;
const LOOKAHEAD = 25.0;
const SCHEDULED_AHEAD_TIME = 0.1;

const EMPTY_BAR: boolean[] = [false, false, false, false];

export default function Page() {
  const [attackTime, setAttackTime] = useState<number>(0.2);
  const [releaseTime, setReleaseTime] = useState<number>(0.5);
  const [frequency, setFrequency] = useState<number>(100);
  const [tempo, setTempo] = useState<number>(60);
  const [sweepBar, setSweepBar] = useState<boolean[]>(EMPTY_BAR);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // event handlers
  const handleAttackChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseFloat(e.target.value);

    setAttackTime(value);
  };

  const handleReleaseChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = parseFloat(e.target.value);

    setReleaseTime(value);
  };

  const handleBPMChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseFloat(e.target.value);

    setTempo(value);
  };

  const handleFrequencyChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = parseFloat(e.target.value);

    setFrequency(value);
  };

  const handlePlayButtonClick = () => {
    setIsPlaying((prev) => !prev);
  };

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const audioCtx = new AudioContext();
    const wave = audioCtx.createPeriodicWave(WAVE_TABLE.real, WAVE_TABLE.imag);

    let timerID: ReturnType<typeof setTimeout>;

    let currentNote = 0;
    let nextNoteTime = audioCtx.currentTime;

    const playSweep = (time: number): void => {
      const osc = new OscillatorNode(audioCtx, {
        frequency: frequency,
        type: "custom",
        periodicWave: wave,
      });

      const sweepEnv = new GainNode(audioCtx);
      sweepEnv.gain.cancelScheduledValues(time);
      sweepEnv.gain.setValueAtTime(0, time);
      sweepEnv.gain.linearRampToValueAtTime(1, time + attackTime);
      sweepEnv.gain.linearRampToValueAtTime(
        0,
        time + SWEEP_LENGTH - releaseTime
      );

      osc.connect(sweepEnv).connect(audioCtx.destination);
      osc.start(time);
      osc.stop(time + SWEEP_LENGTH);
    };

    const nextNote = () => {
      const secondsPerBeat = 60.0 / tempo;
      nextNoteTime += secondsPerBeat;
      currentNote = (currentNote + 1) % 4;
    };

    const scheduleNote = (beatNumber: number, time: number) => {
      if (sweepBar[beatNumber]) {
        playSweep(time);
      }
    };

    const scheduler = () => {
      // While there are notes that will need to play before the next interval,
      // schedule them and advance the pointer

      while (nextNoteTime < audioCtx.currentTime + SCHEDULED_AHEAD_TIME) {
        scheduleNote(currentNote, nextNoteTime);
        nextNote();
      }

      timerID = setTimeout(scheduler, LOOKAHEAD);
    };

    scheduler();

    return () => {
      if (timerID) {
        clearTimeout(timerID);
      }
    };
  }, [attackTime, frequency, isPlaying, releaseTime, sweepBar, tempo]);

  const playButtonLabel = isPlaying ? "STOP" : "START";

  return (
    <main>
      <h1 className="text-2xl font-bold">Example 2. Audio Sequencer</h1>

      <article>
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
          <button onClick={handlePlayButtonClick}>{playButtonLabel}</button>
        </div>
        {/**
         * SWEEP CONTROLS
         */}
        <section className="flex flex-col mt-5">
          <div className="flex space-x-5">
            <h3 className="text-2xl">Sweep Controls</h3>
            <div className="flex flex-col">
              <ControlKnob
                label="Att"
                min={0}
                max={1}
                step={0.1}
                value={attackTime}
                onChange={handleAttackChange}
              />
              <ControlKnob
                label="Rel"
                min={0}
                max={2}
                step={0.1}
                value={releaseTime}
                onChange={handleReleaseChange}
              />

              <ControlKnob
                label="Freq"
                min={0}
                max={400}
                step={10}
                value={frequency}
                onChange={handleFrequencyChange}
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
          </div>
        </section>
      </article>
    </main>
  );
}
