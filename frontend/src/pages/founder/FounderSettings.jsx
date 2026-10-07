
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

function FounderSettings() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    platform_name: "SEIYALAM",
    support_email: "",
    support_phone: "",
    support_website: "",
    default_currency: "INR",
    default_timezone: "Asia/Kolkata",
    default_language: "en",
    maintenance_mode: false,
    maintenance_message:
      "SEIYALAM is currently under maintenance. Please try again later.",
    allow_customer_registration: true,
    allow_customer_otp_login: true,
    max_upload_size_mb: 10,
    platform_announcement: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettings = async () => {
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

      const response = await api.get(
        "/founder/settings/"
      );

      setSettings(response.data.settings);
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
        "Unable to load platform settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setSettings((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.patch(
        "/founder/settings/",
        {
          ...settings,

          max_upload_size_mb:
            Number(
              settings.max_upload_size_mb
            ),
        }
      );

      setSettings(
        response.data.settings
      );

      setSuccess(
        response.data.message ||
          "Platform settings updated successfully."
      );
    } catch (err) {
      console.error(err);

      const responseData =
        err.response?.data;

      const errors =
        responseData?.errors;

      if (
        errors &&
        typeof errors === "object"
      ) {
        setError(
          Object.values(errors)
            .flat()
            .join(" ")
        );
      } else {
        setError(
          responseData?.message ||
            responseData?.detail ||
            "Unable to save platform settings."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(
      "founder_access_token"
    );

    localStorage.removeItem(
      "founder_refresh_token"
    );

    navigate("/founder/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-500">
          Loading platform settings...
        </p>
      </div>
    );
  }

  const platformName =
    settings.platform_name?.trim() ||
    "SEIYALAM";

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
                "/founder/dashboard"
              )
            }
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
          >
            Dashboard
          </button>

          <button
            onClick={() =>
              navigate(
                "/founder/companies"
              )
            }
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
          >
            Companies
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

      <main className="max-w-6xl mx-auto p-6">

        <button
          onClick={() =>
            navigate(
              "/founder/dashboard"
            )
          }
          className="mb-5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back to Dashboard
        </button>


        <div className="mb-6">

          <h2 className="text-2xl font-bold text-slate-800">
            Platform Settings
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage global {platformName} platform configuration.
          </p>

        </div>


        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}


        {/* SUCCESS */}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}


        <form
          onSubmit={handleSave}
          className="space-y-6"
        >

          {/* ==================================================
              PLATFORM INFORMATION
          ================================================== */}

          <section className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">

            <h3 className="text-lg font-semibold text-slate-800">
              Platform Information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Basic information about {platformName}
            </p>


            <div className="mt-6 grid gap-5 md:grid-cols-2">

              {/* PLATFORM NAME */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Platform Name
                </label>

                <input
                  type="text"
                  name="platform_name"
                  value={
                    settings.platform_name
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-3"
                />

              </div>


              {/* CURRENCY */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Default Currency
                </label>

                <select
                  name="default_currency"
                  value={
                    settings.default_currency
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-3"
                >

                  <option value="INR">
                    INR - Indian Rupee
                  </option>

                  <option value="USD">
                    USD - US Dollar
                  </option>

                  <option value="EUR">
                    EUR - Euro
                  </option>

                  <option value="GBP">
                    GBP - British Pound
                  </option>

                  <option value="AED">
                    AED - UAE Dirham
                  </option>

                  <option value="SGD">
                    SGD - Singapore Dollar
                  </option>

                  <option value="AUD">
                    AUD - Australian Dollar
                  </option>

                  <option value="CAD">
                    CAD - Canadian Dollar
                  </option>

                </select>

              </div>


              {/* TIMEZONE */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Default Timezone
                </label>

                <select
                  name="default_timezone"
                  value={
                    settings.default_timezone
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-3"
                >

                  <option value="Asia/Kolkata">
                    Asia/Kolkata
                  </option>

                  <option value="Asia/Dubai">
                    Asia/Dubai
                  </option>

                  <option value="Asia/Singapore">
                    Asia/Singapore
                  </option>

                  <option value="Europe/London">
                    Europe/London
                  </option>

                  <option value="America/New_York">
                    America/New_York
                  </option>

                  <option value="America/Los_Angeles">
                    America/Los_Angeles
                  </option>

                </select>

              </div>


              {/* LANGUAGE */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Default Language
                </label>

                <select
                  name="default_language"
                  value={
                    settings.default_language
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-3"
                >

                  <option value="en">
                    English
                  </option>

                  <option value="ta">
                    Tamil
                  </option>

                </select>

              </div>

            </div>

          </section>


          {/* ==================================================
              SUPPORT
          ================================================== */}

          <section className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">

            <h3 className="text-lg font-semibold text-slate-800">
              Support Information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Contact information displayed to platform users.
            </p>


            <div className="mt-6 grid gap-5 md:grid-cols-2">

              {/* EMAIL */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Support Email
                </label>

                <input
                  type="email"
                  name="support_email"
                  value={
                    settings.support_email
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="support@example.com"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3"
                />

              </div>


              {/* PHONE */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Support Phone
                </label>

                <input
                  type="tel"
                  name="support_phone"
                  value={
                    settings.support_phone
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3"
                />

              </div>


              {/* WEBSITE */}

              <div className="md:col-span-2">

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Support Website
                </label>

                <input
                  type="url"
                  name="support_website"
                  value={
                    settings.support_website
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3"
                />

              </div>

            </div>

          </section>


          {/* ==================================================
              USER ACCESS
          ================================================== */}

          <section className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">

            <h3 className="text-lg font-semibold text-slate-800">
              User Access
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Control how customers access {platformName}
            </p>


            <div className="mt-6 space-y-5">

              {/* REGISTRATION */}

              <label className="flex items-center justify-between gap-5 rounded-lg border border-slate-200 p-4 cursor-pointer">

                <div>

                  <p className="font-medium text-slate-800">
                    Allow Customer Registration
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Allow new customers to create accounts.
                  </p>

                </div>

                <input
                  type="checkbox"
                  name="allow_customer_registration"
                  checked={
                    settings.allow_customer_registration
                  }
                  onChange={
                    handleChange
                  }
                  className="h-5 w-5"
                />

              </label>


              {/* OTP */}

              <label className="flex items-center justify-between gap-5 rounded-lg border border-slate-200 p-4 cursor-pointer">

                <div>

                  <p className="font-medium text-slate-800">
                    Allow Customer OTP Login
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Allow customers to log in using phone OTP.
                  </p>

                </div>

                <input
                  type="checkbox"
                  name="allow_customer_otp_login"
                  checked={
                    settings.allow_customer_otp_login
                  }
                  onChange={
                    handleChange
                  }
                  className="h-5 w-5"
                />

              </label>

            </div>

          </section>


          {/* ==================================================
              MAINTENANCE
          ================================================== */}

          <section className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">

            <h3 className="text-lg font-semibold text-slate-800">
              Maintenance
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Temporarily control platform availability.
            </p>


            <div className="mt-6">

              {/* MAINTENANCE MODE */}

              <label className="flex items-center justify-between gap-5 rounded-lg border border-yellow-200 bg-yellow-50 p-4 cursor-pointer">

                <div>

                  <p className="font-medium text-yellow-900">
                    Maintenance Mode
                  </p>

                  <p className="mt-1 text-sm text-yellow-700">
                    Enable this when {platformName} is temporarily unavailable.
                  </p>

                </div>

                <input
                  type="checkbox"
                  name="maintenance_mode"
                  checked={
                    settings.maintenance_mode
                  }
                  onChange={
                    handleChange
                  }
                  className="h-5 w-5"
                />

              </label>


              {/* MAINTENANCE MESSAGE */}

              <div className="mt-5">

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Maintenance Message
                </label>

                <textarea
                  name="maintenance_message"
                  value={
                    settings.maintenance_message
                  }
                  onChange={
                    handleChange
                  }
                  rows="3"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3"
                />

              </div>

            </div>

          </section>


          {/* ==================================================
              FILE UPLOAD
          ================================================== */}

          <section className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">

            <h3 className="text-lg font-semibold text-slate-800">
              File Upload
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Global file upload configuration.
            </p>


            <div className="mt-6 max-w-sm">

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Maximum Upload Size (MB)
              </label>

              <input
                type="number"
                name="max_upload_size_mb"
                min="1"
                max="500"
                value={
                  settings.max_upload_size_mb
                }
                onChange={
                  handleChange
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
              />

            </div>

          </section>


          {/* ==================================================
              ANNOUNCEMENT
          ================================================== */}

          <section className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">

            <h3 className="text-lg font-semibold text-slate-800">
              Platform Announcement
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Optional announcement that can later be displayed to users.
            </p>


            <textarea
              name="platform_announcement"
              value={
                settings.platform_announcement
              }
              onChange={
                handleChange
              }
              rows="4"
              placeholder={`Example: ${platformName} mobile app v2 is now available.`}
              className="mt-6 w-full rounded-lg border border-slate-300 px-4 py-3"
            />

          </section>


          {/* ==================================================
              SAVE
          ================================================== */}

          <div className="flex justify-end pb-10">

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-7 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : "Save Platform Settings"}
            </button>

          </div>

        </form>

      </main>

    </div>
  );
}

export default FounderSettings;
