import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo.png";

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";

interface LogoProps {
  size?: LogoSize;
  className?: string;
  showText?: boolean;
}

const sizeMap: Record<LogoSize, { icon: string; text: string }> = {
  xs: { icon: "w-6 h-6", text: "text-sm" },
  sm: { icon: "w-8 h-8", text: "text-base" },
  md: { icon: "w-10 h-10", text: "text-lg" },
  lg: { icon: "w-12 h-12", text: "text-xl" },
  xl: { icon: "w-16 h-16", text: "text-2xl" },
};

export function Logo({ size = "md", className, showText = true }: LogoProps) {
  const sizes = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2 group", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl group-hover:bg-primary/30 transition-colors" />
        <img
          src={logoImage}
          alt="RestaurantOS Logo"
          className={cn(
            sizes.icon,
            "relative rounded-xl object-contain transition-transform duration-300 group-hover:scale-105"
          )}
        />
      </div>
      {showText && (
        <span
          className={cn(
            sizes.text,
            "font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
          )}
        >
          RestaurantOS
        </span>
      )}
    </div>
  );
}
