import type { DBCourse } from "@/types"
import { supabase } from "../supabase/client"

export const courseService = {
  async createCourse(course: DBCourse) {
    try {
      const { data: existingCourse, error: existingCourseError } = await supabase
        .from("courses")
        .select("id")
        .eq("slug", course.slug)
        .maybeSingle();

      if (existingCourseError && existingCourseError.code !== 'PGRST116') {
        console.error("Error checking for existing course:", existingCourseError);
        throw existingCourseError;
      }

      let courseData;
      const coursePayload = {
        title: course.title,
        difficulty: course.difficulty,
        slug: course.slug,
        metaDescription: course.metaDescription,
        done: course.done,
        faqs: course.faqs
      };

      if (existingCourse) {
        // Update existing course
        const { data: updatedCourse, error: updateError } = await supabase
          .from("courses")
          .update(coursePayload)
          .eq("id", existingCourse.id)
          .select()
          .single();

        if (updateError) throw updateError;
        courseData = updatedCourse;

        // Delete existing modules and FAQs
        const [{ error: deleteModulesError }, { error: deleteFaqsError }] = await Promise.all([
          supabase.from("modules").delete().eq("course_id", existingCourse.id),
          supabase.from("faqs").delete().eq("course_id", existingCourse.id),
        ]);

        if (deleteModulesError || deleteFaqsError) {
          console.error("Error deleting existing data:", deleteModulesError || deleteFaqsError);
          throw deleteModulesError || deleteFaqsError;
        }
      } else {
        // Create new course
        const { data: newCourse, error: insertError } = await supabase
          .from("courses")
          .insert(coursePayload)
          .select()
          .single();

        if (insertError) throw insertError;
        courseData = newCourse;
      }

      // Insert modules and lessons
      for (const courseModule of course.modules) {
        const { data: moduleData, error: moduleError } = await supabase
          .from("modules")
          .insert({
            course_id: courseData.id,
            title: courseModule.title,
            position: courseModule.position,
          })
          .select()
          .single();

        if (moduleError) throw moduleError;

        // Insert lessons
        const lessonInserts = courseModule.lessons.map(lesson =>
          supabase.from("lessons").insert({
            module_id: moduleData.id,
            title: lesson.title,
            content: lesson.content || "",
            position: lesson.position,
          })
        );

        const lessonResults = await Promise.all(lessonInserts);
        for (const result of lessonResults) {
          if (result.error) throw result.error;
        }
      }

      // Insert FAQs
      if (course.faqs?.length) {
        const { error: faqError } = await supabase
          .from("faqs")
          .insert(course.faqs.map(faq => ({
            course_id: courseData.id,
            question: faq.question,
            answer: faq.answer,
          })));

        if (faqError) throw faqError;
      }

      return courseData;
    } catch (error) {
      console.error("Error in createCourse:", error);
      throw error;
    }
  },

  async getCoursesCount(): Promise<number> {
    const { count, error } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting courses count:', error.message);
      throw error;
    }

    return count ?? 0;
  },

  async getCourse(slug: string) {

    try {
      const { data: course, error } = await supabase
        .from("courses")
        .select(`
          *,
          modules:modules!course_id (
            *,
            lessons:lessons!module_id (
              *
            )
          )
        `)
        .eq("slug", slug)
        .maybeSingle()

      if (error) {
        console.error("Error fetching course:", error)
        throw error
      }

      return course
    } catch (error) {
      console.error("Error in getCourse:", error)
      throw error
    }
  },

  async getAllSlugs() {
    try {
      const { data: courses, error } = await supabase
        .from("courses")
        .select("slug")

      if (error) {
        console.error("Error fetching courses:", error)
        throw error
      }

      return courses
    } catch (error) {
      console.error("Error in getAllCourses:", error)
      throw error
    }
  },

  async getAllCourses(owners: string | string[]) {
    try {
      const { data: courses, error } = await supabase
        .from("courses")
        .select(`
          *,
          modules:modules!course_id (
            *,
            lessons:lessons!module_id (
              *
            )
          )
        `)
        .contains("owners", Array.isArray(owners) ? owners : [owners])

      if (error) {
        console.error("Error fetching courses:", error)
        throw error
      }

      return courses
    } catch (error) {
      console.error("Error in getAllCourses:", error)
      throw error
    }
  },

  async addCourseOwners(courseId: string, newOwners: string[]) {
    try {
      const { data: currentData, error: fetchError } = await supabase
        .from("courses")
        .select("owners")
        .eq("id", courseId)
        .single()
  
      if (fetchError) {
        console.error("Error fetching current owners:", fetchError)
        throw fetchError
      }
  
      const existingOwners: string[] = currentData?.owners || []
  
      const mergedOwners = Array.from(new Set([...existingOwners, ...newOwners]))
  
      const { data: updatedData, error: updateError } = await supabase
        .from("courses")
        .update({ owners: mergedOwners })
        .eq("id", courseId)
        .select()
  
      if (updateError) {
        console.error("Error updating course owners:", updateError)
        throw updateError
      }
  
      return updatedData
    } catch (error) {
      console.error("Error in addCourseOwners:", error)
      throw error
    }
  },  

  async getModuleIdByPosition(courseId: string, position: number) {
    try {
      const { data, error } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", courseId)
        .eq("position", position)
        .single();

      if (error) {
        console.error("Error fetching module:", error);
        throw error;
      }

      return data?.id;
    } catch (error) {
      console.error("Error in getModuleIdByPosition:", error);
      throw error;
    }
  },

  async updateModule(moduleId: string, title: string) {
    console.log("Updating module title:", { moduleId, title });

    try {
      const { data: existingModule, error: checkError } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();

      if (checkError) {
        console.error("Error checking module existence:", checkError);
        throw checkError;
      }

      if (!existingModule) {
        throw new Error(`Module with ID ${moduleId} not found`);
      }

      const updateFields = {
        title: title
      };

      const { data, error: updateError } = await supabase
        .from("modules")
        .update(updateFields)
        .eq("id", moduleId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating module:", updateError);
        throw updateError;
      }

      console.log("Module title updated successfully:", data);
      return data;
    } catch (error) {
      console.error("Error in updateModule:", error);
      throw error;
    }
  },

  async updateLesson(lessonId: string, content: string) {

    try {
      const { data, error } = await supabase.from("lessons").update({ content }).eq("id", lessonId).select().single()

      if (error) {
        console.error("Error updating lesson:", error)
        throw error
      }
      return data
    } catch (error) {
      console.error("Error in updateLesson:", error)
      throw error
    }
  },

  async updateLessonByModuleAndPosition(moduleId: string, position: number, content: string) {

    try {
      const { data: lessons, error: findError } = await supabase
        .from("lessons")
        .select("id")
        .eq("module_id", moduleId)
        .eq("position", position)

      if (findError) {
        console.error("Error finding lesson:", findError)
        throw findError
      }

      if (!lessons || lessons.length === 0) {
        console.error("Lesson not found for module_id and position:", { moduleId, position })
        throw new Error(`Lesson not found for module_id: ${moduleId} and position: ${position}`)
      }

      const lessonId = lessons[0].id

      const { data, error: updateError } = await supabase
        .from("lessons")
        .update({ content })
        .eq("id", lessonId)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating lesson:", updateError)
        throw updateError
      }

      return data
    } catch (error) {
      console.error("Error in updateLessonByModuleAndPosition:", error)
      throw error
    }
  },

  async saveAllLessonContent(
    courseId: string,
    modulesWithContent: Array<{
      moduleId: string
      lessons: Array<{
        position: number
        content: string
      }>
    }>,
  ) {
    try {

      for (const moduleData of modulesWithContent) {
        for (const lesson of moduleData.lessons) {
          if (!lesson.content) continue

          try {
            await this.updateLessonByModuleAndPosition(moduleData.moduleId, lesson.position, lesson.content)
          } catch (error) {
            console.error(
              `Error updating lesson at position ${lesson.position} in module ${moduleData.moduleId}:`,
              error,
            )
          }
        }
      }

      return true
    } catch (error) {
      console.error("Error in saveAllLessonContent:", error)
      throw error
    }
  },

  async deleteCourse(id: string) {
    console.log("Deleting course with ID:", id)

    try {
      const { error } = await supabase.from("courses").delete().eq("id", id)

      if (error) {
        console.error("Error deleting course:", error)
        throw error
      }

      console.log("Course deleted successfully")
    } catch (error) {
      console.error("Error in deleteCourse:", error)
      throw error
    }
  },
}
