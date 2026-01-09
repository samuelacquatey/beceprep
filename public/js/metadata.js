/**
 * metadata.js
 * Source of truth for available subjects, years, and topics.
 * In a full production environment, this could be fetched from an API endpoint.
 */

export const QUIZ_METADATA = {
    subjects: [
        {
            id: "Mathematics",
            name: "Mathematics",
            icon: "📐",
            dbKey: 'CAREERTECHNOLOGY',
            years: [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015]
        },
        {
            id: "English Language",
            name: "English Language",
            icon: "📖",
            dbKey: 'ENGLISH',
            years: [2023, 2022, 2021, 2020, 2019, 2018, 2017]
        },
        {
            id: "Integrated Science",
            name: "Integrated Science",
            icon: "🔬",
            dbKey: 'SCIENCE',
            years: [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016]
        },
        {
            id: "Social Studies",
            name: "Social Studies",
            icon: "🌍",
            dbKey: 'SOCIALSTUDIES',
            years: [2023, 2022, 2021, 2020, 2019, 2018]
        },
        {
            id: "ICT",
            name: "ICT",
            icon: "💻",
            dbKey: 'INFORMATIONANDCOMMUNICATIONSTECHNOLOGY',
            years: [2023, 2022, 2021, 2020, 2019] // Recent subject
        },
        {
            id: "RME",
            name: "RME",
            icon: "🙏",
            dbKey: 'RELIGIOUSANDMORALEDUCATION',
            years: [2022, 2021, 2020, 2019, 2018]
        },
        {
            id: "French",
            name: "French",
            icon: "🇫🇷",
            dbKey: 'FRENCH',
            years: [2022, 2021, 2020, 2019]
        },
        {
            id: "BDT",
            name: "BDT",
            icon: "🔨",
            dbKey: 'BASICDESIGNANDTECHNOLOGY',
            years: [2021, 2020, 2019, 2018]
        },
        {
            id: "Home Economics",
            name: "Home Economics",
            icon: "🍳",
            dbKey: 'HOMEECONOMICS',
            years: [2022, 2021, 2020, 2019]
        }
    ],

    // Helper to get years for a list of subject names
    getAvailableYears(selectedSubjectNames) {
        if (!selectedSubjectNames || selectedSubjectNames.length === 0) {
            // If nothing selected, return all unique years across all subjects
            const allYears = new Set();
            this.subjects.forEach(s => s.years.forEach(y => allYears.add(y)));
            return Array.from(allYears).sort((a, b) => b - a);
        }

        // Find intersection or union? 
        // UX Decision: Union (Show years that are available in AT LEAST one selected subject)
        // Reason: If I pick Math (2023) and BDT (2020), I should probably see both options.
        const availableYears = new Set();

        this.subjects.forEach(subject => {
            if (selectedSubjectNames.includes(subject.name)) {
                subject.years.forEach(y => availableYears.add(y));
            }
        });

        return Array.from(availableYears).sort((a, b) => b - a);
    }
};
