import { ChangeEventHandler } from "react";

interface ControlKnobProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: ChangeEventHandler<HTMLInputElement>;
}

export default function ControlKnob(props: ControlKnobProps) {
  return (
    <div>
      <label>
        <p>{props.label}</p>
        <input
          type="range"
          min={props.min}
          max={props.max}
          step={props.step}
          value={props.value}
          onChange={props.onChange}
        />
      </label>
    </div>
  );
}
