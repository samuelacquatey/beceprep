const ENHANCED_QUESTIONS = [
  {
    id: 1,
    year: 2019,
    subject: 'Mathematics',
    topic: 'Algebra',
    subtopic: 'Linear Equations',
    difficulty: 'medium', // low/medium/high
    tags: ['simplification', 'variables', 'basic_algebra'],
    prerequisites: ['basic_arithmetic'],
    cognitiveLevel: 'application', // knowledge/comprehension/application/analysis
    timeEstimate: 60, // seconds
    explanation: 'Distribute and combine like terms: 3(x+4) - 2x = 3x + 12 - 2x = x + 12',
    q: 'Simplify: 3(x+4) - 2x',
    options: ['x+12', 'x+4', '5x+12', 'x+8'],
    a: 0
  },
  // ... more questions with enhanced metadata
];

const TOPIC_HIERARCHY = {
  'Mathematics': {
    'Algebra': ['Linear Equations', 'Quadratic Equations', 'Factorization'],
    'Geometry': ['Shapes', 'Angles', 'Area'],
    'Statistics': ['Mean', 'Median', 'Probability']
  },
  'English': {
    'Grammar': ['Tenses', 'Parts of Speech', 'Sentence Structure'],
    'Comprehension': ['Inference', 'Vocabulary', 'Context']
  }
};