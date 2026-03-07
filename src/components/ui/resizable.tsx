// Stub — react-resizable-panels removed from dependencies.
// This component is not used by any application page.
import * as React from "react";

export const ResizablePanelGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => <div ref={ref} className="flex h-full w-full" {...props}>{children}</div>
);
ResizablePanelGroup.displayName = "ResizablePanelGroup";

export const ResizablePanel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => <div ref={ref} {...props}>{children}</div>
);
ResizablePanel.displayName = "ResizablePanel";

export const ResizableHandle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <div ref={ref} {...props} />
);
ResizableHandle.displayName = "ResizableHandle";
