// app/api/chat/route.ts
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { streamText } from '@/lib/ai/client';
import { prompts } from '@/lib/ai/prompts';

export async function POST(req: NextRequest) {
  try {
    const { message, topicId, sessionId } = await req.json();
    
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
    const { data: topic } = await supabase
      .from('course_topics')
      .select(`
        *,
        courses(title, subject, difficulty_level),
        topic_contents(content)
      `)
      .eq('id', topicId)
      .single();
    
    if (!topic) {
      return Response.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }
    
    // Get or create chat session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const { data: newSession, error } = await supabase
        .from('chat_sessions')
        .insert({
          course_id: topic.course_id,
          topic_id: topicId,
        })
        .select()
        .single();
      
      if (error) {
        return Response.json(
          { error: 'Failed to create chat session' },
          { status: 500 }
        );
      }
      
      currentSessionId = newSession.id;
    }
    
    // Save user message
    await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        sender_type: 'user',
        message_content: message,
      });
    
    // Generate AI tutor response
    const prompt = prompts.chatTutor({
      courseTitle: topic.courses.title,
      topicTitle: topic.title,
      topicContent: topic.topic_contents?.[0]?.content || '',
      userQuestion: message,
      difficultyLevel: topic.courses.difficulty_level,
    });
    
    // Stream the response
    const aiResponse = streamText(prompt, 'chat');
    
    // Save AI response in database (after streaming starts)
    setTimeout(async () => {
      await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSessionId,
          sender_type: 'ai',
          message_content: '[AI response streamed]', // Placeholder
        });
    }, 100);
    
    return aiResponse;
    
  } catch (error: any) {
    console.error('Error in chat API:', error);
    
    return Response.json(
      { error: error.message || 'Failed to process chat message' },
      { status: 500 }
    );
  }
}