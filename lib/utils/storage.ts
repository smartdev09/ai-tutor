import { CourseFineTuneData, AiCourse } from '@/types';

// Browser check to avoid SSR issues
const isBrowser = typeof window !== 'undefined';

// Session storage for fine-tuning data
export function storeFineTuneData(meta: CourseFineTuneData): string {
  if (!isBrowser) return '';
  
  const sessionId = Date.now().toString();
  localStorage.setItem(sessionId, JSON.stringify(meta));
  localStorage.setItem('lastSessionId', sessionId);

  return sessionId;
}

export function getCourseFineTuneData(sessionId: string): CourseFineTuneData | null {
  if (!isBrowser) return null;
  
  const meta = localStorage.getItem(sessionId);
  if (!meta) {
    return null;
  }

  return JSON.parse(meta);
}

export function getLastSessionId(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem('lastSessionId');
}

export function clearFineTuneData(): void {
  if (!isBrowser) return;
  
  const sessionId = getLastSessionId();
  if (sessionId) {
    localStorage.removeItem(sessionId);
  }

  localStorage.removeItem('lastSessionId');
}

// Course storage - mimics a database but uses localStorage
// In a real app, you'd replace this with actual DB calls

export function storeCourse(course: AiCourse): AiCourse {
  if (!isBrowser) return course;
  
  // Generate an ID if one doesn't exist
  if (!course.id) {
    course.id = Date.now().toString();
  }
  
  // Generate a slug if one doesn't exist
  if (!course.slug) {
    course.slug = course.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  
  const courses = getCourses();
  courses[course.id] = course;
  localStorage.setItem('ai-courses', JSON.stringify(courses));
  
  return course;
}

export function getCourse(id: string): AiCourse | null {
  if (!isBrowser) return null;
  
  const courses = getCourses();
  return courses[id] || null;
}

export function getCourseBySlug(slug: string): AiCourse | null {
  if (!isBrowser) return null;
  
  const courses = getCourses();
  return Object.values(courses).find(course => course.slug === slug) || null;
}

export function getCourses(): Record<string, AiCourse> {
  if (!isBrowser) return {};
  
  const courses = localStorage.getItem('ai-courses');
  return courses ? JSON.parse(courses) : {};
}

export function updateCourseProgress(courseId: string, lessonId: string, completed: boolean): AiCourse | null {
  if (!isBrowser) return null;
  
  const course = getCourse(courseId);
  if (!course) return null;
  
  if (completed && !course.done.includes(lessonId)) {
    course.done.push(lessonId);
  } else if (!completed) {
    course.done = course.done.filter(id => id !== lessonId);
  }
  
  storeCourse(course);
  return course;
}