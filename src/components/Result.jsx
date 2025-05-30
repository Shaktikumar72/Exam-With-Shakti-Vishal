import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import '../styles/Result.css';

export default function Result() {
  const { examId, userId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // New state for search
  const isAdmin = currentUser.email === 'kumarvishal00021@gmail.com';

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const examDoc = await getDoc(doc(db, 'exams', examId));
        if (examDoc.exists()) {
          setExam({ id: examDoc.id, ...examDoc.data() });
        }

        const targetUserId = isAdmin && userId ? userId : currentUser.uid;
        const resultQuery = query(
          collection(db, 'results'),
          where('userId', '==', targetUserId),
          where('examId', '==', examId)
        );
        const resultSnapshot = await getDocs(resultQuery);
        if (!resultSnapshot.empty) {
          setResult(resultSnapshot.docs[0].data());
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [examId, userId, currentUser, isAdmin]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) return (
    <div className="loader-container">
      <p className="loader-text">Please Wait! Your Reasult is Loading...</p>
      <div className="loader"></div>
    </div>
  );
  if (!result || !exam) return <div className="error-message">No result found.</div>;

  return (
    <div className="result-container container">
      <header className="result-header">
        <button onClick={handleBack} className="back-button">Back</button>
        <h1>Result for {exam.title} ({exam.subject})</h1>
        <Link to="/dashboard" className="dashboard-button">Back to Dashboard</Link>
      </header>
      <section className="result-summary">
        <h2>Summary</h2>
        <div className="summary-card">
          <p>Score: {result.score}/{result.totalQuestions}</p>
          <p>Percentage: {((result.score / result.totalQuestions) * 100).toFixed(2)}%</p>
          <p>Date: {new Date(result.timestamp?.toDate()).toLocaleString()}</p>
        </div>
      </section>
      <section className="result-details">
        <h2>Detailed Answers</h2>
        <div className="search-container">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions..."
            className="search-input"
          />
        </div>
        <div className="answers-list">
          {exam.questions
            .filter(question =>
              question.text.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((q, index) => {
              const chosenAnswer = result.answers[index] || 'Not Answered';
              const isCorrect = chosenAnswer === q.correctAnswer;
              return (
                <div key={index} className="answer-card">
                  <h3>{index + 1}. {q.text}</h3>
                  <div className="options">
                    {q.options.map((option, optIndex) => {
                      const isChosen = option === chosenAnswer;
                      const isCorrectOption = option === q.correctAnswer;
                      return (
                        <div
                          key={optIndex}
                          className={`option ${
                            isChosen
                              ? isCorrect
                                ? 'correct'
                                : 'incorrect'
                              : isCorrectOption
                              ? 'correct'
                              : ''
                          }`}
                        >
                          <span>{option}</span>
                          {isChosen && (
                            <span className="status">
                              {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </section>
      <Link to="/dashboard" className="dashboard-button">Back to Dashboard</Link>
    </div>
  );
}