"use client"

import { courseService } from "@/lib/services/course"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ForkBannerProps {
  courseId: string
  userId: string
}

export default function ForkBanner({ courseId, userId }: ForkBannerProps) {
  const [loading, setLoading] = useState(false)
  const [Error, setError] = useState("")
  const router = useRouter()

  const handleFork = async () => {
    try {
      setLoading(true)
      const slug = await courseService.forkCourse(parseInt(courseId), userId)
      if(!slug.error)
        router.push(`${slug.newSlug}`)
      setError(slug?.error ?? "")
    } catch (error) {
      console.error("Failed to fork course:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between w-full p-4 bg-amber-100 rounded-lg gap-4 mb-4">
      <p className="text-sm font-medium text-gray-800 text-center sm:text-left">
        Fork the course to track progress and make changes to the course.
      </p>
      <button
        onClick={handleFork}
        disabled={loading}
        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-800 bg-amber-300 rounded-md hover:bg-amber-400 transition-colors whitespace-nowrap w-full sm:w-auto disabled:opacity-50"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-git-fork"
        >
          <circle cx="12" cy="18" r="3" />
          <circle cx="6" cy="6" r="3" />
          <circle cx="18" cy="6" r="3" />
          <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9" />
          <path d="M12 12v3" />
        </svg>
        {loading ? "Forking..." : "Fork Course"}
        {Error && <p className="text-red-500">{Error}</p>}
      </button>
    </div>
  )
}
