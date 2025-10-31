import * as React from "react"
import { cn } from "@/lib/utils"

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "default" | "gradient" | "outline"
}

export function PrimaryButton({ 
  children, 
  className, 
  variant = "gradient",
  ...props 
}: PrimaryButtonProps) {
  return (
    <button
      className={cn(
        "relative z-30 rounded-md font-bold cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-flex items-center justify-center gap-2 text-center px-4 text-sm",
        variant === "gradient" && "py-2 bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]",
        variant === "default" && "py-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]",
        variant === "outline" && "py-3.5 border border-border/50 bg-background/50 backdrop-blur-sm text-foreground hover:bg-background/80 hover:border-primary/50 shadow-[inset_0_2px_8px_rgba(219,39,119,0.3)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

