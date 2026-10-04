import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';

export default function PublicSurvey() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api(`/api/public/surveys/${id}`)
      .then((data) => {
        setSurvey(data.survey);
        setQuestions(data.questions);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function setValue(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function chooseOption(questionId, optionId, multiple) {
    setAnswers((prev) => {
      if (!multiple) return { ...prev, [questionId]: [optionId] };
      const current = prev[questionId] || [];
      const next = current.includes(optionId)
        ? current.filter((x) => x !== optionId)
        : [...current, optionId];
      return { ...prev, [questionId]: next };
    });
  }

  function isChoice(q) {
    return q.type === 'single_choice' || q.type === 'multiple_choice';
  }

  function isAnswered(q) {
    const a = answers[q.id];
    if (isChoice(q)) return Array.isArray(a) && a.length > 0;
    return a !== undefined && String(a).trim() !== '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    const missingIndex = questions.findIndex((q) => q.required && !isAnswered(q));
    if (missingIndex !== -1) {
      setSubmitError(`Please answer question ${missingIndex + 1}`);
      return;
    }

    const payload = questions.filter(isAnswered).map((q) =>
      isChoice(q)
        ? { questionId: q.id, optionIds: answers[q.id] }
        : { questionId: q.id, value: answers[q.id] }
    );

    setSubmitting(true);
    try {
      await api(`/api/public/surveys/${id}/responses`, {
        method: 'POST',
        body: { answers: payload },
      });
      setDone(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>;

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-lg text-gray-800">{loadError}</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Thank you!</h1>
        <p className="mt-2 text-gray-600">Your response has been recorded.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">{survey.title}</h1>
      {survey.description && <p className="mt-1 text-gray-600">{survey.description}</p>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {questions.map((q, index) => (
          <fieldset
            key={q.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <legend className="px-1 font-medium text-gray-900">
              {index + 1}. {q.text}
              {q.required && <span className="text-red-600"> *</span>}
            </legend>

            {q.type === 'short_text' && (
              <textarea
                value={answers[q.id] || ''}
                onChange={(e) => setValue(q.id, e.target.value)}
                maxLength={2000}
                rows={3}
                aria-label={q.text}
                className="mt-2 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {q.type === 'rating' && (
              <div className="mt-2">
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <label key={n} className="flex flex-col items-center gap-1 text-sm text-gray-700">
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === n}
                        onChange={() => setValue(q.id, n)}
                      />
                      {n}
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">1 is lowest, 5 is highest</p>
              </div>
            )}

            {q.type === 'single_choice' &&
              q.options.map((o) => (
                <label key={o.id} className="mt-2 flex items-center gap-2 text-gray-700">
                  <input
                    type="radio"
                    name={q.id}
                    checked={(answers[q.id] || [])[0] === o.id}
                    onChange={() => chooseOption(q.id, o.id, false)}
                  />
                  {o.label}
                </label>
              ))}

            {q.type === 'multiple_choice' &&
              q.options.map((o) => (
                <label key={o.id} className="mt-2 flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    checked={(answers[q.id] || []).includes(o.id)}
                    onChange={() => chooseOption(q.id, o.id, true)}
                  />
                  {o.label}
                </label>
              ))}
          </fieldset>
        ))}

        {submitError && (
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-red-700">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}