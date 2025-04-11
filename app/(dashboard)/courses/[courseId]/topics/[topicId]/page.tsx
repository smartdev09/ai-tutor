// app/(dashboard)/courses/[courseId]/topics/[topicId]/page.tsx
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, MessageSquare } from 'lucide-react';
import TopicContentDisplay from '@/components/topic/content-display';

export const dynamic = 'force-dynamic';

async function getTopicData(courseId: string, topicId: string) {
  
  // Get topic data
  const { data: topic, error } = await supabase
    .from('course_topics')
    .select(`
      *,
      courses(title, subject, difficulty_level)
    `)
    .eq('id', topicId)
    .eq('course_id', courseId)
    .single();
  
  if (error || !topic) {
    console.error('Error fetching topic:', error);
    return null;
  }
  
  // Get existing content if available
  const { data: content } = await supabase
    .from('topic_contents')
    .select('content')
    .eq('topic_id', topicId)
    .single();
  
  // Get next and previous topics
  const { data: siblingTopics } = await supabase
    .from('course_topics')
    .select('id, sequence_number')
    .eq('course_id', courseId)
    .order('sequence_number', { ascending: true });
  
  let prevTopic = null;
  let nextTopic = null;
  
  if (siblingTopics) {
    const currentIndex = siblingTopics.findIndex(t => t.id === topicId);
    
    if (currentIndex > 0) {
      prevTopic = siblingTopics[currentIndex - 1].id;
    }
    
    if (currentIndex < siblingTopics.length - 1) {
      nextTopic = siblingTopics[currentIndex + 1].id;
    }
  }
  
  return {
    topic,
    content: content?.content || null,
    prevTopic,
    nextTopic,
  };
}

export default async function TopicPage({ 
  params 
}: { 
  params: { courseId: string; topicId: string } 
}) {
  const topicData = await getTopicData(params.courseId, params.topicId);
  
  if (!topicData) {
    notFound();
  }
  
  const { topic, content, prevTopic, nextTopic } = topicData;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center text-sm text-gray-500">
          <Link href={`/courses/${params.courseId}`} className="hover:text-blue-600">
            {topic.courses.title}
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-gray-800">{topic.title}</span>
        </div>
        
        <Button asChild variant="outline" size="sm">
          <Link href={`/courses/${params.courseId}/chat?topicId=${params.topicId}`}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat with AI Tutor
          </Link>
        </Button>
      </div>
      
      {/* Topic Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">{topic.title}</h1>
        <p className="text-gray-600">{topic.description}</p>
      </div>
      
      {/* Topic Content */}
      <TopicContentDisplay 
        topicId={params.topicId} 
        initialContent={content}
        courseId={params.courseId}
      />
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        {prevTopic ? (
          <Button 
            asChild
            variant="outline"
          >
            <Link href={`/courses/${params.courseId}/topics/${prevTopic}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous Topic
            </Link>
          </Button>
        ) : (
          <div></div>
        )}
        
        {nextTopic ? (
          <Button 
            asChild
          >
            <Link href={`/courses/${params.courseId}/topics/${nextTopic}`}>
              Next Topic
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        ) : (
          <Button 
            asChild
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            <Link href={`/courses/${params.courseId}`}>
              Finish Course
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}