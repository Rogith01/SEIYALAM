import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Building2,
  ShieldCheck,
  Save,
  Lock,
  Smartphone,
  CheckCircle,
  Pencil,
  X,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function Settings() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [phoneData, setPhoneData] = useState({
    phone: "",
    otp: "",
  });

  const [changingPhone, setChangingPhone] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [devOTP, setDevOTP] = useState("");

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [changingPassword, setChangingPassword] = useState(false);

  // ============================================================
  // LOAD PROFILE
  // ============================================================

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/me/");

        setProfile(response.data);

        setPhoneData({
          phone: response.data?.phone || "",
          otp: "",
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // ============================================================
  // PROFILE CHANGE
  // ============================================================

  const handleChange = (event) => {
    setProfile({
      ...profile,
      [event.target.name]: event.target.value,
    });
  };

  // ============================================================
  // PROFILE SAVE
  // ============================================================

  const handleSave = async (event) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setMessageType("info");

    setTimeout(() => {
      setSaving(false);

      setMessage(
        "Profile editing will be connected when the profile update API is added."
      );

      setMessageType("info");
    }, 500);
  };

  // ============================================================
  // PHONE CHANGE
  // ============================================================

  const handlePhoneChange = (event) => {
    const value = event.target.value;

    if (!/^\d*$/.test(value)) {
      return;
    }

    setPhoneData({
      ...phoneData,
      phone: value,
    });

    if (otpSent) {
      setOtpSent(false);
      setDevOTP("");

      setPhoneData((previous) => ({
        ...previous,
        phone: value,
        otp: "",
      }));
    }
  };

  // ============================================================
  // START CHANGE PHONE
  // ============================================================

  const handleStartChangePhone = () => {
    setMessage("");
    setMessageType("info");

    setChangingPhone(true);
    setOtpSent(false);
    setDevOTP("");

    setPhoneData({
      phone: "",
      otp: "",
    });
  };

  // ============================================================
  // CANCEL CHANGE PHONE
  // ============================================================

  const handleCancelChangePhone = () => {
    setChangingPhone(false);
    setOtpSent(false);
    setDevOTP("");

    setPhoneData({
      phone: profile?.phone || "",
      otp: "",
    });

    setMessage("");
    setMessageType("info");
  };

  // ============================================================
  // OTP CHANGE
  // ============================================================

  const handleOTPChange = (event) => {
    const value = event.target.value;

    if (!/^\d*$/.test(value)) {
      return;
    }

    setPhoneData({
      ...phoneData,
      otp: value,
    });
  };

  // ============================================================
  // SEND PHONE VERIFICATION OTP
  // ============================================================

  const handleSendOTP = async () => {
    setMessage("");
    setMessageType("info");
    setDevOTP("");

    const phone = phoneData.phone.trim();

    if (!phone) {
      setMessage("Please enter your phone number.");
      setMessageType("error");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setMessage(
        "Please enter a valid 10-digit mobile number."
      );
      setMessageType("error");
      return;
    }

    try {
      setSendingOTP(true);

      const response = await api.post(
        "/auth/send-phone-otp/",
        {
          phone,
        }
      );

      setOtpSent(true);

      setPhoneData((previous) => ({
        ...previous,
        otp: "",
      }));

      if (response.data?.dev_otp) {
        setDevOTP(response.data.dev_otp);
      }

      setMessage(
        response.data?.message ||
          "OTP generated successfully."
      );

      setMessageType("success");
    } catch (err) {
      console.error(err);

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Unable to send OTP. Please try again.";

      setMessage(errorMessage);
      setMessageType("error");
    } finally {
      setSendingOTP(false);
    }
  };

  // ============================================================
  // VERIFY PHONE OTP
  // ============================================================

  const handleVerifyOTP = async () => {
    setMessage("");
    setMessageType("info");

    const phone = phoneData.phone.trim();
    const otp = phoneData.otp.trim();

    if (!phone) {
      setMessage("Please enter your phone number.");
      setMessageType("error");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setMessage(
        "Please enter a valid 10-digit mobile number."
      );
      setMessageType("error");
      return;
    }

    if (!otp) {
      setMessage("Please enter the OTP.");
      setMessageType("error");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setMessage("OTP must be 6 digits.");
      setMessageType("error");
      return;
    }

    try {
      setVerifyingOTP(true);

      const response = await api.post(
        "/auth/verify-phone-otp/",
        {
          phone,
          otp,
        }
      );

      setMessage(
        response.data?.message ||
          "Phone number verified successfully."
      );

      setMessageType("success");

      setOtpSent(false);
      setDevOTP("");

      setPhoneData({
        phone:
          response.data?.phone ||
          phone,
        otp: "",
      });

      try {
        const profileResponse = await api.get("/me/");

        setProfile(profileResponse.data);

        setPhoneData({
          phone:
            profileResponse.data?.phone ||
            phone,
          otp: "",
        });
      } catch (profileError) {
        console.error(profileError);
      }
    } catch (err) {
      console.error(err);

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Unable to verify phone number. Please try again.";

      setMessage(errorMessage);
      setMessageType("error");
    } finally {
      setVerifyingOTP(false);
    }
  };

  // ============================================================
  // SEND CHANGE PHONE OTP
  // ============================================================

  const handleSendChangePhoneOTP = async () => {
    setMessage("");
    setMessageType("info");
    setDevOTP("");

    const phone = phoneData.phone.trim();

    if (!phone) {
      setMessage("Please enter your new phone number.");
      setMessageType("error");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setMessage(
        "Please enter a valid 10-digit mobile number."
      );
      setMessageType("error");
      return;
    }

    if (phone === profile?.phone) {
      setMessage(
        "This is already your current phone number."
      );
      setMessageType("error");
      return;
    }

    try {
      setSendingOTP(true);

      const response = await api.post(
        "/auth/send-change-phone-otp/",
        {
          phone,
        }
      );

      setOtpSent(true);

      setPhoneData((previous) => ({
        ...previous,
        otp: "",
      }));

      if (response.data?.dev_otp) {
        setDevOTP(response.data.dev_otp);
      }

      setMessage(
        response.data?.message ||
          "OTP generated successfully."
      );

      setMessageType("success");
    } catch (err) {
      console.error(err);

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Unable to send OTP. Please try again.";

      setMessage(errorMessage);
      setMessageType("error");
    } finally {
      setSendingOTP(false);
    }
  };

  // ============================================================
  // VERIFY CHANGE PHONE OTP
  // ============================================================

  const handleVerifyChangePhoneOTP = async () => {
    setMessage("");
    setMessageType("info");

    const phone = phoneData.phone.trim();
    const otp = phoneData.otp.trim();

    if (!phone) {
      setMessage("Please enter your new phone number.");
      setMessageType("error");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setMessage(
        "Please enter a valid 10-digit mobile number."
      );
      setMessageType("error");
      return;
    }

    if (!otp) {
      setMessage("Please enter the OTP.");
      setMessageType("error");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setMessage("OTP must be 6 digits.");
      setMessageType("error");
      return;
    }

    try {
      setVerifyingOTP(true);

      const response = await api.post(
        "/auth/verify-change-phone-otp/",
        {
          phone,
          otp,
        }
      );

      setMessage(
        response.data?.message ||
          "Phone number changed successfully."
      );

      setMessageType("success");

      setOtpSent(false);
      setDevOTP("");
      setChangingPhone(false);

      const newPhone =
        response.data?.phone || phone;

      setPhoneData({
        phone: newPhone,
        otp: "",
      });

      try {
        const profileResponse = await api.get("/me/");

        setProfile(profileResponse.data);

        setPhoneData({
          phone:
            profileResponse.data?.phone ||
            newPhone,
          otp: "",
        });
      } catch (profileError) {
        console.error(profileError);
      }
    } catch (err) {
      console.error(err);

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Unable to change phone number. Please try again.";

      setMessage(errorMessage);
      setMessageType("error");
    } finally {
      setVerifyingOTP(false);
    }
  };

  // ============================================================
  // PASSWORD CHANGE
  // ============================================================

  const handlePasswordChange = (event) => {
    setPasswordData({
      ...passwordData,
      [event.target.name]: event.target.value,
    });
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    setMessage("");
    setMessageType("info");

    if (!passwordData.current_password) {
      setMessage("Please enter your current password.");
      setMessageType("error");
      return;
    }

    if (!passwordData.new_password) {
      setMessage("Please enter a new password.");
      setMessageType("error");
      return;
    }

    if (!passwordData.confirm_password) {
      setMessage("Please confirm your new password.");
      setMessageType("error");
      return;
    }

    if (
      passwordData.new_password !==
      passwordData.confirm_password
    ) {
      setMessage("New passwords do not match.");
      setMessageType("error");
      return;
    }

    if (passwordData.new_password.length < 8) {
      setMessage(
        "New password must be at least 8 characters long."
      );
      setMessageType("error");
      return;
    }

    if (
      passwordData.current_password ===
      passwordData.new_password
    ) {
      setMessage(
        "New password must be different from your current password."
      );
      setMessageType("error");
      return;
    }

    try {
      setChangingPassword(true);

      const response = await api.post(
        "/auth/change-password/",
        passwordData
      );

      setMessage(
        response.data?.message ||
          "Password changed successfully."
      );

      setMessageType("success");

      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      console.error(err);

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Unable to change password. Please try again.";

      setMessage(errorMessage);
      setMessageType("error");
    } finally {
      setChangingPassword(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />

          <p className="text-sm text-slate-500">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-lg bg-slate-800 p-2 text-white">
          <SettingsIcon size={22} />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Settings
          </h1>

          <p className="text-sm text-slate-500">
            Manage your account and organization settings
          </p>
        </div>
      </div>

      {/* ======================================================
          PROFILE
      ====================================================== */}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
          <User size={20} className="text-slate-600" />

          <div>
            <h2 className="font-semibold text-slate-800">
              Account Information
            </h2>

            <p className="text-sm text-slate-400">
              Current administrator account
            </p>
          </div>
        </div>

        {profile && (
          <form
            onSubmit={handleSave}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            {/* Username */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Username
              </label>

              <input
                value={profile.username || ""}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
              />
            </div>

            {/* Role */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Role
              </label>

              <input
                value={profile.role || ""}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Phone
              </label>

              {!changingPhone ? (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      name="phone"
                      value={phoneData.phone}
                      disabled
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
                    />

                    {profile.phone_verified && (
                      <CheckCircle
                        size={22}
                        className="shrink-0 text-green-600"
                      />
                    )}
                  </div>

                  {profile.phone_verified ? (
                    <>
                      <p className="mt-2 flex items-center gap-1 text-xs font-medium text-green-600">
                        <CheckCircle size={14} />
                        Phone number verified
                      </p>

                      <button
                        type="button"
                        onClick={handleStartChangePhone}
                        className="mt-3 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil size={16} />
                        Change Phone Number
                      </button>
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-amber-600">
                      Phone number is not verified.
                    </p>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 text-slate-700">
                        <Smartphone size={19} />
                      </div>

                      <div>
                        <h3 className="font-semibold text-slate-800">
                          Change Phone Number
                        </h3>

                        <p className="text-sm text-slate-500">
                          Verify your new mobile number using OTP.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCancelChangePhone}
                      className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-700"
                      title="Cancel"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {!otpSent ? (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          New Phone Number
                        </label>

                        <input
                          value={phoneData.phone}
                          onChange={handlePhoneChange}
                          maxLength={10}
                          inputMode="numeric"
                          placeholder="Enter 10-digit phone number"
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSendChangePhoneOTP}
                        disabled={sendingOTP}
                        className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Smartphone size={17} />

                        {sendingOTP
                          ? "Sending OTP..."
                          : "Send OTP"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Development OTP */}
                      {devOTP && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                          <p className="text-xs font-medium text-amber-700">
                            Development OTP
                          </p>

                          <p className="mt-1 text-lg font-bold tracking-widest text-amber-900">
                            {devOTP}
                          </p>

                          <p className="mt-1 text-xs text-amber-600">
                            This is temporary for development
                            testing only.
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          New Phone Number
                        </label>

                        <input
                          value={phoneData.phone}
                          disabled
                          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Enter OTP
                        </label>

                        <input
                          value={phoneData.otp}
                          onChange={handleOTPChange}
                          maxLength={6}
                          inputMode="numeric"
                          placeholder="Enter 6-digit OTP"
                          className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm tracking-widest outline-none focus:border-slate-500"
                        />
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleVerifyChangePhoneOTP}
                          disabled={verifyingOTP}
                          className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle size={17} />

                          {verifyingOTP
                            ? "Verifying..."
                            : "Verify & Change"}
                        </button>

                        <button
                          type="button"
                          onClick={handleSendChangePhoneOTP}
                          disabled={sendingOTP}
                          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {sendingOTP
                            ? "Sending..."
                            : "Resend OTP"}
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelChangePhone}
                          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Company ID */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Company ID
              </label>

              <input
                value={profile.company_id || ""}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
              />
            </div>

            {/* Phone Verification */}
            {!profile.phone_verified && (
              <div className="md:col-span-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-white p-2 text-slate-700">
                      <Smartphone size={19} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Verify Phone Number
                      </h3>

                      <p className="text-sm text-slate-500">
                        Verify your mobile number using OTP.
                      </p>
                    </div>
                  </div>

                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={sendingOTP}
                      className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Smartphone size={17} />

                      {sendingOTP
                        ? "Sending OTP..."
                        : "Send OTP"}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      {devOTP && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                          <p className="text-xs font-medium text-amber-700">
                            Development OTP
                          </p>

                          <p className="mt-1 text-lg font-bold tracking-widest text-amber-900">
                            {devOTP}
                          </p>

                          <p className="mt-1 text-xs text-amber-600">
                            This is temporary for development
                            testing only.
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Enter OTP
                        </label>

                        <input
                          value={phoneData.otp}
                          onChange={handleOTPChange}
                          maxLength={6}
                          inputMode="numeric"
                          placeholder="Enter 6-digit OTP"
                          className="w-full max-w-sm rounded-lg border border-slate-300 px-4 py-2.5 text-sm tracking-widest outline-none focus:border-slate-500"
                        />
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleVerifyOTP}
                          disabled={verifyingOTP}
                          className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle size={17} />

                          {verifyingOTP
                            ? "Verifying..."
                            : "Verify Phone"}
                        </button>

                        <button
                          type="button"
                          onClick={handleSendOTP}
                          disabled={sendingOTP}
                          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {sendingOTP
                            ? "Sending..."
                            : "Resend OTP"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Save Profile */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                <Save size={17} />

                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        )}

        {message && (
          <div
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
              messageType === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : messageType === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-blue-200 bg-blue-50 text-blue-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {/* ======================================================
          COMPANY
      ====================================================== */}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-slate-100 p-3 text-slate-700">
            <Building2 size={22} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-800">
              Organization
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Company configuration is managed through
              the organization backend.
            </p>

            <p className="mt-3 text-sm text-slate-600">
              Company ID:{" "}
              <span className="font-semibold">
                {user?.company_id || "-"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          SECURITY
      ====================================================== */}

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
              Manage your account password and authentication security.
            </p>
          </div>
        </div>

        {/* Change Password */}
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
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Your account is authenticated using JWT access
          and refresh tokens.
        </p>
      </div>
    </div>
  );
}

export default Settings;