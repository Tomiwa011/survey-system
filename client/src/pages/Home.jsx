import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';

const STEPS = [
  { number: '01', title: 'Create', text: 'Put together a thoughtful survey with text, choice, and rating questions.' },
  { number: '02', title: 'Share', text: 'Send one simple link. People can respond from any device, no account needed.' },
  { number: '03', title: 'Understand', text: 'See responses take shape with clear charts, averages, and written feedback.' },
];

const FEATURES = [
  { icon: '✳', title: 'Flexible questions', text: 'Mix short answers, single or multiple choice, and 1-to-5 ratings.' },
  { icon: '↗', title: 'Easy to share', text: 'Every survey has a shareable link that is ready to send in seconds.' },
  { icon: '▥', title: 'Useful insights', text: 'Explore response counts, charts, rating averages, and written answers.' },
  { icon: '◎', title: 'Honest feedback', text: 'Anonymous responses help people share what they really think.' },
  { icon: '⌁', title: 'Made for mobile', text: 'A comfortable experience for both survey creators and respondents.' },
  { icon: '◇', title: 'Security in mind', text: 'Protected accounts and role-based access help keep your data safe.' },
];

export default function Home() {
  const { user, loading } = useAuth();
  const pageRef = useRef(null);

  useEffect(() => {
    const sections = pageRef.current?.querySelectorAll('.home-reveal');
    if (!sections?.length) return undefined;

    if (!('IntersectionObserver' in window)) {
      sections.forEach((section) => section.setAttribute('data-visible', 'true'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-visible', 'true');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const createSurveyPath = user ? '/dashboard#new-survey' : '/register';

  return (
    <div className="home-page" ref={pageRef}>
      <Navbar />

      <main>
        <section className="home-hero">
          <div className="home-hero__glow home-hero__glow--one" aria-hidden="true" />
          <div className="home-hero__glow home-hero__glow--two" aria-hidden="true" />
          <div className="home-container home-hero__layout">
            <div className="home-hero__copy">
              <p className="home-eyebrow home-hero__eyebrow">
                <span className="home-eyebrow__dot" />
                Better questions. Brighter insights.
              </p>
              <h1>
                Make room for
                <span> good answers.</span>
              </h1>
              <p className="home-hero__description">
                Welcome to SurveyApp — the simple, secure way to ask what matters, hear every voice, and turn responses into clear next steps.
              </p>
              <div className="home-hero__actions">
                {!loading && (
                  <Link className="home-button home-button--primary" to={createSurveyPath}>
                    Create your first survey
                    <span aria-hidden="true">→</span>
                  </Link>
                )}
                {!loading && !user && (
                  <Link className="home-button home-button--quiet" to="/login">
                    I already have an account
                  </Link>
                )}
              </div>
              <p className="home-hero__note">Start in minutes <span>·</span> Nothing to install</p>
            </div>

            <div className="home-art" role="img" aria-label="Illustration of a survey and its response chart">
              <div className="home-art__orbit home-art__orbit--outer" />
              <div className="home-art__orbit home-art__orbit--inner" />
              <div className="home-art__spark home-art__spark--one">✦</div>
              <div className="home-art__spark home-art__spark--two">✳</div>
              <div className="home-survey-card">
                <div className="home-survey-card__top">
                  <span className="home-survey-card__mark">S</span>
                  <span className="home-survey-card__status"><i /> LIVE SURVEY</span>
                  <span className="home-survey-card__more">•••</span>
                </div>
                <p className="home-survey-card__overline">QUICK CHECK-IN</p>
                <h2>What helps you do your best work?</h2>
                <div className="home-survey-card__option home-survey-card__option--selected">
                  <span className="home-survey-card__radio" />
                  A little quiet time
                  <span className="home-survey-card__check">✓</span>
                </div>
                <div className="home-survey-card__option">
                  <span className="home-survey-card__radio" />
                  A great team around me
                </div>
                <div className="home-survey-card__option">
                  <span className="home-survey-card__radio" />
                  Room to try new things
                </div>
                <div className="home-survey-card__submit">Send my answer <span>→</span></div>
              </div>
              <div className="home-insight-card">
                <div className="home-insight-card__heading">
                  <span>Responses</span>
                  <span className="home-insight-card__growth">↗ 18%</span>
                </div>
                <strong>128</strong>
                <div className="home-chart" aria-hidden="true">
                  <i /><i /><i /><i /><i /><i /><i />
                </div>
                <div className="home-insight-card__days"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
              </div>
              <div className="home-response-pill"><span>✦</span> Your feedback matters</div>
            </div>
          </div>
          <div className="home-hero__bottom">
            <div className="home-container home-hero__bottom-inner">
              <span>Thoughtful surveys, made simple</span>
              <span className="home-hero__bottom-line" />
              <span>Ask <b>·</b> Share <b>·</b> Learn</span>
            </div>
          </div>
        </section>

        <section className="home-how home-section">
          <div className="home-container">
            <div className="home-section-heading home-reveal">
              <p className="home-eyebrow">A clearer way to collect feedback</p>
              <h2>From first question to fresh perspective.</h2>
              <p>Everything you need to get answers, without getting in the way.</p>
            </div>
            <ol className="home-steps">
              {STEPS.map((step, index) => (
                <li className="home-step home-reveal" key={step.title} style={{ '--reveal-delay': `${index * 100}ms` }}>
                  <span className="home-step__number">{step.number}</span>
                  <div className="home-step__rule" />
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="home-features home-section">
          <div className="home-container">
            <div className="home-section-heading home-reveal">
              <p className="home-eyebrow">The details that make a difference</p>
              <h2>Simple to use. Thoughtful by design.</h2>
              <p>From your first draft to your final insight, the essentials are all here.</p>
            </div>
            <div className="home-feature-grid">
              {FEATURES.map((feature, index) => (
                <article className="home-feature home-reveal" key={feature.title} style={{ '--reveal-delay': `${(index % 3) * 80}ms` }}>
                  <span className="home-feature__icon" aria-hidden="true">{feature.icon}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-security">
          <div className="home-container home-security__inner home-reveal">
            <div className="home-security__icon" aria-hidden="true">◇</div>
            <div>
              <p className="home-eyebrow">Your trust comes first</p>
              <h2>Feedback should feel safe to share.</h2>
              <p>Passwords are hashed, access is checked on the server, and security practices are explained openly.</p>
            </div>
            <Link className="home-button home-button--outline" to="/security">
              Explore our security
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-container home-footer__inner">
          <p>SurveyApp <span>·</span> A web application security project</p>
          <div>
            <Link to="/security">Security</Link>
            <a href="https://github.com/Tomiwa011/survey-system" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}