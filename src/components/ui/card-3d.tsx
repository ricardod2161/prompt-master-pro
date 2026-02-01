import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const card3DVariants = cva(
  "rounded-xl border bg-card text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "card-3d hover:border-primary/20",
        elevated: "card-3d hover:border-primary/30 hover-glow",
        glass: "glass rounded-xl hover:border-primary/20",
        outlined: "border-2 hover:border-primary hover-lift",
        subtle: "card-3d-sm hover:border-primary/10",
      },
      size: {
        default: "",
        sm: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface Card3DProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof card3DVariants> {
  interactive?: boolean;
}

const Card3D = React.forwardRef<HTMLDivElement, Card3DProps>(
  ({ className, variant, size, interactive = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        card3DVariants({ variant, size }),
        !interactive && "pointer-events-none",
        className
      )}
      {...props}
    />
  )
);
Card3D.displayName = "Card3D";

const Card3DHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
Card3DHeader.displayName = "Card3DHeader";

const Card3DTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
Card3DTitle.displayName = "Card3DTitle";

const Card3DDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
Card3DDescription.displayName = "Card3DDescription";

const Card3DContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
Card3DContent.displayName = "Card3DContent";

const Card3DFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
Card3DFooter.displayName = "Card3DFooter";

export {
  Card3D,
  Card3DHeader,
  Card3DFooter,
  Card3DTitle,
  Card3DDescription,
  Card3DContent,
};
