import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface CourseCardProps {
  course: {
    id: string
    title: string
    description: string
    subject: string
    sub_category: string
    difficulty_level: string
    cover_image_url?: string
    course_topics?: { count: number }[]
    user_progress?: { completed: boolean; progress_percentage: number }[]
    users?: { username: string }
  }
  isRecommended?: boolean
}

export default function CourseCard({ course, isRecommended = false }: CourseCardProps) {
  const topicCount = course.course_topics?.[0]?.count || 0
  const progress = course.user_progress?.[0]?.progress_percentage || 0
  const creator = course.users?.username

  return (
    <Card className="overflow-hidden">
      {course.cover_image_url && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={course.cover_image_url}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-2">{course.title}</CardTitle>
          <Badge variant="outline" className="ml-2 shrink-0">
            {course.difficulty_level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
          {course.description}
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{course.subject}</Badge>
          <Badge variant="secondary">{course.sub_category}</Badge>
        </div>
        {!isRecommended && progress > 0 && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        {isRecommended && creator && (
          <p className="mt-4 text-sm text-muted-foreground">
            Created by {creator}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {topicCount} {topicCount === 1 ? "Topic" : "Topics"}
          </span>
          <Link
            href={`/courses/${course.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            View Course →
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
} 