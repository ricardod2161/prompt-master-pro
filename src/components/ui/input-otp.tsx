// Stub — input-otp removed from dependencies.
// This component is not used by any application page.
import * as React from "react";

export const InputOTP = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => <input ref={ref} {...props} />
);
InputOTP.displayName = "InputOTP";

export const InputOTPGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => <div ref={ref} className="flex items-center" {...props}>{children}</div>
);
InputOTPGroup.displayName = "InputOTPGroup";

export const InputOTPSlot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { index?: number }>(
  ({ children, ...props }, ref) => <div ref={ref} {...props}>{children}</div>
);
InputOTPSlot.displayName = "InputOTPSlot";

export const InputOTPSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <div ref={ref} role="separator" {...props} />
);
InputOTPSeparator.displayName = "InputOTPSeparator";
