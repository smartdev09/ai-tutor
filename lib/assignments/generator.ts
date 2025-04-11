import { createServerClient, type SupabaseClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateText } from '../ai/client';
import { AssignmentInput } from '../validations/schemas';

interface AssignmentMetrics {
  averageScore: number;
  averageTime: number;
  completionRate: number;
  difficultyRating: number;
}

interface AssignmentAttempt {
  score: number;
  time_taken_seconds: number;
}

export async function generateAssignment(input: AssignmentInput) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  // Get user's performance metrics
  const { data: metrics } = await calculateUserMetrics(supabase, input.topicId);
  
  // Adjust difficulty based on performance
  const adjustedDifficulty = adjustDifficulty(input.difficulty, metrics);

  // Generate assignment content
  const prompt = generateAssignmentPrompt(input, adjustedDifficulty);
  const content = await generateText(prompt, 'assignment');

  try {
    const parsedContent = JSON.parse(content);
    return {
      ...parsedContent,
      difficulty: adjustedDifficulty,
      metrics
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw new Error('Failed to generate valid assignment');
  }
}

async function calculateUserMetrics(
  supabase: SupabaseClient,
  topicId: string
): Promise<{ data: AssignmentMetrics }> {
  const { data: attempts } = await supabase
    .from('assignment_attempts')
    .select(`
      score,
      time_taken_seconds,
      assignments!inner(topic_id)
    `)
    .eq('assignments.topic_id', topicId)
    .order('submitted_at', { ascending: false })
    .limit(10);

  if (!attempts?.length) {
    return {
      data: {
        averageScore: 0,
        averageTime: 0,
        completionRate: 0,
        difficultyRating: 1
      }
    };
  }

  const metrics = attempts.reduce((acc: { totalScore: number; totalTime: number; completed: number }, attempt: AssignmentAttempt) => ({
    totalScore: acc.totalScore + attempt.score,
    totalTime: acc.totalTime + attempt.time_taken_seconds,
    completed: acc.completed + (attempt.score > 0 ? 1 : 0)
  }), { totalScore: 0, totalTime: 0, completed: 0 });

  return {
    data: {
      averageScore: metrics.totalScore / attempts.length,
      averageTime: metrics.totalTime / attempts.length,
      completionRate: metrics.completed / attempts.length,
      difficultyRating: calculateDifficultyRating(metrics.totalScore / attempts.length)
    }
  };
}

function adjustDifficulty(baseDifficulty: number, metrics: AssignmentMetrics): number {
  const performanceFactor = (metrics.averageScore / 100) * metrics.completionRate;
  let adjustment = 0;

  if (performanceFactor > 0.8) adjustment = 0.5;
  else if (performanceFactor < 0.4) adjustment = -0.5;

  return Math.max(1, Math.min(5, baseDifficulty + adjustment));
}

function calculateDifficultyRating(averageScore: number): number {
  if (averageScore >= 90) return 5;
  if (averageScore >= 80) return 4;
  if (averageScore >= 70) return 3;
  if (averageScore >= 60) return 2;
  return 1;
}

function generateAssignmentPrompt(input: AssignmentInput, difficulty: number): string {
  return JSON.stringify({
    role: "system",
    content: `Generate a ${input.type} for ${input.title} at difficulty level ${difficulty}/5. 
              Include step-by-step solution hints without giving away the answers.
              Format the response as a JSON object with:
              - questions: array of question objects
              - hints: array of progressive hints for each question
              - explanations: detailed solution steps (to be revealed after completion)
              - prerequisites: concepts needed to solve this assignment`
  });
} 