
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

function FounderDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [stats, setStats] = useState(null);

  const [platformName, setPlatformName] =
    useState("SEIYALAM");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token =
          localStorage.getItem(
            "founder_access_token"
          );

        if (!token) {
          navigate("/founder/login");
          return;
        }

        const [
          dashboardResponse,
          statsResponse,
          platformSettingsResponse,
        ] = await Promise.all([
          api.get(
            "/founder/dashboard/"
          ),

          api.get(
            "/founder/stats/"
          ),

          api.get(
            "/platform/settings/"
          ),
        ]);

        setDashboard(
          dashboardResponse.data
        );

        setStats(
          statsResponse.data.stats
        );

        if (
          platformSettingsResponse.data?.success &&
          platformSettingsResponse.data?.platform?.name
        ) {
          setPlatformName(
            platformSettingsResponse.data.platform.name
          );
        }
      } catch (err) {
        console.error(err);

        if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          localStorage.removeItem(
            "founder_access_token"
          );

          localStorage.removeItem(
            "founder_refresh_token"
          );

          navigate(
            "/founder/login"
          );

          return;
        }

        setError(
          "Unable to load Founder Dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem(
      "founder_access_token"
    );

    localStorage.removeItem(
      "founder_refresh_token"
    );

    navigate(
      "/founder/login"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-500">
          Loading Founder Dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            {error}
          </p>

          <button
            onClick={() =>
              navigate(
                "/founder/login"
              )
            }
            className="rounded-lg bg-slate-900 px-5 py-2 text-white"
          >
            Founder Login
          </button>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Companies",
      value:
        stats?.total_companies ?? 0,
      icon: "🏢",
    },

    {
      title: "Active Companies",
      value:
        stats?.active_companies ?? 0,
      icon: "✅",
    },

    {
      title: "Suspended Companies",
      value:
        stats?.suspended_companies ?? 0,
      icon: "⏸️",
    },

    {
      title: "Deactivated Companies",
      value:
        stats?.deactivated_companies ?? 0,
      icon: "🚫",
    },

    {
      title: "Total Admins",
      value:
        stats?.total_admins ?? 0,
      icon: "👨‍💼",
    },

    {
      title: "Total Workers",
      value:
        stats?.total_workers ?? 0,
      icon: "👷",
    },

    {
      title: "Total Customers",
      value:
        stats?.total_customers ?? 0,
      icon: "👥",
    },

    {
      title: "Service Requests",
      value:
        stats?.total_service_requests ?? 0,
      icon: "📋",
    },

    {
      title: "Work Orders",
      value:
        stats?.total_work_orders ?? 0,
      icon: "🔧",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100">

      {/* HEADER */}

      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-6">

        <div>

          <h1 className="text-xl font-bold">
            {platformName}
          </h1>

          <p className="text-xs text-slate-400">
            Founder Portal
          </p>

        </div>

        <div className="flex items-center gap-3">

          <button
            onClick={() =>
              navigate(
                "/founder/companies"
              )
            }
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-600"
          >
            Companies
          </button>

          <button
            onClick={() =>
              navigate(
                "/founder/users"
              )
            }
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-600"
          >
            Users
          </button>

          <button
            onClick={() =>
              navigate(
                "/founder/settings"
              )
            }
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-600"
          >
            Settings
          </button>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium hover:bg-red-600"
          >
            Logout
          </button>

        </div>

      </header>


      {/* MAIN */}

      <main className="p-6">

        {/* TITLE */}

        <div className="mb-6">

          <h2 className="text-2xl font-bold text-slate-800">
            Founder Dashboard
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Platform-wide {platformName} management.
          </p>

        </div>


        {/* STATISTICS */}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {cards.map(
            (card) => (

              <div
                key={card.title}
                className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm"
              >

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-slate-500">
                      {card.title}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-800">
                      {card.value}
                    </p>

                  </div>

                  <span className="text-2xl">
                    {card.icon}
                  </span>

                </div>

              </div>

            )
          )}

        </div>


        {/* PLATFORM MANAGEMENT */}

        <div className="mt-8">

          <h3 className="text-lg font-semibold text-slate-800">
            Platform Management
          </h3>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {/* COMPANIES */}

            <button
              onClick={() =>
                navigate(
                  "/founder/companies"
                )
              }
              className="text-left rounded-xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition"
            >

              <span className="text-2xl">
                🏢
              </span>

              <h4 className="mt-4 text-lg font-semibold text-slate-800">
                Companies
              </h4>

              <p className="mt-2 text-sm text-slate-500">
                Create, monitor, suspend, deactivate and manage companies.
              </p>

            </button>


            {/* PLATFORM USERS */}

            <button
              onClick={() =>
                navigate(
                  "/founder/users"
                )
              }
              className="text-left rounded-xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition"
            >

              <span className="text-2xl">
                👥
              </span>

              <h4 className="mt-4 text-lg font-semibold text-slate-800">
                Platform Users
              </h4>

              <p className="mt-2 text-sm text-slate-500">
                View Admins, Workers, Customers and Founder accounts across the platform.
              </p>

            </button>


            {/* PLATFORM SETTINGS */}

            <button
              onClick={() =>
                navigate(
                  "/founder/settings"
                )
              }
              className="text-left rounded-xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition"
            >

              <span className="text-2xl">
                ⚙️
              </span>

              <h4 className="mt-4 text-lg font-semibold text-slate-800">
                Platform Settings
              </h4>

              <p className="mt-2 text-sm text-slate-500">
                Manage global platform configuration, support, maintenance and customer access.
              </p>

            </button>

          </div>

        </div>


        {/* QUICK PLATFORM STATUS */}

        <div className="mt-8 grid gap-5 md:grid-cols-2">

          {/* ACTIVE USERS */}

          <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Active Users
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {stats?.active_users ?? 0}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Users currently enabled on the platform.
            </p>

          </div>


          {/* INACTIVE USERS */}

          <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Inactive Users
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {stats?.inactive_users ?? 0}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Accounts currently disabled.
            </p>

          </div>

        </div>


        {/* LOGGED-IN FOUNDER */}

        <div className="mt-8 rounded-xl bg-white border border-slate-200 p-6 shadow-sm">

          <p className="text-sm text-slate-500">
            Logged in as
          </p>

          <p className="mt-1 text-lg font-semibold text-slate-800">
            {dashboard?.user}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Role: {dashboard?.role}
          </p>

        </div>

      </main>

    </div>
  );
}

export default FounderDashboard;
