
import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import EligibilityQuiz from '../components/EligibilityQuiz';
import HowItWorks from '../components/HowItWorks';
import Safety from '../components/Safety';
import WhyGLP1 from '../components/WhyGLP1';
import Faq from '../components/Faq';
import Stats from '../components/Stats';
import Team from '../components/Team';
import CallToAction from '../components/CallToAction';
import Footer from '../components/Footer';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  return (
    <>
      <Header onLogin={onLogin} />
      <main>
        <Hero />
        <EligibilityQuiz />
        <HowItWorks />
        <WhyGLP1 />
        <Safety />
        <Faq />
        <Stats />
        <Team />
        <CallToAction onStart={onLogin} />
      </main>
      <Footer />
    </>
  );
};

export default LandingPage;
