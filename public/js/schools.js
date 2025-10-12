import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  arrayUnion 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from './auth.js';

const db = getFirestore(app);

// School management system
export class SchoolManager {
  constructor() {
    this.schools = new Map();
    this.schoolCodes = new Map();
  }

  // Generate unique school code
  generateSchoolCode(schoolName) {
    const prefix = schoolName.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${prefix}${randomNum}`;
  }

  // Register new school
  async registerSchool(schoolData, teacherData) {
    try {
      const schoolCode = this.generateSchoolCode(schoolData.name);
      
      const school = {
        id: `school_${Date.now()}`,
        code: schoolCode,
        name: schoolData.name,
        location: schoolData.location,
        registeredAt: new Date(),
        teachers: [teacherData],
        students: [],
        classes: ['JHS 1', 'JHS 2', 'JHS 3'],
        status: 'active'
      };

      // Save to Firebase
      await setDoc(doc(db, 'schools', school.id), school);
      
      // Also store by code for easy lookup
      await setDoc(doc(db, 'schoolCodes', schoolCode), {
        schoolId: school.id,
        schoolName: school.name
      });

      return school;
    } catch (error) {
      console.error('Error registering school:', error);
      throw new Error('Failed to register school. Please try again.');
    }
  }

  // Student joins school with code
  async joinSchool(studentId, schoolCode, studentData) {
    try {
      const schoolCodeDoc = await getDoc(doc(db, 'schoolCodes', schoolCode));
      if (!schoolCodeDoc.exists()) {
        throw new Error('Invalid school code. Please check and try again.');
      }

      const schoolId = schoolCodeDoc.data().schoolId;
      const schoolDoc = await getDoc(doc(db, 'schools', schoolId));
      
      if (!schoolDoc.exists()) {
        throw new Error('School not found. Please contact your teacher.');
      }

      const school = schoolDoc.data();

      const studentRecord = {
        studentId,
        fullName: studentData.fullName,
        class: studentData.class || 'JHS 3',
        joinedAt: new Date(),
        status: 'active'
      };

      // Add student to school
      await updateDoc(doc(db, 'schools', schoolId), {
        students: arrayUnion(studentRecord)
      });

      // Also store student-school relationship
      await setDoc(doc(db, 'studentSchools', studentId), {
        schoolId: schoolId,
        schoolCode: schoolCode,
        schoolName: school.name,
        joinedAt: new Date()
      });

      return school;
    } catch (error) {
      console.error('Error joining school:', error);
      throw new Error(error.message || 'Failed to join school. Please try again.');
    }
  }

  // Get school by code
  async getSchoolByCode(schoolCode) {
    try {
      const schoolCodeDoc = await getDoc(doc(db, 'schoolCodes', schoolCode));
      if (!schoolCodeDoc.exists()) {
        return null;
      }

      const schoolId = schoolCodeDoc.data().schoolId;
      const schoolDoc = await getDoc(doc(db, 'schools', schoolId));
      
      return schoolDoc.exists() ? schoolDoc.data() : null;
    } catch (error) {
      console.error('Error getting school by code:', error);
      return null;
    }
  }

  // Get teacher's school
  async getTeacherSchool(teacherId) {
    try {
      const schoolsQuery = query(
        collection(db, 'schools'),
        where('teachers', 'array-contains', { userId: teacherId })
      );
      
      const snapshot = await getDocs(schoolsQuery);
      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data();
    } catch (error) {
      console.error('Error getting teacher school:', error);
      return null;
    }
  }

  // Get student's school
  async getStudentSchool(studentId) {
    try {
      const studentSchoolDoc = await getDoc(doc(db, 'studentSchools', studentId));
      if (!studentSchoolDoc.exists()) {
        return null;
      }

      const schoolData = studentSchoolDoc.data();
      const schoolDoc = await getDoc(doc(db, 'schools', schoolData.schoolId));
      
      return schoolDoc.exists() ? schoolDoc.data() : null;
    } catch (error) {
      console.error('Error getting student school:', error);
      return null;
    }
  }

  // Bulk import students
  async bulkImportStudents(schoolCode, studentsData) {
    try {
      const school = await this.getSchoolByCode(schoolCode);
      if (!school) {
        throw new Error('School not found');
      }

      const results = [];
      const newStudents = [];

      for (const student of studentsData) {
        try {
          const studentRecord = {
            studentId: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fullName: student.fullName,
            class: student.class,
            username: this.generateUsername(student.fullName),
            temporaryPassword: this.generateTemporaryPassword(),
            joinedAt: new Date(),
            status: 'pending' // Students need to complete registration
          };

          newStudents.push(studentRecord);
          results.push({ success: true, student: studentRecord });
        } catch (error) {
          results.push({ success: false, error: error.message, student });
        }
      }

      // Add all new students to school
      await updateDoc(doc(db, 'schools', school.id), {
        students: arrayUnion(...newStudents)
      });

      return results;
    } catch (error) {
      console.error('Error bulk importing students:', error);
      throw new Error('Failed to import students. Please try again.');
    }
  }

  // Generate student username
  generateUsername(fullName) {
    const nameParts = fullName.toLowerCase().split(' ');
    const firstName = nameParts[0];
    const lastNameInitial = nameParts[nameParts.length - 1].charAt(0);
    const randomNum = Math.floor(10 + Math.random() * 90);
    
    return `${firstName}.${lastNameInitial}${randomNum}`;
  }

  // Generate temporary password
  generateTemporaryPassword() {
    return Math.random().toString(36).slice(-8);
  }

  // Get school leaderboard
  async getSchoolLeaderboard(schoolId) {
    try {
      // This would integrate with the analytics system
      // For now, return mock data
      return [
        { rank: 1, name: 'Kwame Mensah', score: 95, class: 'JHS 3A' },
        { rank: 2, name: 'Ama Serwaa', score: 92, class: 'JHS 3B' },
        { rank: 3, name: 'Kofi Annan', score: 88, class: 'JHS 3A' }
      ];
    } catch (error) {
      console.error('Error getting school leaderboard:', error);
      return [];
    }
  }
}

// School code validation
export const validateSchoolCode = (code) => {
  // Format: ABC123 (3 letters + 3 numbers)
  const schoolCodeRegex = /^[A-Z]{3}\d{3}$/;
  return schoolCodeRegex.test(code);
};