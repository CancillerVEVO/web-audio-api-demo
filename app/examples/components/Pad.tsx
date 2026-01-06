import { ChangeEventHandler, InputHTMLAttributes, useState } from "react";

type PadProps = {
  label: string;
  isChecked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
};
export default function Pad({ label, isChecked, onChange }: PadProps) {
  return (
    <div className="p-2">
      <label>
        <span>{label}</span>
        <input
          type="checkbox"
          checked={isChecked}
          className="appearance-none size-20 border-solid border-2 border-sky-900 rounded-md checked:bg-sky-300 checked:border-sky-500 active:scale-95 transition-transform duration-100 ml-2"
          onChange={onChange}
        />
      </label>
    </div>
  );
}
