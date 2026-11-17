import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const LiquidButton = forwardRef(({ 
  children, 
  variant = "primary", 
  size = "default",
  className, 
  ...props 
}, ref) => {
  const base = "relative overflow-hidden font-heading font-semibold tracking-wide transition-all duration-300 active:scale-95 cursor-pointer inline-flex items-center justify-center";
  
  const variants = {
    primary: "bg-[#F3A15A] text-[#1A202C] hover:shadow-[0_0_40px_rgba(243,161,90,0.5)] hover:-translate-y-0.5",
    glass: "bg-white/[0.07] text-white border border-white/20 backdrop-blur-md hover:bg-white/[0.14] hover:border-white/30 hover:shadow-[0_8px_32px_rgba(255,255,255,0.06)]",
    ghost: "bg-transparent text-white/80 hover:text-white hover:bg-white/[0.06]",
  };

  const sizes = {
    sm: "px-5 py-2 text-sm rounded-full",
    default: "px-7 py-3 text-base rounded-full",
    lg: "px-9 py-4 text-lg rounded-full",
    xl: "px-10 py-5 text-lg rounded-full",
  };

  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {/* Shimmer sweep */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] hover-shimmer pointer-events-none" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
});

LiquidButton.displayName = "LiquidButton";
export { LiquidButton };
