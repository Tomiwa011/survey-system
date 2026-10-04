import { Link } from 'react-router-dom';
const BADGE = {
  draft: "bg-gray-200 text-gray-800",
  open: "bg-green-100 text-green-800",
  closed: "bg-gray-800 text-white",
};

const NEXT_ACTION = {
  draft: { label: "Open", status: "open" },
  open: { label: "Close", status: "closed" },
  closed: { label: "Reopen", status: "open" },
};

export default function SurveyCard({ survey, onStatusChange, onDelete }) {
  const action = NEXT_ACTION[survey.status];

  return (
    <div className="mb-3 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">{survey.title}</h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE[survey.status]}`}
        >
          {survey.status}
        </span>
      </div>
      {survey.description && (
        <p className="mt-1 text-gray-600">{survey.description}</p>
      )}
      <p className="mt-2 text-sm text-gray-500">
        Created {new Date(survey.created_at).toLocaleDateString()}
      </p>

      <div className="mt-3 flex gap-2">
        <Link
          to={`/surveys/${survey.id}`}
          className="cursor-pointer rounded border border-blue-600 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50"
        >
          Edit
        </Link>
        <Link
          onClick={() => onDelete(survey)}
          className="cursor-pointer rounded border border-red-600 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete
        </Link>

        <Link
  to={`/surveys/${survey.id}`}
  className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
>
  Edit questions
</Link>
      </div>
    </div>
  );
}
