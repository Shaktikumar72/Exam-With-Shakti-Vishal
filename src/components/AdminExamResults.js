import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, query, where, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import '../styles/Dashboard.css';

export default function AdminExamResults() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // New state for search

  useEffect(() => {
    const fetchResults = async () => {
      const examDoc = await getDoc(doc(db, 'exams', examId));
      if (examDoc.exists()) {
        setExam(examDoc.data());
      }
      try {
        const resultsQuery = query(collection(db, 'results'), where('examId', '==', examId));
        const resultsSnapshot = await getDocs(resultsQuery);
        const resultsData = resultsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const userIds = [...new Set(resultsData.map(result => result.userId))];
        const users = {};
        for (const id of userIds) {
          const userDoc = await getDoc(doc(db, 'users', id));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            users[id] = userData.name || 'Anonymous';
            if (!userData.name) {
              console.warn(`User ${id} has no name field in users collection`);
            }
          } else {
            console.warn(`User document ${id} not found in users collection`);
            users[id] = 'Anonymous';
          }
        }

        const enrichedResults = resultsData.map(result => ({
          ...result,
          userName: users[result.userId] || 'Anonymous',
          percentage: (result.score / result.totalQuestions) * 100,
        }));
        setResults(enrichedResults);
      } catch (error) {
        console.error('Error fetching results:', error);
        setError('Failed to load results: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [examId]);

  const handleDeleteResult = async (resultId) => {
    if (window.confirm('Are you sure you want to delete this result?')) {
      try {
        await deleteDoc(doc(db, 'results', resultId));
        setResults(results.filter(result => result.id !== resultId));
        alert('Result deleted successfully.');
      } catch (error) {
        console.error('Error deleting result:', error);
        alert('Failed to delete result: ' + error.message);
      }
    }
  };

  const handleViewReport = (examId, userId) => {
    navigate(`/result/${examId}/${userId}`);
  };

  const handleAllowReExam = async (resultId) => {
    if (window.confirm('Allow this student to retake the exam?')) {
      try {
        await updateDoc(doc(db, 'results', resultId), { reExamAllowed: true });
        const updatedResults = results.map(result =>
          result.id === resultId ? { ...result, reExamAllowed: true } : result
        );
        setResults(updatedResults);
        alert('Re-exam allowed successfully.');
      } catch (error) {
        console.error('Error allowing re-exam:', error);
        alert('Failed to allow re-exam: ' + error.message);
      }
    }
  };

  if (loading) return (
    <div className="loader-container">
      <p className="loader-text">Please Wait! Results is Loading...</p>
      <div className="loader"></div>
    </div>
  );
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dashboard container">
      <header className="dashboard-header">
        <button onClick={() => navigate('/dashboard')} className="back-button">Back</button>
        <h1>Student Results for Exam {exam?.title || 'Loading...'}</h1>
      </header>
      <section className="top-students-section">
        <h2>Student Results</h2>
        <div className="search-container">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name..."
            className="search-input"
          />
        </div>
        <div className="top-students-list">
          {results.length > 0 ? (
            results
              .filter(result =>
                result.userName.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((result, index) => (
                <div key={index} className="top-student-item">
                  <h3>{index + 1}. {result.userName}</h3>
                  <p>Exam: {result.examTitle}</p>
                  <p>Score: {result.score}/{result.totalQuestions} ({result.percentage.toFixed(2)}%)</p>
                  <div className="result-actions">
                    <button
                      onClick={() => handleDeleteResult(result.id)}
                      className="delete-result-button"
                    >
                      Delete Result
                    </button>
                    <button
                      onClick={() => handleViewReport(result.examId, result.userId)}
                      className="view-report-button"
                    >
                      View Report
                    </button>
                    <button
                      onClick={() => handleAllowReExam(result.id)}
                      className="reexam-button"
                    >
                      Allow Re-Exam
                    </button>
                  </div>
                </div>
              ))
          ) : (
            <p className="no-data">No results yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}