import { useEffect, useRef, useState } from "react";

interface ControlKnobProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

export default function ControlKnob({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: ControlKnobProps) {
  const dragging = useRef(false);

  const r = 46;

  const x = r * Math.cos(Math.PI / 4);
  const y = r * Math.sin(Math.PI / 4);

  const calculatePosition = (value: number) => {
    const normalized = (value - min) / (max - min); // 0..1

    const startAngle = (Math.PI * 5) / 4; // 225°

    const sweep = (Math.PI * 3) / 2;

    const angle = startAngle - sweep * normalized;

    const dx = r * Math.cos(angle);
    const dy = -r * Math.sin(angle);

    const largeArc = angle > Math.PI / 4 ? 0 : 1;

    return { dx, dy, largeArc };
  };

  const onMouseDown = () => {
    dragging.current = true;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging.current) return;
    console.log("GLOBAL MOVE", e.clientX, e.clientY);
  };

  const onMouseUp = () => {
    dragging.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const pos = calculatePosition(value);

  return (
    <div className="flex flex-col items-center">
      <svg
        width={100}
        height={100}
        viewBox="-50 -50 100 100"
        className="cursor-pointer touch-none"
        onMouseDown={onMouseDown}
      >
        <path
          stroke="gray"
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
          d={`
            M ${-x} ${y}
            A ${r} ${r} 0 1 1 ${x} ${y}
            `}
        />

        <path
          stroke="blue"
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
          d={`
            M ${-x} ${y}
            A ${r} ${r} 0 ${pos.largeArc} 1 ${pos.dx} ${pos.dy} 
            `}
        />

        <line
          stroke="black"
          strokeWidth={6}
          strokeLinecap="round"
          x1={0}
          y1={0}
          x2={pos.dx}
          y2={pos.dy}
        />
      </svg>

      <p>{`${label}: ${value.toFixed(2)}`}</p>

      <label>
        change
        <input
          min={min}
          max={max}
          value={value}
          step={1}
          type="range"
          onChange={(e) => {
            onChange(Number(e.target.value));
          }}
        />
      </label>
    </div>
  );
}
