import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import Navbar from '../components/Navbar';

const TYPE_LABEL = {
  short_text: 'Short text',
  single_choice: 'Single choice',
  multiple_choice: 'Multiple choice',
  rating: 'Rating',
};

export default function SurveyBuilder() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qText, setQText] = useState('');
const [qType, setQType] = useState('short_text');
const [qRequired, setQRequired] = useState(false);
const [qOptions, setQOptions] = useState(['', '']);
const [adding, setAdding] = useState(false);
const [addError, setAddError] = useState('');
const [editingId, setEditingId] = useState(null);
const [editText, setEditText] = useState('');
const [editRequired, setEditRequired] = useState(false);
const [actionError, setActionError] = useState('');

const isChoice = qType === 'single_choice' || qType === 'multiple_choice';

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api(`/api/surveys/${id}`),
      api(`/api/surveys/${id}/questions`),
    ])
      .then(([s, q]) => {
        setSurvey(s.survey);
        setQuestions(q.questions);
      })
      .catch((err) => {
        if (err.status === 401) navigate('/login');
        else setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [id, user, navigate]);
function updateOption(index, value) {
  setQOptions(qOptions.map((o, i) => (i === index ? value : o)));
}

function addOption() {
  if (qOptions.length < 10) setQOptions([...qOptions, '']);
}

function removeOption(index) {
  if (qOptions.length > 2) setQOptions(qOptions.filter((_, i) => i !== index));
}

async function handleAddQuestion(e) {
  e.preventDefault();
  setAddError('');
  setAdding(true);
  try {
    const body = { type: qType, text: qText, required: qRequired };
    if (isChoice) {
      body.options = qOptions.map((o) => o.trim()).filter((o) => o !== '');
    }
    const data = await api(`/api/surveys/${id}/questions`, { method: 'POST', body });
    setQuestions([...questions, data.question]);
    setQText('');
    setQRequired(false);
    setQOptions(['', '']);
  } catch (err) {
    if (err.status === 401) navigate('/login');
    else setAddError(err.message);
  } finally {
    setAdding(false);
  }
}
function startEdit(q) {
  setActionError('');
  setEditingId(q.id);
  setEditText(q.text);
  setEditRequired(q.required);
}

async function saveEdit(q) {
  setActionError('');
  try {
    const data = await api(`/api/surveys/${id}/questions/${q.id}`, {
      method: 'PATCH',
      body: { text: editText, required: editRequired },
    });
    setQuestions(
      questions.map((x) =>
        x.id === q.id
          ? { ...x, text: data.question.text, required: data.question.required }
          : x
      )
    );
    setEditingId(null);
  } catch (err) {
    if (err.status === 401) navigate('/login');
    else setActionError(err.message);
  }
}

async function handleDeleteQuestion(q) {
  if (!window.confirm(`Delete question "${q.text}"?`)) return;
  setActionError('');
  try {
    await api(`/api/surveys/${id}/questions/${q.id}`, { method: 'DELETE' });
    setQuestions(
      questions
        .filter((x) => x.id !== q.id)
        .map((x) => (x.position > q.position ? { ...x, position: x.position - 1 } : x))
    );
  } catch (err) {
    if (err.status === 401) navigate('/login');
    else setActionError(err.message);
  }
}
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

        {survey && (
          <>
            <h1 className="mt-4 text-2xl font-semibold text-gray-900">{survey.title}</h1>
            {survey.description && <p className="mt-1 text-gray-600">{survey.description}</p>}

            <h2 className="mb-3 mt-8 text-lg font-semibold text-gray-900">Questions</h2>
            {questions.length === 0 && (
              <p className="text-gray-500">No questions yet.</p>
            )}

          {actionError && (
  <p role="alert" className="mb-3 rounded bg-red-50 px-3 py-2 text-red-700">
    {actionError}
  </p>
)}

{questions.map((q) => (
  <div key={q.id} className="mb-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    {editingId === q.id ? (
      <div className="space-y-3">
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          maxLength={500}
          aria-label="Question text"
          className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={editRequired}
            onChange={(e) => setEditRequired(e.target.checked)}
          />
          Required
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => saveEdit(q)}
            className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={() => setEditingId(null)}
            className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <>
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-gray-900">
            {q.position}. {q.text}
            {q.required && <span className="text-red-600"> *</span>}
          </p>
          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
            {TYPE_LABEL[q.type]}
          </span>
        </div>
        {q.options.length > 0 && (
          <ul className="mt-2 list-disc pl-6 text-gray-600">
            {q.options.map((o) => (
              <li key={o.id}>{o.label}</li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => startEdit(q)}
            className="rounded border border-blue-600 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteQuestion(q)}
            className="rounded border border-red-600 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </>
    )}
  </div>
))}
            <form
  onSubmit={handleAddQuestion}
  className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
>
  <h3 className="text-lg font-semibold text-gray-900">Add a question</h3>

  {addError && (
    <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
      {addError}
    </p>
  )}

  <div>
    <label htmlFor="qtext" className="mb-1 block text-sm font-medium text-gray-700">
      Question
    </label>
    <input
      id="qtext"
      type="text"
      value={qText}
      onChange={(e) => setQText(e.target.value)}
      maxLength={500}
      required
      className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div>
    <label htmlFor="qtype" className="mb-1 block text-sm font-medium text-gray-700">
      Type
    </label>
    <select
      id="qtype"
      value={qType}
      onChange={(e) => setQType(e.target.value)}
      className="w-full rounded border border-gray-300 px-3 py-2"
    >
      <option value="short_text">Short text</option>
      <option value="single_choice">Single choice</option>
      <option value="multiple_choice">Multiple choice</option>
      <option value="rating">Rating (1 to 5)</option>
    </select>
  </div>

  {isChoice && (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Options</p>
      {qOptions.map((o, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={o}
            onChange={(e) => updateOption(i, e.target.value)}
            maxLength={200}
            placeholder={`Option ${i + 1}`}
            aria-label={`Option ${i + 1}`}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => removeOption(i)}
            disabled={qOptions.length <= 2}
            className="rounded border border-gray-300 px-3 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            aria-label={`Remove option ${i + 1}`}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addOption}
        disabled={qOptions.length >= 10}
        className="text-sm font-medium text-blue-700 hover:underline disabled:opacity-40"
      >
        + Add option
      </button>
    </div>
  )}

  <label className="flex items-center gap-2 text-sm text-gray-700">
    <input
      type="checkbox"
      checked={qRequired}
      onChange={(e) => setQRequired(e.target.checked)}
    />
    Required
  </label>

  <button
    type="submit"
    disabled={adding}
    className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
  >
    {adding ? 'Adding...' : 'Add question'}
  </button>
</form>
          </>
        )}
      </div>
    </>
  );
}