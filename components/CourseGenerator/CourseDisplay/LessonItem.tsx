import { cn } from "@/lib/utils"

interface LessonItemProps {
  lesson: string
  lessonNumber: number
  isActive?: boolean
  isStreaming?: boolean
  isWaiting?: boolean 
  onClick?: () => void
  disabled?: boolean
}

export function LessonItem({ 
  lesson, 
  lessonNumber, 
  isActive = false, 
  isStreaming = false,
  isWaiting = false,
  disabled = false,
  onClick
}: LessonItemProps) {
  return (
    <li className="group">
      <div
        className={cn(
          "flex items-center py-2 px-3 rounded-lg cursor-pointer transition-all",
          isActive ? "bg-primary/10 text-primary" : "hover:bg-primary/5 hover:text-primary",
          disabled && "opacity-50 pointer-events-none"
        )}
        onClick={disabled ? undefined : onClick}
      >
        <span className="text-xs text-muted-foreground mr-2 group-hover:text-primary transition-colors">
          {lessonNumber}.
        </span>
        <span className="text-sm group-hover:text-primary transition-colors">{lesson}</span>

        {isStreaming && (
          <div className="ml-auto flex items-center">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </div>
          </div>
        )}
        
        {isWaiting && (
          <div className="ml-auto flex items-center">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </div>
          </div>
        )}
      </div>
    </li>
  )
}