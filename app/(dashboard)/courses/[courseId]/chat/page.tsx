// app/(dashboard)/courses/[courseId]/chat/page.tsx
import { notFound, redirect } from 'next/navigation';
import AIChatTutor from '@/components/topic/ai-chat-tutor';
import { supabase } from '@/lib/supabase/client';
export const dynamic = 'force-dynamic';

async function getChatData(courseId: string, topicId?: string) {
  
  
  // Get course data to verify it exists
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .single();
  
  if (courseError || !course) {
    console.error('Error fetching course:', courseError);
    return null;
  }
  
  // If topicId is provided, verify that it exists and belongs to the course
  let topic = null;
  if (topicId) {
    const { data, error } = await supabase
      .from('course_topics')
      .select('id, title')
      .eq('id', topicId)
      .eq('course_id', courseId)
      .single();
    
    if (!error && data) {
      topic = data;
    } else {
      // If topic doesn't exist, we'll default to the first topic
      console.error('Topic not found or not part of this course:', error);
    }
  }
  
  // If no specific topic was provided or found, get the first topic of the course
  if (!topic) {
    const { data: firstTopic, error } = await supabase
      .from('course_topics')
      .select('id, title')
      .eq('course_id', courseId)
      .order('sequence_number', { ascending: true })
      .limit(1)
      .single();
    
    if (error || !firstTopic) {
      console.error('Error fetching first topic:', error);
      return null;
    }
    
    topic = firstTopic;
  }
  
  return {
    courseId,
    courseTitle: course.title,
    topicId: topic.id,
    topicTitle: topic.title,
  };
}

export default async function ChatPage({ 
  params, 
  searchParams 
}: { 
  params: { courseId: string }; 
  searchParams: { topicId?: string } 
}) {
  const topicId = searchParams.topicId;
  const chatData = await getChatData(params.courseId, topicId);
  
  if (!chatData) {
    notFound();
  }
  
  // If topicId was not in the URL, redirect to include it
  if (!topicId) {
    redirect(`/courses/${params.courseId}/chat?topicId=${chatData.topicId}`);
  }

  return (
    <AIChatTutor
      topicId={chatData.topicId}
      courseId={chatData.courseId}
      topicTitle={chatData.topicTitle}
    />
  );
}