import React from 'react';
import CourseCard from '../CourseCard';
import SearchHeader from '../SearchHeader';

const ExploreCourses: React.FC = () => {
  // Array of courses to explore
  const exploreCourses = [
    { level: "Intermediate", title: "Advanced IoT Solutions for Experienced Professionals", lessons: 41 },
    { level: "Beginner", title: "Quantitative Finance Roadmap: A Beginner's Guide", lessons: 35 },
    { level: "Beginner", title: "Software Development with AI/ML: A Beginner's Guide", lessons: 35 },
    { level: "Beginner", title: "Go Generics: A Beginner's Guide", lessons: 42 },
    { level: "Beginner", title: "React for Beginners: A Comprehensive Guide", lessons: 28 },
    { level: "Intermediate", title: "Intermediate Algebra: Mastering Advanced Concepts", lessons: 42 },
    { level: "Beginner", title: "Mastering the 管理类联考: A Beginner's Guide", lessons: 36 },
    { level: "Beginner", title: "Javascript for Frontend Development: A Beginner's Guide", lessons: 43 },
    { level: "Beginner", title: "HTML for Beginners: A Comprehensive Guide", lessons: 45 },
    { level: "Beginner", title: "Kotlin Android and C# Windows Roadmap for Beginners", lessons: 42 },
    { level: "Beginner", title: "Математика для Начинающих", lessons: 35 },
    { level: "Beginner", title: "Network Security for Beginners", lessons: 35 },
    { level: "Beginner", title: "Introduction to Arrays", lessons: 28 },
    { level: "Beginner", title: "The Junior Developer's Handbook: From Zero to First Job", lessons: 50 },
    { level: "Beginner", title: "Machine Learning for Beginners: From Zero to Model Building", lessons: 37 },
    { level: "Beginner", title: "QA Engineer: A Beginner's Guide to Software Quality Assurance", lessons: 35 },
    { level: "Intermediate", title: "Docker Mastery: From Fundamentals to Orchestration", lessons: 42 },
    { level: "Intermediate", title: "Mastering JavaScript Promises", lessons: 42 }
  ];

  return (
    <div className="w-full max-w-screen p-4">
      <SearchHeader title="Explore Courses" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exploreCourses.map((course, index) => (
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

export default ExploreCourses;