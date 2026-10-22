
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// Detect the Electron desktop app.
const isElectron =
  window.location.protocol === "file:" ||
  (
    ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
    window.location.port === "5173"
  );

// Add the real download URLs when your files are ready.
const ANDROID_DOWNLOAD_URL = "";
const WINDOWS_DOWNLOAD_URL = "";

function Login() {
  const navigate = useNavigate();
  const { login, platformSettings } = useAuth();

  const platformName =
    platformSettings?.platform?.name || "SEIYALAM";

  // LOGIN STATE
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // CUSTOMER REGISTRATION STATE
  const [customerRegistration, setCustomerRegistration] =
    useState(false);

  const [registrationData, setRegistrationData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [registrationLoading, setRegistrationLoading] =
    useState(false);

  const [registrationMessage, setRegistrationMessage] =
    useState("");

  const [registrationError, setRegistrationError] = useState("");

  // FORGOT PASSWORD STATE
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);

  const [forgotData, setForgotData] = useState({
    phone: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [devOtp, setDevOtp] = useState("");

  // CUSTOMER REGISTRATION SETTING
  const allowCustomerRegistration =
    !isElectron &&
    platformSettings?.access?.allow_customer_registration === true;

  // LOGIN
  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.username.trim() || !formData.password) {
      setError("Please enter username and password.");
      return;
    }

    try {
      setLoading(true);

      const currentUser = await login(
        formData.username,
        formData.password
      );

      if (currentUser.role === "FOUNDER") {
        navigate("/founder/dashboard", { replace: true });
      } else if (currentUser.role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else if (currentUser.role === "WORKER") {
        navigate("/worker/dashboard", { replace: true });
      } else if (currentUser.role === "CUSTOMER") {
        navigate("/customer/dashboard", { replace: true });
      } else {
        setError(
          `Login succeeded, but the role "${currentUser.role}" is not recognized.`
        );
      }
    } catch (err) {
      const message =
        err.response?.data?.error?.detail ||
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Invalid username or password.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // CUSTOMER REGISTRATION
  const handleRegistrationChange = (event) => {
    setRegistrationData({
      ...registrationData,
      [event.target.name]: event.target.value,
    });
  };

  const handleCustomerRegistration = async (event) => {
    event.preventDefault();

    setRegistrationError("");
    setRegistrationMessage("");

    const name = registrationData.name.trim();
    const username = registrationData.username.trim();
    const email = registrationData.email.trim();
    const phone = registrationData.phone.trim();
    const password = registrationData.password;
    const confirmPassword = registrationData.confirmPassword;

    if (!name) {
      setRegistrationError("Please enter your name.");
      return;
    }

    if (!username) {
      setRegistrationError("Please enter a username.");
      return;
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setRegistrationError("Please enter a valid email address.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setRegistrationError(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    if (password.length < 8) {
      setRegistrationError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setRegistrationError("Passwords do not match.");
      return;
    }

    try {
      setRegistrationLoading(true);

      const response = await api.post("/customer/register/", {
        name,
        username,
        email,
        phone,
        password,
        confirm_password: confirmPassword,
      });

      setRegistrationMessage(
        response.data.message ||
          "Customer account created successfully."
      );

      setRegistrationData({
        name: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        setCustomerRegistration(false);
        setRegistrationMessage("");
        setRegistrationError("");
      }, 1500);
    } catch (err) {
      const data = err.response?.data;

      let message =
        data?.message ||
        data?.detail ||
        "Unable to create customer account. Change phone number or username.";

      const errors = data?.errors || data;

      if (errors && typeof errors === "object") {
        if (errors.name?.[0]) {
          message = errors.name[0];
        } else if (errors.username?.[0]) {
          message =
            "This username is already taken. Please choose another username.";
        } else if (errors.email?.[0]) {
          message = errors.email[0];
        } else if (errors.phone?.[0]) {
          message =
            "This mobile number is already registered. Please use a different number or log in.";
        } else if (errors.password?.[0]) {
          message = errors.password[0];
        } else if (errors.confirm_password?.[0]) {
          message = errors.confirm_password[0];
        }
      }

      setRegistrationError(message);
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleBackToLoginFromRegistration = () => {
    setCustomerRegistration(false);

    setRegistrationData({
      name: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });

    setRegistrationMessage("");
    setRegistrationError("");
  };

  // FORGOT PASSWORD
  const handleForgotChange = (event) => {
    setForgotData({
      ...forgotData,
      [event.target.name]: event.target.value,
    });
  };

  // SEND OTP
  const handleSendForgotOTP = async (event) => {
    event.preventDefault();

    setForgotError("");
    setForgotMessage("");
    setDevOtp("");

    const phone = forgotData.phone.trim();

    if (!/^\d{10}$/.test(phone)) {
      setForgotError(
        "Please enter a valid 10-digit phone number."
      );
      return;
    }

    try {
      setForgotLoading(true);

      const response = await api.post(
        "/auth/forgot-password/send-otp/",
        { phone }
      );

      setForgotMessage(
        response.data.message || "OTP generated successfully."
      );

      if (response.data.dev_otp) {
        setDevOtp(response.data.dev_otp);
      }

      setForgotStep(2);
    } catch (err) {
      setForgotError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Unable to send OTP."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  // RESET PASSWORD
  const handleResetPassword = async (event) => {
    event.preventDefault();

    setForgotError("");
    setForgotMessage("");

    const phone = forgotData.phone.trim();
    const otp = forgotData.otp.trim();
    const newPassword = forgotData.newPassword;
    const confirmPassword = forgotData.confirmPassword;

    if (!/^\d{10}$/.test(phone)) {
      setForgotError(
        "Please enter a valid 10-digit phone number."
      );
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setForgotError("Please enter the 6-digit OTP.");
      return;
    }

    if (newPassword.length < 8) {
      setForgotError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match.");
      return;
    }

    try {
      setForgotLoading(true);

      const response = await api.post(
        "/auth/forgot-password/reset/",
        {
          phone,
          otp,
          new_password: newPassword,
        }
      );

      setForgotMessage(
        response.data.message || "Password reset successfully."
      );

      setForgotData({
        phone: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
      });

      setDevOtp("");

      setTimeout(() => {
        setForgotPassword(false);
        setForgotStep(1);
        setForgotMessage("");
      }, 1500);
    } catch (err) {
      setForgotError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Unable to reset password."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  // BACK TO LOGIN FROM FORGOT PASSWORD
  const handleBackToLogin = () => {
    setForgotPassword(false);
    setForgotStep(1);

    setForgotData({
      phone: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    });

    setForgotMessage("");
    setForgotError("");
    setDevOtp("");
  };

  // SHARED AUTHENTICATION PAGE STYLES
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

  const primaryButtonClass =
    "w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

  const authCard = (title, subtitle, content) => (
    <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-black text-white shadow-lg shadow-blue-600/25">
          S
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {platformName}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Service Management Platform
        </p>

        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
          {title}
        </p>

        {subtitle && (
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>

      {content}

      <div className="mt-8 border-t border-slate-100 pt-5 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {platformName}. All rights reserved.
      </div>
    </div>
  );

  // FORGOT PASSWORD SCREEN
  if (forgotPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
        {authCard(
          "Reset Password",
          "Recover access to your account",
          <>
            {forgotMessage && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {forgotMessage}
              </div>
            )}

            {forgotError && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {forgotError}
              </div>
            )}

            {forgotStep === 1 && (
              <form onSubmit={handleSendForgotOTP} className="space-y-5">
                <div>
                  <label
                    htmlFor="forgot-phone"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Registered Phone Number
                  </label>

                  <input
                    id="forgot-phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength="10"
                    value={forgotData.phone}
                    onChange={handleForgotChange}
                    placeholder="Enter 10-digit phone number"
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className={primaryButtonClass}
                >
                  {forgotLoading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label
                    htmlFor="forgot-phone-display"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Phone Number
                  </label>

                  <input
                    id="forgot-phone-display"
                    type="text"
                    value={forgotData.phone}
                    disabled
                    className={`${inputClass} cursor-not-allowed opacity-70`}
                  />
                </div>

                {devOtp && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="mb-1 text-xs font-semibold text-amber-700">
                      Development OTP
                    </p>
                    <p className="text-xl font-bold tracking-[0.3em] text-amber-900">
                      {devOtp}
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="forgot-otp"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    OTP
                  </label>

                  <input
                    id="forgot-otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength="6"
                    value={forgotData.otp}
                    onChange={handleForgotChange}
                    placeholder="Enter 6-digit OTP"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    New Password
                  </label>

                  <input
                    id="new-password"
                    name="newPassword"
                    type="password"
                    value={forgotData.newPassword}
                    onChange={handleForgotChange}
                    placeholder="Enter new password"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Confirm Password
                  </label>

                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={forgotData.confirmPassword}
                    onChange={handleForgotChange}
                    placeholder="Confirm new password"
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className={primaryButtonClass}
                >
                  {forgotLoading ? "Resetting Password..." : "Reset Password"}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={handleBackToLogin}
              className="mt-5 w-full text-sm font-semibold text-slate-500 transition hover:text-blue-600"
            >
              ← Back to Login
            </button>
          </>
        )}
      </div>
    );
  }

  // CUSTOMER REGISTRATION SCREEN
  if (customerRegistration && allowCustomerRegistration) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
        {authCard(
          "Customer Registration",
          "Create your customer account",
          <>
            {registrationMessage && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {registrationMessage}
              </div>
            )}

            {registrationError && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {registrationError}
              </div>
            )}

            <form
              onSubmit={handleCustomerRegistration}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="registration-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>

                <input
                  id="registration-name"
                  name="name"
                  type="text"
                  value={registrationData.name}
                  onChange={handleRegistrationChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="registration-username"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Username
                </label>

                <input
                  id="registration-username"
                  name="username"
                  type="text"
                  value={registrationData.username}
                  onChange={handleRegistrationChange}
                  placeholder="Choose a username"
                  autoComplete="username"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="registration-email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <input
                  id="registration-email"
                  name="email"
                  type="email"
                  value={registrationData.email}
                  onChange={handleRegistrationChange}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="registration-phone"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Mobile Number
                </label>

                <input
                  id="registration-phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength="10"
                  value={registrationData.phone}
                  onChange={handleRegistrationChange}
                  placeholder="Enter 10-digit mobile number"
                  autoComplete="tel"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="registration-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <input
                  id="registration-password"
                  name="password"
                  type="password"
                  value={registrationData.password}
                  onChange={handleRegistrationChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="registration-confirm-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm Password
                </label>

                <input
                  id="registration-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={registrationData.confirmPassword}
                  onChange={handleRegistrationChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={registrationLoading}
                className={primaryButtonClass}
              >
                {registrationLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleBackToLoginFromRegistration}
              className="mt-5 w-full text-sm font-semibold text-slate-500 transition hover:text-blue-600"
            >
              ← Back to Login
            </button>
          </>
        )}
      </div>
    );
  }

  // NORMAL LOGIN SCREEN
  // Login logic is unchanged; only the presentation has been redesigned.
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 right-0 h-96 w-96 rounded-full bg-indigo-100/70 blur-3xl" />

      {/* Top navigation */}
      <header className="relative z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white shadow-lg shadow-blue-600/20">
              S
            </div>

            <div>
              <p className="text-lg font-extrabold tracking-tight text-slate-900">
                {platformName}
              </p>
              <p className="text-xs text-slate-500">
                Service Management Platform
              </p>
            </div>
          </div>

          <span className="hidden items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            One platform. Every service.
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-77px)] max-w-7xl items-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-14">
        {/* Left brand panel */}
        <section className="mx-auto w-full max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            A smarter way to manage services
          </div>

          <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Better service.
            <span className="mt-2 block text-blue-600">
              A smarter tomorrow.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
            Manage service requests, coordinate your team, and keep every
            customer informed — all from one connected platform.
          </p>

          {/* Feature highlights */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <rect x="5" y="3" width="14" height="18" rx="2" />
                  <path d="M9 7h6M9 11h6M9 15h3" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Organized workflow
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Keep requests and work progress in one place.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <circle cx="9" cy="8" r="3" />
                  <path d="M3.5 19v-1.5a5.5 5.5 0 0 1 11 0V19M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 4.8V19" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Connected teams
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Help customers, workers, and managers stay aligned.
                </p>
              </div>
            </div>
          </div>

          {/* Downloads */}
          <div className="mt-10">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Get the app
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                Take SEIYALAM with you
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Choose the version that fits the way you work.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Android: one app for customers and workers */}
              <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-200 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-6 w-6"
                      aria-hidden="true"
                    >
                      <rect x="6" y="2" width="12" height="20" rx="2.5" />
                      <path d="M10 5h4M11 19h2" />
                    </svg>
                  </div>

                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green-700">
                    Android
                  </span>
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-900">
                  Mobile App
                </h3>

                <p className="mt-2 min-h-[60px] text-sm leading-5 text-slate-500">
                  One app for customers and workers. Sign in with your own
                  account to access your role.
                </p>

                {ANDROID_DOWNLOAD_URL ? (
                  <a
                    href={ANDROID_DOWNLOAD_URL}
                    download
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M12 3v12m-5-5 5 5 5-5M5 20h14" />
                    </svg>
                    Download Android App
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="The Android download link has not been configured yet."
                    className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400"
                  >
                    Android App Coming Soon
                  </button>
                )}

                <p className="mt-3 text-center text-xs text-slate-400">
                  For customers and workers
                </p>
              </div>

              {/* Windows desktop */}
              <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-6 w-6"
                      aria-hidden="true"
                    >
                      <rect x="2.5" y="3.5" width="19" height="13" rx="1.5" />
                      <path d="M8 20.5h8M12 16.5v4" />
                    </svg>
                  </div>

                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    Windows
                  </span>
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-900">
                  Desktop App
                </h3>

                <p className="mt-2 min-h-[60px] text-sm leading-5 text-slate-500">
                  Use the desktop experience for office work, administration,
                  and managing service operations.
                </p>

                {WINDOWS_DOWNLOAD_URL ? (
                  <a
                    href={WINDOWS_DOWNLOAD_URL}
                    download
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M12 3v12m-5-5 5 5 5-5M5 20h14" />
                    </svg>
                    Download for Windows
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="The Windows download link has not been configured yet."
                    className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400"
                  >
                    Windows App Coming Soon
                  </button>
                )}

                <p className="mt-3 text-center text-xs text-slate-400">
                  For office and management teams
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-400">
              Download links will be enabled when the official installation
              files are published.
            </p>
          </div>
        </section>

        {/* Login card */}
        <section className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-2xl shadow-slate-900/5 sm:p-9">
            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
                </svg>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to continue to your SEIYALAM workspace.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Username or Mobile Number
                </label>

                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username or mobile number"
                  autoComplete="username"
                  className={inputClass}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>
                </div>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={primaryButtonClass}
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Signing in...
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2">
                    Sign In
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14m-6-6 6 6-6 6" />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* FORGOT PASSWORD */}
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setForgotPassword(true);
                  setError("");
                }}
                className="text-sm font-semibold text-slate-500 transition hover:text-blue-600"
              >
                Forgot Password?
              </button>
            </div>

            {/* CUSTOMER REGISTRATION: WEBSITE ONLY */}
            {allowCustomerRegistration && (
              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                <p className="text-sm text-slate-600">
                  New to {platformName}?
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setCustomerRegistration(true);
                    setError("");
                  }}
                  className="mt-1 text-sm font-bold text-blue-600 transition hover:text-blue-800"
                >
                  Create Customer Account
                </button>
              </div>
            )}

            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M12 3 5 6v5c0 4.5 3 7.5 7 10 4-2.5 7-5.5 7-10V6l-7-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Secure role-based access
            </div>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-slate-400">
            By signing in, you agree to use {platformName} responsibly.
          </p>
        </section>
      </main>
    </div>
  );
}

export default Login;
