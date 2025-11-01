"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode
  trigger: React.ReactNode
  align?: "left" | "right" | "center"
}

export function DropdownMenu({ children, trigger, align = "right" }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown]')) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const alignClasses = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 -translate-x-1/2",
  }

  return (
    <div className="relative" data-dropdown>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute top-full mt-2 z-50 min-w-[200px] rounded-lg bg-card border border-border/50 shadow-lg p-1",
              alignClasses[align]
            )}
          >
            {children}
          </div>
        </>
      )}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors",
        className
      )}
    >
      {children}
    </button>
  )
}

