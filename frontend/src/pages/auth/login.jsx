import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function Login() {
  const navigate = useNavigate();

  const {
    login,
    platformSettings,
  } = useAuth();

  const platformName =
    platformSettings?.platform?.name || "SEIYALAM";

  // ============================================================
  // LOGIN STATE
  // ============================================================

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ============================================================
  // CUSTOMER REGISTRATION STATE
  // ============================================================

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

  const [registrationError, setRegistrationError] =
    useState("");

  // ============================================================
  // FORGOT PASSWORD STATE
  // ============================================================

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

  // ============================================================
  // CUSTOMER REGISTRATION SETTING
  // ============================================================

  const allowCustomerRegistration =
    platformSettings?.access?.allow_customer_registration === true;

  // ============================================================
  // LOGIN
  // ============================================================

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.username || !formData.password) {
      setError("Please enter username and password.");
      return;
    }

    try {
      setLoading(true);

      const currentUser = await login(
        formData.username,
        formData.password
      );

      if (currentUser.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (currentUser.role === "WORKER") {
        navigate("/worker/dashboard");
      } else if (currentUser.role === "CUSTOMER") {
        navigate("/customer/dashboard");
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

  // ============================================================
  // CUSTOMER REGISTRATION
  // ============================================================

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
      setRegistrationError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setRegistrationLoading(true);

      const response = await api.post(
        "/customer/register/",
        {
          name,
          username,
          email,
          phone,
          password,
          confirm_password: confirmPassword,
        }
      );

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

      // Return to login after successful registration.
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
        "Unable to create customer account.";

      // Handle Django/DRF validation errors.
      const errors = data?.errors || data;

      if (errors && typeof errors === "object") {
        if (errors.name?.[0]) {
          message = errors.name[0];
        } else if (errors.username?.[0]) {
          message =
            "This username is already taken. Please choose another username.";
        } else if (errors.email?.[0]) {
          message =
            errors.email[0];
        } else if (errors.phone?.[0]) {
          message =
            "This mobile number is already registered. Please use a different number or login.";
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

  // ============================================================
  // BACK TO LOGIN FROM REGISTRATION
  // ============================================================

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

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  const handleForgotChange = (event) => {
    setForgotData({
      ...forgotData,
      [event.target.name]: event.target.value,
    });
  };

  // ============================================================
  // SEND OTP
  // ============================================================

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
        {
          phone,
        }
      );

      setForgotMessage(
        response.data.message ||
          "OTP generated successfully."
      );

      // Development only.
      if (response.data.dev_otp) {
        setDevOtp(response.data.dev_otp);
      }

      setForgotStep(2);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Unable to send OTP.";

      setForgotError(message);
    } finally {
      setForgotLoading(false);
    }
  };

  // ============================================================
  // RESET PASSWORD
  // ============================================================

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
      setForgotError(
        "Please enter the 6-digit OTP."
      );
      return;
    }

    if (newPassword.length < 8) {
      setForgotError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError(
        "Passwords do not match."
      );
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
        response.data.message ||
          "Password reset successfully."
      );

      setForgotData({
        phone: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
      });

      setDevOtp("");

      // Go back to login after successful reset.
      setTimeout(() => {
        setForgotPassword(false);
        setForgotStep(1);
        setForgotMessage("");
      }, 1500);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Unable to reset password.";

      setForgotError(message);
    } finally {
      setForgotLoading(false);
    }
  };

  // ============================================================
  // BACK TO LOGIN
  // ============================================================

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

  // ============================================================
  // FORGOT PASSWORD SCREEN
  // ============================================================

  if (forgotPassword) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          <div className="bg-white rounded-2xl shadow-xl p-8">

            {/* HEADER */}

            <div className="text-center mb-8">

              <h1 className="text-4xl font-bold text-slate-800">
                {platformName}
              </h1>

              <p className="mt-2 text-slate-500">
                Service Management Platform
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Reset Password
              </p>

            </div>

            {/* SUCCESS MESSAGE */}

            {forgotMessage && (
              <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600">
                {forgotMessage}
              </div>
            )}

            {/* ERROR MESSAGE */}

            {forgotError && (
              <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {forgotError}
              </div>
            )}

            {/* ==================================================
                STEP 1 - PHONE NUMBER
            ================================================== */}

            {forgotStep === 1 && (
              <form
                onSubmit={handleSendForgotOTP}
                className="space-y-5"
              >

                <div>
                  <label
                    htmlFor="forgot-phone"
                    className="block text-sm font-medium text-slate-700 mb-2"
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
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full rounded-lg bg-slate-800 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {forgotLoading
                    ? "Sending OTP..."
                    : "Send OTP"}
                </button>

              </form>
            )}

            {/* ==================================================
                STEP 2 - OTP + NEW PASSWORD
            ================================================== */}

            {forgotStep === 2 && (
              <form
                onSubmit={handleResetPassword}
                className="space-y-5"
              >

                {/* PHONE */}

                <div>
                  <label
                    htmlFor="forgot-phone-display"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Phone Number
                  </label>

                  <input
                    id="forgot-phone-display"
                    type="text"
                    value={forgotData.phone}
                    disabled
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
                  />
                </div>

                {/* DEVELOPMENT OTP */}

                {devOtp && (
                  <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3">

                    <p className="text-xs text-yellow-700 mb-1">
                      Development OTP
                    </p>

                    <p className="text-lg font-bold text-yellow-800 tracking-widest">
                      {devOtp}
                    </p>

                  </div>
                )}

                {/* OTP */}

                <div>
                  <label
                    htmlFor="forgot-otp"
                    className="block text-sm font-medium text-slate-700 mb-2"
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
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {/* NEW PASSWORD */}

                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-slate-700 mb-2"
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
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {/* CONFIRM PASSWORD */}

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-slate-700 mb-2"
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
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {/* RESET */}

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full rounded-lg bg-slate-800 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {forgotLoading
                    ? "Resetting Password..."
                    : "Reset Password"}
                </button>

              </form>
            )}

            {/* BACK TO LOGIN */}

            <button
              type="button"
              onClick={handleBackToLogin}
              className="mt-5 w-full text-sm font-medium text-slate-500 hover:text-slate-800 transition"
            >
              ← Back to Login
            </button>

            <div className="mt-8 text-center text-xs text-slate-400">
              {platformName} • Service Management Platform
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // CUSTOMER REGISTRATION SCREEN
  // ============================================================

  if (customerRegistration) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          <div className="bg-white rounded-2xl shadow-xl p-8">

            {/* HEADER */}

            <div className="text-center mb-8">

              <h1 className="text-4xl font-bold text-slate-800">
                {platformName}
              </h1>

              <p className="mt-2 text-slate-500">
                Service Management Platform
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Customer Registration
              </p>

            </div>

            {/* SUCCESS MESSAGE */}

            {registrationMessage && (
              <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600">
                {registrationMessage}
              </div>
            )}

            {/* ERROR MESSAGE */}

            {registrationError && (
              <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {registrationError}
              </div>
            )}

            <form
              onSubmit={handleCustomerRegistration}
              className="space-y-5"
            >

              {/* NAME */}

              <div>
                <label
                  htmlFor="registration-name"
                  className="block text-sm font-medium text-slate-700 mb-2"
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
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* USERNAME */}

              <div>
                <label
                  htmlFor="registration-username"
                  className="block text-sm font-medium text-slate-700 mb-2"
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
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* EMAIL */}

              <div>
                <label
                  htmlFor="registration-email"
                  className="block text-sm font-medium text-slate-700 mb-2"
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
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* MOBILE */}

              <div>
                <label
                  htmlFor="registration-phone"
                  className="block text-sm font-medium text-slate-700 mb-2"
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
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* PASSWORD */}

              <div>
                <label
                  htmlFor="registration-password"
                  className="block text-sm font-medium text-slate-700 mb-2"
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
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* CONFIRM PASSWORD */}

              <div>
                <label
                  htmlFor="registration-confirm-password"
                  className="block text-sm font-medium text-slate-700 mb-2"
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
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* REGISTER */}

              <button
                type="submit"
                disabled={registrationLoading}
                className="w-full rounded-lg bg-slate-800 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {registrationLoading
                  ? "Creating Account..."
                  : "Create Account"}
              </button>

            </form>

            {/* BACK TO LOGIN */}

            <button
              type="button"
              onClick={handleBackToLoginFromRegistration}
              className="mt-5 w-full text-sm font-medium text-slate-500 hover:text-slate-800 transition"
            >
              ← Back to Login
            </button>

            <div className="mt-8 text-center text-xs text-slate-400">
              {platformName} • Service Management Platform
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // NORMAL LOGIN SCREEN
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="bg-white rounded-2xl shadow-xl p-8">

          <div className="text-center mb-8">

            <h1 className="text-4xl font-bold text-slate-800">
              {platformName}
            </h1>

            <p className="mt-2 text-slate-500">
              Service Management Platform
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Login
            </p>

          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* USERNAME / MOBILE */}

            <div>

              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700 mb-2"
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
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />

            </div>

            {/* PASSWORD */}

            <div>

              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />

            </div>

            {/* SIGN IN */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-800 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

          </form>

          {/* FORGOT PASSWORD */}

          <div className="mt-4 text-center">

            <button
              type="button"
              onClick={() => {
                setForgotPassword(true);
                setError("");
              }}
              className="text-sm font-medium text-slate-500 hover:text-slate-800 transition"
            >
              Forgot Password?
            </button>

          </div>

          {/* CUSTOMER REGISTRATION */}

          {allowCustomerRegistration && (
            <div className="mt-5 text-center">

              <p className="text-sm text-slate-500">
                New customer?
              </p>

              <button
                type="button"
                onClick={() => {
                  setCustomerRegistration(true);
                  setError("");
                }}
                className="mt-1 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
              >
                Create Customer Account
              </button>

            </div>
          )}

          <div className="mt-8 text-center text-xs text-slate-400">
            {platformName} • Service Management Platform
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;