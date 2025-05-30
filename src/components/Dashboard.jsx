import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const isAdmin = currentUser?.email === 'kumarvishal00021@gmail.com';

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setError('Please sign in to view the dashboard.');
        setLoading(false);
        return;
      }

      try {
        const examsSnapshot = await getDocs(collection(db, 'exams'));
        setExams(examsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        if (isAdmin) {
          const allResultsSnapshot = await getDocs(collection(db, 'results'));
          const allResultsData = allResultsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          const userIds = [...new Set(allResultsData.map(result => result.userId))];
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

          const enrichedResults = allResultsData.map(result => ({
            ...result,
            userName: users[result.userId] || 'Anonymous',
            percentage: (result.score / result.totalQuestions) * 100,
          }));
          const sortedResults = enrichedResults
            .sort((a, b) => b.percentage - a.percentage || b.score - a.score)
            .slice(0, 3);
          setTopStudents(sortedResults);
        } else {
          const resultsQuery = query(
            collection(db, 'results'),
            where('userId', '==', currentUser.uid)
          );
          const resultsSnapshot = await getDocs(resultsQuery);
          setResults(
            resultsSnapshot.docs.map(doc => ({
              ...doc.data(),
              percentage: (doc.data().score / doc.data().totalQuestions) * 100,
            }))
          );
        }
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        setError('Failed to load dashboard: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser, isAdmin]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to log out: ' + error.message);
    }
  };

  const handleStartExam = (examId) => {
    setSelectedExamId(examId);
    setShowConfirm(true);
  };

  const confirmStartExam = () => {
    setShowConfirm(false);
    navigate(`/exam/${selectedExamId}`);
  };

  const cancelStartExam = () => {
    setShowConfirm(false);
    setSelectedExamId(null);
  };

  const handleDeleteExam = async (examId) => {
    if (
      window.confirm(
        'Are you sure you want to delete this exam? This action cannot be undone.'
      )
    ) {
      try {
        await deleteDoc(doc(db, 'exams', examId));
        setExams(exams.filter(exam => exam.id !== examId));
        alert('Exam deleted successfully.');
      } catch (error) {
        console.error('Error deleting exam:', error);
        alert('Failed to delete exam: ' + error.message);
      }
    }
  };

  const handleDeleteResult = async (resultId) => {
    if (window.confirm('Are you sure you want to delete this result?')) {
      try {
        await deleteDoc(doc(db, 'results', resultId));
        setTopStudents(topStudents.filter(student => student.id !== resultId));
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
        const updatedStudents = topStudents.map(student =>
          student.id === resultId ? { ...student, reExamAllowed: true } : student
        );
        setTopStudents(updatedStudents);
        alert('Re-exam allowed successfully.');
      } catch (error) {
        console.error('Error allowing re-exam:', error);
        alert('Failed to allow re-exam: ' + error.message);
      }
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  if (loading)
    return (
      <div className="loader-container">
        <div className="loader"></div>
        <p className="loader-text">Please Wait Your Dashboard is Loading...</p>
      </div>
    );
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dashboard">
      <nav className="nav-bar">
        <button className="menu-button" onClick={toggleSidebar}>
          {isOpen ? 'X' : '☰'}
        </button>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
          <Link to="/login" className="nav-link" onClick={handleLogout}>Logout</Link>
        </div>
      </nav>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <h2 className="logo">📘 Dashboard</h2>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-link" onClick={toggleSidebar}>Dashboard</Link>
          <Link to="/about" className="nav-link" onClick={toggleSidebar}>About</Link>
          <Link to="/contact" className="nav-link" onClick={toggleSidebar}>Contact</Link>
          <Link to="/login" className="nav-link" onClick={() => { handleLogout(); toggleSidebar(); }}>Logout</Link>
        </nav>
      </div>

      <div className="container">
        <header className="dashboard-header">
          <h1>Welcome, {currentUser?.displayName || currentUser?.email}</h1>
        </header>

        {isAdmin && (
          <Link to="/admin" className="admin-link">
            Manage Exams (Admin)
          </Link>
        )}

        <section className="exams-section">
          <h2>Available Exams</h2>
          <div className="search-container">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search exams by title or subject..."
              className="search-input"
            />
          </div>
          <div className="exams-grid">
            {exams.length > 0 ? (
              exams
                .filter(exam =>
                  exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  exam.subject.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(exam => (
                  <div key={exam.id} className="exam-card">
                    <h3>
                      {exam.title} ({exam.subject})
                    </h3>
                    <p>{exam.description}</p>
                    {isAdmin ? (
                      <>
                        <Link
                          to={`/admin/exam/${exam.id}/results`}
                          className="view-results-button"
                        >
                          View Student Results
                        </Link>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="delete-exam-button"
                        >
                          Delete Exam
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleStartExam(exam.id)}
                        className="start-exam-button"
                      >
                        Start Exam
                      </button>
                    )}
                  </div>
                ))
            ) : (
              <p className="no-data">No exams available yet.</p>
            )}
          </div>
        </section>

        {isAdmin ? (
          <section className="top-students-section">
            <h2>Top 3 Students</h2>
            <div className="top-students-list">
              {topStudents.length > 0 ? (
                topStudents.map((student, index) => (
                  <div key={index} className="top-student-item">
                    <h3>
                      {index + 1}. {student.userName}
                    </h3>
                    <p>Exam: {student.examTitle}</p>
                    <p>
                      Score: {student.score}/{student.totalQuestions} (
                      {student.percentage.toFixed(2)}%)
                    </p>
                    <div className="result-actions">
                      <button
                        onClick={() => handleDeleteResult(student.id)}
                        className="delete-result-button"
                      >
                        Delete Result
                      </button>
                      <button
                        onClick={() =>
                          handleViewReport(student.examId, student.userId)
                        }
                        className="view-report-button"
                      >
                        View Report
                      </button>
                      <button
                        onClick={() => handleAllowReExam(student.id)}
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
        ) : (
          <section className="results-section">
            <h2>Your Results</h2>
            <div className="results-list">
              {results.length > 0 ? (
                results.map((result, index) => (
                  <div key={index} className="result-item">
                    <h3>{result.examTitle}</h3>
                    <p>
                      Score: {result.score}/{result.totalQuestions} (
                      {result.percentage.toFixed(2)}%)
                    </p>
                    <small>
                      {new Date(result.timestamp?.toDate()).toLocaleString()}
                    </small>
                    <Link
                      to={`/result/${result.examId}/${currentUser.uid}`}
                      className="view-detailed-button"
                    >
                      View Detailed Results
                    </Link>
                  </div>
                ))
              ) : (
                <p className="no-data">No results yet.</p>
              )}
            </div>
          </section>
        )}

        {showConfirm && (
          <div className="confirm-popup">
            <div className="confirm-popup-content">
              <h2>Confirm Exam</h2>
              <p>Are you sure you want to start this exam?</p>
              <div className="confirm-buttons">
                <button onClick={confirmStartExam} className="confirm-button">
                  Yes, Start
                </button>
                <button onClick={cancelStartExam} className="cancel-button">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}