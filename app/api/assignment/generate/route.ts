// app/api/assignments/generate/[topicId]/route.ts
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { streamText, generateText } from '@/lib/ai/client';
import { prompts } from '@/lib/ai/prompts';

export async function POST(
  req: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const topicId = params.topicId;
    const { assignmentType = 'homework', stream = true } = await req.json();
    
    // Create Supabase server client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
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
    
    // Generate assignment with AI
    const prompt = prompts.generateAssignment({
      courseTitle: topic.courses.title,
      topicTitle: topic.title,
      assignmentType,
      difficultyLevel: topic.courses.difficulty_level,
    });
    
    // Use streaming if requested, otherwise return full response
    if (stream) {
      return streamText(prompt, 'assignment');
    } else {
      const content = await generateText(prompt, 'assignment');
      
      // Save assignment to database
      const { data: assignment, error } = await supabase
        .from('assignments')
        .insert({
          topic_id: topicId,
          title: `${assignmentType.charAt(0).toUpperCase() + assignmentType.slice(1)} for ${topic.title}`,
          description: `${assignmentType.charAt(0).toUpperCase() + assignmentType.slice(1)} assignment for ${topic.title}`,
          assignment_type: assignmentType,
          difficulty: topic.courses.difficulty_level === 'beginner' ? 1 : 
                      topic.courses.difficulty_level === 'intermediate' ? 3 : 5,
          content,
          solution_hints: '',
        })
        .select()
        .single();
      
      if (error) {
        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }
      
      return Response.json({ assignment });
    }
    
  } catch (error: any) {
    console.error('Error generating assignment:', error);
    
    return Response.json(
      { error: error.message || 'Failed to generate assignment' },
      { status: 500 }
    );
  }
}