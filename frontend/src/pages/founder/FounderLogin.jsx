
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function FounderLogin() {
  const navigate = useNavigate();

  const { platformSettings } = useAuth();

  const platformName =
    platformSettings?.platform?.name || "SEIYALAM";

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.username || !formData.password) {
      setError("Please enter username and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/founder/token/",
        {
          username: formData.username,
          password: formData.password,
        }
      );

      localStorage.setItem(
        "founder_access_token",
        response.data.access
      );

      localStorage.setItem(
        "founder_refresh_token",
        response.data.refresh
      );

      setSuccess("Founder login successful.");

      navigate("/founder/dashboard");

    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Invalid Founder username or password.";

      setError(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        <div className="bg-white rounded-2xl shadow-xl p-8">

          {/* BRANDING */}

          <div className="text-center mb-8">

            <h1 className="text-4xl font-bold text-slate-800">
              {platformName}
            </h1>

            <p className="mt-2 text-slate-500">
              Service Management Platform
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Founder Login
            </p>

          </div>


          {/* SUCCESS */}

          {success && (
            <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600">
              {success}
            </div>
          )}


          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}


          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* USERNAME */}

            <div>

              <label
                htmlFor="founder-username"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Username
              </label>

              <input
                id="founder-username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter Founder username"
                autoComplete="username"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />

            </div>


            {/* PASSWORD */}

            <div>

              <label
                htmlFor="founder-password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Password
              </label>

              <input
                id="founder-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter Founder password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />

            </div>


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading
                ? "Signing in..."
                : "Sign In"}

            </button>

          </form>


          {/* FOOTER */}

          <div className="mt-6 text-center">

            <p className="text-xs text-slate-400">
              {platformName} Founder Portal
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default FounderLogin;
