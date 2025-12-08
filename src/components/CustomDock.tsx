import * as React from "react"
import { useNavigate } from 'react-router-dom'
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { LucideIcon, Plus } from "lucide-react"

interface DockProps {
  className?: string
  items: {
    icon: LucideIcon
    label: string
    onClick?: () => void
  }[]
}

interface DockIconButtonProps {
  icon: LucideIcon
  label: string
  onClick?: () => void
  className?: string
}

interface CenterButtonProps {
  onClick?: () => void
  className?: string
}

const floatingAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-2, 2, -2] as [number, number, number],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

const DockIconButton = React.forwardRef<HTMLButtonElement, DockIconButtonProps>(
  ({ icon: Icon, label, onClick, className }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "relative group p-3 rounded-lg",
          "hover:bg-secondary transition-colors",
          className
        )}
      >
        <Icon className="w-5 h-5 text-foreground" />
        <span className={cn(
          "absolute -top-8 left-1/2 -translate-x-1/2",
          "px-2 py-1 rounded text-xs",
          "bg-popover text-popover-foreground",
          "opacity-0 group-hover:opacity-100",
          "transition-opacity whitespace-nowrap pointer-events-none"
        )}>
          {label}
        </span>
      </motion.button>
    )
  }
)
DockIconButton.displayName = "DockIconButton"

const CenterButton = React.forwardRef<HTMLButtonElement, CenterButtonProps>(
  ({ onClick, className }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.15, y: -4 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className={cn(
          "relative p-4 rounded-full",
          "bg-foreground text-background",
          "hover:opacity-90 transition-opacity",
          "shadow-lg",
          className
        )}
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    )
  }
)
CenterButton.displayName = "CenterButton"

const CustomDock = React.forwardRef<HTMLDivElement, DockProps>(
  ({ items, className }, ref) => {
    const navigate = useNavigate()
    const centerIndex = Math.floor(items.length / 2)

    const leftItems = items.slice(0, centerIndex)
    const rightItems = items.slice(centerIndex)

    return (
      <div ref={ref} className={cn("w-full flex items-center justify-center p-2", className)}>
        <motion.div
          initial="initial"
          animate="animate"
          variants={floatingAnimation as any}
          className={cn(
            "flex items-center gap-1 p-3 rounded-2xl",
            "backdrop-blur-lg border shadow-lg",
            "bg-background/90 border-border",
            "hover:shadow-xl transition-shadow duration-300"
          )}
        >
          {leftItems.map((item) => (
            <DockIconButton key={item.label} {...item} />
          ))}
          
          <CenterButton onClick={() => navigate('/create-post')} />
          
          {rightItems.map((item) => (
            <DockIconButton key={item.label} {...item} />
          ))}
        </motion.div>
      </div>
    )
  }
)
CustomDock.displayName = "CustomDock"

export { CustomDock }

