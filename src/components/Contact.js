import { useNavigate } from 'react-router-dom';
import '../styles/Contact.css';

export default function Contact() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="contact container">
      <header className="contact-header">
        <button onClick={handleBack} className="back-button">Back</button>
        <h1>Contact Us</h1>
      </header>
      <section className="contact-section">
        <p>
          Have questions or need support? Feel free to reach out to us:
          <br />
          Email: <a href="mailto:kumarvishal00021@gmail.com">kumarvishal00021@gmail.com</a>
          <br />
          Phone: +91-7250983519
          <br />
          Address: 115 Udham Singh Boys Hostel, Subharti Uni Meerut, EC 25005
        </p>
      </section>
    </div>
  );
}