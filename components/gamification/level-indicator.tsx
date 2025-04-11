import { Badge } from "@/components/ui/badge"

interface LevelIndicatorProps {
  level: number
}

export default function LevelIndicator({ level }: LevelIndicatorProps) {
  return (
    <Badge variant="secondary" className="font-semibold">
      Level {level}
    </Badge>
  )
} 