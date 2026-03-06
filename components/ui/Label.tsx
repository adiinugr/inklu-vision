import { LabelHTMLAttributes } from "react";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export default function Label({ className = "", children, ...props }: LabelProps) {
  return (
    <label
      className={`text-sm font-medium text-zinc-700 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
