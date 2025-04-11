// app/(dashboard)/dashboard/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import CourseCard from '@/components/courses/course-card';
import XpProgress from '@/components/gamification/xp-progress';
import LevelIndicator from '@/components/gamification/level-indicator';
import { supabase } from '@/lib/supabase/client';
export default async function DashboardPage() {

  
  // Get user profile with experience and level
  let { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', "bd09a12c-9e83-4616-a360-539288c23b48")
    .single();
  
  if (profileError) {
    console.error('Profile error:', profileError.message);
    // Create profile if it doesn't exist
    if (profileError.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert([
          { 
            id: "bd09a12c-9e83-4616-a360-539288c23b48",
            email: "usiddique09@gmail.com",
            username: "usiddique09@gmail.com"?.split('@')[0],
            experience_points: 0,
            level: 1
          }
        ])
        .select()
        .single();
      
      if (createError) {
        console.error('Create profile error:', createError.message);
      }
      
      if (newProfile) {
        userProfile = newProfile;
      }
    }
  }
  
  // Get user's courses
  const { data: userCourses, error: coursesError } = await supabase
    .from('courses')
    .select(`
      *,
      course_topics(count),
      user_progress(completed, progress_percentage)
    `)
    .eq('creator_id', "bd09a12c-9e83-4616-a360-539288c23b48")
    .order('created_at', { ascending: false });
  
  if (coursesError) {
    console.error('Courses error:', coursesError.message);
  }
  
  // Get recommended courses
  const { data: recommendedCourses, error: recommendedError } = await supabase
    .from('courses')
    .select(`
      *,
      course_topics(count),
      users(username)
    `)
    .neq('creator_id', "bd09a12c-9e83-4616-a360-539288c23b48")
    .eq('published', true)
    .limit(4);
    
  if (recommendedError) {
    console.error('Recommended courses error:', recommendedError.message);
  }
    
  // Get user achievements
  const { data: userAchievements, error: achievementsError } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievements(name, description, icon_url, experience_points)
    `)
    .eq('user_id', "bd09a12c-9e83-4616-a360-539288c23b48")
    .limit(3);

  if (achievementsError) {
    console.error('Achievements error:', achievementsError.message);
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* User stats card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span>Welcome back, {userProfile?.username || session.user.email?.split('@')[0]}</span>
              <LevelIndicator level={userProfile?.level || 1} />
            </CardTitle>
            <CardDescription>Continue your learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Experience</span>
                <span className="text-sm font-medium">{userProfile?.experience_points || 0} XP</span>
              </div>
              <XpProgress 
                currentXp={userProfile?.experience_points || 0} 
                level={userProfile?.level || 1} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {userCourses?.length || 0}
                </div>
                <div className="text-sm text-gray-500">Courses Created</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {userAchievements?.length || 0}
                </div>
                <div className="text-sm text-gray-500">Achievements</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/courses/create">Create New Course</Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Achievements card */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
            <CardDescription>Your latest accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            {userAchievements && userAchievements.length > 0 ? (
              <div className="space-y-4">
                {userAchievements.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 text-lg">🏆</span>
                    </div>
                    <div>
                      <div className="font-medium">{item.achievements?.name}</div>
                      <div className="text-sm text-gray-500">{item.achievements?.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No achievements yet. Start learning to earn badges!
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">View All Achievements</Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Your Courses Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Courses</h2>
          <Button asChild variant="outline">
            <Link href="/courses">View All</Link>
          </Button>
        </div>
        
        {userCourses && userCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-xl font-medium mb-2">Start Your First Course</h3>
              <p className="text-gray-500 text-center mb-6">
                Create your first course and begin your teaching journey
              </p>
              <Button asChild>
                <Link href="/courses/create">Create Course</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Recommended Courses Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recommended Courses</h2>
          <Button asChild variant="outline">
            <Link href="/courses/discover">Discover More</Link>
          </Button>
        </div>
        
        {recommendedCourses && recommendedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedCourses.map((course) => (
              <CourseCard key={course.id} course={course} isRecommended />
            ))}
          </div>
        ) : (
          <Card className="bg-gray-50">
            <CardContent className="py-8 text-center text-gray-500">
              No recommendations available yet. Check back soon!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}