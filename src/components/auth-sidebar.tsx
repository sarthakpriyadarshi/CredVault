"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Building2, User, UserCog } from "lucide-react"
import { motion } from "framer-motion"

interface AuthSidebarProps {
  recipientLink: string
  organizationLink: string
  adminLink: string
}

export function AuthSidebar({ recipientLink, organizationLink, adminLink }: AuthSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = (path: string) => {
    // Check if pathname matches exactly
    if (pathname === path) return true
    // For forgot-password page, check if it was accessed from this login page
    if (pathname === "/forgot-password") {
      const fromParam = searchParams.get("from")
      if (fromParam === "recipient" && path === recipientLink) return true
      if (fromParam === "issuer" && path === organizationLink) return true
      if (fromParam === "admin" && path === adminLink) return true
    }
    return false
  }

  const activeIndex = isActive(recipientLink) ? 0 : isActive(organizationLink) ? 1 : 2

  return (
    <>
      {/* Mobile Horizontal Version - Top of Page */}
      <div className="md:hidden fixed top-4 left-1/2 -translate-x-1/2 z-20 w-fit">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-4xl p-2 flex gap-2 relative">
          {/* Animated background indicator - horizontal pill */}
          <motion.div
            layoutId="activeTabIndicatorMobile"
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="absolute top-2 bottom-2 bg-primary/20 border-2 border-primary/50 rounded-4xl shadow-lg"
            style={{
              left: `${activeIndex * 64 + 8}px`,
              width: '56px',
            }}
          />

          <Link
            href={recipientLink}
            className={`relative z-10 flex items-center justify-center w-14 h-14 transition-all duration-300 ${
              isActive(recipientLink)
                ? "text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <motion.div
              animate={{ scale: isActive(recipientLink) ? 1.15 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <User className="w-4 h-4" />
            </motion.div>
          </Link>
          <Link
            href={organizationLink}
            className={`relative z-10 flex items-center justify-center w-14 h-14 transition-all duration-300 ${
              isActive(organizationLink)
                ? "text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <motion.div
              animate={{ scale: isActive(organizationLink) ? 1.15 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <Building2 className="w-4 h-4" />
            </motion.div>
          </Link>
          <Link
            href={adminLink}
            className={`relative z-10 flex items-center justify-center w-14 h-14 transition-all duration-300 ${
              isActive(adminLink)
                ? "text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <motion.div
              animate={{ scale: isActive(adminLink) ? 1.15 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <UserCog className="w-4 h-4" />
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Desktop Vertical Version - Left Side */}
      <div className="hidden md:block w-16 shrink-0 h-fit fixed top-1/2 -translate-y-1/2 z-20"
           style={{ 
             left: 'max(16px, calc((100% - 540px) / 2 ))',
           }}>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-4xl p-2 flex flex-col gap-2 relative">
          {/* Animated background indicator - vertical pill */}
          <motion.div
            layoutId="activeTabIndicatorDesktop"
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="absolute left-2 right-2 bg-primary/20 border-2 border-primary/50 rounded-4xl shadow-lg"
            style={{
              top: `${activeIndex * 88 + 8}px`,
              height: '80px',
            }}
          />

          <Link
            href={recipientLink}
            className={`relative z-10 flex items-center justify-center w-full h-20 transition-all duration-300 ${
              isActive(recipientLink)
                ? "text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <motion.div
              animate={{ scale: isActive(recipientLink) ? 1.15 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <User className="w-5 h-5" />
            </motion.div>
          </Link>
          <Link
            href={organizationLink}
            className={`relative z-10 flex items-center justify-center w-full h-20 transition-all duration-300 ${
              isActive(organizationLink)
                ? "text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <motion.div
              animate={{ scale: isActive(organizationLink) ? 1.15 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <Building2 className="w-5 h-5" />
            </motion.div>
          </Link>
          <Link
            href={adminLink}
            className={`relative z-10 flex items-center justify-center w-full h-20 transition-all duration-300 ${
              isActive(adminLink)
                ? "text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <motion.div
              animate={{ scale: isActive(adminLink) ? 1.15 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <UserCog className="w-5 h-5" />
            </motion.div>
          </Link>
        </div>
      </div>
    </>
  )
}

