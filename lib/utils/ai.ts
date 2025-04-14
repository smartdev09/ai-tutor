import { nanoid } from 'nanoid';
import { AiCourse, Module, Question, ResultItem, Topic } from '@/types';

export function generateAiCourseStructure(
  data: string,
): Omit<AiCourse, 'difficulty' | 'done'> {
  const lines = data.split('\n');
  let title = '';
  const modules: Module[] = [];
  let currentModule: Module | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (i === 0 && line.startsWith('#')) {
      // First line is the title
      title = line.replace('#', '').trim();
    } else if (line.startsWith('## ')) {
      // New module
      if (currentModule) {
        modules.push(currentModule);
      }
      currentModule = {
        title: line.replace('## ', ''),
        lessons: [],
      };
      // Modules collapsed by default
    } else if (line.startsWith('- ') && currentModule) {
      // Lesson within current module
      currentModule.lessons.push(line.replace('- ', ''));
    }
  }

  // Add the last module if it exists
  if (currentModule) {
    modules.push(currentModule);
  }

  return {
    title,
    modules,
  };
}

export function generateAiCourseLessonQuestions(
  questionData: string,
): Question[] {
  const questions: Question[] = [];

  const lines = questionData.split('\n');
  let currentQuestion: Question | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#')) {
      if (currentQuestion) {
        questions.push(currentQuestion);
        currentQuestion = null;
      }

      const title = line.replace('#', '').trim();
      currentQuestion = {
        id: nanoid(),
        title,
        options: [],
      };
    } else if (line.startsWith('-')) {
      if (!currentQuestion) {
        continue;
      }

      let title = line.replace('-', '').trim();
      const isCorrect = title.startsWith('*');
      title = title.replace('*', '').trim();

      currentQuestion.options.push({
        id: nanoid(),
        title,
        isCorrect,
      });
    }
  }

  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  return questions;
}

export function generateAICourseRoadmapStructure(
  data: string,
  isCourseRoadmap: boolean = false,
): ResultItem[] {
  const lines = data.split('\n');

  const result: ResultItem[] = [];
  let currentTopic: Topic | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('###')) {
      if (currentTopic) {
        result.push(currentTopic);
      }

      const label = line.replace('###', '').trim();
      currentTopic = {
        id: nanoid(),
        type: 'topic',
        label,
        children: [],
      };
    } else if (line.startsWith('##')) {
      result.push({
        id: nanoid(),
        type: 'label',
        label: line.replace('##', '').trim(),
      });
    } else if (i === 0 && line.startsWith('#')) {
      const title = line.replace('#', '').trim();
      result.push({
        id: nanoid(),
        type: 'title',
        label: title,
      });
    } else if (line.startsWith('-')) {
      if (currentTopic) {
        const label = line.replace('-', '').trim();

        let id = nanoid();
        if (isCourseRoadmap) {
          const currentTopicIndex = result.length - 1;
          const subTopicIndex = currentTopic.children?.length || 0;
          id = `${currentTopicIndex}-${subTopicIndex}`;
        }

        currentTopic.children?.push({
          id,
          type: 'subtopic',
          label,
        });
      }
    }
  }

  if (currentTopic) {
    result.push(currentTopic);
  }

  return result;
}

// Helper function to generate a slug from a title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}