import api from "./api";

export const loginUser = async (username, password) => {
  const identifier = username.trim();

  let response;

  // ==========================================================
  // CUSTOMER MOBILE LOGIN
  // ==========================================================
  // If the user enters a 10-digit mobile number,
  // use the customer-specific login endpoint.
  //
  // This is important because /api/token/ expects
  // the Django username field, while customer mobile
  // login is handled by /api/customer/login/.
  // ==========================================================

  if (/^\d{10}$/.test(identifier)) {
    response = await api.post("/customer/login/", {
      username: identifier,
      password,
    });
  } else {
    // ========================================================
    // NORMAL USERNAME LOGIN
    // ========================================================
    // Admin / Worker / Customer username login continues
    // through the existing common login endpoint.
    // ========================================================

    response = await api.post("/token/", {
      username: identifier,
      password,
    });
  }

  // ==========================================================
  // SAVE TOKENS
  // ==========================================================

  localStorage.setItem(
    "access_token",
    response.data.access
  );

  localStorage.setItem(
    "refresh_token",
    response.data.refresh
  );

  return response.data;
};


// ============================================================
// CURRENT USER
// ============================================================

export const getCurrentUser = async () => {
  const response = await api.get("/me/");

  localStorage.setItem(
    "user",
    JSON.stringify(response.data)
  );

  return response.data;
};


// ============================================================
// LOGOUT
// ============================================================

export const logoutUser = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};