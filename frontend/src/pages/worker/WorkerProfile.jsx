import {
  UserCircle,
  RefreshCw,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Calendar,
  ShieldCheck,
  Lock,
} from "lucide-react";

import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function WorkerProfile() {
  const { platformSettings } = useAuth();

  const platformTimezone =
    platformSettings?.platform?.timezone ||
    "Asia/Kolkata";

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordMessageType, setPasswordMessageType] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/me/");

      setUser(response.data);

      localStorage.setItem(
        "user",
        JSON.stringify(response.data)
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handlePasswordChange = (event) => {
    setPasswordData({
      ...passwordData,
      [event.target.name]: event.target.value,
    });
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordMessageType("");

    if (!passwordData.current_password) {
      setPasswordMessage("Please enter your current password.");
      setPasswordMessageType("error");
      return;
    }

    if (!passwordData.new_password) {
      setPasswordMessage("Please enter a new password.");
      setPasswordMessageType("error");
      return;
    }

    if (!passwordData.confirm_password) {
      setPasswordMessage("Please confirm your new password.");
      setPasswordMessageType("error");
      return;
    }

    if (
      passwordData.new_password !==
      passwordData.confirm_password
    ) {
      setPasswordMessage("New passwords do not match.");
      setPasswordMessageType("error");
      return;
    }

    if (passwordData.new_password.length < 8) {
      setPasswordMessage(
        "New password must be at least 8 characters long."
      );
      setPasswordMessageType("error");
      return;
    }

    if (
      passwordData.current_password ===
      passwordData.new_password
    ) {
      setPasswordMessage(
        "New password must be different from your current password."
      );
      setPasswordMessageType("error");
      return;
    }

    try {
      setChangingPassword(true);

      const response = await api.post(
        "/auth/change-password/",
        passwordData
      );

      setPasswordMessage(
        response.data?.message ||
          "Password changed successfully."
      );

      setPasswordMessageType("success");

      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      console.error(err);

      setPasswordMessage(
        err.response?.data?.detail ||
          "Unable to change password. Please try again."
      );

      setPasswordMessageType("error");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <RefreshCw
            size={20}
            className="animate-spin"
          />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View your worker account information.
          </p>
        </div>

        <button
          onClick={loadProfile}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Profile card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-900 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-700 text-2xl font-bold">
              {user?.username
                ?.charAt(0)
                .toUpperCase() || "W"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user?.username || "Worker"}
              </p>

              <p className="text-xs text-slate-400">
                Worker
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          <div className="flex gap-3">
            <Mail
              size={19}
              className="mt-0.5 text-slate-400"
            />

            <div>
              <p className="text-xs text-slate-400">
                Email
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {user?.email || "Not provided"}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Phone
              size={19}
              className="mt-0.5 text-slate-400"
            />

            <div>
              <p className="text-xs text-slate-400">
                Phone
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {user?.phone || "Not provided"}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Briefcase
              size={19}
              className="mt-0.5 text-slate-400"
            />

            <div>
              <p className="text-xs text-slate-400">
                Employee ID
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {user?.employee_id || "Not assigned"}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Calendar
              size={19}
              className="mt-0.5 text-slate-400"
            />

            <div>
              <p className="text-xs text-slate-400">
                Joining Date
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {user?.joining_date
                  ? new Date(
                      user.joining_date
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        timeZone: platformTimezone,
                      }
                    )
                  : "Not provided"}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <MapPin
              size={19}
              className="mt-0.5 text-slate-400"
            />

            <div>
              <p className="text-xs text-slate-400">
                Address
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {user?.address || "Not provided"}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <UserCircle
              size={19}
              className="mt-0.5 text-slate-400"
            />

            <div>
              <p className="text-xs text-slate-400">
                Availability
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {user?.availability || "Not specified"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account information */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">
          Account Information
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-400">
              Username
            </p>

            <p className="mt-1 text-sm font-medium text-slate-800">
              {user?.username || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Role
            </p>

            <p className="mt-1 text-sm font-medium text-slate-800">
              {user?.role || "WORKER"}
            </p>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-lg bg-slate-100 p-3 text-slate-700">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-800">
              Security
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your account password and security.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <div className="mb-5 flex items-center gap-3">
            <Lock size={19} className="text-slate-600" />

            <div>
              <h3 className="font-semibold text-slate-800">
                Change Password
              </h3>

              <p className="text-sm text-slate-400">
                Change your current account password.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleChangePassword}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Current Password
              </label>

              <input
                type="password"
                name="current_password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                placeholder="Enter current password"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                New Password
              </label>

              <input
                type="password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                placeholder="Enter new password"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Confirm New Password
              </label>

              <input
                type="password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                placeholder="Confirm new password"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={changingPassword}
                className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Lock size={17} />

                {changingPassword
                  ? "Changing Password..."
                  : "Change Password"}
              </button>
            </div>
          </form>

          {passwordMessage && (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                passwordMessageType === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {passwordMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkerProfile;