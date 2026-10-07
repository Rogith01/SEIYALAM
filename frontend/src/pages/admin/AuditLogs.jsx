import { useEffect, useState } from "react";
import {
  FileText,
  RefreshCw,
  Search,
} from "lucide-react";

import api from "../../services/api";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/audit-logs/");

      const data = response.data.results || response.data;

      if (search.trim()) {
        const keyword = search.trim().toLowerCase();

        setLogs(
          data.filter(
            (log) =>
              log.action
                ?.toLowerCase()
                .includes(keyword) ||
              log.description
                ?.toLowerCase()
                .includes(keyword)
          )
        );
      } else {
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-800 p-2 text-white">
            <FileText size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Audit Logs
            </h1>

            <p className="text-sm text-slate-500">
              Track important system activities
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                fetchLogs();
              }
            }}
            placeholder="Search action or description..."
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />

              <p className="text-sm text-slate-500">
                Loading audit logs...
              </p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="text-center">
              <FileText
                size={40}
                className="mx-auto mb-3 text-slate-300"
              />

              <p className="font-medium text-slate-600">
                No audit logs found
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    User
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {log.action}
                      </span>
                    </td>

                    <td className="max-w-lg px-5 py-4 text-sm text-slate-600">
                      {log.description}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {log.user || "-"}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {log.created_at
                        ? new Date(
                            log.created_at
                          ).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLogs;