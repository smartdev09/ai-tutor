interface LessonItemProps {
  lesson: string;
  lessonNumber: number;
}

export function LessonItem({ lesson, lessonNumber }: LessonItemProps) {
  return (
    <li className="group">
      <div className="flex items-center py-1.5 px-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors">
        <span className="text-xs text-muted-foreground mr-2 group-hover:text-accent-foreground transition-colors">
          {lessonNumber}.
        </span>
        <span className="text-sm group-hover:text-accent-foreground transition-colors">
          {lesson}
        </span>
      </div>
    </li>
  );
} 