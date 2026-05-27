"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FloatingInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  wrapperClassName?: string;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, wrapperClassName, className, id, type, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("relative", wrapperClassName)}>
        <input
          ref={ref}
          id={inputId}
          type={type}
          placeholder=" "
          className={cn(
            "floating-input peer",
            error && "error",
            className
          )}
          {...props}
        />
        <label htmlFor={inputId} className="floating-label">
          {label}
        </label>
        {error && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);
FloatingInput.displayName = "FloatingInput";

export { FloatingInput };
