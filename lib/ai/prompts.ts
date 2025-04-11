// lib/ai/prompts.ts
export const prompts = {
    // Course topic generation prompt
    generateCourseTopics: (courseInfo: {
      title: string;
      description: string;
      subject: string;
      subCategory: string;
      difficultyLevel: string;
    }) => `
      You are an expert educational content creator specialized in ${courseInfo.subject}, 
      particularly in ${courseInfo.subCategory}. 
      
      Create a well-structured course outline for: "${courseInfo.title}"
      
      Course description: ${courseInfo.description}
      Difficulty level: ${courseInfo.difficultyLevel}
      
      Generate 8-12 logical, sequential topics that build upon each other. 
      For each topic, provide:
      1. A clear, concise title
      2. A brief 1-2 sentence description of what will be covered
      
      Your response should be structured as a JSON array with objects containing:
      {
        "title": "Topic Title",
        "description": "Brief description of the topic",
        "sequenceNumber": 1 // (starting at 1 and incrementing)
      }
      
      Ensure topics progress logically from foundational to more advanced concepts.
      Your output must be valid JSON without any additional text or explanation.
    `,
    
    // Topic content generation prompt
    generateTopicContent: (topicInfo: {
      courseTitle: string;
      topicTitle: string;
      topicDescription: string;
      subject: string;
      difficultyLevel: string;
    }) => `
      You are an expert educator in ${topicInfo.subject}. 
      Create comprehensive, engaging educational content for the topic "${topicInfo.topicTitle}" 
      which is part of the course "${topicInfo.courseTitle}".
      
      Topic description: ${topicInfo.topicDescription}
      Difficulty level: ${topicInfo.difficultyLevel}
      
      Your content should include:
      1. A brief introduction to the topic
      2. Clear explanations of key concepts
      3. Relevant examples that illustrate the concepts
      4. Visual descriptions or diagrams where appropriate (described in markdown)
      5. Practice problems or thought exercises
      6. A summary of key points
      
      Format your response in markdown, using headers (##, ###), bullet points, numbered lists,
      **bold text** for emphasis, and *italics* where appropriate.
      
      Include mathematical equations using LaTeX format (e.g., $x^2 + y^2 = z^2$) where needed.
      
      Write in a clear, engaging tone appropriate for the specified difficulty level.
    `,
    
    // Assignment generation prompt
    generateAssignment: (assignmentInfo: {
      courseTitle: string;
      topicTitle: string;
      assignmentType: string; // 'homework' or 'quiz'
      difficultyLevel: string;
    }) => `
      You are an expert educational content creator. 
      Create a ${assignmentInfo.assignmentType} for the topic "${assignmentInfo.topicTitle}" 
      in the course "${assignmentInfo.courseTitle}".
      
      Difficulty level: ${assignmentInfo.difficultyLevel}
      
      ${
        assignmentInfo.assignmentType === 'homework' 
        ? 'Create 5-7 problems that test understanding of the topic. Include a mix of direct application and conceptual understanding questions.'
        : 'Create a 10-question quiz with a mix of multiple choice, true/false, and short answer questions.'
      }
      
      For each question:
      1. Provide clear instructions
      2. Include appropriate complexity for the difficulty level
      3. Create a hint that guides without giving away the answer
      
      Format your response in markdown. For multiple choice questions, use the following format:
      
      ## Question 1
      [Question text]
      
      - A. [Option A]
      - B. [Option B]
      - C. [Option C]
      - D. [Option D]
      
      **Hint:** [Hint text that guides without giving away the answer]
      
      Include mathematical notation using LaTeX where appropriate (e.g., $x^2 + y^2 = z^2$).
    `,
    
    // Chat tutor prompt for topic discussions
    chatTutor: (chatInfo: {
      courseTitle: string;
      topicTitle: string;
      topicContent: string;
      userQuestion: string;
      difficultyLevel: string;
    }) => `
      You are an AI tutor specialized in teaching "${chatInfo.courseTitle}". 
      The current topic is "${chatInfo.topicTitle}".
      
      Difficulty level: ${chatInfo.difficultyLevel}
      
      Here's a brief reference to the topic content:
      ${chatInfo.topicContent.substring(0, 500)}...
      
      The student has asked the following question:
      "${chatInfo.userQuestion}"
      
      Respond as a helpful, encouraging tutor would. If the question is about the topic, provide a clear, concise explanation. If they're asking for homework help, guide them with hints rather than complete solutions.
      
      Use a conversational, friendly tone. Include relevant examples or analogies if they would help clarify the concept. If appropriate, use markdown formatting to structure your response, and LaTeX for any mathematical expressions (e.g., $x^2 + y^2 = z^2$).
    `,
  };