
export type Lesson = string;

export type Module = {
  title: string;
  lessons: Lesson[];
};

export type AiCourse = {
  id?: string;
  title: string;
  modules: Module[];
  difficulty: string;
  done: string[];
  slug?: string;
};

export type CourseFineTuneData = {
  about: string;
  goal: string;
  customInstructions: string;
};

export type Question = {
  id: string;
  title: string;
  options: {
    id: string;
    title: string;
    isCorrect: boolean;
  }[];
};

export type SubTopic = {
  id: string;
  type: 'subtopic';
  label: string;
};

export type Topic = {
  id: string;
  type: 'topic';
  label: string;
  children?: SubTopic[];
};

export type Label = {
  id: string;
  type: 'label';
  label: string;
};

export type Title = {
  id: string;
  type: 'title';
  label: string;
};

export type ResultItem = Title | Topic | Label;

// DB Types

export type DBCourse = {
  id?: string;
  title: string;
  difficulty: string;
  slug?: string;
  modules: DBModule[];
};

export type DBModule = {
  id?: string;
  title: string;
  position: number;
  lessons: DBLesson[];
};

export type DBLesson = {
  id?: string;
  title: string;
  content?: string;
  position: number;
};