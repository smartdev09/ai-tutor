import { z } from "zod";

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Base schemas
export const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  subject: z.enum(["math", "science"]),
  subCategory: z.string().min(1, "Sub-category is required"),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced"])
});

export const assignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  topicId: z.string().uuid("Invalid topic ID"),
  type: z.enum(["quiz", "problem", "project"]),
  difficulty: z.number().min(1).max(5),
  timeLimit: z.number().optional(),
  maxAttempts: z.number().optional()
});

export const submissionSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment ID"),
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.string()
  })),
  timeTaken: z.number().optional()
});

// Rate limiting configuration
export const rateLimitConfig = {
  '/api/courses/generate': {
    points: 5,
    duration: 3600, // 1 hour
  },
  '/api/topics/content': {
    points: 10,
    duration: 3600,
  },
  '/api/assignments/generate': {
    points: 10,
    duration: 3600,
  },
  '/api/chat': {
    points: 50,
    duration: 3600,
  },
} as const;

// Types
export type RegisterInput = z.infer<typeof registerSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type AssignmentInput = z.infer<typeof assignmentSchema>;
export type SubmissionInput = z.infer<typeof submissionSchema>; 