
// Arabic (ar) version
export const cleanTextAR = (text: string): string => {
    let cleaned = text.replace(/\bf:{"messageId".*?}/g, '');
    cleaned = cleaned.replace(/\b\d+:"([^"]*)"/g, '$1');
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.replace(/"delta":{"text":"(.*?)"},"usage":/g, '$1');
    return cleaned;
};

export const parseMCQQuestionsAR = (completionText: string) => {
    const parsedQuestions: Array<{
        question: string;
        options: string[];
        correctAnswer: number;
        explanation?: string;
    }> = [];

    const questionPattern = /(?:سؤال\s+\d+:|السؤال\s+\d+:|(?:\*\*سؤال\s+\d+:)|(?:\*\*)?س\d+:?)\s*([^\n]+)([\s\S]*?)(?=(?:سؤال\s+\d+:|السؤال\s+\d+:|(?:\*\*سؤال\s+\d+:)|(?:\*\*)?س\d+:?)|$)/gi;

    let match;
    while ((match = questionPattern.exec(completionText)) !== null) {
        try {
            
            const questionText = match[1].replace(/\*\*/g, '').trim();
            const optionsBlock = match[2].trim();

            const optionsPattern = /([أ-د][).:])\s*(.*?)(?=(?:[أ-د][).:])|شرح:|$)/gis;
            const options: string[] = [];
            let correctIndex = -1;

            let optionMatch;
            let optionIndex = 0;

            while ((optionMatch = optionsPattern.exec(optionsBlock)) !== null) {
                let optionText = optionMatch[2].replace(/\*\*/g, '').trim();

                const isCorrect = /\[صحيح\]/.test(optionText);
                if (isCorrect) {
                    correctIndex = optionIndex;
                    optionText = optionText.replace(/\[صحيح\]/i, '').trim();
                }

                options.push(optionText);
                optionIndex++;
            }

            if (correctIndex === -1) {
                const explanationMatch = optionsBlock.match(/شرح:.*?([أ-د])\s*\)/i);
                if (explanationMatch) {
                    const arabicLetters = ['أ', 'ب', 'ج', 'د'];
                    const correctLetter = explanationMatch[1];
                    correctIndex = arabicLetters.indexOf(correctLetter);
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
            console.error('Error parsing Arabic question:', err);
        }
    }

    if (parsedQuestions.length === 0) {
        const fallbackQuestionPattern = /(\d+\.\s*|(?:\*\*)?(?:اختياري|س(?:ؤال)?)\s*\d+[:.]\s*)([^\n]+)([\s\S]*?)(?=(?:\d+\.\s*|(?:\*\*)?(?:اختياري|س(?:ؤال)?)\s*\d+[:.]\s*)|$)/gi;

        while ((match = fallbackQuestionPattern.exec(completionText)) !== null) {
            try {
                const questionText = match[2].replace(/\*\*/g, '').trim();
                const optionsBlock = match[3].trim();

                const options: string[] = [];
                let correctIndex = 0;

                const lines = optionsBlock.split('\n');
                const correct = lines[4].replace("صحيح: ", "");
                const explanation = lines[5];

                for (let i = 0; i < 4; i++) {
                    options.push(lines[i]);
                    if (lines[i] === correct) {
                        correctIndex = i;
                    }
                }

                if (questionText && options.length >= 2) {
                    while (options.length < 4) {
                        options.push(`خيار ${options.length + 1}`);
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
                console.error('Error in Arabic fallback parsing:', err);
            }
        }
    }

    return parsedQuestions;
};

// German (de) version
export const cleanTextDE = (text: string): string => {
    let cleaned = text.replace(/\bf:{"messageId".*?}/g, '');
    cleaned = cleaned.replace(/\b\d+:"([^"]*)"/g, '$1');
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.replace(/"delta":{"text":"(.*?)"},"usage":/g, '$1');
    return cleaned;
};

export const parseMCQQuestionsDE = (completionText: string) => {
    const parsedQuestions: Array<{
        question: string;
        options: string[];
        correctAnswer: number;
        explanation?: string;
    }> = [];

    const questionPattern = /(?:Frage\s+\d+:|(?:\*\*Frage\s+\d+:)|(?:\*\*)?F\d+:?)\s*([^\n]+)([\s\S]*?)(?=(?:Frage\s+\d+:|(?:\*\*Frage\s+\d+:)|(?:\*\*)?F\d+:?)|$)/gi;

    let match;
    while ((match = questionPattern.exec(completionText)) !== null) {
        try {
            const questionText = match[1].replace(/\*\*/g, '').trim();
            const optionsBlock = match[2].trim();

            const optionsPattern = /([A-D][).:])\s*(.*?)(?=(?:[A-D][).:])|Erklärung:|$)/gis;
            const options: string[] = [];
            let correctIndex = -1;

            let optionMatch;
            let optionIndex = 0;

            while ((optionMatch = optionsPattern.exec(optionsBlock)) !== null) {
                let optionText = optionMatch[2].replace(/\*\*/g, '').trim();

                const isCorrect = /\[RICHTIG\]/.test(optionText);
                if (isCorrect) {
                    correctIndex = optionIndex;
                    optionText = optionText.replace(/\[RICHTIG\]/i, '').trim();
                }

                options.push(optionText);
                optionIndex++;
            }

            if (correctIndex === -1) {
                const explanationMatch = optionsBlock.match(/Erklärung:.*?([A-D])\s*\)/i);
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
            console.error('Error parsing German question:', err);
        }
    }

    if (parsedQuestions.length === 0) {
        const fallbackQuestionPattern = /(\d+\.\s*|(?:\*\*)?(?:MCQ|F(?:rage)?)\s*\d+[:.]\s*)([^\n]+)([\s\S]*?)(?=(?:\d+\.\s*|(?:\*\*)?(?:MCQ|F(?:rage)?)\s*\d+[:.]\s*)|$)/gi;

        while ((match = fallbackQuestionPattern.exec(completionText)) !== null) {
            try {
                const questionText = match[2].replace(/\*\*/g, '').trim();
                const optionsBlock = match[3].trim();

                const options: string[] = [];
                let correctIndex = 0;

                const lines = optionsBlock.split('\n');
                const correct = lines[4].replace("RICHTIG: ", "");
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
                console.error('Error in German fallback parsing:', err);
            }
        }
    }

    return parsedQuestions;
};

// English (en) version
export const cleanText = (text: string): string => {
    let cleaned = text.replace(/\bf:{"messageId".*?}/g, '');
    cleaned = cleaned.replace(/\b\d+:"([^"]*)"/g, '$1');
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.replace(/"delta":{"text":"(.*?)"},"usage":/g, '$1');

    return cleaned;
};

export const parseMCQQuestions = (completionText: string) => {
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
                // Defensive: check if lines[4] and lines[5] exists
                let correct = "";
                let explanation = "";
                correct = lines[4]?.replace("CORRECT: ", "");
                explanation = lines[5] || ""                

                for (let i = 0; i < 4; i++) {
                    options.push(lines[i] || `Option ${i + 1}`);
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