"use client"
import { parseContentFromMarkdown } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FlaskConical, Loader } from "lucide-react"
import { useEffect, useState } from "react"
import TestMyKnowledge from "../CourseDisplay/TestMyKnowledge"
import { ChatButton } from "../CourseControls/ChatButton"
import { setCurrentLessonContent } from "@/store/courseSlice"
import { useAppDispatch } from "@/store/hooks"

interface CourseContentProps {
  lessonContent: string
  lessonError: string
  isLoadingLesson: boolean
  handleSelectLesson: () => void
  toggleBot: boolean
  setToggleBot: (value: boolean) => void
}

export function CourseContent({ 
  lessonContent, 
  lessonError, 
  isLoadingLesson, 
  handleSelectLesson, 
  toggleBot, 
  setToggleBot 
}: CourseContentProps) {
  const [testMyKnowledgeToggle, setTestMyKnowledgeToggle] = useState<boolean>(false)
  const dispatch = useAppDispatch()

  useEffect(() => {
    setTestMyKnowledgeToggle(false);
  }, [lessonContent]);

  // Parse the markdown content to HTML
  const parsedContent = parseContentFromMarkdown(lessonContent)
  dispatch(setCurrentLessonContent(parsedContent))

  if (lessonError) {
    return (
      <div className="bg-white min-h-[85vh] overflow-auto justify-center items-center">
        <div className="flex flex-col items-center justify-center mt-[20%] h-full space-y-6 text-center">
          <div className="bg-red-100 p-5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-800">Error Loading Lesson</h3>
            <p className="text-muted-foreground max-w-md">{lessonError}</p>
            <Button
              onClick={handleSelectLesson}
              variant="default"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleTestMyKnowledgeToggle = () => {
    setTestMyKnowledgeToggle(!testMyKnowledgeToggle)
  }

  return (
    <div className="bg-white rounded-xl min-h-[85vh] overflow-auto">
      <ChatButton toggleBot={toggleBot} setToggleBot={setToggleBot} />
      
      {lessonContent ? (
        <div className="prose prose-lg max-w-none relative min-h-[200px] lesson-content">
          <div className="content-container" dangerouslySetInnerHTML={{ __html: parsedContent }} />
          
          {isLoadingLesson && (
            <span className="inline-block h-5 w-2 bg-purple-500 animate-pulse ml-0.5 align-bottom"></span>
          )}
          
          {!isLoadingLesson && (
            testMyKnowledgeToggle ? (
              <div className="mt-12">
                <TestMyKnowledge />
              </div>
            ) : (
              <Button
                variant="default"
                onClick={handleTestMyKnowledgeToggle}
                className="mt-12"
              >
                <FlaskConical className="mr-2 h-4 w-4" />
                Test My Knowledge
              </Button>
            )
          )}
        </div>
      ) : isLoadingLesson ? (
        <div className="flex flex-col items-center justify-center h-full space-y-6 text-center mt-[20%]">
          <div className="relative">
            <div className="bg-purple-100 p-5 rounded-full">
              <Loader className="h-12 w-12 text-purple-400 animate-spin" />
            </div>
            <div className="absolute -top-2 -right-2 h-4 w-4 bg-purple-500 rounded-full animate-ping"></div>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-800">Preparing your lesson</h3>
            <p className="text-muted-foreground max-w-md">
              Your selected lesson is being prepared. Please wait while we generate content for lessons in sequence.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
          <div className="bg-gray-100 p-5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-800">No Content Available</h3>
            <p className="text-muted-foreground max-w-md">No content available yet.</p>
          </div>
        </div>
      )}
    </div>
  )
}