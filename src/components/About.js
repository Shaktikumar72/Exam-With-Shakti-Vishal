import { useNavigate } from 'react-router-dom';
import '../styles/About.css';

export default function About() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="about container">
      <header className="about-header">
        <button onClick={handleBack} className="back-button">Back</button>
        <h1>About Us</h1>
      </header>
      <section className="about-section">
        <p>
          Welcome to our online exam platform! We are dedicated to providing a seamless and secure experience for students and educators. Our mission is to simplify the process of creating, managing, and taking exams with cutting-edge technology. Founded in 2025, we aim to empower learning through innovation and accessibility.
        </p>
      </section>
    </div>
  );
}