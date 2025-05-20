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

    // Match each question block starting with "Question <num>:"
    const questionBlocks = completionText.split(/(?=Question \d+:)/g);
    questionBlocks.shift();

    for (let i = 0; i < questionBlocks.length; i++) {
        const block = questionBlocks[i];
        try {
            const questionMatch = block.match(/Question \d+:\s*(.+?)\n/);
            const correctMatch = block.match(/CORRECT:\s*([A-D])\)/);
            const explanationMatch = block.match(/Explanation:\s*(.+)/s);

            const options: string[] = [];
            const optionRegex = /([A-D])\)\s*(.*)/g;
            let match: RegExpExecArray | null;
            while ((match = optionRegex.exec(block)) !== null) {
                const index = match[1].charCodeAt(0) - 'A'.charCodeAt(0);
                options[index] = match[2].trim();
            }

            if (questionMatch && correctMatch && options.length > 0) {
                const question = questionMatch[1].trim();
                const correctLetter = correctMatch[1].toUpperCase();
                const correctIndex = correctLetter.charCodeAt(0) - 'A'.charCodeAt(0);
                const explanation = explanationMatch?.[1]?.trim() || '';

                parsedQuestions.push({
                    question,
                    options,
                    correctAnswer: correctIndex,
                    explanation
                });
            } else {
                console.warn("Skipped block due to missing fields:", block);
            }
        } catch (err) {
            console.error('Error parsing question block:', err);
        }
    }


    console.log(`Parsed ${parsedQuestions.length} questions out of ${questionBlocks.length}`, parsedQuestions);
    return parsedQuestions;
};
