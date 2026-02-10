import { MouseEventHandler, useEffect, useRef, useState } from "react";

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
  const [editing, setEditing] = useState(false);

  const startY = useRef(0);
  const startValue = useRef(0);
  const dragging = useRef(false);
  const knobRef = useRef<SVGSVGElement>(null);

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

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    startY.current = e.clientY;
    startValue.current = value;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging.current) return;

    const deltaY = startY.current - e.clientY;
    let next = startValue.current + deltaY * step;

    next = Math.min(max, Math.max(min, next));

    onChange(next);
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
        className="cursor-ns-resize touch-none"
        onMouseDown={onMouseDown}
        ref={knobRef}
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
      <p className="text-sm opacity-70">{label}</p>

      <div className="flex items-center gap-1">
        {editing ? (
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            autoFocus
            onChange={(e) => {
              let v = Number(e.target.value);
              v = Math.min(max, Math.max(min, v));
              onChange(v);
            }}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setEditing(false);
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-16 text-center border rounded"
          />
        ) : (
          <span
            className="cursor-text select-none"
            onDoubleClick={() => setEditing(true)}
            title="Double click to edit"
          >
            {value.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}
