import { useState } from "react";

interface ControlKnobProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

const START_ANGLE = 135;
const END_ANGLE = 405;
const ANGLE_RANGE = END_ANGLE - START_ANGLE;

export default function ControlKnob({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: ControlKnobProps) {
  const [isDragging, setIsDragging] = useState(false);

  const r = 46;
  const x = r * Math.cos(Math.PI / 4);
  const y = r * Math.sin(Math.PI / 4);

  const calculateX = (angleInDegrees: number): number => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return r * Math.cos(angleInRadians);
  };

  const calculateY = (angleInDegrees: number): number => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return r * Math.sin(angleInRadians);
  };

  const isSweepArc = (): number => {
    const x1 = -x;
    const y1 = y;

    const x2 = calculateX(valueToAngle(value));
    const y2 = calculateY(valueToAngle(value));

    const angleA = Math.atan2(y1, x1);
    const angleB = Math.atan2(y2, x2);

    let delta = angleB - angleA;
    if (delta < 0) delta += Math.PI * 2;

    return (delta * 180) / Math.PI > 180 ? 1 : 0;
  };

  const valueToAngle = (value: number) => {
    return START_ANGLE + ((value - min) / (max - min)) * ANGLE_RANGE;
  };

  const getAngleFromMouse = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    if (angle < 0) angle += 360;

    return angle;
  };

  const normalizeAngle = (angle: number): number => {
    if (angle < START_ANGLE) {
      return angle + 360;
    }
    return angle;
  };

  const clampAngle = (angle: number): number => {
    const normalized = normalizeAngle(angle);
    return Math.min(Math.max(normalized, START_ANGLE), END_ANGLE);
  };
  const angleToValue = (angle: number): number => {
    const ratio = (angle - START_ANGLE) / ANGLE_RANGE;
    const raw = min + ratio * (max - min);

    return Math.round(raw / step) * step;
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(true);

    const angle = clampAngle(getAngleFromMouse(e));
    onChange(angleToValue(angle));
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;

    const angle = clampAngle(getAngleFromMouse(e));
    onChange(angleToValue(angle));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col items-center">
      <svg
        width={100}
        height={100}
        viewBox="-50 -50 100 100"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="cursor-pointer touch-none"
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
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
          d={`
            M ${-x} ${y}
            A ${r} ${r} 0 ${isSweepArc()} 1 ${calculateX(
            valueToAngle(value)
          )} ${calculateY(valueToAngle(value))}
            `}
        />

        <line
          stroke="black"
          strokeWidth={4}
          strokeLinecap="round"
          x1={0}
          y1={0}
          x2={calculateX(valueToAngle(value))}
          y2={calculateY(valueToAngle(value))}
        />
      </svg>

      <p>{`${label}: ${value.toFixed(2)}`}</p>
    </div>
  );
}
