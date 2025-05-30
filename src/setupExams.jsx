import { db } from './firebase/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

// Exam data
const examData = {
  title: "Exam 1",
  description: "Test exam",
  questions: [
    {
      text: "What is 2 + 2?",
      options: ["2", "4", "6", "8"],
      correctAnswer: "4"
    }
  ]
};

// Function to add exam
async function addExam() {
  try {
    await setDoc(doc(db, 'exams', 'exam1'), examData);
    console.log('Exam added successfully!');
  } catch (error) {
    console.error('Error adding exam:', error);
  }
}

addExam();