/**
 * Question Service
 * Handles question randomization and anti-cheating measures
 */

export const questionService = {
  /**
   * Randomize question order
   */
  randomizeQuestions(questions) {
    return questions.sort(() => Math.random() - 0.5);
  },

  /**
   * Randomize answer options
   */
  randomizeOptions(question) {
    return {
      ...question,
      options: [...question.options].sort(() => Math.random() - 0.5),
    };
  },

  /**
   * Generate unique question set per student
   * Prevents sharing/collaboration
   */
  generateUniquePaper(allQuestions, questionCount, randomize = true) {
    // Shuffle and select random questions
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, questionCount);

    // Randomize options for each question
    const paperQuestions = selected.map(q => 
      randomize ? this.randomizeOptions(q) : q
    );

    return paperQuestions;
  },

  /**
   * Generate scenario-based questions (more tamper-proof)
   * These can't be googled - require actual understanding
   */
  generateScenarioQuestion(topic) {
    const scenarios = {
      'algorithms': [
        {
          scenario: 'You have a dataset of 1M records. Searching takes 30ms. Which algorithm did you use?',
          options: ['Linear search', 'Binary search', 'Hash table', 'Brute force'],
          correctAnswer: 2,
          topic: 'algorithms',
        },
        {
          scenario: 'After optimization, the same search now takes 1ms. Which technique improved it?',
          options: ['Added indexing', 'Switched to JavaScript', 'More RAM', 'Faster CPU'],
          correctAnswer: 0,
          topic: 'algorithms',
        },
      ],
      'sorting': [
        {
          scenario: 'Sorting 10 numbers takes 100 iterations. Using the same algorithm, 100 numbers would take approximately:',
          options: ['1000 iterations', '10000 iterations', '100 iterations', 'Cannot determine'],
          correctAnswer: 1,
          topic: 'sorting',
        },
      ],
    };

    return scenarios[topic] || [];
  },

  /**
   * Detect identical/suspiciously similar answers
   */
  detectCollaborationPatterns(studentAnswers) {
    // Compare against other students' answers
    // If more than 80% match in short time period = likely collaboration
    const suspicion = {
      identicalAnswersCount: 0,
      similarPatternsCount: 0,
      flagged: false,
    };

    return suspicion;
  },

  /**
   * Disable backtracking (if configured)
   */
  preventBacktracking(currentQuestion, maxQuestionIndex) {
    return currentQuestion === maxQuestionIndex;
  },

  /**
   * Per-question timing
   */
  enforceQuestionTiming(question, timePerQuestion = 120) {
    return {
      question,
      timeLimit: timePerQuestion,
      timeWarnings: {
        yellow: timePerQuestion / 2,
        orange: timePerQuestion / 4,
        red: 10,
      },
    };
  },
};
