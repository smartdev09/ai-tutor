// app/api/courses/generate/route.ts
import { NextRequest } from 'next/server';
import { generateText } from '@/lib/ai/client';
import { prompts } from '@/lib/ai/prompts';
import { supabase } from '@/lib/supabase/client';

interface GeneratedTopic {
  title: string;
  description: string;
  sequenceNumber: number;
}

export async function POST(req: NextRequest) {
  try {
    const { title, description, subject, subCategory, difficultyLevel } = await req.json();
    
    // Validate required fields
    if (!title || !subject || !subCategory || !difficultyLevel) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // First create the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        title,
        description,
        subject,
        sub_category: subCategory,
        difficulty_level: difficultyLevel,
        published: false
      })
      .select()
      .single();

    if (courseError) {
      console.error('Error creating course:', courseError);
      return Response.json(
        { error: 'Failed to create course' },
        { status: 500 }
      );
    }
    
    // Generate course topics using AI
    const prompt = prompts.generateCourseTopics({
      title,
      description: description || '',
      subject,
      subCategory,
      difficultyLevel,
    });
    
    const generatedContent = await generateText(prompt, 'courseGeneration');
    
    // Parse the JSON response
    let topics: GeneratedTopic[];
    try {
      // Clean up the response by removing markdown code block markers
      const cleanedContent = generatedContent
        .replace(/^```json\s*/g, '') // Remove opening ```json
        .replace(/\s*```\s*$/g, '') // Remove closing ```
        .trim();
      
      topics = JSON.parse(cleanedContent);
      
      // Validate the structure
      if (!Array.isArray(topics)) {
        throw new Error('Invalid response format');
      }
      
      // Validate each topic has required fields
      topics.forEach((topic: GeneratedTopic) => {
        if (!topic.title || !topic.description || !topic.sequenceNumber) {
          throw new Error('Invalid topic format');
        }
      });

      // Insert topics into database
      const { error: topicsError } = await supabase
        .from('course_topics')
        .insert(
          topics.map(topic => ({
            course_id: course.id,
            title: topic.title,
            description: topic.description,
            sequence_number: topic.sequenceNumber
          }))
        );

      if (topicsError) {
        console.error('Error creating topics:', topicsError);
        return Response.json(
          { error: 'Failed to create topics' },
          { status: 500 }
        );
      }

    } catch (error: unknown) {
      console.error('Error parsing AI response:', error);
      console.log('Raw response:', generatedContent);
      
      return Response.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }
    
    return Response.json({ course, topics });
  } catch (error: unknown) {
    console.error('Error generating course topics:', error);
    
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to generate course topics' },
      { status: 500 }
    );
  }
}