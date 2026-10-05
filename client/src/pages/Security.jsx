import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const MEASURES = [
  {
    title: 'Password hashing',
    text: 'Passwords are hashed with bcrypt (cost 12, with a random salt) before they are stored. The plain password is never saved, logged or sent back to the browser.',
    where: 'server/routes/auth.js',
  },
  {
    title: 'Authentication and sessions',
    text: 'After login the server issues a signed token in an httpOnly, SameSite=Lax cookie that expires after one hour, and is marked Secure in production. JavaScript cannot read it. On every request the server checks the user in the database again, so a deactivated account loses access immediately.',
    where: 'server/routes/auth.js, server/middleware/auth.js',
  },
  {
    title: 'Safe login errors',
    text: 'Wrong email, wrong password and deactivated accounts all show the same message, and a dummy hash is compared when the email does not exist, so neither the message nor the response time reveals which emails are registered.',
    where: 'server/routes/auth.js',
  },
  {
    title: 'Role-based access control',
    text: 'There are two roles, user and admin. Admin routes are protected by server-side middleware, so hiding a button in the page is only cosmetic. Nobody can register as an admin, and role is never accepted from a request.',
    where: 'server/middleware/auth.js, server/routes/admin.js',
  },
  {
    title: 'Ownership checks',
    text: 'Every survey, question and result query includes the owner, so people can only reach their own surveys. Someone else\'s survey returns "not found", which does not confirm that it exists. Even admins cannot read survey questions, answers or results; they can only see titles, owners, status and counts, and close or delete surveys.',
    where: 'server/routes/surveys.js, server/routes/questions.js',
  },
  {
    title: 'Input validation',
    text: 'Forms are checked in the browser for quick feedback, and again on the server, which is the check that counts. The server checks types, lengths, allowed values and that every answer belongs to a real question and option. The database adds its own rules (unique emails, allowed roles and statuses, foreign keys).',
    where: 'all server routes, database/schema.sql',
  },
  {
    title: 'SQL injection protection',
    text: 'Every database query uses parameters, so user input is never joined into SQL text. Search wildcards are escaped.',
    where: 'all server routes',
  },
  {
    title: 'Cross-site scripting (XSS) protection',
    text: 'React escapes everything it displays, and the app never injects raw HTML, so a title or answer containing a script tag shows up as plain text. The server also sends Content-Security and related headers through Helmet.',
    where: 'React pages, server/index.js',
  },
  {
    title: 'Rate limiting',
    text: 'Login, registration, password changes and public survey submissions are limited per address, which slows down password guessing and spam.',
    where: 'server/routes/auth.js, server/routes/public.js',
  },
  {
    title: 'Protecting secrets',
    text: 'Passwords, the token secret and database details live in environment variables, not in the code, and the .env file is excluded from Git. The server refuses to start if the token secret is missing or too short.',
    where: 'server/.env, server/index.js, .gitignore',
  },
  {
    title: 'Safe errors',
    text: 'Users see short, generic error messages. Technical details stay in the server log, and unknown pages return a plain JSON error rather than a debugging page.',
    where: 'server/index.js',
  },
  {
    title: 'Cross-origin and security headers',
    text: 'Only the app\'s own address is allowed to call the API from a browser (CORS), request bodies are capped at 100 KB, and Helmet adds headers such as X-Content-Type-Options and Strict-Transport-Security while hiding the server software.',
    where: 'server/index.js',
  },
  {
    title: 'Respondent privacy',
    text: 'Responses are anonymous: nothing links an answer to a person. The public survey endpoint returns only what is needed to answer, and drafts and closed surveys cannot be answered.',
    where: 'server/routes/public.js',
  },
];

const LIMITS = [
  'Other devices stay signed in until their one-hour cookie expires, even after a password change.',
  'Rate limits work per network address, so an attacker with many addresses is only slowed down, and people on a shared network share a limit.',
  'There is no email verification, password reset, CAPTCHA or two-factor authentication.',
  'There is no audit log of security events yet.',
];

export default function Security() {
  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Security</h1>
        <p className="mt-2 text-gray-600">
          How this application protects its users and their data, and where each measure is implemented.
        </p>

        <div className="mt-6 space-y-3">
          {MEASURES.map((m) => (
            <section key={m.title} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="font-semibold text-gray-900">{m.title}</h2>
              <p className="mt-1 text-gray-700">{m.text}</p>
              <p className="mt-2 text-xs text-gray-500">Implemented in: {m.where}</p>
            </section>
          ))}
        </div>

        <h2 className="mt-10 text-lg font-semibold text-gray-900">Known limitations</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
          {LIMITS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>

        <p className="mt-8 text-sm">
          <Link to="/dashboard" className="text-blue-700 hover:underline">
            ← Back to the app
          </Link>
        </p>
      </div>
    </>
  );
}