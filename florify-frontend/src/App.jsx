import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import EmailConfirmationPage from './pages/EmailConfirmationPage';
import LandingPage from './pages/LandingPage'; // ✅ new import

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [userEmail, setUserEmail] = useState('');

  const navigate = (page, email = '') => {
    setCurrentPage(page);
    if (email) setUserEmail(email);
  };

  const handleLogout = () => {
    setCurrentPage('login');
    setUserEmail('');
  };

  return (
    <>
      {currentPage === 'login' && <LoginPage onNavigate={navigate} />}
      {currentPage === 'signup' && <SignupPage onNavigate={navigate} />}
      {currentPage === 'confirm' && (
        <EmailConfirmationPage onNavigate={navigate} email={userEmail} />
      )}
      {currentPage === 'landing' && (
        <LandingPage onLogout={handleLogout} userEmail={userEmail} />
      )}
    </>
  );
}

export default App;
