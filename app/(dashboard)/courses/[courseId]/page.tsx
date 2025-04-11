// app/(dashboard)/courses/[courseId]/page.tsx
import { supabase } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  LineChart, 
  Clock, 
  Award, 
  Calendar, 
  User, 
  Layers,
  ChevronRight
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getCourseData(courseId: string) {

  
  // Get course data
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();
  
  if (error || !course) {
    console.error('Error fetching course:', error);
    return null;
  }
  
  // Get course topics
  const { data: topics } = await supabase
    .from('course_topics')
    .select('*')
    .eq('course_id', courseId)
    .order('sequence_number', { ascending: true });
  
  // Get student progress if logged in
  const { data: { user } } = await supabase.auth.getUser();
  
  let progress = 0;
  let completedTopics = 0;
  
  if (user) {
    const { data: userProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .in('topic_id', topics?.map(t => t.id) || []);
    
    if (userProgress && userProgress.length > 0) {
      completedTopics = userProgress.filter(p => p.completed_at).length;
      progress = topics && topics.length > 0 
        ? Math.round((completedTopics / topics.length) * 100)
        : 0;
    }
  }
  
  return {
    course,
    topics: topics || [],
    progress,
    completedTopics,
    totalTopics: topics?.length || 0
  };
}

export default async function CoursePage({ params }: { params: { courseId: string } }) {
  const courseData = await getCourseData(params.courseId);
  
  if (!courseData) {
    // notFound();
  }
  
  const { course, topics, progress, completedTopics, totalTopics } = courseData;
  
  // Format date
  const formattedDate = new Date(course.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Estimated completion time (10 min per topic)
  const estimatedTime = totalTopics * 10;
  const hours = Math.floor(estimatedTime / 60);
  const minutes = estimatedTime % 60;
  const timeString = hours > 0 
    ? `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} min` : ''}`
    : `${minutes} minutes`;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
            <div className="text-gray-600 mb-4">{course.description}</div>
            
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {course.subject}
              </div>
              <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                {course.sub_category}
              </div>
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm capitalize">
                {course.difficulty_level}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Created {formattedDate}
              </div>
              <div className="flex items-center">
                <Layers className="h-4 w-4 mr-1" />
                {totalTopics} topics
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {timeString}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col justify-center">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-center">
                <div className="text-lg font-medium mb-1">Your Progress</div>
                <div className="text-3xl font-bold text-blue-600 mb-2">{progress}%</div>
                <Progress value={progress} className="h-2 mb-2" />
                <div className="text-sm text-gray-500">
                  {completedTopics} of {totalTopics} topics completed
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Topics List */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Course Topics</h2>
          <Button asChild variant="outline">
            <Link href={`/courses/${course.id}/progress`}>
              View Progress <LineChart className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="grid gap-4">
          {topics.map((topic, index) => {
            const isCompleted = progress > 0 && (index / totalTopics) * 100 < progress;
            
            return (
              <Link key={topic.id} href={`/courses/${course.id}/topics/${topic.id}`}>
                <Card className={`hover:shadow-md transition-shadow ${isCompleted ? 'border-green-100' : ''}`}>
                  <CardContent className="p-0">
                    <div className="flex items-center p-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full 
                        ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'} 
                        flex items-center justify-center font-medium mr-4`}
                      >
                        {isCompleted ? (
                          <Award className="h-5 w-5" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      
                      <div className="flex-grow">
                        <h3 className="font-medium mb-1">{topic.title}</h3>
                        <p className="text-gray-500 text-sm">{topic.description}</p>
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}