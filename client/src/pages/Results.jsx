import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import Navbar from '../components/Navbar';

function Bar({ label, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between gap-2 text-sm text-gray-700">
        <span className="break-words">{label}</span>
        <span className="shrink-0">
          {count} ({pct}%)
        </span>
      </div>
      <div className="mt-1 h-3 w-full rounded bg-gray-100">
        <div className="h-3 rounded bg-blue-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Results() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api(`/api/surveys/${id}/results`)
      .then(setData)
      .catch((err) => {
        if (err.status === 401) navigate('/login');
        else setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [id, user, navigate]);

  if (authLoading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link to="/dashboard" className="text-sm text-blue-700 hover:underline">
          ← Back to dashboard
        </Link>

        {loading && <p className="mt-4 text-gray-500">Loading...</p>}
        {error && (
          <p role="alert" className="mt-4 rounded bg-red-50 px-3 py-2 text-red-700">
            {error}
          </p>
        )}

        {data && (
          <>
            <h1 className="mt-4 text-2xl font-semibold text-gray-900">{data.survey.title}</h1>
            <p className="mt-1 text-gray-600">
              {data.totalResponses} {data.totalResponses === 1 ? 'response' : 'responses'}
            </p>

            {data.totalResponses === 0 && (
              <p className="mt-6 text-gray-500">No responses yet. Share the link to get started.</p>
            )}

            {data.totalResponses > 0 &&
              data.questions.map((q, index) => (
                <div
                  key={q.id}
                  className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <h2 className="font-medium text-gray-900">
                    {index + 1}. {q.text}
                  </h2>
                  <p className="mb-3 text-sm text-gray-500">
                    {q.answered} of {data.totalResponses} answered
                  </p>

                  {(q.type === 'single_choice' || q.type === 'multiple_choice') &&
                    q.options.map((o) => (
                      <Bar key={o.id} label={o.label} count={o.count} total={q.answered} />
                    ))}

                  {q.type === 'rating' && (
                    <>
                      {q.average !== null && (
                        <p className="mb-3 text-sm font-medium text-gray-700">
                          Average: {q.average} / 5
                        </p>
                      )}
                      {q.distribution.map((d) => (
                        <Bar
                          key={d.value}
                          label={`${d.value}`}
                          count={d.count}
                          total={q.answered}
                        />
                      ))}
                    </>
                  )}

                  {q.type === 'short_text' &&
                    (q.answers.length === 0 ? (
                      <p className="text-sm text-gray-500">No text answers yet.</p>
                    ) : (
                      <ul className="max-h-64 space-y-2 overflow-y-auto">
                        {q.answers.map((text, i) => (
                          <li
                            key={i}
                            className="whitespace-pre-wrap break-words rounded bg-gray-50 px-3 py-2 text-gray-800"
                          >
                            {text}
                          </li>
                        ))}
                      </ul>
                    ))}
                </div>
              ))}
          </>
        )}
      </div>
    </>
  );
}