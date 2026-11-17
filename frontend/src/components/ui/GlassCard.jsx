import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const GlassCard = forwardRef(({ 
  children, 
  variant = "default",
  hover = true,
  className, 
  ...props 
}, ref) => {
  const base = "rounded-2xl transition-all duration-300";
  
  const variants = {
    default: "bg-white/[0.05] backdrop-blur-xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
    solid: "bg-[#333D47]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.2)]",
    highlight: "bg-white/[0.07] backdrop-blur-xl border border-[#F3A15A]/20 shadow-[0_8px_32px_rgba(243,161,90,0.08)]",
  };

  const hoverClass = hover 
    ? "hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:border-white/20" 
    : "";

  return (
    <div
      ref={ref}
      className={cn(base, variants[variant], hoverClass, className)}
      {...props}
    >
      {children}
    </div>
  );
});

GlassCard.displayName = "GlassCard";
export { GlassCard };
