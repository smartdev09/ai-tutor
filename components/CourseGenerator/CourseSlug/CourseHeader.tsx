"use client"

import { ChatButton } from "../CourseControls/ChatButton"

interface CourseHeaderProps {
  moduleTitle: string
  toggleBot: boolean
  setToggleBot: (value: boolean) => void
}

export function CourseHeader({ moduleTitle,
  toggleBot,
  setToggleBot }: CourseHeaderProps) {

  return (
    <div className="flex items-center justify-between">
      <p className="text-lg text-gray-600">
        {moduleTitle}
      </p>
      <ChatButton toggleBot={toggleBot} setToggleBot={setToggleBot} />
    </div>
  )
}
