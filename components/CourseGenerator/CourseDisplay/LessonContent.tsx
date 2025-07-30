"use client"
// Move uuidv4 import to the top with other imports
import { v4 as uuidv4 } from 'uuid';

import type React from "react"
import type { Module } from "@/types"
import { useCompletion } from "@ai-sdk/react"
import { useState, useEffect, useRef, useCallback } from "react" // Import useCallback
import { parseContentFromMarkdown } from "@/lib/utils"
import { BookOpen, Loader, Edit, Save, X, FlaskConical } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  addProcessedLesson,
  setEditingLessonContent,
  setIsEditing,
  updateLessonContent,
  setEditingModuleTitle,
  clearEditingTitles,
  setGeneratedCourse,
  setCurrentLessonContent,
  setCurrentLessonTitle
} from "@/store/courseSlice"
import { courseService } from "@/lib/services/course"
import { toast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import TestMyKnowledge from "./TestMyKnowledge"
import ContextModalButton from "./EditPrompt"
import { useLocale, useTranslations } from "next-intl"

interface LessonContentProps {
  module: Module
  onModuleProcessed: () => void
  initialLessonIndex?: number
  waitingForLesson?: boolean
  onLessonReached?: (lessonIndex: number) => void
  slug?: string
}

export function LessonContent({
  module,
  onModuleProcessed,
  initialLessonIndex = 0,
  waitingForLesson = false,
  onLessonReached,
  slug,
}: LessonContentProps) {
  const t = useTranslations()
  const dispatch = useAppDispatch()
  const lang = useLocale();
  const currentModuleIndex = useAppSelector((state) => state.course.currentModuleIndex)
  const reduxProcessedLessons = useAppSelector((state) => state.course.processedLessons)
  const isEditing = useAppSelector((state) => state.course.isEditing)
  const editingLessonContent = useAppSelector((state) => state.course.editingLessonContent)
  const generatedCourse = useAppSelector((state) => state.course.generatedCourse);

  const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(initialLessonIndex)
  const [generatingLessonIndex, setGeneratingLessonIndex] = useState<number>(-1)
  const [isProcessingBackground, setIsProcessingBackground] = useState<boolean>(false)

  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [testMyKnowledgeToggle, setTestMyKnowledgeToggle] = useState<boolean>(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const moduleRef = useRef<string>("")
  const processedModulesRef = useRef<{ [key: string]: boolean }>({})
  const [currentModuleTitle, setCurrentModuleTitle] = useState<string>("")

  const editingModuleTitle = useAppSelector((state) => state.course.editingModuleTitle);
  const editingModuleId = useAppSelector((state) => state.course.editingModuleId);

  // --- FIX 1: `currentLessonTitle` definition and dispatch ---
  // Ensure currentLessonTitle is always a string.
  // It should get the title property directly from the lesson object.
  const currentLessonTitleText = module?.lessons[currentLessonIndex]?.title || "";

  useEffect(() => {
    // Only dispatch if the title is available and has actually changed to avoid unnecessary Redux updates.
    if (currentLessonTitleText) {
      dispatch(setCurrentLessonTitle(currentLessonTitleText));
    }
  }, [currentLessonTitleText, dispatch]);
  // --- END FIX 1 ---

  const handleModuleTitleEdit = () => {
    dispatch(setEditingModuleTitle({ title: module.title, moduleId: currentModuleId || "" }));
  };

  const handleModuleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setEditingModuleTitle({ title: e.target.value, moduleId: editingModuleId || "" }));
  };

  const handleSaveModuleTitle = async () => {
    if (!editingModuleId) return;

    try {
      setIsSaving(true);
      await courseService.updateModule(editingModuleId, editingModuleTitle);

      if (currentModuleIndex !== null && generatedCourse?.modules) {
        const updatedModules = [...generatedCourse.modules];
        // Ensure you are updating the correct module in the local state.
        // `module` prop may not reflect the latest Redux state immediately.
        // It's better to update via Redux and let selectors pick it up.
        // Or, update the `module` prop from the parent component.
        // For now, let's update the `generatedCourse` in Redux.
        const newGeneratedCourse = { ...generatedCourse };
        if (newGeneratedCourse.modules && currentModuleIndex < newGeneratedCourse.modules.length) {
          newGeneratedCourse.modules[currentModuleIndex] = {
            ...newGeneratedCourse.modules[currentModuleIndex],
            title: editingModuleTitle,
          };
          dispatch(setGeneratedCourse(newGeneratedCourse));
        }
      }

      dispatch(clearEditingTitles());
      toast({
        title: t("lesson-content.success"),
        description: t("lesson-content.moduleTitleUpdated"),
      });
    } catch (error) {
      console.error("Error saving module title:", error);
      toast({
        title: t("lesson-content.error"),
        description: t("lesson-content.failedToSaveModuleTitle"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    dispatch(clearEditingTitles());
  };

  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/generate-lesson",
  })

  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null); // Initialize with null

  // --- FIX 2: Stable module ID generation ---
  // Generate uuidv4 ONLY when needed, not on every render.
  // This effect will run once when slug or currentModuleIndex changes.
  useEffect(() => {
    const fetchModuleId = async () => {
      if (!slug || currentModuleIndex === null) {
        // If slug or currentModuleIndex is null, reset ID and return
        setCurrentModuleId(null);
        return;
      }

      try {
        const course = await courseService.getCourse(slug);
        // If course.id exists, fetch from DB. Otherwise, generate a new UUID for the session.
        const fetchedModuleId = course?.id
          ? await courseService.getModuleIdByPosition(course.id, currentModuleIndex)
          : null; // Start with null if no course ID

        // Only set the ID if it's different from the current state
        if (fetchedModuleId && fetchedModuleId !== currentModuleId) {
          setCurrentModuleId(fetchedModuleId);
        } else if (!fetchedModuleId && !currentModuleId) {
          // If no fetched ID and current ID is null, generate a new one only once
          // This ensures that a new UUID is generated only if it's genuinely new module
          // that doesn't exist in DB, and only once per mount if DB lookup fails.
          // The issue was `id` being generated on every render.
          setCurrentModuleId(uuidv4());
        }
      } catch (e) {
        console.error("Error fetching module ID:", e);
        // Fallback to generating a UUID if there's an error fetching from DB
        if (!currentModuleId) { // Only generate if not already set
           setCurrentModuleId(uuidv4());
        }
      }
    };
    fetchModuleId();
  }, [slug, currentModuleIndex, currentModuleId]); // Include currentModuleId in dependencies to prevent re-fetching if it's already set.
  // --- END FIX 2 ---


  // Get current content directly from Redux processed lessons
  // This will ensure currentContent updates when Redux updates, without local state.
  const currentContent = currentModuleIndex !== null && reduxProcessedLessons[currentModuleIndex]
    ? reduxProcessedLessons[currentModuleIndex][currentLessonIndex] || ""
    : "";

  // Dispatch current lesson content to Redux (moved from render)
  // This `useEffect` is typically fine if `currentContent` is truly stable.
  // The Redux state update itself causes a re-render, but if `currentContent`
  // doesn't change on that re-render, the effect won't re-dispatch.
  useEffect(() => {
    if (currentContent) {
      dispatch(setCurrentLessonContent(currentContent));
    }
  }, [currentContent, dispatch]);


  const parsedContent = parseContentFromMarkdown(
    // Show streamed completion ONLY if this is the lesson actively being generated AND displayed
    generatingLessonIndex === currentLessonIndex && isLoading && completion ? completion : currentContent,
  )

  // This effect handles setting the initial lesson index from props
  useEffect(() => {
    if (initialLessonIndex !== currentLessonIndex) {
      setCurrentLessonIndex(initialLessonIndex);
    }
  }, [initialLessonIndex, currentLessonIndex]);


  // Effect to initiate background generation for the module
  useEffect(() => {
    if (!module?.title || !module?.lessons) return;

    if (moduleRef.current !== module.title) {
      moduleRef.current = module.title;
      setCurrentModuleTitle(module.title);

      setGeneratingLessonIndex(-1);
      setIsProcessingBackground(false);

      const moduleKey = module.title;
      const moduleLessonsInRedux = currentModuleIndex !== null && reduxProcessedLessons
        ? reduxProcessedLessons[currentModuleIndex] || {}
        : {};

      const isModuleFullyProcessed = module.lessons.every((_, index) => {
        return !!moduleLessonsInRedux[index];
      });

      if (isModuleFullyProcessed) {
        onModuleProcessed();
        processedModulesRef.current[moduleKey] = true;
      } else {
        let nextLessonToGenerate = 0;
        if (moduleLessonsInRedux) {
          while (nextLessonToGenerate < module.lessons.length && moduleLessonsInRedux[nextLessonToGenerate]) {
            nextLessonToGenerate++;
          }
        }

        if (nextLessonToGenerate < module.lessons.length) {
          setGeneratingLessonIndex(nextLessonToGenerate);
          setIsProcessingBackground(true);
          complete("", {
            body: {
              moduleTitle: module.title,
              lessonTitle: module.lessons[nextLessonToGenerate].title || "",
              lang: lang,
            },
          });
        } else {
          setIsProcessingBackground(false);
          onModuleProcessed();
        }
      }
    }
  }, [
    module?.title,
    module?.lessons,
    currentModuleIndex,
    reduxProcessedLessons,
    complete,
    onModuleProcessed,
    lang,
  ]);


  // Effect to handle the completion of a background lesson generation
  useEffect(() => {
    if (!isLoading && completion && isProcessingBackground) {
      const currentAICompletedIndex = generatingLessonIndex;

      if (currentModuleIndex !== null && currentAICompletedIndex !== -1) {
        dispatch(
          addProcessedLesson({
            moduleIndex: currentModuleIndex,
            lessonIndex: currentAICompletedIndex,
            content: completion,
          }),
        );
      }

      if (onLessonReached && currentAICompletedIndex === currentLessonIndex) {
        onLessonReached(currentAICompletedIndex);
      }

      const nextIndexInSequence = currentAICompletedIndex + 1;
      const moduleLessonsCount = module?.lessons?.length || 0;

      if (nextIndexInSequence < moduleLessonsCount) {
        const moduleLessonsInRedux =
          currentModuleIndex !== null && reduxProcessedLessons
            ? reduxProcessedLessons[currentModuleIndex] || {}
            : {};

        let nextLessonForAI = nextIndexInSequence;

        while (nextLessonForAI < moduleLessonsCount && moduleLessonsInRedux[nextLessonForAI]) {
          nextLessonForAI++;
        }

        if (nextLessonForAI < moduleLessonsCount) {
          setGeneratingLessonIndex(nextLessonForAI);
          complete("", {
            body: {
              moduleTitle: module?.title,
              lessonTitle: module?.lessons[nextLessonForAI].title || "",
              lang: lang,
            },
          });
        } else {
          setIsProcessingBackground(false);
          onModuleProcessed();
        }
      } else {
        setIsProcessingBackground(false);
        onModuleProcessed();
      }
    }
  }, [
    isLoading,
    completion,
    isProcessingBackground,
    generatingLessonIndex,
    module?.lessons,
    onModuleProcessed,
    complete,
    module?.title,
    onLessonReached,
    currentLessonIndex,
    currentModuleIndex,
    dispatch,
    reduxProcessedLessons,
    lang,
  ]);


  const progressPercentage = module?.lessons?.length
    ? (Object.keys(reduxProcessedLessons[currentModuleIndex!] || {}).length / module.lessons.length) * 100
    : 0


  const currentLessonNumber = currentLessonIndex + 1
  const isLessonGenerated = currentModuleIndex !== null && !!reduxProcessedLessons[currentModuleIndex]?.[currentLessonIndex]
  const isCurrentLessonBeingGenerated = generatingLessonIndex === currentLessonIndex && isLoading

  const showLoader = waitingForLesson && !isLessonGenerated && !isCurrentLessonBeingGenerated;


  const handleEditToggle = () => {
    if (isEditing) {
      dispatch(setIsEditing(false))
    } else {
      dispatch(setEditingLessonContent(currentContent))
      dispatch(setIsEditing(true))
    }
  }

  // --- FIX 3: Reset TestMyKnowledgeToggle on lesson change ---
  useEffect(() => {
    setTestMyKnowledgeToggle(false)
  }, [currentLessonIndex, module]); // Also depend on module to reset if module changes
  // --- END FIX 3 ---


  const handleTestMyKnowledgeToggle = useCallback(() => { // Wrap in useCallback
    setTestMyKnowledgeToggle(prev => !prev);
  }, []); // Empty dependency array means it's stable

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setEditingLessonContent(e.target.value))
  }

  const handleSaveContent = async () => {
    if (currentModuleIndex === null) return

    try {
      setIsSaving(true)

      dispatch(
        updateLessonContent({
          moduleIndex: currentModuleIndex,
          lessonIndex: currentLessonIndex,
          content: editingLessonContent,
        }),
      )

      if (currentModuleId) { // Use currentModuleId (now nullable)
        await courseService.updateLessonByModuleAndPosition(currentModuleId, currentLessonIndex, editingLessonContent)

        toast({
          title: t("lesson-content.success"),
          description: t("lesson-content.lessonContentUpdated"),
        })
      } else {
        console.warn("Module ID not available, changes only saved locally")
        toast({
          title: t("lesson-content.warning"),
          description: t("lesson-content.changesSavedLocally"),
          variant: "default",
        })
      }

      dispatch(setIsEditing(false))
    } catch (error) {
      console.error("Error saving lesson content:", error)
      toast({
        title: t("lesson-content.error"),
        description: t("lesson-content.failedToSaveLessonContent") + ": " + (error instanceof Error ? error.message : t("lesson-content.unknownError")),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const [userPrompt, setUserPrompt] = useState<string>("")
  const handleOnSubmit = useCallback((input: string) => { // Wrap in useCallback
    setUserPrompt(input);
  }, []);

  useEffect(() => {
    if (userPrompt && module?.lessons?.[currentLessonIndex]) {
      setGeneratingLessonIndex(currentLessonIndex)
      setIsProcessingBackground(true);
      setTestMyKnowledgeToggle(false)

      complete("", {
        body: {
          moduleTitle: module?.title,
          lessonTitle: module?.lessons[currentLessonIndex].title || "",
          userPrompt: userPrompt,
          lang: lang,
        },
      })
    }
  }, [userPrompt, currentLessonIndex, module?.lessons, module?.title, complete, lang]);


  return (
    <div className="space-y-4 w-full mx-auto">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ContextModalButton onSubmit={handleOnSubmit} />
            <BookOpen className="h-6 w-6 text-white" />
            {editingModuleId === currentModuleId ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingModuleTitle}
                  onChange={handleModuleTitleChange}
                  className="text-2xl text-white font-bold bg-transparent border-b border-white/50 focus:border-white focus:outline-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t('lesson-content.cancelButton')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    onClick={handleSaveModuleTitle}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader className="h-4 w-4 mr-1 animate-spin" />
                        {t('lesson-content.savingButton')}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        {t('lesson-content.saveButton')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <h2 className="text-2xl text-white font-bold">
                {module?.title}
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-2 text-white/70 hover:text-white hover:bg-white/20"
                  onClick={handleModuleTitleEdit}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </h2>
            )}
          </div>

          {isProcessingBackground && (
            <div className="flex items-center gap-2 text-sm text-white bg-white/20 px-3 py-1.5 rounded-full">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
              <span>{t('lesson-content.generatingIndicator')}</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-white/90 text-sm mb-1">
            <span>{t('lesson-content.progressLabel')}</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2 bg-white/30" />
        </div>

        <div className="flex justify-between items-center">
          <p className="text-white/90 flex items-center gap-2">
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
              {currentLessonNumber}/{module?.lessons?.length}
            </span>
            {/* Display the correct currentLessonTitleText here */}
            <span className="text-sm font-medium">{currentLessonTitleText}</span>
            {waitingForLesson && !isLessonGenerated && !isCurrentLessonBeingGenerated && (
              <span className="inline-flex items-center bg-white/20 px-2 py-1 rounded-full text-xs">
                <Loader className="h-3 w-3 mr-1 animate-spin" />
                {t('lesson-content.waitingIndicator')}
              </span>
            )}
          </p>

          {isLessonGenerated && !isCurrentLessonBeingGenerated && (
            <div>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    onClick={handleEditToggle}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t('lesson-content.cancelButton')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    onClick={handleSaveContent}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader className="h-4 w-4 mr-1 animate-spin" />
                        {t('lesson-content.savingButton')}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        {t('lesson-content.saveButton')}
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  onClick={handleEditToggle}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {t('lesson-content.editButton')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-white p-4 bg-red-500/90 rounded-lg mt-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {t('lesson-content.errorMessage')}
        </div>
      )}

      <div
        className="bg-white rounded-xl p-8 min-h-[85vh] overflow-auto shadow-md border border-gray-100"
        ref={contentRef}
      >
        {showLoader ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
            <div className="relative">
              <div className="bg-purple-100 p-5 rounded-full">
                <Loader className="h-12 w-12 text-purple-600 animate-spin" />
              </div>
              <div className="absolute -top-2 -right-2 h-4 w-4 bg-purple-500 rounded-full animate-ping"></div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-800">{t('lesson-content.loadingTitle')}</h3>
              <p className="text-muted-foreground max-w-md">
                {t('lesson-content.loadingDescription')}
              </p>
            </div>
          </div>
        ) : isEditing ? (
          <div className="prose prose-lg max-w-none relative min-h-[200px]">
            <Textarea
              value={editingLessonContent}
              onChange={handleContentChange}
              className="min-h-[70vh] font-mono text-sm p-4"
              placeholder={`${t('lesson-content.contentPlaceholder')}`}
            />
          </div>
        ) : (
          <div className="prose prose-lg max-w-none relative min-h-[200px] lesson-content">
            <div className="content-container" dangerouslySetInnerHTML={{ __html: parsedContent }} />
            {!isCurrentLessonBeingGenerated && (
              testMyKnowledgeToggle ? (
                <div className="mt-12">
                  {/* --- FIX 4: Remove literal string --- */}
                  {/* {'testMyKnowledge'} <-- REMOVE THIS LINE */}
                  <TestMyKnowledge lessonContent={currentContent} />
                </div>
              ) : (
                <Button
                  variant="default"
                  onClick={handleTestMyKnowledgeToggle}
                  disabled={!currentContent}
                >
                  <FlaskConical />
                  {t('lesson-content.testKnowledgeButton')}
                </Button>
              )
            )}

            {isCurrentLessonBeingGenerated && (
              <span className="inline-block h-5 w-2 bg-purple-500 animate-pulse ml-0.5 align-bottom"></span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
export default LessonContent
// "use client"

// import type React from "react"
// import type { Module } from "@/types"
// import { useCompletion } from "@ai-sdk/react"
// import { useState, useEffect, useRef } from "react"
// import { parseContentFromMarkdown } from "@/lib/utils"
// import { BookOpen, Loader, Edit, Save, X, FlaskConical } from "lucide-react"
// import { Progress } from "@/components/ui/progress"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import {
//   addProcessedLesson,
//   setEditingLessonContent,
//   setIsEditing,
//   updateLessonContent,
//   setEditingModuleTitle,
//   clearEditingTitles,
//   setGeneratedCourse,
//   setCurrentLessonContent,
//   setCurrentLessonTitle
// } from "@/store/courseSlice"
// import { courseService } from "@/lib/services/course"
// import { toast } from "@/hooks/use-toast"
// import { Textarea } from "@/components/ui/textarea"
// import { Button } from "@/components/ui/button"
// import TestMyKnowledge from "./TestMyKnowledge"
// import ContextModalButton from "./EditPrompt"
// import { useLocale, useTranslations } from "next-intl"

// interface LessonContentProps {
//   module: Module
//   onModuleProcessed: () => void
//   initialLessonIndex?: number
//   waitingForLesson?: boolean
//   onLessonReached?: (lessonIndex: number) => void
//   slug?: string
// }

// export function LessonContent({
//   module,
//   onModuleProcessed,
//   initialLessonIndex = 0,
//   waitingForLesson = false,
//   onLessonReached,
//   slug,
// }: LessonContentProps) {
//   const t = useTranslations()
//   const dispatch = useAppDispatch()
//   const lang = useLocale();
//   const currentModuleIndex = useAppSelector((state) => state.course.currentModuleIndex)
//   const reduxProcessedLessons = useAppSelector((state) => state.course.processedLessons)
//   const isEditing = useAppSelector((state) => state.course.isEditing)
//   const editingLessonContent = useAppSelector((state) => state.course.editingLessonContent)
//   const generatedCourse = useAppSelector((state) => state.course.generatedCourse);

//   const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(initialLessonIndex)
//   const [isProcessing, setIsProcessing] = useState<boolean>(false)
//   const [processedLessons, setProcessedLessons] = useState<Record<number, string>>({})
//   const [generatingLessonIndex, setGeneratingLessonIndex] = useState<number>(0)
//   const [userSelectedLesson, setUserSelectedLesson] = useState<boolean>(false)
//   const [isSaving, setIsSaving] = useState<boolean>(false)
//   const [testMyKnowledgeToggle, setTestMyKnowledgeToggle] = useState<boolean>(false)

//   const contentRef = useRef<HTMLDivElement>(null)
//   const moduleRef = useRef<string>("")
//   const processedModulesRef = useRef<{ [key: string]: boolean }>({})
//   const [currentModuleTitle, setCurrentModuleTitle] = useState<string>("")

//   const editingModuleTitle = useAppSelector((state) => state.course.editingModuleTitle);
//   const editingModuleId = useAppSelector((state) => state.course.editingModuleId);


//   const handleModuleTitleEdit = () => {
//     dispatch(setEditingModuleTitle({ title: module.title, moduleId: currentModuleId || "" }));
//   };

//   const handleModuleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     dispatch(setEditingModuleTitle({ title: e.target.value, moduleId: editingModuleId || "" }));
//   };

//   const handleSaveModuleTitle = async () => {
//     if (!editingModuleId) return;

//     try {
//       setIsSaving(true);
//       await courseService.updateModule(editingModuleId, editingModuleTitle);

//       // Update local state using the component level selector
//       if (currentModuleIndex !== null && generatedCourse?.modules) {
//         const updatedModules = [...generatedCourse.modules];
//         updatedModules[currentModuleIndex].title = editingModuleTitle;
//         dispatch(setGeneratedCourse({ ...generatedCourse, modules: updatedModules }));
//       }

//       dispatch(clearEditingTitles());
//       toast({
//         title: "Success",
//         description: "Module title updated successfully",
//       });
//     } catch (error) {
//       console.error("Error saving module title:", error);
//       toast({
//         title: "Error",
//         description: "Failed to save module title",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleCancelEdit = () => {
//     dispatch(clearEditingTitles());
//   };

//   const { completion, complete, isLoading, error } = useCompletion({
//     api: "/api/generate-lesson",
//   })

//   const [currentModuleId, setCurrentModuleId] = useState<string>()

//   useEffect(() => {
//     const fetchModuleId = async () => {
//       if (!slug || currentModuleIndex === null) return;
//       const courseId = await courseService.getCourse(slug)
//       const moduleId = await courseService.getModuleIdByPosition(courseId.id, currentModuleIndex)
//       setCurrentModuleId(moduleId)
//     }
//     fetchModuleId()
//   },[slug, currentModuleIndex]) // FIX: Added dependency array here

//   useEffect(() => {
//     if (currentModuleIndex !== null && reduxProcessedLessons[currentModuleIndex]) {
//       const moduleLessons = reduxProcessedLessons[currentModuleIndex]
//       if (module?.title === currentModuleTitle) {
//         setProcessedLessons(moduleLessons || {})
//       }
//     }
//   }, [currentModuleIndex, currentModuleTitle, module?.title, reduxProcessedLessons])

//   const currentContent = processedLessons[currentLessonIndex] || ""

//   // FIX: Moved dispatch(setCurrentLessonContent) into a useEffect
//   useEffect(() => {
//     // Only dispatch if currentContent is actually different, to prevent unnecessary renders
//     if (currentContent) {
//       dispatch(setCurrentLessonContent(currentContent));
//     }
//   }, [currentContent, dispatch]);


//   const parsedContent = parseContentFromMarkdown(
//     generatingLessonIndex === currentLessonIndex && isProcessing ? completion || "" : currentContent,
//   )

//   useEffect(() => {
//     if (initialLessonIndex !== currentLessonIndex) {
//       setCurrentLessonIndex(initialLessonIndex)
//       setUserSelectedLesson(true)
//     }
//   }, [initialLessonIndex, currentLessonIndex])

//   useEffect(() => {
//     if (isProcessing && !userSelectedLesson) {
//       setCurrentLessonIndex(generatingLessonIndex)
//     }
//   }, [generatingLessonIndex, isProcessing, userSelectedLesson])

//   useEffect(() => {
//     if (moduleRef.current !== module?.title) {
//       const previousModule = moduleRef.current
//       moduleRef.current = module.title
//       setCurrentModuleTitle(module.title)

//       if (previousModule !== "") {
//         setProcessedLessons({})
//         setUserSelectedLesson(false)
//       }

//       const moduleKey = module?.title || ""
//       const moduleLessons = currentModuleIndex !== null ? reduxProcessedLessons[currentModuleIndex] : {}

//       if (
//         moduleLessons &&
//         Object.keys(moduleLessons).length === module?.lessons?.length &&
//         module?.lessons?.every((_, index) => !!moduleLessons[index])
//       ) {
//         setProcessedLessons(moduleLessons)
//         setIsProcessing(false)
//         onModuleProcessed()

//         if (waitingForLesson && onLessonReached) {
//           onLessonReached(currentLessonIndex)
//         }

//         processedModulesRef.current[moduleKey] = true
//       } else {
//         let nextLessonToGenerate = 0
//         if (moduleLessons) {
//           while (nextLessonToGenerate < module?.lessons?.length && moduleLessons[nextLessonToGenerate]) {
//             nextLessonToGenerate++
//           }
//         }

//         setGeneratingLessonIndex(nextLessonToGenerate)
//         if (!userSelectedLesson) {
//           setCurrentLessonIndex(nextLessonToGenerate)
//         }
//         setIsProcessing(true)

//         if (nextLessonToGenerate < module?.lessons?.length) {
//           complete("", {
//             body: {
//               moduleTitle: module?.title,
//               lessonTitle: module?.lessons[nextLessonToGenerate] || "",
//               lang: lang,
//             },
//           })
//         } else {
//           setIsProcessing(false)
//           onModuleProcessed()
//         }
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [
//     module?.title,
//     module?.lessons,
//     currentModuleIndex,
//     reduxProcessedLessons,
//     complete,
//     onModuleProcessed,
//     waitingForLesson,
//     onLessonReached,
//     currentLessonIndex,
//     userSelectedLesson,
//   ])

//   useEffect(() => {
//     if (!isLoading && completion && isProcessing) {
//       const currentGeneratingIndex = generatingLessonIndex

//       setProcessedLessons((prev) => ({
//         ...prev,
//         [currentGeneratingIndex]: completion,
//       }))

//       if (currentModuleIndex !== null) {
//         dispatch(
//           addProcessedLesson({
//             moduleIndex: currentModuleIndex,
//             lessonIndex: currentGeneratingIndex,
//             content: completion,
//           }),
//         )
//       }

//       if (onLessonReached && currentGeneratingIndex === currentLessonIndex) {
//         onLessonReached(currentGeneratingIndex)
//       }

//       if (currentGeneratingIndex < module?.lessons?.length - 1) {
//         const nextIndex = currentGeneratingIndex + 1
//         setGeneratingLessonIndex(nextIndex)

//         setCurrentLessonIndex(nextIndex)
//         setUserSelectedLesson(false)

//         const hasNextLessonInRedux =
//           currentModuleIndex !== null &&
//           reduxProcessedLessons[currentModuleIndex] &&
//           reduxProcessedLessons[currentModuleIndex][nextIndex]

//         if (hasNextLessonInRedux) {
//           setProcessedLessons((prev) => ({
//             ...prev,
//             [nextIndex]: reduxProcessedLessons[currentModuleIndex][nextIndex],
//           }))

//           let futureIndex = nextIndex + 1
//           while (
//             futureIndex < module?.lessons?.length &&
//             currentModuleIndex !== null &&
//             reduxProcessedLessons[currentModuleIndex] &&
//             reduxProcessedLessons[currentModuleIndex][futureIndex]
//           ) {
//             setProcessedLessons((prev) => ({
//               ...prev,
//               [futureIndex]: reduxProcessedLessons[currentModuleIndex][futureIndex],
//             }))
//             futureIndex++
//           }

//           if (futureIndex < module?.lessons?.length) {
//             setGeneratingLessonIndex(futureIndex)
//             if (!userSelectedLesson) {
//               setCurrentLessonIndex(futureIndex)
//             }
//             complete("", {
//               body: {
//                 moduleTitle: module?.title,
//                 lessonTitle: module?.lessons[futureIndex] || "",
//                 lang: lang,
//               },
//             })
//           } else {
//             setIsProcessing(false)
//             onModuleProcessed()
//           }
//         } else {
//           complete("", {
//             body: {
//               moduleTitle: module?.title,
//               lessonTitle: module?.lessons[nextIndex] || "",
//               lang: lang,
//             },
//           })
//         }
//       } else {
//         setIsProcessing(false)
//         onModuleProcessed()
//       }
//     }
//   }, [
//     isLoading,
//     completion,
//     generatingLessonIndex,
//     module?.lessons,
//     onModuleProcessed,
//     complete,
//     isProcessing,
//     module?.title,
//     onLessonReached,
//     currentLessonIndex,
//     currentModuleIndex,
//     dispatch,
//     reduxProcessedLessons,
//     userSelectedLesson,
//     lang,
//   ])

//   const progressPercentage = module?.lessons?.length
//     ? (Object.keys(processedLessons).length / module.lessons.length) * 100
//     : 0

//   const currentLessonTitle = module?.lessons[currentLessonIndex] || ""

//   // FIX: Moved dispatch(setCurrentLessonTitle) into a useEffect
//   useEffect(() => {
//     // Only dispatch if currentLessonTitle is actually different
//     if (currentLessonTitle && currentLessonTitle.title) {
//         dispatch(setCurrentLessonTitle(currentLessonTitle.title));
//     }
//   }, [currentLessonTitle, dispatch]);


//   const currentLessonNumber = currentLessonIndex + 1
//   const isLessonGenerated = !!processedLessons[currentLessonIndex]
//   const isCurrentLessonBeingGenerated = isProcessing && generatingLessonIndex === currentLessonIndex
//   const showLoader = (userSelectedLesson || waitingForLesson) && !isLessonGenerated && !isCurrentLessonBeingGenerated

//   const handleEditToggle = () => {
//     if (isEditing) {
//       dispatch(setIsEditing(false))
//     } else {
//       dispatch(setEditingLessonContent(currentContent))
//       dispatch(setIsEditing(true))
//     }
//   }

//   useEffect(() => {
//     setTestMyKnowledgeToggle(false)
//   }, [currentLessonIndex])

//   const handleTestMyKnowledgeToggle = () => {
//     setTestMyKnowledgeToggle(!testMyKnowledgeToggle)
//   }

//   const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     dispatch(setEditingLessonContent(e.target.value))
//   }

//   const handleSaveContent = async () => {
//     if (currentModuleIndex === null) return

//     try {
//       setIsSaving(true)

//       dispatch(
//         updateLessonContent({
//           moduleIndex: currentModuleIndex,
//           lessonIndex: currentLessonIndex,
//           content: editingLessonContent,
//         }),
//       )

//       setProcessedLessons((prev) => ({
//         ...prev,
//         [currentLessonIndex]: editingLessonContent,
//       }))

//       if (currentModuleId) {

//         await courseService.updateLessonByModuleAndPosition(currentModuleId, currentLessonIndex, editingLessonContent)

//         toast({
//           title: "Success",
//           description: "Lesson content updated successfully",
//         })
//       } else {
//         console.warn("Module ID not available, changes only saved locally")
//         toast({
//           title: "Warning",
//           description: "Changes saved locally but not to database (module ID not available)",
//           variant: "default",
//         })
//       }

//       dispatch(setIsEditing(false))
//     } catch (error) {
//       console.error("Error saving lesson content:", error)
//       toast({
//         title: "Error",
//         description: "Failed to save lesson content: " + (error instanceof Error ? error.message : "Unknown error"),
//         variant: "destructive",
//       })
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   // Edit prompt related implementation

//   const [userPrompt, setUserPrompt] = useState<string>("")
//   const handleOnSubmit = (input: string) => {
//     setUserPrompt(input);
//   };

//   useEffect(() => {
//     if (userPrompt && module?.lessons?.[currentLessonIndex]) {
//       setIsProcessing(true)
//       setGeneratingLessonIndex(currentLessonIndex)
//       setTestMyKnowledgeToggle(false)

//       complete("", {
//         body: {
//           moduleTitle: module?.title,
//           lessonTitle: module?.lessons[currentLessonIndex] || "",
//           userPrompt: userPrompt,
//           lang: lang,
//         },
//       })
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [userPrompt])

//   return (
//     <div className="space-y-4 w-full mx-auto">
//       <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-xl shadow-lg">
//         <div className="flex items-center justify-between mb-3">
//           <div className="flex items-center gap-2">
//             <ContextModalButton onSubmit={handleOnSubmit} />
//             <BookOpen className="h-6 w-6 text-white" />
//             {editingModuleId === currentModuleId ? (
//               <div className="flex items-center gap-2">
//                 <input
//                   type="text"
//                   value={editingModuleTitle}
//                   onChange={handleModuleTitleChange}
//                   className="text-2xl text-white font-bold bg-transparent border-b border-white/50 focus:border-white focus:outline-none"
//                 />
//                 <div className="flex gap-2">
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     className="bg-white/20 hover:bg-white/30 text-white border-white/30"
//                     onClick={handleCancelEdit}
//                     disabled={isSaving}
//                   >
//                     <X className="h-4 w-4 mr-1" />
//                     {t('lesson-content.saveButton')}
//                   </Button>
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     className="bg-white/20 hover:bg-white/30 text-white border-white/30"
//                     onClick={handleSaveModuleTitle}
//                     disabled={isSaving}
//                   >
//                     {isSaving ? (
//                       <>
//                         <Loader className="h-4 w-4 mr-1 animate-spin" />
//                         {t('lesson-content.savingButton')}
//                       </>
//                     ) : (
//                       <>
//                         <Save className="h-4 w-4 mr-1" />
//                         {t('lesson-content.saveButton')}
//                       </>
//                     )}
//                   </Button>
//                 </div>
//               </div>
//             ) : (
//               <h2 className="text-2xl text-white font-bold">
//                 {module?.title}
//                 <Button
//                   size="sm"
//                   variant="ghost"
//                   className="ml-2 text-white/70 hover:text-white hover:bg-white/20"
//                   onClick={handleModuleTitleEdit}
//                 >
//                   <Edit className="h-4 w-4" />
//                 </Button>
//               </h2>
//             )}
//           </div>

//           {isProcessing && (
//             <div className="flex items-center gap-2 text-sm text-white bg-white/20 px-3 py-1.5 rounded-full">
//               <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
//               <span>{t('lesson-content.generatingIndicator')}</span>
//             </div>
//           )}
//         </div>

//         <div className="mb-4">
//           <div className="flex justify-between text-white/90 text-sm mb-1">
//             <span>{t('lesson-content.progressLabel')}</span>
//             <span>{Math.round(progressPercentage)}%</span>
//           </div>
//           <Progress value={progressPercentage} className="h-2 bg-white/30" />
//         </div>

//         <div className="flex justify-between items-center">
//           <p className="text-white/90 flex items-center gap-2">
//             <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
//               {currentLessonNumber}/{module?.lessons?.length}
//             </span>
//             <span className="text-sm font-medium">{currentLessonTitle.title}</span>
//             {waitingForLesson && !isLessonGenerated && !isCurrentLessonBeingGenerated && (
//               <span className="inline-flex items-center bg-white/20 px-2 py-1 rounded-full text-xs">
//                 <Loader className="h-3 w-3 mr-1 animate-spin" />
//                 {t('lesson-content.waitingIndicator')}
//               </span>
//             )}
//           </p>

//           {isLessonGenerated && !isProcessing && (
//             <div>
//               {isEditing ? (
//                 <div className="flex gap-2">
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     className="bg-white/20 hover:bg-white/30 text-white border-white/30"
//                     onClick={handleEditToggle}
//                     disabled={isSaving}
//                   >
//                     <X className="h-4 w-4 mr-1" />
//                     {t('lesson-content.cancelButton')}
//                   </Button>
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     className="bg-white/20 hover:bg-white/30 text-white border-white/30"
//                     onClick={handleSaveContent}
//                     disabled={isSaving}
//                   >
//                     {isSaving ? (
//                       <>
//                         <Loader className="h-4 w-4 mr-1 animate-spin" />
//                         {t('lesson-content.savingButton')}
//                       </>
//                     ) : (
//                       <>
//                         <Save className="h-4 w-4 mr-1" />
//                         {t('lesson-content.saveButton')}
//                       </>
//                     )}
//                   </Button>
//                 </div>
//               ) : (
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   className="bg-white/20 hover:bg-white/30 text-white border-white/30"
//                   onClick={handleEditToggle}
//                 >
//                   <Edit className="h-4 w-4 mr-1" />
//                   {t('lesson-content.editButton')}
//                 </Button>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {error && (
//         <div className="text-white p-4 bg-red-500/90 rounded-lg mt-4 flex items-center gap-2">
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//             <path
//               fillRule="evenodd"
//               d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
//               clipRule="evenodd"
//             />
//           </svg>
//           {t('lesson-content.errorMessage')}
//         </div>
//       )}

//       <div
//         className="bg-white rounded-xl p-8 min-h-[85vh] overflow-auto shadow-md border border-gray-100"
//         ref={contentRef}
//       >
//         {showLoader ? (
//           <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
//             <div className="relative">
//               <div className="bg-purple-100 p-5 rounded-full">
//                 <Loader className="h-12 w-12 text-purple-600 animate-spin" />
//               </div>
//               <div className="absolute -top-2 -right-2 h-4 w-4 bg-purple-500 rounded-full animate-ping"></div>
//             </div>
//             <div className="space-y-3">
//               <h3 className="text-xl font-bold text-gray-800">{t('lesson-content.loadingTitle')}</h3>
//               <p className="text-muted-foreground max-w-md">
//                 {t('lesson-content.loadingDescription')}
//               </p>
//             </div>
//           </div>
//         ) : isEditing ? (
//           <div className="prose prose-lg max-w-none relative min-h-[200px]">
//             <Textarea
//               value={editingLessonContent}
//               onChange={handleContentChange}
//               className="min-h-[70vh] font-mono text-sm p-4"
//               placeholder={`${t('lesson-content.contentPlaceholder')}`}
//             />
//           </div>
//         ) : (
//           <div className="prose prose-lg max-w-none relative min-h-[200px] lesson-content">
//             <div className="content-container" dangerouslySetInnerHTML={{ __html: parsedContent }} />
//             {!isCurrentLessonBeingGenerated && (
//               testMyKnowledgeToggle ? (
//                 <div className="mt-12">
//                   <TestMyKnowledge lessonContent={currentContent} />
//                 </div>
//               ) : (
//                 <Button
//                   variant="default"
//                   onClick={handleTestMyKnowledgeToggle}
//                   disabled={!currentContent}
//                 >
//                   <FlaskConical />
//                   {t('lesson-content.testKnowledgeButton')}
//                 </Button>
//               )
//             )}

//             {isCurrentLessonBeingGenerated && (
//               <span className="inline-block h-5 w-2 bg-purple-500 animate-pulse ml-0.5 align-bottom"></span>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }
// export default LessonContent

// "use client"

// import type React from "react"
// import type { Module } from "@/types"
// import { useCompletion } from "@ai-sdk/react"
// import { useState, useEffect, useRef } from "react"
// import { parseContentFromMarkdown } from "@/lib/utils"
// import { BookOpen, Loader, Edit, Save, X, FlaskConical } from "lucide-react"
// import { Progress } from "@/components/ui/progress"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import {
//   addProcessedLesson,
//   setEditingLessonContent,
//   setIsEditing,
//   updateLessonContent,
//   setEditingModuleTitle,
//   clearEditingTitles,
//   setGeneratedCourse,
//   setCurrentLessonContent,
//   setCurrentLessonTitle
// } from "@/store/courseSlice"
// import { courseService } from "@/lib/services/course"
// import { toast } from "@/hooks/use-toast"
// import { Textarea } from "@/components/ui/textarea"
// import { Button } from "@/components/ui/button"
// import TestMyKnowledge from "./TestMyKnowledge"
// import ContextModalButton from "./EditPrompt"
// import { useLocale, useTranslations } from "next-intl"

// interface LessonContentProps {
//   module: Module
//   onModuleProcessed: () => void
//   initialLessonIndex?: number
//   waitingForLesson?: boolean
//   onLessonReached?: (lessonIndex: number) => void
//   slug?: string
// }

// export function LessonContent({
//   module,
//   onModuleProcessed,
//   initialLessonIndex = 0,
//   waitingForLesson = false,
//   onLessonReached,
//   slug,
// }: LessonContentProps) {
//   const t = useTranslations()
//   const dispatch = useAppDispatch()
//   const lang = useLocale();
//   const currentModuleIndex = useAppSelector((state) => state.course.currentModuleIndex)
//   const reduxProcessedLessons = useAppSelector((state) => state.course.processedLessons)
//   const isEditing = useAppSelector((state) => state.course.isEditing)
//   const editingLessonContent = useAppSelector((state) => state.course.editingLessonContent)
//   const generatedCourse = useAppSelector((state) => state.course.generatedCourse);

//   const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(initialLessonIndex)
//   const [isProcessing, setIsProcessing] = useState<boolean>(false)
//   const [processedLessons, setProcessedLessons] = useState<Record<number, string>>({})
//   const [generatingLessonIndex, setGeneratingLessonIndex] = useState<number>(0)
//   const [userSelectedLesson, setUserSelectedLesson] = useState<boolean>(false)
//   const [isSaving, setIsSaving] = useState<boolean>(false)
//   const [testMyKnowledgeToggle, setTestMyKnowledgeToggle] = useState<boolean>(false)

//   const contentRef = useRef<HTMLDivElement>(null)
//   const moduleRef = useRef<string>("")
//   const processedModulesRef = useRef<{ [key: string]: boolean }>({})
//   const [currentModuleTitle, setCurrentModuleTitle] = useState<string>("")

//   const editingModuleTitle = useAppSelector((state) => state.course.editingModuleTitle);
//   const editingModuleId = useAppSelector((state) => state.course.editingModuleId);


//   const handleModuleTitleEdit = () => {
//     dispatch(setEditingModuleTitle({ title: module.title, moduleId: currentModuleId || "" }));
//   };

//   const handleModuleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     dispatch(setEditingModuleTitle({ title: e.target.value, moduleId: editingModuleId || "" }));
//   };

//   const handleSaveModuleTitle = async () => {
//     if (!editingModuleId) return;

//     try {
//       setIsSaving(true);
//       await courseService.updateModule(editingModuleId, editingModuleTitle);

//       // Update local state using the component level selector
//       if (currentModuleIndex !== null && generatedCourse?.modules) {
//         const updatedModules = [...generatedCourse.modules];
//         updatedModules[currentModuleIndex].title = editingModuleTitle;
//         dispatch(setGeneratedCourse({ ...generatedCourse, modules: updatedModules }));
//       }

//       dispatch(clearEditingTitles());
//       toast({
//         title: "Success",
//         description: "Module title updated successfully",
//       });
//     } catch (error) {
//       console.error("Error saving module title:", error);
//       toast({
//         title: "Error",
//         description: "Failed to save module title",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleCancelEdit = () => {
//     dispatch(clearEditingTitles());
//   };

//   const { completion, complete, isLoading, error } = useCompletion({
//     api: "/api/generate-lesson",
//   })

//   const [currentModuleId, setCurrentModuleId] = useState<string>()

//   useEffect(() => {
//     const fetchModuleId = async () => {
//       if (!slug || currentModuleIndex === null) return;
//       const courseId = await courseService.getCourse(slug)
//       const moduleId = await courseService.getModuleIdByPosition(courseId.id, currentModuleIndex)
//       setCurrentModuleId(moduleId)
//     }
//     fetchModuleId()
//   },[slug, currentModuleIndex])

//   useEffect(() => {
//     if (currentModuleIndex !== null && reduxProcessedLessons[currentModuleIndex]) {
//       const moduleLessons = reduxProcessedLessons[currentModuleIndex]
//       if (module?.title === currentModuleTitle) {
//         setProcessedLessons(moduleLessons || {})
//       }
//     }
//   }, [currentModuleIndex, currentModuleTitle, module?.title, reduxProcessedLessons])

//   const currentContent = processedLessons[currentLessonIndex] || ""
//   dispatch(setCurrentLessonContent(currentContent))
//   const parsedContent = parseContentFromMarkdown(
//     generatingLessonIndex === currentLessonIndex && isProcessing ? completion || "" : currentContent,
//   )

//   useEffect(() => {
//     if (initialLessonIndex !== currentLessonIndex) {
//       setCurrentLessonIndex(initialLessonIndex)
//       setUserSelectedLesson(true)
//     }
//   }, [initialLessonIndex, currentLessonIndex])

//   useEffect(() => {
//     if (isProcessing && !userSelectedLesson) {
//       setCurrentLessonIndex(generatingLessonIndex)
//     }
//   }, [generatingLessonIndex, isProcessing, userSelectedLesson])

//   useEffect(() => {
//     if (moduleRef.current !== module?.title) {
//       const previousModule = moduleRef.current
//       moduleRef.current = module.title
//       setCurrentModuleTitle(module.title)

//       if (previousModule !== "") {
//         setProcessedLessons({})
//         setUserSelectedLesson(false)
//       }

//       const moduleKey = module?.title || ""
//       const moduleLessons = currentModuleIndex !== null ? reduxProcessedLessons[currentModuleIndex] : {}

//       if (
//         moduleLessons &&
//         Object.keys(moduleLessons).length === module?.lessons?.length &&
//         module?.lessons?.every((_, index) => !!moduleLessons[index])
//       ) {
//         setProcessedLessons(moduleLessons)
//         setIsProcessing(false)
//         onModuleProcessed()

//         if (waitingForLesson && onLessonReached) {
//           onLessonReached(currentLessonIndex)
//         }

//         processedModulesRef.current[moduleKey] = true
//       } else {
//         let nextLessonToGenerate = 0
//         if (moduleLessons) {
//           while (nextLessonToGenerate < module?.lessons?.length && moduleLessons[nextLessonToGenerate]) {
//             nextLessonToGenerate++
//           }
//         }

//         setGeneratingLessonIndex(nextLessonToGenerate)
//         if (!userSelectedLesson) {
//           setCurrentLessonIndex(nextLessonToGenerate)
//         }
//         setIsProcessing(true)

//         if (nextLessonToGenerate < module?.lessons?.length) {
//           complete("", {
//             body: {
//               moduleTitle: module?.title,
//               lessonTitle: module?.lessons[nextLessonToGenerate] || "",
//               lang: lang,
//             },
//           })
//         } else {
//           setIsProcessing(false)
//           onModuleProcessed()
//         }
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [
//     module?.title,
//     module?.lessons,
//     currentModuleIndex,
//     reduxProcessedLessons,
//     complete,
//     onModuleProcessed,
//     waitingForLesson,
//     onLessonReached,
//     currentLessonIndex,
//     userSelectedLesson,
//   ])

//   useEffect(() => {
//     if (!isLoading && completion && isProcessing) {
//       const currentGeneratingIndex = generatingLessonIndex

//       setProcessedLessons((prev) => ({
//         ...prev,
//         [currentGeneratingIndex]: completion,
//       }))

//       if (currentModuleIndex !== null) {
//         dispatch(
//           addProcessedLesson({
//             moduleIndex: currentModuleIndex,
//             lessonIndex: currentGeneratingIndex,
//             content: completion,
//           }),
//         )
//       }

//       if (onLessonReached && currentGeneratingIndex === currentLessonIndex) {
//         onLessonReached(currentGeneratingIndex)
//       }

//       if (currentGeneratingIndex < module?.lessons?.length - 1) {
//         const nextIndex = currentGeneratingIndex + 1
//         setGeneratingLessonIndex(nextIndex)

//         setCurrentLessonIndex(nextIndex)
//         setUserSelectedLesson(false)

//         const hasNextLessonInRedux =
//           currentModuleIndex !== null &&
//           reduxProcessedLessons[currentModuleIndex] &&
//           reduxProcessedLessons[currentModuleIndex][nextIndex]

//         if (hasNextLessonInRedux) {
//           setProcessedLessons((prev) => ({
//             ...prev,
//             [nextIndex]: reduxProcessedLessons[currentModuleIndex][nextIndex],
//           }))

//           let futureIndex = nextIndex + 1
//           while (
//             futureIndex < module?.lessons?.length &&
//             currentModuleIndex !== null &&
//             reduxProcessedLessons[currentModuleIndex] &&
//             reduxProcessedLessons[currentModuleIndex][futureIndex]
//           ) {
//             setProcessedLessons((prev) => ({
//               ...prev,
//               [futureIndex]: reduxProcessedLessons[currentModuleIndex][futureIndex],
//             }))
//             futureIndex++
//           }

//           if (futureIndex < module?.lessons?.length) {
//             setGeneratingLessonIndex(futureIndex)
//             if (!userSelectedLesson) {
//               setCurrentLessonIndex(futureIndex)
//             }
//             complete("", {
//               body: {
//                 moduleTitle: module?.title,
//                 lessonTitle: module?.lessons[futureIndex] || "",
//                 lang: lang,
//               },
//             })
//           } else {
//             setIsProcessing(false)
//             onModuleProcessed()
//           }
//         } else {
//           complete("", {
//             body: {
//               moduleTitle: module?.title,
//               lessonTitle: module?.lessons[nextIndex] || "",
//               lang: lang,
//             },
//           })
//         }
//       } else {
//         setIsProcessing(false)
//         onModuleProcessed()
//       }
//     }
//   }, [
//     isLoading,
//     completion,
//     generatingLessonIndex,
//     module?.lessons,
//     onModuleProcessed,
//     complete,
//     isProcessing,
//     module?.title,
//     onLessonReached,
//     currentLessonIndex,
//     currentModuleIndex,
//     dispatch,
//     reduxProcessedLessons,
//     userSelectedLesson,
//     lang,
//   ])

//   const progressPercentage = module?.lessons?.length
//     ? (Object.keys(processedLessons).length / module.lessons.length) * 100
//     : 0

//   const currentLessonTitle = module?.lessons[currentLessonIndex] || ""
//   dispatch(setCurrentLessonTitle(currentLessonTitle.title))
//   const currentLessonNumber = currentLessonIndex + 1
//   const isLessonGenerated = !!processedLessons[currentLessonIndex]
//   const isCurrentLessonBeingGenerated = isProcessing && generatingLessonIndex === currentLessonIndex
//   const showLoader = (userSelectedLesson || waitingForLesson) && !isLessonGenerated && !isCurrentLessonBeingGenerated

//   const handleEditToggle = () => {
//     if (isEditing) {
//       dispatch(setIsEditing(false))
//     } else {
//       dispatch(setEditingLessonContent(currentContent))
//       dispatch(setIsEditing(true))
//     }
//   }

//   useEffect(() => {
//     setTestMyKnowledgeToggle(false)
//   }, [currentLessonIndex])

//   const handleTestMyKnowledgeToggle = () => {
//     setTestMyKnowledgeToggle(!testMyKnowledgeToggle)
//   }

//   const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     dispatch(setEditingLessonContent(e.target.value))
//   }

//   const handleSaveContent = async () => {
//     if (currentModuleIndex === null) return

//     try {
//       setIsSaving(true)

//       dispatch(
//         updateLessonContent({
//           moduleIndex: currentModuleIndex,
//           lessonIndex: currentLessonIndex,
//           content: editingLessonContent,
//         }),
//       )

//       setProcessedLessons((prev) => ({
//         ...prev,
//         [currentLessonIndex]: editingLessonContent,
//       }))

//       if (currentModuleId) {

//         await courseService.updateLessonByModuleAndPosition(currentModuleId, currentLessonIndex, editingLessonContent)

//         toast({
//           title: "Success",
//           description: "Lesson content updated successfully",
//         })
//       } else {
//         console.warn("Module ID not available, changes only saved locally")
//         toast({
//           title: "Warning",
//           description: "Changes saved locally but not to database (module ID not available)",
//           variant: "default",
//         })
//       }

//       dispatch(setIsEditing(false))
//     } catch (error) {
//       console.error("Error saving lesson content:", error)
//       toast({
//         title: "Error",
//         description: "Failed to save lesson content: " + (error instanceof Error ? error.message : "Unknown error"),
//         variant: "destructive",
//       })
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   // Edit prompt related implementation

//   const [userPrompt, setUserPrompt] = useState<string>("")
//   const handleOnSubmit = (input: string) => {
//     setUserPrompt(input);
//   };

//   useEffect(() => {
//     if (userPrompt && module?.lessons?.[currentLessonIndex]) {
//       setIsProcessing(true)
//       setGeneratingLessonIndex(currentLessonIndex)
//       setTestMyKnowledgeToggle(false)

//       complete("", {
//         body: {
//           moduleTitle: module?.title,
//           lessonTitle: module?.lessons[currentLessonIndex] || "",
//           userPrompt: userPrompt,
//           lang: lang,
//         },
//       })
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [userPrompt])

//   return (
//     <div className="space-y-4 w-full mx-auto">
//       <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-xl shadow-lg">
//         <div className="flex items-center justify-between mb-3">
//           <div className="flex items-center gap-2">
//             <ContextModalButton onSubmit={handleOnSubmit} />
//             <BookOpen className="h-6 w-6 text-white" />
//             {editingModuleId === currentModuleId ? (
//               <div className="flex items-center gap-2">
//                 <input
//                   type="text"
//                   value={editingModuleTitle}
//                   onChange={handleModuleTitleChange}
//                   className="text-2xl text-white font-bold bg-transparent border-b border-white/50 focus:border-white focus:outline-none"
//                 />
//                 <div className="flex gap-2">
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     className="bg-white/20 hover:bg-white/30 text-white border-white/30"
//                     onClick={handleCancelEdit}
//                     disabled={isSaving}
//                   >
//                     <X className="h-4 w-4 mr-1" />
//                     {t('lesson-content.saveButton')}
//                   </Button>
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     className="bg-white/20 hover:bg-white/30 text-white border-white/30"
//                     onClick={handleSaveModuleTitle}
//                     disabled={isSaving}
//                   >
//                     {isSaving ? (
//                       <>
//                         <Loader className="h-4 w-4 mr-1 animate-spin" />
//                         {t('lesson-content.savingButton')}
//                       </>
//                     ) : (
//                       <>
//                         <Save className="h-4 w-4 mr-1" />
//                         {t('lesson-content.saveButton')}
//                       </>
//                     )}
//                   </Button>
//                 </div>
//               </div>
//             ) : (
//               <h2 className="text-2xl text-white font-bold">
//                 {module?.title}
//                 <Button
//                   size="sm"
//                   variant="ghost"
//                   className="ml-2 text-white/70 hover:text-white hover:bg-white/20"
//                   onClick={handleModuleTitleEdit}
//                 >
//                   <Edit className="h-4 w-4" />
//                 </Button>
//               </h2>
//             )}
//           </div>

//           {isProcessing && (
//             <div className="flex items-center gap-2 text-sm text-white bg-white/20 px-3 py-1.5 rounded-full">
//               <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
//               <span>{t('lesson-content.generatingIndicator')}</span>
//             </div>
//           )}
//         </div>

//         <div className="mb-4">
//           <div className="flex justify-between text-white/90 text-sm mb-1">
//             <span>{t('lesson-content.progressLabel')}</span>
//             <span>{Math.round(progressPercentage)}%</span>
//           </div>
//           <Progress value={progressPercentage} className="h-2 bg-white/30" />
//         </div>

//         <div className="flex justify-between items-center">
//           <p className="text-white/90 flex items-center gap-2">
//             <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
//               {currentLessonNumber}/{module?.lessons?.length}
//             </span>
//             <span className="text-sm font-medium">{currentLessonTitle.title}</span>
//             {waitingForLesson && !isLessonGenerated && !isCurrentLessonBeingGenerated && (
//               <span className="inline-flex items-center bg-white/20 px-2 py-1 rounded-full text-xs">
//                 <Loader className="h-3 w-3 mr-1 animate-spin" />
//                 {t('lesson-content.waitingIndicator')}
//               </span>
//             )}
//           </p>

//           {isLessonGenerated && !isProcessing && (
//             <div>
//               {isEditing ? (
//                 <div className="flex gap-2">
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     className="bg-white/20 hover:bg-white/30 text-white border-white/30"
//                     onClick={handleEditToggle}
//                     disabled={isSaving}
//                   >
//                     <X className="h-4 w-4 mr-1" />
//                     {t('lesson-content.cancelButton')}
//                   </Button>
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     className="bg-white/20 hover:bg-white/30 text-white border-white/30"
//                     onClick={handleSaveContent}
//                     disabled={isSaving}
//                   >
//                     {isSaving ? (
//                       <>
//                         <Loader className="h-4 w-4 mr-1 animate-spin" />
//                         {t('lesson-content.savingButton')}
//                       </>
//                     ) : (
//                       <>
//                         <Save className="h-4 w-4 mr-1" />
//                         {t('lesson-content.saveButton')}
//                       </>
//                     )}
//                   </Button>
//                 </div>
//               ) : (
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   className="bg-white/20 hover:bg-white/30 text-white border-white/30"
//                   onClick={handleEditToggle}
//                 >
//                   <Edit className="h-4 w-4 mr-1" />
//                   {t('lesson-content.editButton')}
//                 </Button>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {error && (
//         <div className="text-white p-4 bg-red-500/90 rounded-lg mt-4 flex items-center gap-2">
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//             <path
//               fillRule="evenodd"
//               d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
//               clipRule="evenodd"
//             />
//           </svg>
//           {t('lesson-content.errorMessage')}
//         </div>
//       )}

//       <div
//         className="bg-white rounded-xl p-8 min-h-[85vh] overflow-auto shadow-md border border-gray-100"
//         ref={contentRef}
//       >
//         {showLoader ? (
//           <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
//             <div className="relative">
//               <div className="bg-purple-100 p-5 rounded-full">
//                 <Loader className="h-12 w-12 text-purple-600 animate-spin" />
//               </div>
//               <div className="absolute -top-2 -right-2 h-4 w-4 bg-purple-500 rounded-full animate-ping"></div>
//             </div>
//             <div className="space-y-3">
//               <h3 className="text-xl font-bold text-gray-800">{t('lesson-content.loadingTitle')}</h3>
//               <p className="text-muted-foreground max-w-md">
//                 {t('lesson-content.loadingDescription')}
//               </p>
//             </div>
//           </div>
//         ) : isEditing ? (
//           <div className="prose prose-lg max-w-none relative min-h-[200px]">
//             <Textarea
//               value={editingLessonContent}
//               onChange={handleContentChange}
//               className="min-h-[70vh] font-mono text-sm p-4"
//               placeholder={`${t('lesson-content.contentPlaceholder')}`}
//             />
//           </div>
//         ) : (
//           <div className="prose prose-lg max-w-none relative min-h-[200px] lesson-content">
//             <div className="content-container" dangerouslySetInnerHTML={{ __html: parsedContent }} />
//             {!isCurrentLessonBeingGenerated && (
//               testMyKnowledgeToggle ? (
//                 <div className="mt-12">
//                   <TestMyKnowledge lessonContent={currentContent} />
//                 </div>
//               ) : (
//                 <Button
//                   variant="default"
//                   onClick={handleTestMyKnowledgeToggle}
//                   disabled={!currentContent}
//                 >
//                   <FlaskConical />
//                   {t('lesson-content.testKnowledgeButton')}
//                 </Button>
//               )
//             )}

//             {isCurrentLessonBeingGenerated && (
//               <span className="inline-block h-5 w-2 bg-purple-500 animate-pulse ml-0.5 align-bottom"></span>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }
// export default LessonContent
// "use client"

// import type React from "react"
// import { useState, useEffect, useRef, useCallback } from "react"
// import { BookOpen, Loader, Edit, Save, X, FlaskConical } from "lucide-react"
// import { Progress } from "@/components/ui/progress"
// import { Textarea } from "@/components/ui/textarea"
// import { Button } from "@/components/ui/button"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { toast } from "@/hooks/use-toast"

// // Types
// interface Module {
//   id?: string
//   title: string
//   lessons: Lesson[]
// }

// interface Lesson {
//   id?: string
//   title: string
//   content?: string
// }

// interface Course {
//   id: string
//   title: string
//   modules: Module[]
// }

// // Mock services - replace with your actual implementations
// const courseService = {
//   async getCourse(slug: string): Promise<Course> {
//     return {
//       id: 'course-1',
//       title: 'Sample Course',
//       modules: []
//     }
//   },

//   async getModuleIdByPosition(courseId: string, position: number): Promise<string> {
//     return `module-${courseId}-${position}`
//   },

//   async updateModule(moduleId: string, title: string): Promise<void> {
//     console.log(`Updating module ${moduleId} with title: ${title}`)
//   },

//   async updateLessonByModuleAndPosition(
//     moduleId: string, 
//     position: number, 
//     content: string
//   ): Promise<void> {
//     console.log(`Updating lesson at position ${position} in module ${moduleId}`)
//   }
// }

// // Mock Redux hooks - replace with your actual Redux implementation
// const useAppDispatch = () => {
//   return (action: any) => {
//     console.log('Redux action dispatched:', action)
//   }
// }

// const useAppSelector = (selector: any) => {
//   // Mock state - replace with actual Redux state
//   return selector({
//     course: {
//       currentModuleIndex: 0,
//       processedLessons: {},
//       isEditing: false,
//       editingLessonContent: '',
//       editingModuleTitle: '',
//       editingModuleId: null,
//       generatedCourse: null,
//       currentLessonContent: '',
//       currentLessonTitle: '',
//     }
//   })
// }

// // Mock actions - replace with your actual Redux actions
// const courseActions = {
//   addProcessedLesson: (payload: any) => ({ type: 'ADD_PROCESSED_LESSON', payload }),
//   setEditingLessonContent: (payload: string) => ({ type: 'SET_EDITING_LESSON_CONTENT', payload }),
//   setIsEditing: (payload: boolean) => ({ type: 'SET_IS_EDITING', payload }),
//   updateLessonContent: (payload: any) => ({ type: 'UPDATE_LESSON_CONTENT', payload }),
//   setEditingModuleTitle: (payload: any) => ({ type: 'SET_EDITING_MODULE_TITLE', payload }),
//   clearEditingTitles: () => ({ type: 'CLEAR_EDITING_TITLES' }),
//   setGeneratedCourse: (payload: Course) => ({ type: 'SET_GENERATED_COURSE', payload }),
//   setCurrentLessonContent: (payload: string) => ({ type: 'SET_CURRENT_LESSON_CONTENT', payload }),
//   setCurrentLessonTitle: (payload: string) => ({ type: 'SET_CURRENT_LESSON_TITLE', payload }),
// }

// // Mock useCompletion hook - replace with your actual AI SDK implementation
// const useCompletion = (config: any) => {
//   const [completion, setCompletion] = useState('')
//   const [isLoading, setIsLoading] = useState(false)
//   const [error, setError] = useState<Error | null>(null)

//   const complete = useCallback(async (prompt: string, options: any) => {
//     setIsLoading(true)
//     setError(null)
    
//     try {
//       // Mock AI completion - replace with actual implementation
//       setTimeout(() => {
//         setCompletion(`Generated content for: ${options.body.lessonTitle}`)
//         setIsLoading(false)
//       }, 2000)
//     } catch (err) {
//       setError(err as Error)
//       setIsLoading(false)
//     }
//   }, [])

//   return { completion, complete, isLoading, error }
// }

// // Mock translations - replace with your actual i18n implementation
// const useTranslations = () => {
//   return (key: string) => {
//     const translations: Record<string, string> = {
//       'lesson-content.generatingIndicator': 'Generating...',
//       'lesson-content.progressLabel': 'Progress',
//       'lesson-content.waitingIndicator': 'Waiting...',
//       'lesson-content.cancelButton': 'Cancel',
//       'lesson-content.saveButton': 'Save',
//       'lesson-content.savingButton': 'Saving...',
//       'lesson-content.editButton': 'Edit',
//       'lesson-content.errorMessage': 'An error occurred',
//       'lesson-content.loadingTitle': 'Generating Lesson Content',
//       'lesson-content.loadingDescription': 'Please wait while we create your personalized lesson content.',
//       'lesson-content.contentPlaceholder': 'Enter lesson content here...',
//       'lesson-content.testKnowledgeButton': 'Test My Knowledge',
//     }
//     return translations[key] || key
//   }
// }

// const useLocale = () => 'en'

// // Utility function
// function parseContentFromMarkdown(content: string): string {
//   return content
//     .replace(/^### (.*$)/gim, '<h3>$1</h3>')
//     .replace(/^## (.*$)/gim, '<h2>$1</h2>')
//     .replace(/^# (.*$)/gim, '<h1>$1</h1>')
//     .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
//     .replace(/\*(.*)\*/gim, '<em>$1</em>')
//     .replace(/\n/gim, '<br>')
// }

// // Components
// interface TestMyKnowledgeProps {
//   lessonContent: string
// }

// function TestMyKnowledge({ lessonContent }: TestMyKnowledgeProps) {
//   return (
//     <div className="bg-gray-50 p-6 rounded-lg">
//       <h3 className="text-lg font-semibold mb-4">Test Your Knowledge</h3>
//       <p className="text-gray-600">
//         Knowledge testing component will be implemented here based on the lesson content.
//       </p>
//     </div>
//   )
// }

// interface ContextModalButtonProps {
//   onSubmit: (input: string) => void
// }

// function ContextModalButton({ onSubmit }: ContextModalButtonProps) {
//   const [isOpen, setIsOpen] = useState(false)
//   const [input, setInput] = useState('')

//   const handleSubmit = () => {
//     if (input.trim()) {
//       onSubmit(input.trim())
//       setInput('')
//       setIsOpen(false)
//     }
//   }

//   return (
//     <Dialog open={isOpen} onOpenChange={setIsOpen}>
//       <DialogTrigger asChild>
//         <Button size="sm" variant="outline" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
//           <Edit className="h-4 w-4 mr-1" />
//           Customize
//         </Button>
//       </DialogTrigger>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Customize Lesson Content</DialogTitle>
//         </DialogHeader>
//         <div className="space-y-4">
//           <Textarea
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             placeholder="Enter your customization request..."
//             className="min-h-24"
//           />
//           <div className="flex gap-2 justify-end">
//             <Button variant="outline" onClick={() => setIsOpen(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleSubmit} disabled={!input.trim()}>
//               Apply Changes
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }

// // Custom hooks
// function useLessonState(
//   initialLessonIndex: number,
//   currentModuleIndex: number | null,
//   reduxProcessedLessons: Record<number, Record<number, string>>,
//   module?: Module
// ) {
//   const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(initialLessonIndex)
//   const [processedLessons, setProcessedLessons] = useState<Record<number, string>>({})
//   const [userSelectedLesson, setUserSelectedLesson] = useState<boolean>(false)

//   useEffect(() => {
//     if (currentModuleIndex !== null && reduxProcessedLessons[currentModuleIndex]) {
//       const moduleLessons = reduxProcessedLessons[currentModuleIndex]
//       setProcessedLessons(moduleLessons || {})
//     }
//   }, [currentModuleIndex, reduxProcessedLessons])

//   useEffect(() => {
//     if (initialLessonIndex !== currentLessonIndex) {
//       setCurrentLessonIndex(initialLessonIndex)
//       setUserSelectedLesson(true)
//     }
//   }, [initialLessonIndex, currentLessonIndex])

//   useEffect(() => {
//     setProcessedLessons({})
//     setUserSelectedLesson(false)
//     setCurrentLessonIndex(initialLessonIndex)
//   }, [module?.title, initialLessonIndex])

//   return {
//     currentLessonIndex,
//     setCurrentLessonIndex,
//     processedLessons,
//     setProcessedLessons,
//     userSelectedLesson,
//     setUserSelectedLesson
//   }
// }

// function useLessonGeneration() {
//   const [isProcessing, setIsProcessing] = useState<boolean>(false)
//   const [generatingLessonIndex, setGeneratingLessonIndex] = useState<number>(0)

//   const { completion, complete, isLoading, error } = useCompletion({
//     api: "/api/generate-lesson",
//   })

//   const generateLesson = useCallback(async (
//     moduleTitle: string,
//     lessonTitle: string,
//     lang: string,
//     userPrompt?: string,
//     lessonIndex?: number
//   ) => {
//     setIsProcessing(true)
//     if (lessonIndex !== undefined) {
//       setGeneratingLessonIndex(lessonIndex)
//     }

//     try {
//       await complete("", {
//         body: {
//           moduleTitle,
//           lessonTitle,
//           lang,
//           userPrompt,
//         },
//       })
//     } catch (error) {
//       console.error("Error generating lesson:", error)
//       setIsProcessing(false)
//     }
//   }, [complete])

//   const stopGeneration = useCallback(() => {
//     setIsProcessing(false)
//   }, [])

//   return {
//     isProcessing,
//     setIsProcessing,
//     generatingLessonIndex,
//     setGeneratingLessonIndex,
//     completion,
//     isLoading,
//     error,
//     generateLesson,
//     stopGeneration
//   }
// }

// function useModuleTitle(
//   module: Module,
//   currentModuleId?: string,
//   generatedCourse?: Course | null,
//   currentModuleIndex?: number | null
// ) {
//   const dispatch = useAppDispatch()
//   const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false)
//   const [editingTitle, setEditingTitle] = useState<string>(module?.title || "")
//   const [isSaving, setIsSaving] = useState<boolean>(false)

//   const handleTitleEdit = useCallback(() => {
//     setIsEditingTitle(true)
//     setEditingTitle(module?.title || "")
//     if (currentModuleId) {
//       dispatch(courseActions.setEditingModuleTitle({ title: module?.title || "", moduleId: currentModuleId }))
//     }
//   }, [module?.title, currentModuleId, dispatch])

//   const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
//     const newTitle = e.target.value
//     setEditingTitle(newTitle)
//     if (currentModuleId) {
//       dispatch(courseActions.setEditingModuleTitle({ title: newTitle, moduleId: currentModuleId }))
//     }
//   }, [currentModuleId, dispatch])

//   const handleSaveTitle = useCallback(async () => {
//     if (!currentModuleId) return

//     try {
//       setIsSaving(true)
//       await courseService.updateModule(currentModuleId, editingTitle)

//       if (currentModuleIndex && generatedCourse?.modules) {
//         const updatedModules = [...generatedCourse.modules]
//         updatedModules[currentModuleIndex].title = editingTitle
//         dispatch(courseActions.setGeneratedCourse({ ...generatedCourse, modules: updatedModules }))
//       }

//       setIsEditingTitle(false)
//       dispatch(courseActions.clearEditingTitles())
      
//       toast({
//         title: "Success",
//         description: "Module title updated successfully",
//       })
//     } catch (error) {
//       console.error("Error saving module title:", error)
//       toast({
//         title: "Error",
//         description: "Failed to save module title",
//         variant: "destructive",
//       })
//     } finally {
//       setIsSaving(false)
//     }
//   }, [currentModuleId, editingTitle, currentModuleIndex, generatedCourse, dispatch])

//   const handleCancelEdit = useCallback(() => {
//     setIsEditingTitle(false)
//     setEditingTitle(module?.title || "")
//     dispatch(courseActions.clearEditingTitles())
//   }, [module?.title, dispatch])

//   return {
//     isEditingTitle,
//     editingTitle,
//     isSaving,
//     handleTitleEdit,
//     handleTitleChange,
//     handleSaveTitle,
//     handleCancelEdit
//   }
// }

// // Main component props
// interface LessonContentProps {
//   module: Module
//   onModuleProcessed: () => void
//   initialLessonIndex?: number
//   waitingForLesson?: boolean
//   onLessonReached?: (lessonIndex: number) => void
//   slug?: string
// }

// // Main LessonContent component
// export function LessonContent({
//   module,
//   onModuleProcessed,
//   initialLessonIndex = 0,
//   waitingForLesson = false,
//   onLessonReached,
//   slug,
// }: LessonContentProps) {
//   const t = useTranslations()
//   const dispatch = useAppDispatch()
//   const lang = useLocale()
  
//   // Redux state
//   const currentModuleIndex = useAppSelector((state:any) => state.course.currentModuleIndex)
//   const reduxProcessedLessons = useAppSelector((state:any) => state.course.processedLessons)
//   const isEditing = useAppSelector((state:any) => state.course.isEditing)
//   const editingLessonContent = useAppSelector((state:any) => state.course.editingLessonContent)
//   const generatedCourse = useAppSelector((state:any) => state.course.generatedCourse)

//   // Local state
//   const [currentModuleId, setCurrentModuleId] = useState<string>()
//   const [isSaving, setIsSaving] = useState<boolean>(false)
//   const [testMyKnowledgeToggle, setTestMyKnowledgeToggle] = useState<boolean>(false)
//   const [userPrompt, setUserPrompt] = useState<string>("")

//   // Custom hooks for better separation of concerns
//   const {
//     currentLessonIndex,
//     setCurrentLessonIndex,
//     processedLessons,
//     setProcessedLessons,
//     userSelectedLesson,
//     setUserSelectedLesson
//   } = useLessonState(initialLessonIndex, currentModuleIndex, reduxProcessedLessons, module)

//   const {
//     isProcessing,
//     generatingLessonIndex,
//     completion,
//     isLoading,
//     error,
//     generateLesson
//   } = useLessonGeneration()

//   const {
//     isEditingTitle,
//     editingTitle,
//     handleTitleEdit,
//     handleTitleChange,
//     handleSaveTitle,
//     handleCancelEdit
//   } = useModuleTitle(module, currentModuleId, generatedCourse, currentModuleIndex)

//   // Fetch module ID effect
//   useEffect(() => {
//     const fetchModuleId = async () => {
//       if (!slug || currentModuleIndex === null) return
//       try {
//         const course = await courseService.getCourse(slug)
//         const moduleId = await courseService.getModuleIdByPosition(course.id, currentModuleIndex)
//         setCurrentModuleId(moduleId)
//       } catch (error) {
//         console.error("Error fetching module ID:", error)
//       }
//     }
//     fetchModuleId()
//   }, [slug, currentModuleIndex])

//   // Update current lesson content in Redux
//   const currentContent = processedLessons[currentLessonIndex] || ""
//   useEffect(() => {
//     dispatch(courseActions.setCurrentLessonContent(currentContent))
//   }, [currentContent, dispatch])

//   // Update current lesson title in Redux
//   const currentLessonTitle = module?.lessons[currentLessonIndex]
//   useEffect(() => {
//     if (currentLessonTitle && typeof currentLessonTitle === 'object' && 'title' in currentLessonTitle) {
//       dispatch(courseActions.setCurrentLessonTitle(currentLessonTitle.title))
//     }
//   }, [currentLessonTitle, dispatch])

//   // Reset test knowledge toggle when lesson changes
//   useEffect(() => {
//     setTestMyKnowledgeToggle(false)
//   }, [currentLessonIndex])

//   // Handle user prompt changes
//   useEffect(() => {
//     const currentLesson = module?.lessons?.[currentLessonIndex]
//     if (userPrompt && currentLesson && typeof currentLesson === 'object' && 'title' in currentLesson) {
//       setTestMyKnowledgeToggle(false)
//       generateLesson(
//         module.title,
//         currentLesson.title,
//         lang,
//         userPrompt,
//         currentLessonIndex
//       )
//       setUserPrompt("")
//     }
//   }, [userPrompt, module, currentLessonIndex, lang, generateLesson])

//   // Handle completion updates
//   useEffect(() => {
//     if (!isLoading && completion && isProcessing) {
//       setProcessedLessons(prev => ({
//         ...prev,
//         [generatingLessonIndex]: completion,
//       }))

//       if (currentModuleIndex !== null) {
//         dispatch(
//           courseActions.addProcessedLesson({
//             moduleIndex: currentModuleIndex,
//             lessonIndex: generatingLessonIndex,
//             content: completion,
//           })
//         )
//       }

//       if (onLessonReached && generatingLessonIndex === currentLessonIndex) {
//         onLessonReached(generatingLessonIndex)
//       }
//     }
//   }, [isLoading, completion, isProcessing, generatingLessonIndex, currentModuleIndex, dispatch, onLessonReached, currentLessonIndex, setProcessedLessons])

//   // Callbacks
//   const handleEditToggle = useCallback(() => {
//     if (isEditing) {
//       dispatch(courseActions.setIsEditing(false))
//     } else {
//       dispatch(courseActions.setEditingLessonContent(currentContent))
//       dispatch(courseActions.setIsEditing(true))
//     }
//   }, [isEditing, currentContent, dispatch])

//   const handleTestMyKnowledgeToggle = useCallback(() => {
//     setTestMyKnowledgeToggle(!testMyKnowledgeToggle)
//   }, [testMyKnowledgeToggle])

//   const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     dispatch(courseActions.setEditingLessonContent(e.target.value))
//   }, [dispatch])

//   const handleSaveContent = useCallback(async () => {
//     if (currentModuleIndex === null) return

//     try {
//       setIsSaving(true)

//       dispatch(
//         courseActions.updateLessonContent({
//           moduleIndex: currentModuleIndex,
//           lessonIndex: currentLessonIndex,
//           content: editingLessonContent,
//         })
//       )

//       setProcessedLessons(prev => ({
//         ...prev,
//         [currentLessonIndex]: editingLessonContent,
//       }))

//       if (currentModuleId) {
//         await courseService.updateLessonByModuleAndPosition(
//           currentModuleId, 
//           currentLessonIndex, 
//           editingLessonContent
//         )

//         toast({
//           title: "Success",
//           description: "Lesson content updated successfully",
//         })
//       } else {
//         console.warn("Module ID not available, changes only saved locally")
//         toast({
//           title: "Warning",
//           description: "Changes saved locally but not to database (module ID not available)",
//           variant: "default",
//         })
//       }

//       dispatch(courseActions.setIsEditing(false))
//     } catch (error) {
//       console.error("Error saving lesson content:", error)
//       toast({
//         title: "Error",
//         description: "Failed to save lesson content: " + (error instanceof Error ? error.message : "Unknown error"),
//         variant: "destructive",
//       })
//     } finally {
//       setIsSaving(false)
//     }
//   }, [
//     currentModuleIndex,
//     currentLessonIndex,
//     editingLessonContent,
//     currentModuleId,
//     dispatch,
//     setProcessedLessons
//   ])

//   const handleOnSubmit = useCallback((input: string) => {
//     setUserPrompt(input)
//   }, [])

//   // Computed values
//   const progressPercentage = module?.lessons?.length
//     ? (Object.keys(processedLessons).length / module.lessons.length) * 100
//     : 0

//   const currentLessonNumber = currentLessonIndex + 1
//   const isLessonGenerated = !!processedLessons[currentLessonIndex]
//   const isCurrentLessonBeingGenerated = isProcessing && generatingLessonIndex === currentLessonIndex
//   const showLoader = (userSelectedLesson || waitingForLesson) && !isLessonGenerated && !isCurrentLessonBeingGenerated

//   const parsedContent = parseContentFromMarkdown(
//     generatingLessonIndex === currentLessonIndex && isProcessing ? completion || "" : currentContent
//   )

//   const lessonTitleText = currentLessonTitle && typeof currentLessonTitle === 'object' && 'title' in currentLessonTitle 
//     ? currentLessonTitle.title 
//     : ''

//   return (
//     <div className="space-y-4 w-full mx-auto">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-xl shadow-lg">
//         <div className="flex items-center justify-between mb-3">
//           <div className="flex items-center gap-2">
//             <ContextModalButton onSubmit={handleOnSubmit} />
//             <BookOpen className="h-6 w-6 text-white" />
            
//             {isEditingTitle ? (
//               <div className="flex items-center gap-2">
//                 <input
//                   type="text"
//                   value={editingTitle}
//                   onChange={handleTitleChange}
//                   className="text-2xl text-white font-bold bg-transparent border-b border-white/50 focus:border-white focus:outline-none"
//                 />
//                 <div className="flex gap-2">
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     className="bg-white/20 hover:bg-white/30 text-white border-white/30"
//                     onClick={handleCancelEdit}
//                     disabled={isSaving}
//                   >
//                     <X className="h-4 w-4 mr-1" />
//                     {t('lesson-content.cancelButton')}
//                   </Button>
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     className="bg-white/20 hover:bg-white/30 text-white border-white/30"
//                     onClick={handleSaveTitle}
//                     disabled={isSaving}
//                   >
//                     {isSaving ? (
//                       <>
//                         <Loader className="h-4 w-4 mr-1 animate-spin" />
//                         {t('lesson-content.savingButton')}
//                       </>
//                     ) : (
//                       <>
//                         <Save className="h-4 w-4 mr-1" />
//                         {t('lesson-content.saveButton')}
//                       </>
//                     )}
//                   </Button>
//                 </div>
//               </div>
//             ) : (
//               <h2 className="text-2xl text-white font-bold">
//                 {module?.title}
//                 <Button
//                   size="sm"
//                   variant="ghost"
//                   className="ml-2 text-white/70 hover:text-white hover:bg-white/20"
//                   onClick={handleTitleEdit}
//                 >
//                   <Edit className="h-4 w-4" />
//                 </Button>
//               </h2>
//             )}
//           </div>

//           {isProcessing && (
//             <div className="flex items-center gap-2 text-sm text-white bg-white/20 px-3 py-1.5 rounded-full">
//               <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
//               <span>{t('lesson-content.generatingIndicator')}</span>
//             </div>
//           )}
//         </div>

//         <div className="mb-4">
//           <div className="flex justify-between text-white/90 text-sm mb-1">
//             <span>{t('lesson-content.progressLabel')}</span>
//             <span>{Math.round(progressPercentage)}%</span>
//           </div>
//           <Progress value={progressPercentage} className="h-2 bg-white/30" />
//         </div>

//         <div className="flex justify-between items-center">
//           <p className="text-white/90 flex items-center gap-2">
//             <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
//               {currentLessonNumber}/{module?.lessons?.length || 0}
//             </span>
//             <span className="text-sm font-medium">{lessonTitleText}</span>
//             {waitingForLesson && !isLessonGenerated && !isCurrentLessonBeingGenerated && (
//               <span className="inline-flex items-center bg-white/20 px-2 py-1 rounded-full text-xs">
//                 <Loader className="h-3 w-3 mr-1 animate-spin" />
//                 {t('lesson-content.waitingIndicator')}
//               </span>
//             )}
//           </p>

//           {isLessonGenerated && !isProcessing && (
//             <div>
//               {isEditing ? (
//                 <div className="flex gap-2">
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     className="bg-white/20 hover:bg-white/30 text-white border-white/30"
//                     onClick={handleEditToggle}
//                     disabled={isSaving}
//                   >
//                     <X className="h-4 w-4 mr-1" />
//                     {t('lesson-content.cancelButton')}
//                   </Button>
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     className="bg-white/20 hover:bg-white/30 text-white border-white/30"
//                     onClick={handleSaveContent}
//                     disabled={isSaving}
//                   >
//                     {isSaving ? (
//                       <>
//                         <Loader className="h-4 w-4 mr-1 animate-spin" />
//                         {t('lesson-content.savingButton')}
//                       </>
//                     ) : (
//                       <>
//                         <Save className="h-4 w-4 mr-1" />
//                         {t('lesson-content.saveButton')}
//                       </>
//                     )}
//                   </Button>
//                 </div>
//               ) : (
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   className="bg-white/20 hover:bg-white/30 text-white border-white/30"
//                   onClick={handleEditToggle}
//                 >
//                   <Edit className="h-4 w-4 mr-1" />
//                   {t('lesson-content.editButton')}
//                 </Button>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Error Display */}
//       {error && (
//         <div className="text-white p-4 bg-red-500/90 rounded-lg mt-4 flex items-center gap-2">
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//             <path
//               fillRule="evenodd"
//               d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
//               clipRule="evenodd"
//             />
//           </svg>
//           {t('lesson-content.errorMessage')}
//         </div>
//       )}

//       {/* Body */}
//       <div className="bg-white rounded-xl p-8 min-h-[85vh] overflow-auto shadow-md border border-gray-100">
//         {showLoader ? (
//           <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
//             <div className="relative">
//               <div className="bg-purple-100 p-5 rounded-full">
//                 <Loader className="h-12 w-12 text-purple-600 animate-spin" />
//               </div>
//               <div className="absolute -top-2 -right-2 h-4 w-4 bg-purple-500 rounded-full animate-ping"></div>
//             </div>
//             <div className="space-y-3">
//               <h3 className="text-xl font-bold text-gray-800">{t('lesson-content.loadingTitle')}</h3>
//               <p className="text-muted-foreground max-w-md">
//                 {t('lesson-content.loadingDescription')}
//               </p>
//             </div>
//           </div>
//         ) : isEditing ? (
//           <div className="prose prose-lg max-w-none relative min-h-[200px]">
//             <Textarea
//               value={editingLessonContent}
//               onChange={handleContentChange}
//               className="min-h-[70vh] font-mono text-sm p-4"
//               placeholder={t('lesson-content.contentPlaceholder')}
//             />
//           </div>
//         ) : (
//           <div className="prose prose-lg max-w-none relative min-h-[200px] lesson-content">
//             <div className="content-container" dangerouslySetInnerHTML={{ __html: parsedContent }} />
            
//             {!isCurrentLessonBeingGenerated && (
//               testMyKnowledgeToggle ? (
//                 <div className="mt-12">
//                   <TestMyKnowledge lessonContent={currentContent} />
//                 </div>
//               ) : (
//                 <Button
//                   variant="default"
//                   onClick={handleTestMyKnowledgeToggle}
//                   disabled={!currentContent}
//                 >
//                   <FlaskConical className="mr-2 h-4 w-4" />
//                   {t('lesson-content.testKnowledgeButton')}
//                 </Button>
//               )
//             )}

//             {isCurrentLessonBeingGenerated && (
//               <span className="inline-block h-5 w-2 bg-purple-500 animate-pulse ml-0.5 align-bottom"></span>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// export default LessonContent