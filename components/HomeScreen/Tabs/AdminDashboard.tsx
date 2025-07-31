import React, { useEffect, useState } from 'react';
import MetaCard from '../MetaCard';
import SearchHeader from '../SearchHeader';
import { courseService } from '@/lib/services/course';
import { AiCourse } from '@/types';
import { Loader } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [courses, setCourses] = useState<AiCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      const data = await courseService.getAllCourses("STAFF");

      setCourses(data);
      setLoading(false);
    }
    fetchCourses();
    
  }, []);
useEffect(()=>{
    if(courses&&courses[0] && courses[0].metaDescription){
        console.log(`dashboard:${courses[0].difficulty}`)
    }
},[courses])
  // Filter courses by search input
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-screen p-4">
      <SearchHeader
        title="Your Courses"
        search={search}
        setSearch={setSearch}
      />

      {loading ? (
        <div className="flex justify-center items-center h-[80vh] w-full">
          <Loader size={60} className="animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredCourses.map((course) => {
          console.log(course.metaDescription)
          return <MetaCard
            //   key={course.id ?? ''}
            //   slug={course.slug || ''}
            //   level={course.difficulty}
            //   title={course.title}
            //   modules={course.modules.length}
            //   progress={50}
            key={course.id??''}
            slug={course.slug??''}
            difficulty={course.difficulty}
            title={course.title}
            metaDescription={course.metaDescription??''}
              modules={course.modules}
            
           // description={course.description??''}            
            />
        
          }
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
