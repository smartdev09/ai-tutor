"use client"


interface CourseHeaderProps {
  moduleTitle: string
  lessonTitle: string
}

export function CourseHeader({ moduleTitle, lessonTitle }: CourseHeaderProps) {

  return (
    <>
      <h2 className="text-2xl font-bold mb-2">{lessonTitle}</h2>
      <p className="text-sm text-gray-600 mb-6">
        {'Module: '} {moduleTitle}
      </p>
    </>
  )
}
