import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AiCourse } from '@/types';

interface CourseState {
  generatedCourse: AiCourse | null;
  processedModules: Record<number, boolean>;
  currentModuleIndex: number | null;
  currentLessonIndex: number;
  expandedModules: number[];
  processedLessons: Record<number, Record<number, string>>;
  streamingModuleIndex: number;
  isLoading: boolean;
  isSaving: boolean;
}

const initialState: CourseState = {
  generatedCourse: null,
  processedModules: {},
  currentModuleIndex: null,
  currentLessonIndex: 0,
  expandedModules: [],
  processedLessons: {},
  streamingModuleIndex: -1,
  isLoading: false,
  isSaving: false,
};

const courseSlice = createSlice({
  name: 'course',
  initialState,
  reducers: {
    setGeneratedCourse(state, action: PayloadAction<AiCourse>) {
      state.generatedCourse = action.payload;
      state.processedModules = {};
      state.processedLessons = {};
      state.currentModuleIndex = null;
      state.currentLessonIndex = 0;
      state.expandedModules = [];
    },
    setProcessedModule(state, action: PayloadAction<number>) {
      state.processedModules[action.payload] = true;
    },
    setCurrentModule(state, action: PayloadAction<number | null>) {
      state.currentModuleIndex = action.payload;
      if (action.payload !== null && !state.expandedModules.includes(action.payload)) {
        state.expandedModules = [...state.expandedModules, action.payload];
      }
    },
    setCurrentLesson(state, action: PayloadAction<number>) {
      state.currentLessonIndex = action.payload;
    },
    setExpandedModules(state, action: PayloadAction<number[]>) {
      state.expandedModules = action.payload;
    },
    toggleModuleExpansion(state, action: PayloadAction<number>) {
      const moduleIndex = action.payload;
      if (state.expandedModules.includes(moduleIndex)) {
        state.expandedModules = state.expandedModules.filter(i => i !== moduleIndex);
      } else {
        state.expandedModules = [...state.expandedModules, moduleIndex];
      }
    },
    addProcessedLesson(
      state, 
      action: PayloadAction<{moduleIndex: number; lessonIndex: number; content: string}>
    ) {
      const { moduleIndex, lessonIndex, content } = action.payload;
      
      if (!state.processedLessons[moduleIndex]) {
        state.processedLessons[moduleIndex] = {};
      }
      
      state.processedLessons[moduleIndex][lessonIndex] = content;
    },
    setStreamingModuleIndex(state, action: PayloadAction<number>) {
      state.streamingModuleIndex = action.payload;
    },
    setIsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setIsSaving(state, action: PayloadAction<boolean>) {
      state.isSaving = action.payload;
    },
    resetCourseState() {
      return initialState;
    }
  }
});

export const { 
  setGeneratedCourse,
  setProcessedModule,
  setCurrentModule,
  setCurrentLesson,
  setExpandedModules,
  toggleModuleExpansion,
  addProcessedLesson,
  setStreamingModuleIndex,
  setIsLoading,
  setIsSaving,
  resetCourseState
} = courseSlice.actions;

export default courseSlice.reducer;