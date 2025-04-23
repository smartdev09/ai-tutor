import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { AiCourse } from "@/types"

interface CourseState {
  generatedCourse: AiCourse | null
  processedModules: Record<number, boolean>
  currentModuleIndex: number | null
  currentLessonIndex: number
  currentLessonContent: string | null
  currentLessonTitle: string;
  currentLessonId: number | null;
  expandedModules: number[]
  processedLessons: Record<number, Record<number, string>>
  streamingModuleIndex: number
  isLoading: boolean
  isSaving: boolean
  isEditing: boolean
  editingLessonContent: string
  editingModuleTitle: string;
  editingModuleId: string | null;
}

const initialState: CourseState = {
  generatedCourse: null,
  processedModules: {},
  currentModuleIndex: null,
  currentLessonIndex: 0,
  currentLessonContent: null,
  currentLessonTitle: '',
  currentLessonId: null,
  expandedModules: [],
  processedLessons: {},
  streamingModuleIndex: -1,
  isLoading: false,
  isSaving: false,
  isEditing: false,
  editingLessonContent: "",
  editingModuleTitle: "",
  editingModuleId: null,
}

const courseSlice = createSlice({
  name: "course",
  initialState,
  reducers: {
    setGeneratedCourse(state, action: PayloadAction<AiCourse>) {
      state.generatedCourse = action.payload
      state.processedModules = {}
      state.processedLessons = {}
      state.currentModuleIndex = null
      state.currentLessonIndex = 0
      state.expandedModules = []
    },
    setProcessedModule(state, action: PayloadAction<number>) {
      state.processedModules[action.payload] = true
    },
    setCurrentModule(state, action: PayloadAction<number | null>) {
      state.currentModuleIndex = action.payload
      if (action.payload !== null && !state.expandedModules.includes(action.payload)) {
        state.expandedModules = [...state.expandedModules, action.payload]
      }
    },
    setCurrentLesson(state, action: PayloadAction<number>) {
      state.currentLessonIndex = action.payload
    },
    setExpandedModules(state, action: PayloadAction<number[]>) {
      state.expandedModules = action.payload
    },
    toggleModuleExpansion(state, action: PayloadAction<number>) {
      const moduleIndex = action.payload
      if (state.expandedModules.includes(moduleIndex)) {
        state.expandedModules = state.expandedModules.filter((i) => i !== moduleIndex)
      } else {
        state.expandedModules = [...state.expandedModules, moduleIndex]
      }
    },
    addProcessedLesson(state, action: PayloadAction<{ moduleIndex: number; lessonIndex: number; content: string }>) {
      const { moduleIndex, lessonIndex, content } = action.payload

      if (!state.processedLessons[moduleIndex]) {
        state.processedLessons[moduleIndex] = {}
      }

      state.processedLessons[moduleIndex][lessonIndex] = content
    },
    setStreamingModuleIndex(state, action: PayloadAction<number>) {
      state.streamingModuleIndex = action.payload
    },
    setIsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    setIsSaving(state, action: PayloadAction<boolean>) {
      state.isSaving = action.payload
    },
    setIsEditing(state, action: PayloadAction<boolean>) {
      state.isEditing = action.payload
    },
    setEditingLessonContent(state, action: PayloadAction<string>) {
      state.editingLessonContent = action.payload
    },
    setCurrentLessonContent(state, action: PayloadAction<string>) {
      state.currentLessonContent = action.payload
    },
    setCurrentLessonTitle(state, action: PayloadAction<string>) {
      console.log("setCurrentLessonTitle", action.payload)
      state.currentLessonTitle = action.payload
    },
    setCurrentLessonId(state, action: PayloadAction<string>) {
      state.currentLessonContent = action.payload
    },
    updateLessonContent(state, action: PayloadAction<{ moduleIndex: number; lessonIndex: number; content: string }>) {
      const { moduleIndex, lessonIndex, content } = action.payload

      if (!state.processedLessons[moduleIndex]) {
        state.processedLessons[moduleIndex] = {}
      }

      state.processedLessons[moduleIndex][lessonIndex] = content
    },
    resetCourseState() {
      return initialState
    },
    setEditingModuleTitle(state, action: PayloadAction<{title: string, moduleId: string}>) {
      state.editingModuleTitle = action.payload.title;
      state.editingModuleId = action.payload.moduleId;
    },
    clearEditingTitles(state) {
      state.editingModuleId = null;
    },
  },
})

export const {
  setGeneratedCourse,
  setProcessedModule,
  setCurrentModule,
  setCurrentLesson,
  setCurrentLessonContent,
  setCurrentLessonTitle,
  setExpandedModules,
  toggleModuleExpansion,
  addProcessedLesson,
  setStreamingModuleIndex,
  setIsLoading,
  setIsSaving,
  setIsEditing,
  setEditingLessonContent,
  updateLessonContent,
  resetCourseState,
  setEditingModuleTitle,
  clearEditingTitles,
} = courseSlice.actions

export default courseSlice.reducer
