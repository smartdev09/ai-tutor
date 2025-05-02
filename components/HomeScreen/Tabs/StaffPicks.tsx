import React from 'react';
import CourseCard from '../CourseCard';
import SearchHeader from '../SearchHeader';

const FeaturedCourses: React.FC = () => {
  // Array of featured courses
  const featuredCourses = [
    { level: "Beginner", title: "SSH Tunnels: A Beginner's Guide", lessons: 35 },
    { level: "Beginner", title: "SSH, SCP, and Related Tools: A Beginner's Guide", lessons: 42 },
    { level: "Beginner", title: "Go Exception Handling for Beginners", lessons: 42 },
    { level: "Beginner", title: "Java Data Structures for Beginners", lessons: 42 },
    { level: "Beginner", title: "NodeJS Clustering for Beginners", lessons: 42 },
    { level: "Beginner", title: "Performance Anti-Patterns: A Beginner's Guide", lessons: 28 },
    { level: "Beginner", title: "Hashing Algorithms: A Beginner's Guide", lessons: 35 },
    { level: "Beginner", title: "Introduction to Availability Patterns", lessons: 41 },
    { level: "Beginner", title: "Networking Protocols for Beginners", lessons: 42 },
    { level: "Beginner", title: "Caching Strategies for Beginners", lessons: 28 },
    { level: "Beginner", title: "Web Backend Performance Antipatterns", lessons: 36 },
    { level: "Beginner", title: "Java OOP Fundamentals for Beginners", lessons: 41 },
    { level: "Beginner", title: "Vim Keybindings for Beginners", lessons: 38 },
    { level: "Beginner", title: "C++ Pointers: A Beginner's Guide", lessons: 35 },
    { level: "Beginner", title: "Linux vs Unix: Explained Like I'm 5", lessons: 28 },
    { level: "Beginner", title: "Mastering Tail and Head Commands", lessons: 35 },
    { level: "Beginner", title: "Dig Command", lessons: 35 },
    { level: "Beginner", title: "Operating System Scheduling Algorithms", lessons: 42 }
  ];

  return (
    <div className="w-full max-w-screen p-4">
      <SearchHeader title="Featured Courses" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {featuredCourses.map((course, index) => (
          <CourseCard 
            key={index}
            level={course.level}
            title={course.title}
            lessons={course.lessons}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedCourses;