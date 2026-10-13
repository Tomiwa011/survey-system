import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { api } from '../api';

const STATUS_COLORS = { draft: '#9ca3af', open: '#16a34a', closed: '#1f2937' };

function Panel({ title, summary, children }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mb-3 text-sm text-gray-500">{summary}</p>
      {children}
    </section>
  );
}

function shortDate(day) {
  return `${day.slice(8)}/${day.slice(5, 7)}`;
}

export default function AdminCharts() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/admin/charts')
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <p role="alert" className="mb-8 rounded bg-red-50 px-3 py-2 text-red-700">
        {error}
      </p>
    );
  }
  if (!data) return <p className="mb-8 text-gray-500">Loading charts...</p>;

  const totalLast30 = data.responsesPerDay.reduce((sum, d) => sum + d.count, 0);
  const totalSurveys = data.statusCounts.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="mb-10 space-y-4">
      <Panel
        title="Responses per day"
        summary={`${totalLast30} ${totalLast30 === 1 ? 'response' : 'responses'} in the last 30 days`}
      >
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.responsesPerDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" tickFormatter={shortDate} minTickGap={24} tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip labelFormatter={shortDate} formatter={(v) => [v, 'Responses']} />
            <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Surveys by status" summary={`${totalSurveys} ${totalSurveys === 1 ? 'survey' : 'surveys'} in total`}>
          {totalSurveys === 0 ? (
            <p className="text-gray-500">No surveys yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.statusCounts}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {data.statusCounts.map((s) => (
                      <Cell key={s.status} fill={STATUS_COLORS[s.status]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <p className="mt-2 text-sm text-gray-600">
                {data.statusCounts.map((s) => `${s.status}: ${s.count}`).join(' · ')}
              </p>
            </>
          )}
        </Panel>

        <Panel title="Most answered surveys" summary="Top 5 by number of responses">
          {data.topSurveys.length === 0 ? (
            <p className="text-gray-500">No surveys yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.topSurveys} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={110}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(t) => (t.length > 16 ? `${t.slice(0, 15)}…` : t)}
                />
                <Tooltip formatter={(v) => [v, 'Responses']} />
                <Bar dataKey="responses" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>
    </div>
  );
}