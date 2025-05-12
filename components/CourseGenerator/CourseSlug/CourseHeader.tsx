"use client"

import ForkBanner from "../../ui/fork"
import { useTranslations } from "next-intl"

interface CourseHeaderProps {
  moduleTitle: string
  lessonTitle: string
  courseId: string
  owners: string[]
}

export function CourseHeader({ moduleTitle, lessonTitle, courseId, owners }: CourseHeaderProps) {
  const t = useTranslations()

  return (
    <>
      {!owners?.includes("USER") && <ForkBanner courseId={courseId} />}
      <h2 className="text-2xl font-bold mb-2">{lessonTitle}</h2>
      <p className="text-sm text-gray-600 mb-6">
        {t("ai-course-content.module")} {moduleTitle}
      </p>
    </>
  )
}
