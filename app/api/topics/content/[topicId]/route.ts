// app/api/topics/content/[topicId]/route.ts
import { NextRequest } from 'next/server';
import { streamResponse } from '@/lib/ai/client';
import { prompts } from '@/lib/ai/prompts';
import { supabase } from '@/lib/supabase/client';

export const runtime = 'edge';
export const maxDuration = 30; // Allow streaming responses up to 30 seconds

export async function GET(
  req: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const topicId = params.topicId;
    
    // Get topic info
    const { data: topic, error: topicError } = await supabase
      .from('course_topics')
      .select(`
        *,
        courses(title, subject, difficulty_level)
      `)
      .eq('id', topicId)
      .single();
    
    if (topicError || !topic) {
      return Response.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }
    
    // Check if content already exists
    const { data: existingContent } = await supabase
      .from('topic_contents')
      .select('*')
      .eq('topic_id', topicId)
      .single();
    
    // If content exists, return it without regenerating
    if (existingContent) {
      return Response.json({ content: existingContent.content });
    }
    
    // Generate content with AI
    const prompt = prompts.generateTopicContent({
      courseTitle: topic.courses.title,
      topicTitle: topic.title,
      topicDescription: topic.description,
      subject: topic.courses.subject,
      difficultyLevel: topic.courses.difficulty_level,
    });
    
    // Use streaming for content generation
    return streamResponse(prompt, 'contentGeneration');
    
  } catch (error: unknown) {
    console.error('Error generating topic content:', error);
    
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to generate topic content' },
      { status: 500 }
    );
  }
}

// Also handle POST to save generated content
export async function POST(
  req: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const topicId = params.topicId;
    const { content } = await req.json();
    
    // Save content to database
    const { error } = await supabase
      .from('topic_contents')
      .insert({
        topic_id: topicId,
        content,
      });
    
    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return Response.json({ success: true });
  } catch (error: unknown) {
    console.error('Error saving topic content:', error);
    
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to save topic content' },
      { status: 500 }
    );
  }
}