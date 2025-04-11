'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Star, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/supabase/database.types';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  category: string;
  earned_at?: string;
}

interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string;
  score: number;
  rank: number;
}

interface UserAchievement {
  achievement_id: string;
  earned_at: string;
  achievements: {
    id: string;
    name: string;
    description: string;
    icon_url: string;
    category_id: string;
    achievement_categories: {
      name: string;
    };
  };
}

interface LeaderboardUser {
  user_id: string;
  score: number;
  rank: number;
  users: {
    username: string;
    avatar_url: string;
  };
}

export default function AchievementsPanel() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    loadAchievements();
    loadLeaderboard(selectedPeriod);
  }, [selectedPeriod]);

  async function loadAchievements() {
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select(`
        achievement_id,
        earned_at,
        achievements (
          id,
          name,
          description,
          icon_url,
          category_id,
          achievement_categories (name)
        )
      `);

    if (userAchievements) {
      setAchievements(userAchievements.map((ua: UserAchievement) => ({
        id: ua.achievements.id,
        name: ua.achievements.name,
        description: ua.achievements.description,
        icon_url: ua.achievements.icon_url,
        category: ua.achievements.achievement_categories.name,
        earned_at: ua.earned_at
      })));
    }
  }

  async function loadLeaderboard(period: 'weekly' | 'monthly' | 'all-time') {
    const { data } = await supabase
      .from('leaderboard_entries')
      .select(`
        user_id,
        score,
        rank,
        users (username, avatar_url)
      `)
      .eq('type', period)
      .order('rank', { ascending: true })
      .limit(10);

    if (data) {
      setLeaderboard(data.map((entry: LeaderboardUser) => ({
        user_id: entry.user_id,
        username: entry.users.username,
        avatar_url: entry.users.avatar_url,
        score: entry.score,
        rank: entry.rank
      })));
    }
  }

  return (
    <Tabs defaultValue="achievements" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="achievements">Achievements</TabsTrigger>
        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
      </TabsList>

      <TabsContent value="achievements">
        <Card>
          <CardHeader>
            <CardTitle>Your Achievements</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        {achievement.icon_url ? (
                          <img
                            src={achievement.icon_url}
                            alt={achievement.name}
                            className="w-8 h-8"
                          />
                        ) : (
                          <Trophy className="w-8 h-8 text-primary" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold">{achievement.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="leaderboard">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Leaderboard</CardTitle>
              <div className="flex space-x-2">
                <TabsList>
                  <TabsTrigger
                    value="weekly"
                    onClick={() => setSelectedPeriod('weekly')}
                  >
                    Weekly
                  </TabsTrigger>
                  <TabsTrigger
                    value="monthly"
                    onClick={() => setSelectedPeriod('monthly')}
                  >
                    Monthly
                  </TabsTrigger>
                  <TabsTrigger
                    value="all-time"
                    onClick={() => setSelectedPeriod('all-time')}
                  >
                    All Time
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {index === 0 ? (
                          <Crown className="w-6 h-6 text-yellow-500" />
                        ) : index === 1 ? (
                          <Medal className="w-6 h-6 text-gray-400" />
                        ) : index === 2 ? (
                          <Star className="w-6 h-6 text-amber-600" />
                        ) : (
                          <span className="w-6 h-6 flex items-center justify-center font-bold">
                            {entry.rank}
                          </span>
                        )}
                      </div>
                      <Avatar>
                        <AvatarImage src={entry.avatar_url} />
                        <AvatarFallback>
                          {entry.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{entry.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.score.toLocaleString()} XP
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={(entry.score / leaderboard[0].score) * 100}
                      className="w-24"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 