import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  RefreshCw,
  CalendarDays,
  Lock,
  Pencil,
  X,
  Save,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const CustomerProfile = () => {
  const { platformSettings } = useAuth();

  const platformTimezone =
    platformSettings?.platform?.timezone ||
    "Asia/Kolkata";

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileMessageType, setProfileMessageType] =
    useState("");

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [changingPassword, setChangingPassword] =
    useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordMessageType, setPasswordMessageType] =
    useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/me/");

      setUser(response.data);

      setProfileData({
        name: response.data.name || "",
        email: response.data.email || "",
        phone: response.data.phone || "",
        address: response.data.address || "",
      });
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Unable to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileChange = (event) => {
    setProfileData({
      ...profileData,
      [event.target.name]: event.target.value,
    });
  };

  const openEditProfile = () => {
    setProfileMessage("");
    setProfileMessageType("");

    setProfileData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
    });

    setEditingProfile(true);
  };

  const closeEditProfile = () => {
    if (savingProfile) {
      return;
    }

    setEditingProfile(false);
    setProfileMessage("");
    setProfileMessageType("");
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    setProfileMessage("");
    setProfileMessageType("");

    const name = profileData.name.trim();
    const email = profileData.email.trim();
    const phone = profileData.phone.trim();
    const address = profileData.address.trim();

if (!name) {
  setProfileMessage("Name is required.");
  setProfileMessageType("error");
  return;
}

if (email && !/^\S+@\S+\.\S+$/.test(email)) {
  setProfileMessage("Please enter a valid email address.");
  setProfileMessageType("error");
  return;
}

if (!phone) {
  setProfileMessage("Mobile number is required.");
  setProfileMessageType("error");
  return;
}

if (!/^\d{10}$/.test(phone)) {
  setProfileMessage(
    "Please enter a valid 10-digit mobile number."
  );
  setProfileMessageType("error");
  return;
}

    try {
      setSavingProfile(true);

      const response = await api.patch(
        "/me/update/",
        {
          name,
          email,
          phone,
          address,
        }
      );

      const updatedUser = response.data?.user;

      if (updatedUser) {
        setUser(updatedUser);

        setProfileData({
          name: updatedUser.name || "",
          email: updatedUser.email || "",
          phone: updatedUser.phone || "",
          address: updatedUser.address || "",
        });
      }

      setProfileMessage(
        response.data?.message ||
          "Profile updated successfully."
      );
      setProfileMessageType("success");

      setEditingProfile(false);
    } catch (err) {
      console.error(err);

      const data = err.response?.data;

      setProfileMessage(
        data?.message ||
          data?.detail ||
          "Unable to update profile. Please try again."
      );
      setProfileMessageType("error");
    } finally {
      setSavingProfile(false);
    }
  };

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
      setPasswordMessage(
        "Please enter your current password."
      );
      setPasswordMessageType("error");
      return;
    }

    if (!passwordData.new_password) {
      setPasswordMessage(
        "Please enter a new password."
      );
      setPasswordMessageType("error");
      return;
    }

    if (!passwordData.confirm_password) {
      setPasswordMessage(
        "Please confirm your new password."
      );
      setPasswordMessageType("error");
      return;
    }

    if (
      passwordData.new_password !==
      passwordData.confirm_password
    ) {
      setPasswordMessage(
        "New passwords do not match."
      );
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
          err.response?.data?.message ||
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
        <RefreshCw
          className="animate-spin text-blue-600"
          size={30}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and manage your customer account information.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadProfile}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={openEditProfile}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Pencil size={16} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Profile update message */}
      {profileMessage && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            profileMessageType === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {profileMessage}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {user && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Profile card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <User size={42} />
              </div>

              <h2 className="mt-4 text-xl font-bold text-slate-900">
                {user.name || user.username || "Customer"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                @{user.username}
              </p>

              <span className="mt-4 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Active Account
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Account Information
              </h2>

              <button
                onClick={openEditProfile}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Pencil size={15} />
                Edit
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Name */}
              <div className="flex gap-3">
                <User
                  size={19}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Name
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {user.name || "Not provided"}
                  </p>
                </div>
              </div>

              {/* Username */}
              <div className="flex gap-3">
                <User
                  size={19}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Username
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {user.username || "Not provided"}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-3">
                <Mail
                  size={19}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Email
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {user.email || "Not provided"}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-3">
                <Phone
                  size={19}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Phone
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {user.phone || "Not provided"}
                  </p>

                  {user.phone && (
                    <p
                      className={`mt-1 text-xs ${
                        user.phone_verified
                          ? "text-green-600"
                          : "text-amber-600"
                      }`}
                    >
                      {user.phone_verified
                        ? "Phone verified"
                        : "Phone not verified"}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="flex gap-3">
                <MapPin
                  size={19}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Address
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {user.address || "Not provided"}
                  </p>
                </div>
              </div>

              {/* Joined */}
              <div className="flex gap-3">
                <CalendarDays
                  size={19}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Joined
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {user.date_joined
                      ? new Date(
                          user.date_joined
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            timeZone:
                              platformTimezone,
                          }
                        )
                      : user.joining_date
                      ? new Date(
                          user.joining_date
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            timeZone:
                              platformTimezone,
                          }
                        )
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Role */}
              <div className="flex gap-3">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Role
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {user.role || "CUSTOMER"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                You can update your name, email, mobile number,
                and address from the Edit Profile option.
              </p>
            </div>
          </div>
        </div>
      )}

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
            <Lock
              size={19}
              className="text-slate-600"
            />

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
                value={
                  passwordData.current_password
                }
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
                value={
                  passwordData.confirm_password
                }
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
                passwordMessageType ===
                "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {passwordMessage}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Edit Profile
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update your personal information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditProfile}
                disabled={savingProfile}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <form
              onSubmit={handleSaveProfile}
              className="space-y-5 px-6 py-6"
            >
              {profileMessage && (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    profileMessageType === "success"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {profileMessage}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Name
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    placeholder="Enter your name"
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="email"
                    name="email"
                    
                    value={profileData.email}
                    onChange={handleProfileChange}
                    placeholder="Enter your email"
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Mobile Number
                </label>

                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <p className="mt-1.5 text-xs text-slate-500">
                  If you change your mobile number, it will
                  need to be verified again.
                </p>
              </div>

              {/* Address */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Address
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-3 top-3 text-slate-400"
                  />

                  <textarea
                    name="address"
                    value={profileData.address}
                    onChange={handleProfileChange}
                    rows={4}
                    placeholder="Enter your address"
                    className="w-full resize-none rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeEditProfile}
                  disabled={savingProfile}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />

                  {savingProfile
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;