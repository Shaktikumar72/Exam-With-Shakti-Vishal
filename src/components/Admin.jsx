import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import '../styles/Admin.css';

export default function Admin() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [exam, setExam] = useState({
    title: '',
    subject: '',
    description: '',
    questions: [{ text: '', options: ['', '', '', ''], correctAnswer: '' }],
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // New state for search

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const examsSnapshot = await getDocs(collection(db, 'exams'));
        setExams(examsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setError('Failed to load exams: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  if (currentUser?.email !== 'kumarvishal00021@gmail.com') {
    return <div className="no-access">Access denied. Admin only.</div>;
  }

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...exam.questions];
    if (field === 'text' || field === 'correctAnswer') {
      newQuestions[index][field] = value;
    } else if (field.startsWith('option')) {
      const optIndex = parseInt(field.split('-')[1]);
      newQuestions[index].options[optIndex] = value;
    }
    setExam({ ...exam, questions: newQuestions });
  };

  const addQuestion = () => {
    setExam({
      ...exam,
      questions: [...exam.questions, { text: '', options: ['', '', '', ''], correctAnswer: '' }],
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = exam.questions.filter((_, i) => i !== index);
    setExam({ ...exam, questions: newQuestions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!exam.title || !exam.subject || !exam.description || exam.questions.some(q => !q.text || !q.correctAnswer)) {
        setError('All fields are required');
        return;
      }
      if (editId) {
        await updateDoc(doc(db, 'exams', editId), exam);
        alert('Exam updated successfully!');
        setEditId(null);
      } else {
        const docRef = await addDoc(collection(db, 'exams'), exam);
        alert('Exam added successfully! ID: ' + docRef.id);
      }
      setExam({ title: '', subject: '', description: '', questions: [{ text: '', options: ['', '', '', ''], correctAnswer: '' }] });
      const examsSnapshot = await getDocs(collection(db, 'exams'));
      setExams(examsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      setError('Failed to save exam: ' + err.message);
    }
  };

  const handleEdit = (examToEdit) => {
    setExam(examToEdit);
    setEditId(examToEdit.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await deleteDoc(doc(db, 'exams', id));
        setExams(exams.filter(exam => exam.id !== id));
        alert('Exam deleted successfully!');
      } catch (err) {
        setError('Failed to delete exam: ' + err.message);
      }
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) return (
    <div className="loader-container">
      <p className="loader-text">Please Wait! Admin Dashboard is Loading...</p>
      <div className="loader"></div>
    </div>
  );
  return (
    <div className="admin-container container">
      <header className="admin-header">
        <button onClick={handleBack} className="back-button">Back</button>
        <h1>{editId ? 'Edit Exam' : 'Add New Exam'}</h1>
        <div className="search-container">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Existing  exams by title or subject..."
            className="search-input"
          />
        </div>
      </header>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-group">
          <label>Exam Title</label>
          <input
            type="text"
            value={exam.title}
            onChange={(e) => setExam({ ...exam, title: e.target.value })}
            placeholder="Enter exam title"
          />
        </div>
        <div className="form-group">
          <label>Subject</label>
          <input
            type="text"
            value={exam.subject}
            onChange={(e) => setExam({ ...exam, subject: e.target.value })}
            placeholder="Enter subject"
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            value={exam.description}
            onChange={(e) => setExam({ ...exam, description: e.target.value })}
            placeholder="Enter description"
          />
        </div>
        <h2>Questions</h2>
        {exam.questions.map((question, qIndex) => (
          <div key={qIndex} className="question-card">
            <div className="form-group">
              <label>Question {qIndex + 1}</label>
              <textarea
                type="text"
                value={question.text}
                onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                placeholder="Enter question"
              />
            </div>
            <div className="options-group">
              <label>Options</label>
              {question.options.map((option, optIndex) => (
                <input
                  key={optIndex}
                  type="text"
                  value={option}
                  onChange={(e) => handleQuestionChange(qIndex, `option-${optIndex}`, e.target.value)}
                  placeholder={`Option ${optIndex + 1}`}
                />
              ))}
            </div>
            <div className="form-group">
              <label>Correct Answer</label>
              <input
                type="text"
                value={question.correctAnswer}
                onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                placeholder="Enter correct answer"
              />
            </div>
            <button type="button" onClick={() => removeQuestion(qIndex)} className="remove-button">
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addQuestion} className="add-question-button">
          Add Question
        </button>
        <button type="submit" className="save-button">{editId ? 'Update Exam' : 'Save Exam'}</button>
      </form>

      <section className="exam-list">
        <h2>Existing Exams</h2>

        {exams.length > 0 ? (
          <div className="exam-grid">
            {exams
              .filter(exam =>
                exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exam.subject.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(exam => (
                <div key={exam.id} className="exam-item">
                  <h3>{exam.title} ({exam.subject})</h3>
                  <p>{exam.description}</p>
                  <div className="exam-actions">
                    <button onClick={() => handleEdit(exam)} className="edit-button">Edit</button>
                    <button onClick={() => handleDelete(exam.id)} className="delete-button">Delete</button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="no-data">No exams available yet.</p>
        )}
      </section>
    </div>
  );
}