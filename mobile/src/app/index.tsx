
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://seiyalam.onrender.com/api";
const TOKEN_KEY = "seiyalam_customer_access";
const REFRESH_KEY = "seiyalam_customer_refresh";

const api = axios.create({
  baseURL: API_URL,
  timeout: 45000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type AnyRecord = Record<string, any>;

function getError(error: any): string {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.detail) return data.detail;

  if (data && typeof data === "object") {
    for (const value of Object.values(data)) {
      if (Array.isArray(value) && value.length) return String(value[0]);
      if (typeof value === "string") return value;
    }
  }

  if (error?.code === "ECONNABORTED") {
    return "The server took too long to respond. Please try again.";
  }

  return error?.message || "Something went wrong. Please try again.";
}

function toArray(value: any): AnyRecord[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.companies)) return value.companies;
  if (Array.isArray(value?.requests)) return value.requests;
  return [];
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor="#94a3b8"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || "default"}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

function Button({
  title,
  onPress,
  loading,
  secondary,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  secondary?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.button, secondary && styles.secondaryButton]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? "#0f766e" : "#ffffff"} />
      ) : (
        <Text style={[styles.buttonText, secondary && styles.secondaryText]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function Index() {
  const [screen, setScreen] = useState<"auth" | "dashboard" | "newRequest" | "requests">("auth");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [user, setUser] = useState<AnyRecord | null>(null);
  const [dashboard, setDashboard] = useState<AnyRecord | null>(null);
  const [companies, setCompanies] = useState<AnyRecord[]>([]);
  const [requests, setRequests] = useState<AnyRecord[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<AnyRecord | null>(null);

  const [requestData, setRequestData] = useState({
    title: "",
    description: "",
    phone: "",
    address: "",
  });

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const loadCustomerData = useCallback(async () => {
    const [profileResult, dashboardResult, companyResult, requestResult] =
      await Promise.allSettled([
        api.get("/me/"),
        api.get("/dashboard/customer/"),
        api.get("/customer/companies/"),
        api.get("/service-requests/my/"),
      ]);

    if (profileResult.status === "fulfilled") {
      setUser(profileResult.value.data);
    }

    if (dashboardResult.status === "fulfilled") {
      setDashboard(dashboardResult.value.data);
    }

    if (companyResult.status === "fulfilled") {
      setCompanies(toArray(companyResult.value.data));
    }

    if (requestResult.status === "fulfilled") {
      setRequests(toArray(requestResult.value.data));
    }

    const failed = [
      profileResult,
      dashboardResult,
      companyResult,
      requestResult,
    ].some((result) => result.status === "rejected");

    if (failed) {
      setErrorMessage(
        "Some dashboard information could not load. Pull down to refresh or try again."
      );
    } else {
      setErrorMessage("");
    }
  }, []);

  const restoreSession = useCallback(async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
      setLoading(true);
      const response = await api.get("/me/");
      setUser(response.data);
      setScreen("dashboard");
      await loadCustomerData();
    } catch {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
    } finally {
      setLoading(false);
    }
  }, [loadCustomerData]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async () => {
    clearMessages();

    if (!loginData.username.trim() || !loginData.password) {
      setErrorMessage("Enter your username or phone number and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/customer/login/`,
        {
          username: loginData.username.trim(),
          password: loginData.password,
        },
        { timeout: 45000 }
      );

      const access = response.data?.access;
      const refresh = response.data?.refresh;

      if (!access) {
        throw new Error("The server did not return an access token.");
      }

      await AsyncStorage.setItem(TOKEN_KEY, access);
      if (refresh) await AsyncStorage.setItem(REFRESH_KEY, refresh);

      setScreen("dashboard");
      await loadCustomerData();
    } catch (error: any) {
      setErrorMessage(getError(error));
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    clearMessages();

    const name = registerData.name.trim();
    const username = registerData.username.trim();
    const email = registerData.email.trim();
    const phone = registerData.phone.trim();

    if (!name || !username || !phone || !registerData.password) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setErrorMessage("Enter a valid 10-digit phone number.");
      return;
    }

    if (registerData.password.length < 8) {
      setErrorMessage("Password must contain at least 8 characters.");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/customer/register/`,
        {
          name,
          username,
          email,
          phone,
          password: registerData.password,
          confirm_password: registerData.confirmPassword,
        },
        { timeout: 45000 }
      );

      setSuccessMessage(
        response.data?.message ||
          "Registration successful. You can now log in."
      );
      setAuthMode("login");
      setLoginData({ username, password: "" });
      setRegisterData({
        name: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      setErrorMessage(getError(error));
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = async () => {
    setRefreshing(true);
    try {
      await loadCustomerData();
    } catch (error: any) {
      setErrorMessage(getError(error));
    } finally {
      setRefreshing(false);
    }
  };

  const submitRequest = async () => {
    clearMessages();

    if (!selectedCompany) {
      setErrorMessage("Select a company before submitting your request.");
      return;
    }

    if (!requestData.title.trim() || !requestData.description.trim()) {
      setErrorMessage("Enter a request title and description.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/service-requests/", {
        company_id: selectedCompany.id,
        title: requestData.title.trim(),
        description: requestData.description.trim(),
        phone: requestData.phone.trim(),
        address: requestData.address.trim(),
      });

      setRequestData({ title: "", description: "", phone: "", address: "" });
      setSuccessMessage("Your service request has been submitted.");
      await loadCustomerData();
      setScreen("requests");
    } catch (error: any) {
      setErrorMessage(getError(error));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
    setUser(null);
    setDashboard(null);
    setRequests([]);
    setCompanies([]);
    setSelectedCompany(null);
    setScreen("auth");
    setAuthMode("login");
    clearMessages();
  };

  const displayName =
    user?.name || user?.username || registerData.name || "Customer";

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>SEIYALAM</Text>
        <Text style={styles.tagline}>Services, connected.</Text>
      </View>
      {screen !== "auth" && (
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderMessages = () => (
    <>
      {!!errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
      {!!successMessage && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}
    </>
  );

  const renderAuth = () => (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.authContent}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>
          {authMode === "login" ? "Welcome back" : "Create your account"}
        </Text>
        <Text style={styles.heroDescription}>
          {authMode === "login"
            ? "Sign in to manage your service requests."
            : "Register as a customer to get started."}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <TouchableOpacity
            onPress={() => {
              setAuthMode("login");
              clearMessages();
            }}
            style={[styles.switchItem, authMode === "login" && styles.switchActive]}
          >
            <Text style={[styles.switchText, authMode === "login" && styles.switchTextActive]}>
              Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setAuthMode("register");
              clearMessages();
            }}
            style={[styles.switchItem, authMode === "register" && styles.switchActive]}
          >
            <Text style={[styles.switchText, authMode === "register" && styles.switchTextActive]}>
              Register
            </Text>
          </TouchableOpacity>
        </View>

        {renderMessages()}

        {authMode === "login" ? (
          <>
            <Field
              label="Username or phone number"
              value={loginData.username}
              onChangeText={(v) => setLoginData({ ...loginData, username: v })}
              placeholder="Enter username or phone"
            />
            <Field
              label="Password"
              value={loginData.password}
              onChangeText={(v) => setLoginData({ ...loginData, password: v })}
              secureTextEntry
            />
            <Button title="Sign in" onPress={login} loading={loading} />
            <Text style={styles.helperText}>
              Customer login uses your SEIYALAM account.
            </Text>
          </>
        ) : (
          <>
            <Field
              label="Full name *"
              value={registerData.name}
              onChangeText={(v) => setRegisterData({ ...registerData, name: v })}
            />
            <Field
              label="Username *"
              value={registerData.username}
              onChangeText={(v) => setRegisterData({ ...registerData, username: v })}
            />
            <Field
              label="Email (optional)"
              value={registerData.email}
              onChangeText={(v) => setRegisterData({ ...registerData, email: v })}
              keyboardType="email-address"
            />
            <Field
              label="10-digit phone number *"
              value={registerData.phone}
              onChangeText={(v) =>
                setRegisterData({ ...registerData, phone: v.replace(/\D/g, "").slice(0, 10) })
              }
              keyboardType="phone-pad"
            />
            <Field
              label="Password (minimum 8 characters) *"
              value={registerData.password}
              onChangeText={(v) => setRegisterData({ ...registerData, password: v })}
              secureTextEntry
            />
            <Field
              label="Confirm password *"
              value={registerData.confirmPassword}
              onChangeText={(v) => setRegisterData({ ...registerData, confirmPassword: v })}
              secureTextEntry
            />
            <Button title="Create account" onPress={register} loading={loading} />
          </>
        )}
      </View>
    </ScrollView>
  );

  const renderDashboard = () => (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refreshDashboard} />
      }
    >
      {renderMessages()}

      <View style={styles.welcomeBlock}>
        <Text style={styles.welcomeLabel}>CUSTOMER DASHBOARD</Text>
        <Text style={styles.welcomeTitle}>Hi, {displayName} 👋</Text>
        <Text style={styles.muted}>Manage your service requests in one place.</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{requests.length}</Text>
          <Text style={styles.statLabel}>My requests</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{companies.length}</Text>
          <Text style={styles.statLabel}>Companies</Text>
        </View>
      </View>

      <Button
        title="+ Create service request"
        onPress={() => {
          clearMessages();
          setScreen("newRequest");
        }}
      />
      <Button
        title="View my requests"
        onPress={() => {
          clearMessages();
          setScreen("requests");
        }}
        secondary
      />

      <Text style={styles.sectionTitle}>Recent requests</Text>
      {requests.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No requests yet</Text>
          <Text style={styles.muted}>Create a service request to get started.</Text>
        </View>
      ) : (
        requests.slice(0, 3).map((item, index) => (
          <View style={styles.requestCard} key={String(item.id ?? index)}>
            <Text style={styles.requestNumber}>
              {item.request_number || `Request #${item.id}`}
            </Text>
            <Text style={styles.requestTitle}>{item.title || "Service request"}</Text>
            <Text style={styles.muted} numberOfLines={2}>
              {item.description || ""}
            </Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{String(item.status || "Pending").replaceAll("_", " ")}</Text>
            </View>
          </View>
        ))
      )}

      {!!dashboard && (
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Account overview</Text>
          <Text style={styles.muted}>
            Your dashboard data is being retrieved from the SEIYALAM backend.
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderCompanies = () => {
    if (companies.length === 0) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No companies available</Text>
          <Text style={styles.muted}>
            No companies were returned by the server. Refresh and try again later.
          </Text>
        </View>
      );
    }

    return companies.map((company, index) => {
      const isSelected = selectedCompany?.id === company.id;
      return (
        <TouchableOpacity
          key={String(company.id ?? index)}
          onPress={() => setSelectedCompany(company)}
          style={[styles.companyCard, isSelected && styles.companySelected]}
        >
          <View style={styles.companyRadio}>
            <Text style={styles.companyRadioText}>{isSelected ? "✓" : ""}</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.requestTitle}>
              {company.name || company.company_name || company.companyName || `Company ${company.id ?? index + 1}`}
            </Text>
            {!!(company.address || company.location) && (
              <Text style={styles.muted}>{company.address || company.location}</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    });
  };

  const renderNewRequest = () => (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => setScreen("dashboard")}>
        <Text style={styles.backLink}>‹ Back to dashboard</Text>
      </TouchableOpacity>
      <Text style={styles.pageTitle}>New service request</Text>
      <Text style={styles.muted}>
        Choose a company, describe the service you need, and submit your request.
      </Text>

      {renderMessages()}

      <Text style={styles.sectionTitle}>1. Select a company *</Text>
      {renderCompanies()}

      <Text style={styles.sectionTitle}>2. Request details</Text>
      <Field
        label="Request title *"
        value={requestData.title}
        onChangeText={(v) => setRequestData({ ...requestData, title: v })}
        placeholder="e.g. Air conditioner repair"
      />
      <Field
        label="Description *"
        value={requestData.description}
        onChangeText={(v) => setRequestData({ ...requestData, description: v })}
        placeholder="Explain the service you need"
        multiline
      />
      <Field
        label="Contact phone"
        value={requestData.phone}
        onChangeText={(v) => setRequestData({ ...requestData, phone: v })}
        keyboardType="phone-pad"
      />
      <Field
        label="Service address"
        value={requestData.address}
        onChangeText={(v) => setRequestData({ ...requestData, address: v })}
        placeholder="Where is the service required?"
        multiline
      />

      <Button
        title="Submit service request"
        onPress={submitRequest}
        loading={loading}
      />
    </ScrollView>
  );

  const renderRequests = () => (
    <View style={styles.flex}>
      <View style={styles.listHeading}>
        <TouchableOpacity onPress={() => setScreen("dashboard")}>
          <Text style={styles.backLink}>‹ Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>My service requests</Text>
        <Text style={styles.muted}>Pull down to refresh the list.</Text>
      </View>
      {renderMessages()}
      <FlatList
        data={requests}
        keyExtractor={(item, index) => String(item.id ?? index)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshDashboard} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.muted}>Your submitted requests will appear here.</Text>
            <Button title="Create request" onPress={() => setScreen("newRequest")} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.requestCard}>
            <Text style={styles.requestNumber}>
              {item.request_number || `Request #${item.id}`}
            </Text>
            <Text style={styles.requestTitle}>{item.title || "Service request"}</Text>
            <Text style={styles.muted}>{item.description || ""}</Text>
            {!!item.company_details && (
              <Text style={styles.companyName}>
                {item.company_details.name || item.company_details.company_name || ""}
              </Text>
            )}
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>
                {String(item.status || "Pending").replaceAll("_", " ")}
              </Text>
            </View>
            {!!item.created_at && (
              <Text style={styles.dateText}>
                Submitted: {new Date(item.created_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}
      />
      <View style={styles.bottomAction}>
        <Button title="+ New request" onPress={() => setScreen("newRequest")} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0f766e" />
      {renderHeader()}
      {loading && screen === "auth" && !successMessage ? (
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="#0f766e" />
          <Text style={styles.muted}>Connecting to SEIYALAM...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {screen === "auth" && renderAuth()}
          {screen === "dashboard" && renderDashboard()}
          {screen === "newRequest" && renderNewRequest()}
          {screen === "requests" && renderRequests()}
        </KeyboardAvoidingView>
      )}
      {screen !== "auth" && (
        <View style={styles.bottomNav}>
          <TouchableOpacity onPress={() => { clearMessages(); setScreen("dashboard"); }}>
            <Text style={[styles.navText, screen === "dashboard" && styles.navActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { clearMessages(); setScreen("newRequest"); }}>
            <Text style={[styles.navText, screen === "newRequest" && styles.navActive]}>New request</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { clearMessages(); setScreen("requests"); }}>
            <Text style={[styles.navText, screen === "requests" && styles.navActive]}>My requests</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  flex: { flex: 1 },
  header: {
    backgroundColor: "#0f766e",
    paddingHorizontal: 20,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { color: "#ffffff", fontSize: 22, fontWeight: "900", letterSpacing: 1.4 },
  tagline: { color: "#ccfbf1", fontSize: 12, marginTop: 2 },
  logoutButton: { borderColor: "#99f6e4", borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8 },
  logoutText: { color: "#ffffff", fontWeight: "700" },
  authContent: { padding: 20, paddingBottom: 36 },
  hero: { paddingVertical: 22 },
  heroTitle: { fontSize: 29, color: "#0f172a", fontWeight: "900" },
  heroDescription: { color: "#64748b", marginTop: 8, fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: "#ffffff", padding: 18, borderRadius: 18, borderWidth: 1, borderColor: "#e2e8f0" },
  switchRow: { flexDirection: "row", backgroundColor: "#f1f5f9", padding: 4, borderRadius: 12, marginBottom: 20 },
  switchItem: { flex: 1, paddingVertical: 11, alignItems: "center", borderRadius: 9 },
  switchActive: { backgroundColor: "#ccfbf1" },
  switchText: { color: "#64748b", fontWeight: "700" },
  switchTextActive: { color: "#115e59" },
  field: { marginBottom: 15 },
  label: { color: "#334155", fontWeight: "700", fontSize: 13, marginBottom: 7 },
  input: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 11, paddingHorizontal: 13, paddingVertical: 12, fontSize: 15, color: "#0f172a" },
  multiline: { minHeight: 95 },
  button: { backgroundColor: "#0f766e", borderRadius: 11, paddingVertical: 14, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", marginTop: 9, minHeight: 48 },
  buttonText: { color: "#ffffff", fontWeight: "800", fontSize: 15 },
  secondaryButton: { backgroundColor: "#ccfbf1", borderWidth: 1, borderColor: "#99f6e4" },
  secondaryText: { color: "#115e59" },
  helperText: { color: "#64748b", fontSize: 12, textAlign: "center", marginTop: 15 },
  content: { padding: 18, paddingBottom: 35 },
  welcomeBlock: { marginTop: 10, marginBottom: 18 },
  welcomeLabel: { color: "#0f766e", fontWeight: "900", fontSize: 11, letterSpacing: 1.3 },
  welcomeTitle: { color: "#0f172a", fontSize: 27, fontWeight: "900", marginTop: 6 },
  muted: { color: "#64748b", fontSize: 13, lineHeight: 20, marginTop: 5 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: "#ffffff", borderRadius: 14, padding: 17, borderWidth: 1, borderColor: "#e2e8f0" },
  statNumber: { fontSize: 27, fontWeight: "900", color: "#0f766e" },
  statLabel: { color: "#64748b", fontSize: 12, marginTop: 4 },
  sectionTitle: { color: "#0f172a", fontSize: 17, fontWeight: "900", marginTop: 23, marginBottom: 12 },
  emptyCard: { backgroundColor: "#ffffff", padding: 18, borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", marginTop: 10 },
  emptyTitle: { color: "#0f172a", fontWeight: "800", fontSize: 16 },
  requestCard: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 14, padding: 16, marginBottom: 12 },
  requestNumber: { color: "#0f766e", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  requestTitle: { color: "#0f172a", fontSize: 16, fontWeight: "800", marginTop: 7 },
  statusPill: { alignSelf: "flex-start", backgroundColor: "#ccfbf1", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  statusText: { color: "#115e59", fontWeight: "800", fontSize: 11, textTransform: "capitalize" },
  infoCard: { backgroundColor: "#ffffff", padding: 15, borderRadius: 14, marginTop: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  companyCard: { flexDirection: "row", alignItems: "center", padding: 13, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, marginBottom: 9 },
  companySelected: { borderColor: "#0f766e", backgroundColor: "#f0fdfa" },
  companyRadio: { width: 23, height: 23, borderRadius: 12, borderWidth: 1, borderColor: "#0f766e", alignItems: "center", justifyContent: "center", marginRight: 12 },
  companyRadioText: { color: "#0f766e", fontWeight: "900" },
  companyInfo: { flex: 1 },
  companyName: { color: "#475569", fontSize: 12, marginTop: 8 },
  pageTitle: { color: "#0f172a", fontSize: 25, fontWeight: "900", marginTop: 12, marginBottom: 5 },
  backLink: { color: "#0f766e", fontWeight: "800", fontSize: 14, marginTop: 4 },
  errorBox: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 10, padding: 12, marginBottom: 13 },
  errorText: { color: "#b91c1c", fontSize: 13, lineHeight: 19 },
  successBox: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 10, padding: 12, marginBottom: 13 },
  successText: { color: "#166534", fontSize: 13, lineHeight: 19 },
  listHeading: { padding: 18, paddingBottom: 10 },
  listContent: { paddingHorizontal: 18, paddingBottom: 20, flexGrow: 1 },
  dateText: { color: "#94a3b8", fontSize: 11, marginTop: 10 },
  bottomAction: { paddingHorizontal: 18, paddingBottom: 8, backgroundColor: "#f8fafc" },
  bottomNav: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingVertical: 13, backgroundColor: "#ffffff", borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  navText: { color: "#64748b", fontWeight: "700", fontSize: 12 },
  navActive: { color: "#0f766e", fontWeight: "900" },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
});