import { Progress } from "@/components/ui/progress"

interface XpProgressProps {
  currentXp: number
  level: number
}

export default function XpProgress({ currentXp, level }: XpProgressProps) {
  // Calculate XP needed for next level using a common RPG formula
  const baseXP = 100
  const xpForNextLevel = Math.floor(baseXP * Math.pow(1.5, level - 1))
  const progress = Math.min((currentXp / xpForNextLevel) * 100, 100)

  return (
    <div className="space-y-2">
      <Progress value={progress} className="h-2" />
      <div className="text-xs text-muted-foreground">
        {currentXp} / {xpForNextLevel} XP to Level {level + 1}
      </div>
    </div>
  )
} 