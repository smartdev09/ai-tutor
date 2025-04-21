import { DBCourse } from "@/types";
import { supabase } from "../supabase/client";

export const courseService = {
  async createCourse(course: DBCourse) {
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: course.title,
        difficulty: course.difficulty,
        slug: course.slug
      })
      .select()
      .single();

    if (courseError) throw courseError;

    for (const courseModule of course.modules) {
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .insert({
          course_id: courseData.id,
          title: courseModule.title,
          position: courseModule.position
        })
        .select()
        .single();

      if (moduleError) throw moduleError;

      for (const lesson of courseModule.lessons) {
        const { error: lessonError } = await supabase
          .from('lessons')
          .insert({
            module_id: moduleData.id,
            title: lesson.title,
            content: lesson.content,
            position: lesson.position
          });

        if (lessonError) throw lessonError;
      }
    }

    return courseData;
  },

  async getCourse(slug: string) {
    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        modules:modules!course_id (
          *,
          lessons:lessons!module_id (
            *
          )
        )
      `)
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return course;
  },

//   async updateCourse(course: DBCourse) {
    // Similar to create but with updates
//   },

  async deleteCourse(id: string) {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
