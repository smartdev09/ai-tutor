"use client"

interface CourseHeaderProps {
  moduleTitle: string
  lessonTitle: string
}

export function CourseHeader({ moduleTitle }: CourseHeaderProps) {

  return (
    <>
      <p className="text-sm text-gray-600">
        Module: {moduleTitle}
      </p>
    </>
  )
}
