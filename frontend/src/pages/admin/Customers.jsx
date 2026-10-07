import { useEffect, useState } from "react";
import {
  UserRound,
  Search,
  RefreshCw,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function Customers() {
  const { platformSettings } = useAuth();

  const platformTimezone =
    platformSettings?.platform?.timezone ||
    "Asia/Kolkata";

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await api.get("/customers/", {
        params,
      });

      setCustomers(response.data.results || response.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-800 p-2 text-white">
            <UserRound size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Customers
            </h1>

            <p className="text-sm text-slate-500">
              Manage registered customers
            </p>
          </div>
        </div>

        <button
          onClick={fetchCustomers}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
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
                  fetchCustomers();
                }
              }}
              placeholder="Search customers..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <button
            onClick={fetchCustomers}
            className="rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Search
          </button>
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
                Loading customers...
              </p>
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="text-center">
              <UserRound
                size={40}
                className="mx-auto mb-3 text-slate-300"
              />

              <p className="font-medium text-slate-600">
                No customers found
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phone
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Address
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Joined
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700">
                          {customer.username
                            ?.charAt(0)
                            .toUpperCase() || "C"}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {customer.username}
                          </p>

                          <p className="text-xs text-slate-400">
                            Customer #{customer.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {customer.phone || "-"}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {customer.email || "-"}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-sm text-slate-600">
                      <p className="truncate">
                        {customer.address || "-"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {customer.date_joined
                        ? new Date(
                            customer.date_joined
                          ).toLocaleDateString("en-IN", {
                            timeZone: platformTimezone,
                          })
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

export default Customers;