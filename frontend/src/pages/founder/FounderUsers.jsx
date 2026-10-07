import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";


function FounderUsers() {

  const navigate = useNavigate();

  const { platformSettings } = useAuth();

  const platformName =
    platformSettings?.platform?.name || "SEIYALAM";

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {

    try {

      const params = new URLSearchParams();

      if (search) {
        params.append("search", search);
      }

      if (role) {
        params.append("role", role);
      }

      const response = await api.get(
        `/founder/users/?${params.toString()}`
      );

      setUsers(
        response.data.users
      );

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);
    }
  };


  useEffect(() => {

    loadUsers();

  }, []);


  const handleSearch = (event) => {

    event.preventDefault();

    setLoading(true);

    loadUsers();
  };


  return (
    <div className="min-h-screen bg-slate-100">

      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-6">

        <div>

          <h1 className="text-xl font-bold">
            {platformName}
          </h1>

          <p className="text-xs text-slate-400">
            Founder Portal
          </p>

        </div>

        <button
          onClick={() =>
            navigate("/founder/dashboard")
          }
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm"
        >
          Dashboard
        </button>

      </header>


      <main className="p-6">

        <div className="flex items-center justify-between mb-6">

          <div>

            <h2 className="text-2xl font-bold text-slate-800">
              Platform Users
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              View users across all companies.
            </p>

          </div>

        </div>


        <form
          onSubmit={handleSearch}
          className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex gap-3 flex-wrap"
        >

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search username..."
            className="border border-slate-300 rounded-lg px-4 py-2 flex-1 min-w-[220px]"
          />

          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value)
            }
            className="border border-slate-300 rounded-lg px-4 py-2"
          >

            <option value="">
              All Roles
            </option>

            <option value="FOUNDER">
              Founder
            </option>

            <option value="ADMIN">
              Admin
            </option>

            <option value="WORKER">
              Worker
            </option>

            <option value="CUSTOMER">
              Customer
            </option>

          </select>

          <button
            type="submit"
            className="rounded-lg bg-slate-900 text-white px-5 py-2"
          >
            Search
          </button>

        </form>


        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

          {loading ? (

            <div className="p-8 text-center text-slate-500">
              Loading users...
            </div>

          ) : users.length === 0 ? (

            <div className="p-8 text-center text-slate-500">
              No users found.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-slate-50 border-b">

                  <tr>

                    <th className="text-left px-5 py-4">
                      User
                    </th>

                    <th className="text-left px-5 py-4">
                      Role
                    </th>

                    <th className="text-left px-5 py-4">
                      Company
                    </th>

                    <th className="text-left px-5 py-4">
                      Phone
                    </th>

                    <th className="text-left px-5 py-4">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {users.map((user) => (

                    <tr
                      key={user.id}
                      className="border-b last:border-b-0"
                    >

                      <td className="px-5 py-4 font-medium">
                        {user.username}
                      </td>

                      <td className="px-5 py-4">
                        {user.role}
                      </td>

                      <td className="px-5 py-4">
                        {user.company_name || "Platform"}
                      </td>

                      <td className="px-5 py-4">
                        {user.phone || "-"}
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={
                            user.is_active
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {user.is_active
                            ? "ACTIVE"
                            : "INACTIVE"}
                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </main>

    </div>
  );
}

export default FounderUsers;