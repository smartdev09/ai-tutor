"use client"

import { useTranslations } from "next-intl"
import FurtherReading from "./FurtherReading"
import { parseContentFromMarkdown } from "@/lib/utils"

interface CourseContentProps {
  slug: string
  lessonContent: string
  lessonError: string
  isLoadingLesson: boolean
  handleSelectLesson: () => void
}

export function CourseContent({ slug, lessonContent, lessonError, isLoadingLesson, handleSelectLesson }: CourseContentProps) {
  const t = useTranslations()

  // Parse the markdown content to HTML
  const parsedContent = parseContentFromMarkdown(lessonContent)

  if (lessonError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">{t("ai-course-content.error_loading_lesson")}</h3>
        <p>{lessonError}</p>
        <button
          onClick={handleSelectLesson}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          {t("ai-course-content.try_again_short")}
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="prose prose-blue max-w-none">
        {/* Rendering the parsed HTML content with streaming support */}
        {lessonContent ? (
          <div className="relative">
            <div dangerouslySetInnerHTML={{ __html: parsedContent }} />
            {isLoadingLesson && (
              <span className="inline-block h-5 w-2 bg-blue-500 animate-pulse ml-0.5 align-bottom"></span>
            )}
          </div>
        ) : isLoadingLesson ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5 mb-6"></div>
          </div>
        ) : (
          <p className="text-gray-500">{t("ai-course-content.no_content_available")}</p>
        )}
      </div>
      <FurtherReading slug={slug} />
    </>
  )
}
