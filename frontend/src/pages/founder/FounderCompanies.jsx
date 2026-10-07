
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function FounderCompanies() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [platformName, setPlatformName] =
    useState("SEIYALAM");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] =
    useState("");
  const [createSuccess, setCreateSuccess] =
    useState("");

  // ========================================================
  // LOAD COMPANIES
  // ========================================================

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem(
        "founder_access_token"
      );

      if (!token) {
        navigate("/founder/login");
        return;
      }

      const [
        companiesResponse,
        platformSettingsResponse,
      ] = await Promise.all([
        api.get(
          "/founder/companies/list/"
        ),

        api.get(
          "/platform/settings/"
        ),
      ]);

      setCompanies(
        companiesResponse.data.companies || []
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

        navigate("/founder/login");
        return;
      }

      setError(
        "Unable to load companies."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);


  // ========================================================
  // FORM CHANGE
  // ========================================================

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]:
        event.target.value,
    });
  };


  // ========================================================
  // CREATE COMPANY
  // ========================================================

  const handleCreateCompany = async (
    event
  ) => {
    event.preventDefault();

    setCreateError("");
    setCreateSuccess("");

    if (!formData.name.trim()) {
      setCreateError(
        "Company / Branch name is required."
      );
      return;
    }

    if (!formData.phone.trim()) {
      setCreateError(
        "Phone number is required."
      );
      return;
    }

    try {
      setCreating(true);

      await api.post(
        "/founder/companies/",
        {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
        }
      );

      setCreateSuccess(
        "Company created successfully."
      );

      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
      });

      await loadCompanies();

      setTimeout(() => {
        setShowCreateForm(false);
        setCreateSuccess("");
      }, 1000);
    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.errors ||
        err.response?.data?.message ||
        "Unable to create company.";

      if (
        typeof message === "object"
      ) {
        setCreateError(
          Object.values(message)
            .flat()
            .join(" ")
        );
      } else {
        setCreateError(message);
      }
    } finally {
      setCreating(false);
    }
  };


  // ========================================================
  // LOGOUT
  // ========================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "founder_access_token"
    );

    localStorage.removeItem(
      "founder_refresh_token"
    );

    navigate("/founder/login");
  };


  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">

        <p className="text-slate-500">
          Loading companies...
        </p>

      </div>
    );
  }


  // ========================================================
  // PAGE
  // ========================================================

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ==================================================
          HEADER
      ================================================== */}

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
                "/founder/dashboard"
              )
            }
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-600"
          >
            Dashboard
          </button>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium hover:bg-red-600"
          >
            Logout
          </button>

        </div>

      </header>


      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="p-6 max-w-7xl mx-auto">

        {/* PAGE HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">

          <div>

            <h2 className="text-2xl font-bold text-slate-800">
              Companies
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage companies and branches on the{" "}
              {platformName} platform.
            </p>

          </div>

          <button
            onClick={() => {
              setShowCreateForm(true);
              setCreateError("");
              setCreateSuccess("");
            }}
            className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            + Create Company
          </button>

        </div>


        {/* ==================================================
            CREATE COMPANY FORM
        ================================================== */}

        {showCreateForm && (

          <div className="mb-6 rounded-xl bg-white border border-slate-200 p-6 shadow-sm">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h3 className="text-lg font-semibold text-slate-800">
                  Create Company
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new company or branch for{" "}
                  {platformName}.
                </p>

              </div>

              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateError("");
                  setCreateSuccess("");
                }}
                className="text-slate-400 hover:text-slate-700 text-xl"
              >
                ×
              </button>

            </div>


            {/* SUCCESS */}

            {createSuccess && (

              <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                {createSuccess}
              </div>

            )}


            {/* ERROR */}

            {createError && (

              <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {createError}
              </div>

            )}


            <form
              onSubmit={handleCreateCompany}
              className="grid gap-5 md:grid-cols-2"
            >

              {/* NAME */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company / Branch Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

              </div>


              {/* PHONE */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

              </div>


              {/* EMAIL */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

              </div>


              {/* ADDRESS */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Address
                </label>

                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter company address"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

              </div>


              {/* BUTTONS */}

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateError("");
                    setCreateSuccess("");
                  }}
                  className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating
                    ? "Creating..."
                    : "Create Company"}
                </button>

              </div>

            </form>

          </div>

        )}


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (

          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>

        )}


        {/* ==================================================
            SUMMARY
        ================================================== */}

        <div className="mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Total Companies
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">
              {companies.length}
            </p>

          </div>

        </div>


        {/* ==================================================
            COMPANY LIST
        ================================================== */}

        {companies.length === 0 ? (

          <div className="rounded-xl bg-white border border-slate-200 p-10 text-center shadow-sm">

            <h3 className="text-lg font-semibold text-slate-800">
              No companies found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Create your first company to get started.
            </p>

          </div>

        ) : (

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {companies.map(
              (company) => (

                <div
                  key={company.id}
                  className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition"
                >

                  <div className="flex items-start justify-between">

                    <div>

                      <h3 className="text-lg font-semibold text-slate-800">
                        {company.name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Company ID: #{company.id}
                      </p>

                    </div>

                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                      Active
                    </span>

                  </div>


                  <div className="mt-5 space-y-3">

                    <div>

                      <p className="text-xs text-slate-400">
                        Phone
                      </p>

                      <p className="text-sm text-slate-700">
                        {company.phone ||
                          "Not provided"}
                      </p>

                    </div>


                    <div>

                      <p className="text-xs text-slate-400">
                        Email
                      </p>

                      <p className="text-sm text-slate-700 break-all">
                        {company.email ||
                          "Not provided"}
                      </p>

                    </div>


                    <div>

                      <p className="text-xs text-slate-400">
                        Address
                      </p>

                      <p className="text-sm text-slate-700">
                        {company.address ||
                          "Not provided"}
                      </p>

                    </div>

                  </div>


                  <div className="mt-6 border-t border-slate-100 pt-4">

                    <button
                      onClick={() =>
                        navigate(
                          `/founder/companies/${company.id}`
                        )
                      }
                      className="text-sm font-medium text-slate-700 hover:text-slate-900"
                    >
                      Manage Company →
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </main>

    </div>
  );
}

export default FounderCompanies;
