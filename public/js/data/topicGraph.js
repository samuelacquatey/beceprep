// Auto-generated from curriculum/topics/topics_mathematics_jhs3_with_graph.json

export const TOPIC_GRAPH = {
    "subject": "Mathematics",
    "levels": [
        {
            "class": "JHS3",
            "strands": [
                {
                    "name": "Numbers and Operations",
                    "substrands": [
                        {
                            "name": "Number Systems",
                            "topics": [
                                {
                                    "id": "MATH_JHS3_NUM_REAL_NUMBERS",
                                    "name": "Real Numbers",
                                    "learning_outcomes": [
                                        "Identify and classify real numbers (rational and irrational).",
                                        "Compare and order real numbers."
                                    ],
                                    "foundations": [
                                        "MATH_JHS2_INTEGERS"
                                    ],
                                    "next": [
                                        "MATH_JHS3_NUM_SIGNIFICANT_FIGURES"
                                    ]
                                },
                                {
                                    "id": "MATH_JHS3_NUM_SIGNIFICANT_FIGURES",
                                    "name": "Significant Figures & Standard Form",
                                    "learning_outcomes": [
                                        "Express numbers to a given number of significant figures.",
                                        "Convert numbers to and from standard form."
                                    ],
                                    "foundations": [
                                        "MATH_JHS3_NUM_REAL_NUMBERS"
                                    ],
                                    "next": [
                                        "MATH_JHS3_ALG_LINEAR_EQUATIONS"
                                    ]
                                }
                            ]
                        },
                        {
                            "name": "Fractions",
                            "topics": [
                                {
                                    "id": "MATH_JHS3_FRACTIONS_OPS",
                                    "name": "Operations on Fractions",
                                    "learning_outcomes": [
                                        "Add, subtract, multiply and divide algebraic fractions."
                                    ],
                                    "foundations": [
                                        "MATH_JHS2_FRACTIONS"
                                    ],
                                    "next": [
                                        "MATH_JHS3_ALG_LINEAR_EQUATIONS"
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Algebra",
                    "substrands": [
                        {
                            "name": "Algebraic Expressions",
                            "topics": [
                                {
                                    "id": "MATH_JHS3_ALG_LINEAR_EQUATIONS",
                                    "name": "Linear Equations",
                                    "learning_outcomes": [
                                        "Solve linear equations involving brackets and fractions.",
                                        "Model word problems into linear equations."
                                    ],
                                    "foundations": [
                                        "MATH_JHS2_ALG_EXPRESSIONS"
                                    ],
                                    "next": [
                                        "MATH_JHS3_ALG_INEQUALITIES"
                                    ]
                                },
                                {
                                    "id": "MATH_JHS3_ALG_INEQUALITIES",
                                    "name": "Linear Inequalities",
                                    "learning_outcomes": [
                                        "Solve simple linear inequalities.",
                                        "Represent solutions on a number line."
                                    ],
                                    "foundations": [
                                        "MATH_JHS3_ALG_LINEAR_EQUATIONS"
                                    ],
                                    "next": []
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Geometry and Measurement",
                    "substrands": [
                        {
                            "name": "Rigid Motion",
                            "topics": [
                                {
                                    "id": "MATH_JHS3_GEO_BEARINGS",
                                    "name": "Bearings and Vectors",
                                    "learning_outcomes": [
                                        "Calculate bearings and solve vector problems."
                                    ],
                                    "foundations": [
                                        "MATH_JHS2_VECTORS"
                                    ],
                                    "next": []
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

// Helper to look up a topic by ID
export function getTopicById(topicId) {
    if (!topicId) return null;
    let found = null;

    // Very inefficient search but fine for MVP with small graph
    // A production version would index this on load.
    const levels = TOPIC_GRAPH.levels || [];
    for (const level of levels) {
        for (const strand of level.strands || []) {
            for (const sub of strand.substrands || []) {
                for (const topic of sub.topics || []) {
                    if (topic.id === topicId) return topic;
                }
            }
        }
    }
    return null;
}
