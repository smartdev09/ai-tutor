"use client"

import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import React, { useEffect, useState } from 'react';
import { useCompletion } from "@ai-sdk/react";

const TestMyKnowledge = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const currentLessonContent = useAppSelector((state) => state.course.currentLessonContent);
  const [questions, setQuestions] = useState<Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [stableQuestionCount, setStableQuestionCount] = useState(0);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);

  const cleanText = (text: string): string => {
    let cleaned = text.replace(/\bf:{"messageId".*?}/g, '');
    cleaned = cleaned.replace(/\b\d+:"([^"]*)"/g, '$1');
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.replace(/"delta":{"text":"(.*?)"},"usage":/g, '$1');
    
    return cleaned;
  };
  
  const parseMCQQuestions = (completionText: string) => {
    const parsedQuestions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }> = [];
    
    const questionPattern = /(?:Question\s+\d+:|(?:\*\*Question\s+\d+:)|(?:\*\*)?Q\d+:?)\s*([^\n]+)([\s\S]*?)(?=(?:Question\s+\d+:|(?:\*\*Question\s+\d+:)|(?:\*\*)?Q\d+:?)|$)/gi;
    
    let match;
    while ((match = questionPattern.exec(completionText)) !== null) {
      try {
        const questionText = match[1].replace(/\*\*/g, '').trim();
        const optionsBlock = match[2].trim();
        
        const optionsPattern = /([A-D][).:])\s*(.*?)(?=(?:[A-D][).:])|Explanation:|$)/gis;
        const options: string[] = [];
        let correctIndex = -1;
        
        let optionMatch;
        let optionIndex = 0;
        
        while ((optionMatch = optionsPattern.exec(optionsBlock)) !== null) {
          let optionText = optionMatch[2].replace(/\*\*/g, '').trim();
          
          const isCorrect = /\[CORRECT\]/.test(optionText);
          if (isCorrect) {
            correctIndex = optionIndex;
            optionText = optionText.replace(/\[CORRECT\]/i, '').trim();
          }
          
          options.push(optionText);
          optionIndex++;
        }
        
        if (correctIndex === -1) {
          const explanationMatch = optionsBlock.match(/Explanation:.*?([A-D])\s*\)/i);
          if (explanationMatch) {
            const correctLetter = explanationMatch[1].toUpperCase();
            correctIndex = correctLetter.charCodeAt(0) - 'A'.charCodeAt(0);
          } else {
            correctIndex = 0;
          }
        }
        
        if (questionText && options.length === 4 && correctIndex >= 0) {
          parsedQuestions.push({
            question: questionText,
            options: options,
            correctAnswer: correctIndex
          });
        }
      } catch (err) {
        console.error('Error parsing question:', err);
      }
    }
    
    if (parsedQuestions.length === 0) {
      const fallbackQuestionPattern = /(\d+\.\s*|(?:\*\*)?(?:MCQ|Q(?:uestion)?)\s*\d+[:.]\s*)([^\n]+)([\s\S]*?)(?=(?:\d+\.\s*|(?:\*\*)?(?:MCQ|Q(?:uestion)?)\s*\d+[:.]\s*)|$)/gi;
      
      while ((match = fallbackQuestionPattern.exec(completionText)) !== null) {
        try {
          const questionText = match[2].replace(/\*\*/g, '').trim();
          const optionsBlock = match[3].trim();
          
          const options: string[] = [];
          let correctIndex = 0;
          
          const lines = optionsBlock.split('\n');

          const correct = lines[4].replace("CORRECT: ", "");

          const explanation = lines[5];

          for (let i = 0; i < 4; i++) {
            options.push(lines[i]);
            if (lines[i] === correct) {
              correctIndex = i;
            }
          }
          
          if (questionText && options.length >= 2) {
            while (options.length < 4) {
              options.push(`Option ${options.length + 1}`);
            }
            
            const finalOptions = options.slice(0, 4);
            
            correctIndex = Math.min(correctIndex, 3);
            
            parsedQuestions.push({
              question: questionText,
              options: finalOptions,
              correctAnswer: correctIndex,
              explanation: explanation
            });
          }
        } catch (err) {
          console.error('Error in fallback parsing:', err);
        }
      }
    }
    
    return parsedQuestions;
  };
  
  const processCompletionText = (text: string) => {
    const cleanedText = cleanText(text);
    return parseMCQQuestions(cleanedText);
  };

  const {
    completion,
    complete,
  } = useCompletion({
    api: '/api/generate-quiz',
    body: {
      content: currentLessonContent,
      type: 'mcq'
    },
    onFinish: (prompt, completion) => {
      try {
        const parsedQuestions = processCompletionText(completion);

      console.log('Quiz generation completed:', completion, parsedQuestions);
        if (parsedQuestions.length > 0) {
          setQuestions(parsedQuestions);
          setAnswers(Array(parsedQuestions.length).fill(null));
          setIsLoading(false);
        } else {
          setError('Failed to parse quiz questions');
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError('Failed to generate quiz');
      }
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    }
  });

  useEffect(() => {
    if (completion) {
      try {
        const newParsedQuestions = processCompletionText(completion);
        setParsedQuestions(newParsedQuestions);
        
        if (newParsedQuestions.length > stableQuestionCount) {
          setStableQuestionCount(newParsedQuestions.length);
          if (answers.length < newParsedQuestions.length) {
            setAnswers(prev => [
              ...prev, 
              ...Array(newParsedQuestions.length - prev.length).fill(null)
            ]);
          }
        }
        
        if (newParsedQuestions.length > 0) {
          const stableQuestions = [...newParsedQuestions];
          
          while (stableQuestions.length < stableQuestionCount) {
            const lastQuestion = stableQuestions[stableQuestions.length - 1] || {
              question: "Loading question...",
              options: ["Loading...", "Loading...", "Loading...", "Loading..."],
              correctAnswer: 0
            };
            stableQuestions.push({ ...lastQuestion });
          }
          
          setQuestions(stableQuestions);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error parsing streaming quiz content:', err);
      }
    }
  }, [completion, stableQuestionCount, answers.length]);

  useEffect(() => {
    if (!hasGenerated) {
      setHasGenerated(true);
      setIsLoading(true);
      complete('');
    }
  }, [hasGenerated, complete]);

  useEffect(() => {
    if (answers.length > 0 && questions.length > 0) {
      const actualQuestionCount = parsedQuestions.length;
      const allAnswered = answers.slice(0, actualQuestionCount).every(answer => answer !== null);
      setAllQuestionsAnswered(allAnswered);
    }
  }, [answers, questions.length, parsedQuestions.length]);

  const handleOptionSelect = (optionIndex: number) => {
    if (quizComplete) return;
    
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentQuestionIndex === questions.length - 1 && allQuestionsAnswered) {
      calculateScore();
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    if (questions.length === 0) return;
    
    let correctCount = 0;
    answers.forEach((answer, index) => {
      if (typeof answer === 'number' && index < questions.length && answer === questions[index].correctAnswer) {
        correctCount++;
      }
    });
    
    const percentageScore = (correctCount / parsedQuestions.length) * 100;
    setScore(percentageScore);
    setQuizComplete(true);
    setReviewMode(true);
    setCurrentQuestionIndex(0);
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers(Array(questions.length).fill(null));
    setQuizComplete(false);
    setScore(null);
    setReviewMode(false);
  };

  if (isLoading || questions.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow flex flex-col items-center justify-center min-h-60">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
        <p className="text-gray-700 font-medium">Generating your multiple choice quiz questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-red-500 text-center">
          <p className="font-medium">Failed to generate quiz</p>
          <p className="mt-2">{error}</p>
          <Button 
            className="mt-4 bg-purple-500 text-white px-4 py-2 rounded-lg"
            onClick={() => {
              setError(null);
              setHasGenerated(false);
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (quizComplete && score !== null && !reviewMode) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center mb-6">Quiz Results</h2>
        
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-purple-600 mb-2">{Math.round(score)}%</div>
          <p className="text-gray-700">
            You got {answers.filter((answer, index) => 
              typeof answer === 'number' && index < parsedQuestions.length && answer === parsedQuestions[index].correctAnswer
            ).length} out of {parsedQuestions.length} questions correct
          </p>
        </div>
        
        <div className="flex justify-center">
          <Button 
            className="px-6 py-2 bg-purple-500 text-white rounded-lg mr-4"
            onClick={() => {
              setReviewMode(true);
              setCurrentQuestionIndex(0);
            }}
          >
            Review Questions
          </Button>
          <Button 
            onClick={restartQuiz}
          >
            Retake Quiz
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  const isPlaceholder = currentQuestionIndex >= parsedQuestions.length;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          {quizComplete ? "Quiz Results" : "Multiple Choice Quiz"}
        </h2>
        {quizComplete && (
          <div className="text-purple-600 font-medium">
            Score: {Math.round(score || 0)}%
          </div>
        )}
      </div>
      
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center mb-2">
          <span className="text-gray-700 font-medium">Question {currentQuestionIndex + 1} of {parsedQuestions.length}</span>
          <div className="ml-2 flex-grow h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-purple-500 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="py-6">
        <h2 className="text-xl font-bold text-gray-800 mb-8">{currentQuestion?.question}</h2>

        <div className="space-y-4">
          {currentQuestion?.options.map((option, index) => {
            const isCorrect = currentQuestion?.correctAnswer === index;
            const isSelected = answers[currentQuestionIndex] === index;
            const showResultInline = quizComplete || isSelected;
            
            return (
              <div 
                key={index}
                className={`flex items-center p-2 rounded transition-all duration-200 ${
                  showResultInline ? (
                    isCorrect ? 'bg-green-50' : 
                    isSelected ? 'bg-red-50' : ''
                  ) : (isSelected ? 'bg-purple-50' : '')
                } ${isPlaceholder ? 'opacity-50' : ''}`}
                role="button"
                onClick={() => !isPlaceholder && !quizComplete && handleOptionSelect(index)}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                  isSelected 
                    ? (showResultInline && !isCorrect ? 'border-red-500' : 'border-purple-500')
                    : 'border-gray-400'
                }`}>
                  {showResultInline ? (
                    isCorrect ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    ) : isSelected ? (
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    ) : null
                  ) : (
                    isSelected && <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  )}
                </div>
                <span className={`text-gray-800 ${
                  (showResultInline && isCorrect) ? 'font-medium' : ''
                }`}>{option}</span>
                
                {/* Immediate feedback message */}
                {isSelected && showResultInline && !quizComplete && (
                  <span className={`ml-auto text-sm font-medium ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 flex justify-between">
        <div className="text-purple-600 font-medium">
          {!quizComplete && !allQuestionsAnswered && currentQuestionIndex === parsedQuestions.length - 1 && 
            'Please answer all questions to submit'
          }
          {quizComplete && (
            answers[currentQuestionIndex] === currentQuestion?.correctAnswer ? 
            'Correct answer!' : 'Incorrect answer'
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            className={`px-4 py-2 flex items-center border border-gray-300 rounded-lg ${currentQuestionIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </Button>
          
          {quizComplete ? (
            currentQuestionIndex === parsedQuestions.length - 1 ? (
              <Button 
                className="px-4 py-2 bg-purple-500 text-white rounded-lg"
                onClick={() => {
                  setReviewMode(false);
                }}
              >
                Show Summary
              </Button>
            ) : (
              <Button 
                className="px-4 py-2 bg-purple-500 text-white rounded-lg flex items-center"
                onClick={goToNextQuestion}
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            )
          ) : (
            <Button 
              className={`px-4 py-2 flex items-center ${
                currentQuestionIndex === parsedQuestions.length - 1 
                  ? (allQuestionsAnswered ? 'bg-green-500' : 'bg-gray-400') 
                  : 'bg-purple-500'
              } text-white rounded-lg`}
              onClick={goToNextQuestion}
              disabled={currentQuestionIndex === parsedQuestions.length - 1 && !allQuestionsAnswered}
            >
              {currentQuestionIndex === parsedQuestions.length - 1 ? 'Submit' : 'Next'}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        {answers.slice(0, parsedQuestions.length).map((answer, index) => (
          <div 
            key={index} 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${answer !== null 
                ? (quizComplete && parsedQuestions[index] && answer === parsedQuestions[index].correctAnswer 
                  ? 'bg-green-500 text-white' 
                  : quizComplete 
                    ? 'bg-red-500 text-white' 
                    : 'bg-purple-500 text-white')
                : 'bg-gray-200 text-gray-600'}
              ${currentQuestionIndex === index ? 'ring-2 ring-purple-300' : ''}
            `}
            onClick={() => setCurrentQuestionIndex(index)}
            role="button"
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestMyKnowledge;