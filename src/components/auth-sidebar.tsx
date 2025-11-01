"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, User, UserCog } from "lucide-react"
import { motion } from "framer-motion"

interface AuthSidebarProps {
  recipientLink: string
  organizationLink: string
  adminLink: string
}

export function AuthSidebar({ recipientLink, organizationLink, adminLink }: AuthSidebarProps) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const activeIndex = isActive(recipientLink) ? 0 : isActive(organizationLink) ? 1 : 2

  return (
    <div className="w-16 shrink-0 h-fit fixed top-1/2 -translate-y-1/2 z-20"
         style={{ 
           left: 'max(16px, calc((100% - 540px) / 2 ))',
         }}>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-4xl p-2 flex flex-col gap-2 relative">
        {/* Animated background indicator - distinct pill/stick shape */}
        <motion.div
          layoutId="activeTabIndicator"
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
  )
}

