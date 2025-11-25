/**
 * Topic Hierarchy and Foundational Knowledge Database
 * Used to suggest remedial topics when a student struggles with a specific concept.
 */

export const TOPIC_HIERARCHY = {
    "Mathematics": {
        "Algebra": {
            foundations: ["Integers", "Order of Operations", "Basic Arithmetic"],
            tips: "Practice simplifying expressions before solving equations."
        },
        "Linear Equations": {
            foundations: ["Algebra", "Variables", "Balancing Equations"],
            tips: "Remember: what you do to one side, you must do to the other."
        },
        "Geometry": {
            foundations: ["Shapes", "Angles", "Measurement"],
            tips: "Visualize the problem. Drawing a diagram often helps."
        },
        "Numbers": {
            foundations: ["Place Value", "Counting"],
            tips: "Master your multiplication tables."
        },
        "Statistics": {
            foundations: ["Data Collection", "Averages", "Graphing"],
            tips: "Check your scale when reading graphs."
        }
    },
    "Integrated Science": {
        "Matter": {
            foundations: ["States of Matter", "Atoms"],
            tips: "Focus on the properties of solids, liquids, and gases."
        },
        "Living Things": {
            foundations: ["Cells", "Characteristics of Life"],
            tips: "Understand the difference between plants and animals."
        },
        "Energy": {
            foundations: ["Forms of Energy", "Work"],
            tips: "Energy cannot be created or destroyed, only transformed."
        },
        "Forces": {
            foundations: ["Push and Pull", "Motion"],
            tips: "Draw force diagrams to see all forces acting on an object."
        }
    },
    "English Language": {
        "Grammar": {
            foundations: ["Parts of Speech", "Sentence Structure"],
            tips: "Read aloud to check if it sounds correct."
        },
        "Comprehension": {
            foundations: ["Vocabulary", "Reading Speed"],
            tips: "Read the questions before reading the passage."
        },
        "Composition": {
            foundations: ["Spelling", "Punctuation", "Paragraphing"],
            tips: "Plan your essay before you start writing."
        }
    }
};

export const BECE_PASS_MARK = 50; // Example pass mark
export const EXAM_DATE = new Date('2025-08-01'); // Example BECE date
