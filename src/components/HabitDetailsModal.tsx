import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import "./HabitDetailsModal.css"

interface HabitDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  habitName: string
  streak: number
  total: number
  completionDates: (Date | string)[]
}

export function HabitDetailsModal({
  isOpen,
  onClose,
  habitName,
  streak,
  total,
  completionDates,
}: HabitDetailsModalProps) {
  // Convert completion dates to Date objects for the calendar
  const selectedDates = completionDates.map(date => {
    if (date instanceof Date) {
      return date
    }
    // Handle string dates (YYYY-MM-DD format)
    if (typeof date === 'string') {
      const dateStr = date.split('T')[0] // Remove time if present
      return new Date(dateStr)
    }
    return new Date(date)
  }).filter(date => !isNaN(date.getTime()))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{habitName}</DialogTitle>
          <DialogDescription>
            Track your completion history and streak progress
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex gap-4 justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{streak}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-xs text-muted-foreground">Total Completions</div>
            </div>
          </div>

          {/* Calendar */}
          <div className="flex justify-center habit-calendar-readonly">
            <Calendar
              mode="multiple"
              selected={selectedDates}
              className="rounded-lg border border-border p-2"
              modifiersClassNames={{
                selected: "bg-primary text-primary-foreground",
              }}
              onSelect={() => {}} // Prevent selection changes
            />
          </div>

          {/* Info text */}
          <p className="text-xs text-center text-muted-foreground">
            Highlighted dates show when you completed this habit
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
