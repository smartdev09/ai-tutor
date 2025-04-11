import { createServerClient, type SupabaseClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface Achievement {
  id: string;
  name: string;
  description: string;
  xp: number;
  icon_url: string;
  category_id: string;
  required_actions: {
    type: string;
    count: number;
    params?: Record<string, unknown>;
  }[];
}

interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string;
  score: number;
  rank: number;
}

interface RequirementParams {
  type: string;
  count: number;
  params?: Record<string, unknown>;
}

export async function checkAchievements(userId: string, action: string, params: Record<string, unknown> = {}) {
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

  // Get all achievements user hasn't earned yet
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .not('id', 'in', (
      supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId)
    ));

  if (!achievements) return [];

  const earnedAchievements: Achievement[] = [];

  for (const achievement of achievements) {
    const meetsRequirements = await checkAchievementRequirements(
      supabase,
      userId,
      achievement.required_actions,
      action,
      params
    );

    if (meetsRequirements) {
      await awardAchievement(supabase, userId, achievement);
      earnedAchievements.push(achievement);
    }
  }

  return earnedAchievements;
}

async function checkAchievementRequirements(
  supabase: SupabaseClient,
  userId: string,
  requirements: RequirementParams[],
  currentAction: string,
  params: Record<string, unknown>
): Promise<boolean> {
  for (const req of requirements) {
    if (req.type !== currentAction) continue;

    const { count: requiredCount, params: reqParams = {} } = req;

    // Count matching actions
    const query = supabase
      .from(getTableForAction(currentAction))
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Add any additional filters from params
    Object.entries(reqParams).forEach(([key, value]) => {
      query.eq(key, params[key] === value);
    });

    const { count } = await query;
    if (!count || count < requiredCount) return false;
  }

  return true;
}

async function awardAchievement(supabase: SupabaseClient, userId: string, achievement: Achievement) {
  // Record achievement
  await supabase
    .from('user_achievements')
    .insert({
      user_id: userId,
      achievement_id: achievement.id,
    });

  // Award XP
  await supabase.rpc('increment_user_xp', {
    user_id: userId,
    xp_amount: achievement.xp
  });

  return true;
}

export async function updateLeaderboard(
  type: 'weekly' | 'monthly' | 'all-time',
  limit: number = 10
): Promise<LeaderboardEntry[]> {
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

  // Get or create leaderboard
  const { data: leaderboard } = await supabase
    .from('leaderboards')
    .select('id')
    .eq('type', type)
    .single();

  if (!leaderboard) {
    const { data: newLeaderboard } = await supabase
      .from('leaderboards')
      .insert({ type, name: `${type} Leaderboard` })
      .select()
      .single();

    if (!newLeaderboard) throw new Error('Failed to create leaderboard');
  }

  // Get top users
  const { data: entries } = await supabase
    .from('leaderboard_entries')
    .select(`
      user_id,
      score,
      rank,
      users (
        username,
        avatar_url
      )
    `)
    .eq('leaderboard_id', leaderboard?.id)
    .order('rank', { ascending: true })
    .limit(limit);

  if (!entries) return [];

  return entries.map(entry => ({
    user_id: entry.user_id,
    username: entry.users.username,
    avatar_url: entry.users.avatar_url,
    score: entry.score,
    rank: entry.rank
  }));
}

function getTableForAction(action: string): string {
  switch (action) {
    case 'complete_assignment':
      return 'assignment_attempts';
    case 'complete_topic':
      return 'user_progress';
    case 'create_course':
      return 'courses';
    default:
      throw new Error(`Unknown action type: ${action}`);
  }
} 