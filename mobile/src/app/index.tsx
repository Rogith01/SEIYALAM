
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as DocumentPicker from "expo-document-picker";
import { Linking } from "react-native";

const API_URL = "https://seiyalam.onrender.com/api";
const TOKEN_KEY = "seiyalam_access";
const REFRESH_KEY = "seiyalam_refresh";

const C = {
  navy: "#080D20",
  primary: "#205DF5",
  background: "#F1F5F9",
  white: "#FFFFFF",
  text: "#101828",
  muted: "#64748B",
  border: "#E2E8F0",
  red: "#E11D48",
  green: "#15803D",
  paleBlue: "#EFF6FF",
};

type Data = Record<string, any>;
type Page =
  | "dashboard"
  | "workerDashboard"
  | "requests"
  | "requestDetails"
  | "newRequest"
  | "workOrders"
  | "workOrderDetails"
  | "notifications"
  | "profile"
  | "support"
  | "register";

const api = axios.create({ baseURL: API_URL, timeout: 60000 });


api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function arr(value: any): Data[] {
  if (Array.isArray(value)) return value;
  for (const key of [
    "results",
    "data",
    "items",
    "requests",
    "work_orders",
    "notifications",
  ]) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
}

function message(error: any): string {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  if (data?.detail) return String(data.detail);
  if (data?.message) return String(data.message);
  if (data && typeof data === "object") {
    for (const value of Object.values(data)) {
      if (Array.isArray(value) && value.length) return String(value[0]);
      if (typeof value === "string") return value;
    }
  }
  if (!error?.response) {
    return "Unable to connect. Check your internet connection and try again.";
  }
  return error?.message || "Something went wrong.";
}

function statusText(value: any) {
  return String(value || "Pending")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function dateText(value: any) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString();
}

function notify(title: string, body: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.alert(`${title}\n\n${body}`);
  } else {
    Alert.alert(title, body);
  }
}

function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        (pressed || disabled) && { opacity: 0.65 },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && styles.buttonSecondaryText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  secure = false,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  secure?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor="#94A3B8"
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize={
          keyboardType === "email-address" ? "none" : "sentences"
        }
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && { minHeight: 100 }]}
      />
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Tag({ value }: { value: any }) {
  const normalized = String(value || "").toLowerCase();
  const color =
    normalized.includes("complete") ||
    normalized.includes("closed") ||
    normalized.includes("confirm")
      ? "#15803D"
      : normalized.includes("cancel")
        ? "#B91C1C"
        : "#1D4ED8";

  return (
    <View style={[styles.tag, { backgroundColor: `${color}14` }]}>
      <Text style={[styles.tagText, { color }]}>{statusText(value)}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text selectable style={styles.infoValue}>
        {value === null || value === undefined || value === ""
          ? "Not provided"
          : String(value)}
      </Text>
    </View>
  );
}

function RequestCard({
  item,
  onPress,
}: {
  item: Data;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card>
        <View style={styles.between}>
          <Text style={styles.smallBlue}>
            {item.request_number || `SR-${item.id ?? "—"}`}
          </Text>
          <Tag value={item.status} />
        </View>
        <Text style={styles.cardTitle}>
          {item.title || "Service request"}
        </Text>
        <Text style={styles.muted}>
          {item.company_details?.name ||
            item.company_name ||
            item.company?.name ||
            "Service company"}
        </Text>
        <Text style={styles.muted}>{dateText(item.created_at)}</Text>
        {!!item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <Text style={styles.link}>View request →</Text>
      </Card>
    </Pressable>
  );
}

export default function Index() {
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebar, setSidebar] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [portalRole, setPortalRole] = useState<"customer" | "worker">("customer");
  const [workProgress, setWorkProgress] = useState("");
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [evidenceDescription, setEvidenceDescription] = useState("");

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
    confirm_password: "",
  });

  const [user, setUser] = useState<Data | null>(null);
  const [dashboard, setDashboard] = useState<Data>({});
  const [requests, setRequests] = useState<Data[]>([]);
  const [workOrders, setWorkOrders] = useState<Data[]>([]);
  const [notifications, setNotifications] = useState<Data[]>([]);
  const [companies, setCompanies] = useState<Data[]>([]);
  const [support, setSupport] = useState<Data>({});

  // Values supplied by Founder Settings through /platform/settings/
  const platformName = String(support?.platform?.name || "SEIYALAM");
  const supportEmail = String(support?.support?.email || "");
  const supportPhone = String(support?.support?.phone || "");
  const supportWebsite = String(support?.support?.website || "");
  const maintenanceEnabled = Boolean(support?.maintenance?.enabled);
  const maintenanceMessage = String(support?.maintenance?.message || "");
  const allowCustomerRegistration =
    support?.access?.allow_customer_registration !== false;
  const platformAnnouncement = String(support?.announcement || "");
  const platformCurrency = String(support?.platform?.currency || "INR");
  const platformLanguage = String(support?.platform?.language || "en");
  const platformTimezone = String(support?.platform?.timezone || "Asia/Kolkata");
  const [selectedRequest, setSelectedRequest] = useState<Data | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] =
    useState<Data | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [companyId, setCompanyId] = useState<number | string | null>(null);

 

  const [requestForm, setRequestForm] = useState({
    title: "",
    description: "",
    phone: "",
    address: "",
  });

  const [currentLocation, setCurrentLocation] = useState<{
  latitude: number;
  longitude: number;
} | null>(null);


  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [profileModal, setProfileModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const loadData = useCallback(async (roleOverride?: "customer" | "worker") => {
    const isWorkerPortal = (roleOverride || portalRole) === "worker";
    const jobs = await Promise.allSettled([
      api.get("/me/"),
      isWorkerPortal ? api.get("/dashboard/worker/") : api.get("/dashboard/customer/"),
      isWorkerPortal ? api.get("/work-orders/my/") : api.get("/customer/companies/"),
      isWorkerPortal ? api.get("/work-orders/my/") : api.get("/service-requests/my/"),
      api.get("/work-orders/my/"),
      api.get("/notifications/"),
      api.get("/platform/settings/"),
    ]);

    if (jobs[0].status === "fulfilled") {
      const u = jobs[0].value.data;
      setUser(u);
      setProfileForm({
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || "",
        address: u.address || "",
      });
    }

    if (jobs[1].status === "fulfilled") {
      setDashboard(jobs[1].value.data || {});
    }
    if (jobs[2].status === "fulfilled") {
      if (isWorkerPortal) setWorkOrders(arr(jobs[2].value.data));
      else setCompanies(arr(jobs[2].value.data));
    }
    if (jobs[3].status === "fulfilled") {
      if (!isWorkerPortal) setRequests(arr(jobs[3].value.data));
      else setWorkOrders(arr(jobs[3].value.data));
    }
    if (jobs[4].status === "fulfilled") {
      setWorkOrders(arr(jobs[4].value.data));
    }
    if (jobs[5].status === "fulfilled") {
      setNotifications(arr(jobs[5].value.data));
    }
    if (jobs[6].status === "fulfilled") {
      setSupport(jobs[6].value.data || {});
    }

    const failed = jobs.some((j) => j.status === "rejected");
    setError(
      failed
        ? "Some information could not load. Use Refresh to try again."
        : ""
    );
  }, [portalRole]);

  const restoreSession = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        setAuthenticated(false);
        return;
      }

      setLoading(true);
      const me = await api.get("/me/");
      const roleText = String(me.data?.role || me.data?.user_type || me.data?.account_type || "").toLowerCase();
      const savedRole = await AsyncStorage.getItem("seiyalam_portal_role");
      const isWorker = roleText.includes("worker") || savedRole === "worker";
      const role = isWorker ? "worker" : "customer";
      setPortalRole(role);
      setAuthenticated(true);
      setPage(isWorker ? "workerDashboard" : "dashboard");
      await loadData(role);
    } catch {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY, "seiyalam_portal_role"]);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (e) {
      setError(message(e));
    } finally {
      setRefreshing(false);
    }
  };

  const login = async () => {
    clearMessages();

    const identifier = loginData.username.trim();
    if (!identifier || !loginData.password) {
      setError("Enter your username and password.");
      return;
    }

    try {
      setLoading(true);
      let res: any;
      let isFounder = false;

      // Match the website authentication flow exactly:
      // 10-digit identifiers use customer login; other usernames try Founder
      // login first, then regular Admin/Worker JWT login.
      if (/^\d{10}$/.test(identifier)) {
        res = await axios.post(
          `${API_URL}/customer/login/`,
          { username: identifier, password: loginData.password },
          { timeout: 60000 }
        );
      } else {
        try {
          res = await axios.post(
            `${API_URL}/founder/token/`,
            { username: identifier, password: loginData.password },
            { timeout: 60000 }
          );
          isFounder = true;
        } catch (loginError: any) {
          if (loginError?.response?.status !== 401) throw loginError;
          res = await axios.post(
            `${API_URL}/token/`,
            { username: identifier, password: loginData.password },
            { timeout: 60000 }
          );
        }
      }

      if (!res.data?.access || !res.data?.refresh) {
        throw new Error("Login response did not contain valid access and refresh tokens.");
      }

      await AsyncStorage.setItem(TOKEN_KEY, res.data.access);
      await AsyncStorage.setItem(REFRESH_KEY, res.data.refresh);
      await AsyncStorage.setItem("seiyalam_portal_role", "customer");

      // The website uses /me/ as the source of truth for the account role.
      const meResponse = await axios.get(`${API_URL}/me/`, {
        headers: { Authorization: `Bearer ${res.data.access}` },
        timeout: 60000,
      });
      const loggedInUser = meResponse.data || res.data?.user || res.data?.profile || {};
      const roleText = String(
        loggedInUser.role || loggedInUser.user_type || loggedInUser.account_type ||
        (isFounder ? "founder" : "")
      ).toLowerCase();
      const isWorker = roleText.includes("worker");
      const role = isWorker ? "worker" : "customer";
      await AsyncStorage.setItem("seiyalam_portal_role", role);
      setPortalRole(role);
      setAuthenticated(true);
      setPage(isWorker ? "workerDashboard" : "dashboard");
      await loadData(role);
    } catch (e: any) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    clearMessages();

    if (maintenanceEnabled) {
      setError(
        maintenanceMessage.trim() ||
          `${platformName} is currently under maintenance. Please try again later.`
      );
      return;
    }
    if (!allowCustomerRegistration) {
      setError("Customer registration is currently disabled by the Founder.");
      setPage("dashboard");
      return;
    }

    const r = registerData;

    if (
      !r.name.trim() ||
      !r.username.trim() ||
      !r.phone.trim() ||
      !r.password
    ) {
      setError("Complete all required fields.");
      return;
    }

    if (!/^\d{10}$/.test(r.phone)) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }

    if (r.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (r.password !== r.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_URL}/customer/register/`,
        r,
        { timeout: 60000 }
      );

      setSuccess(
        res.data?.message || "Registration successful. Sign in now."
      );
      setLoginData({
        username: r.username,
        password: "",
      });
      setRegisterData({
        name: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        confirm_password: "",
      });
      setPage("dashboard");
      setAuthenticated(false);
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setProfileMenu(false);
    setSidebar(false);
    setProfileModal(false);
    setPasswordModal(false);
    setAuthenticated(false);
    setUser(null);
    setRequests([]);
    setWorkOrders([]);
    setNotifications([]);
    setDashboard({});
    setPage("dashboard");
    setLoginData({ username: "", password: "" });

    setPortalRole("customer");
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY, "seiyalam_portal_role"]);
  };

  const navigate = (target: Page) => {
    clearMessages();
    setSidebar(false);
    setProfileMenu(false);
    setPage(target);
  };

  const openRequest = async (item: Data) => {
    clearMessages();
    setSelectedRequest(item);
    setPage("requestDetails");

    if (item.id == null) return;

    try {
      const res = await api.get(`/service-requests/${item.id}/`);
      setSelectedRequest(res.data?.data || res.data || item);
    } catch {
      // Keep the list record if detail retrieval fails.
    }
  };

  const openWorkOrder = async (item: Data) => {
    clearMessages();
    setSelectedWorkOrder(item);
    setPage("workOrderDetails");

    if (item.id == null) return;

    try {
      const res = await api.get(`/work-orders/${item.id}/`);
      let detail: Data = res.data?.data || res.data || item;
      // Some API serializers return only service_request_id instead of nesting
      // the full request. Fetch the linked request so the worker sees what the
      // customer actually asked for.
      // The website serializer exposes the linked request as
      // service_request_details. Keep that shape and support mobile/API variants.
      const existingRequest = detail.service_request_details ||
        (detail.service_request && typeof detail.service_request === "object" ? detail.service_request : null) ||
        detail.request_details || null;
      const requestId = detail.service_request_id ?? detail.service_request?.id ??
        detail.service_request_details?.id ?? detail.request_id ?? item.service_request_id ??
        item.service_request?.id ?? item.service_request_details?.id;
      if (requestId != null && (!existingRequest || !existingRequest.description)) {
        try {
          const requestResponse = await api.get(`/service-requests/${requestId}/`);
          const requestData = requestResponse.data?.data || requestResponse.data;
          detail = { ...detail, service_request: requestData, service_request_details: requestData };
        } catch { /* Keep available work-order details if request lookup is restricted. */ }
      } else if (existingRequest) {
        detail = { ...detail, service_request_details: existingRequest };
      }
      setSelectedWorkOrder(detail);
    } catch {
      // Keep the list record if detail retrieval fails.
    }
  };

const shareCurrentLocation = async () => {
  clearMessages();

  try {
    setLoading(true);

    const permission =
      await Location.requestForegroundPermissionsAsync();

    if (permission.status !== "granted") {
      setError(
        "Please allow location permission in your phone settings to share your location."
      );
      return;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    setCurrentLocation(coords);
    setSuccess("Your current location has been shared with this request form.");
  } catch (e) {
    setError(
      "Unable to get your location. Please enable your phone's GPS and try again."
    );
  } finally {
    setLoading(false);
  }
};

const submitRequest = async () => {
  clearMessages();

  if (maintenanceEnabled) {
    setError(
      maintenanceMessage.trim() ||
        `${platformName} is currently under maintenance. Please try again later.`
    );
    return;
  }

  if (!companyId) {
    setError("Select a service company.");
    return;
  }

  if (
    !requestForm.title.trim() ||
    !requestForm.description.trim()
  ) {
    setError("Enter a title and description.");
    return;
  }

  try {
    setLoading(true);

    // Use the previously shared location if available.
    let coords = currentLocation;

    // Fetch GPS location if it has not been shared yet.
    if (!coords) {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setError(
          "Location permission is required to submit a request. Enable location permission and try again."
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // Save the newly fetched location.
      setCurrentLocation(coords);
    }

    // Submit the service request with GPS coordinates.

await api.post("/service-requests/", {
  company_id: companyId,
  title: requestForm.title.trim(),
  description: requestForm.description.trim(),
  phone: requestForm.phone.trim(),
  address: requestForm.address.trim(),
location_latitude: Number(coords.latitude.toFixed(6)),
location_longitude: Number(coords.longitude.toFixed(6)),
});

    // Reset the form after successful submission.
    setRequestForm({
      title: "",
      description: "",
      phone: "",
      address: "",
    });

    setCompanyId(null);

    // Clear location so the next request can capture fresh GPS.
    setCurrentLocation(null);

    await loadData();

    setPage("requests");
    setSuccess(
      "Service request submitted successfully with GPS coordinates."
    );
  } catch (e) {
    setError(message(e));
  } finally {
    setLoading(false);
  }
};
  const saveProfile = async () => {
    clearMessages();

    if (!profileForm.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (profileForm.phone && !/^\d{10}$/.test(profileForm.phone)) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }

    try {
      setLoading(true);
      await api.patch("/me/update/", profileForm);
      setProfileModal(false);
      setSuccess("Profile updated successfully.");
      await loadData();
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    clearMessages();

    if (
      !passwordForm.current_password ||
      !passwordForm.new_password ||
      !passwordForm.confirm_password
    ) {
      setError("Complete all password fields.");
      return;
    }

    if (
      passwordForm.new_password !== passwordForm.confirm_password
    ) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/change-password/", passwordForm);
      setPasswordModal(false);
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setSuccess("Password changed successfully.");
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (item: Data) => {
    try {
      await api.post(`/notifications/${item.id}/read/`);
      setNotifications((old) =>
        old.map((n) =>
          n.id === item.id
            ? { ...n, is_read: true, read: true }
            : n
        )
      );
    } catch (e) {
      setError(message(e));
    }
  };

  const displayName = user?.name || user?.username || (portalRole === "worker" ? "Worker" : "Customer");
  const unreadCount = notifications.filter(
    (n) => !(n.is_read ?? n.read)
  ).length;

  const filteredRequests = requests.filter((r) => {
    const text =
      `${r.title || ""} ${r.description || ""} ${r.request_number || ""} ${r.company_name || ""}`
        .toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All Status" ||
      statusText(r.status).toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const filteredOrders = workOrders.filter((w) =>
    `${w.title || ""} ${w.work_order_number || ""} ${w.id || ""} ${w.worker_name || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const renderPlatformNotices = () => (
    <>
      {!!platformAnnouncement.trim() && !announcementDismissed && (
        <View style={[styles.successBox, { flexDirection: "row", alignItems: "flex-start", gap: 10 }]}>
          <Text style={[styles.successText, { flex: 1 }]}>{platformAnnouncement}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Dismiss platform announcement" onPress={() => setAnnouncementDismissed(true)} hitSlop={10} style={{ paddingHorizontal: 5, paddingVertical: 1 }}>
            <Text style={{ color: C.muted, fontSize: 22, fontWeight: "700" }}>×</Text>
          </Pressable>
        </View>
      )}
      {maintenanceEnabled && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            {maintenanceMessage.trim() ||
              `${platformName} is currently under maintenance. Please try again later.`}
          </Text>
        </View>
      )}
    </>
  );

  const renderMessage = () => (
    <>
      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {!!success && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}
    </>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open navigation menu"
        onPress={() => setSidebar(true)}
        hitSlop={12}
        style={styles.menuButton}
      >
        <Text style={styles.menuIcon}>☰</Text>
      </Pressable>

      <Pressable
        onPress={() => navigate("dashboard")}
        style={styles.brandBlock}
      >
        <Text style={styles.brand}>{platformName}</Text>
        <Text style={styles.brandSub}>{portalRole === "worker" ? "Worker Portal" : "Customer Portal"}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        onPress={() => navigate("notifications")}
        style={styles.headerIcon}
      >
        <Text style={styles.headerIconText}>🔔</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open profile menu"
        onPress={() => setProfileMenu(true)}
        style={styles.avatar}
      >
        <Text style={styles.avatarText}>👤</Text>
      </Pressable>
    </View>
  );

  const renderDashboard = () => (
    <>
      <Text style={styles.breadcrumb}>{platformName}  ›  {portalRole === "worker" ? "Worker Portal" : "Customer Portal"}</Text>
      <Text style={styles.pageTitle}>{portalRole === "worker" ? "Worker Dashboard" : "Customer Dashboard"}</Text>
      <Text style={styles.muted}>
        {portalRole === "worker" ? "Manage your assigned jobs and report work progress." : "Track your service requests and work progress."}
      </Text>

      <Button
        title="↻  Refresh"
        secondary
        onPress={() => void refresh()}
      />

      <View style={styles.statsGrid}>
        <Card>
          <Text style={styles.statLabel}>Total Requests</Text>
          <Text style={styles.statNumber}>
            {dashboard.total_requests ?? requests.length}
          </Text>
          <Text style={styles.muted}>All your service requests</Text>
        </Card>

        <Card>
          <Text style={styles.statLabel}>Pending Requests</Text>
          <Text style={styles.statNumber}>
            {dashboard.pending_requests ??
              requests.filter((r) =>
                ["new", "pending"].includes(
                  String(r.status).toLowerCase()
                )
              ).length}
          </Text>
          <Text style={styles.muted}>Awaiting progress</Text>
        </Card>

        <Card>
          <Text style={styles.statLabel}>Completed Requests</Text>
          <Text style={styles.statNumber}>
            {dashboard.completed_requests ??
              requests.filter((r) =>
                String(r.status).toLowerCase().includes("complete")
              ).length}
          </Text>
          <Text style={styles.muted}>Finished services</Text>
        </Card>

        <Card>
          <Text style={styles.statLabel}>Active Work Orders</Text>
          <Text style={styles.statNumber}>
            {dashboard.active_work_orders ??
              workOrders.filter(
                (w) =>
                  ![
                    "closed",
                    "completed",
                    "customer_confirmed",
                  ].includes(String(w.status).toLowerCase())
              ).length}
          </Text>
          <Text style={styles.muted}>Work in progress</Text>
        </Card>
      </View>

      <Pressable onPress={() => navigate("requests")}>
        <Card>
          <View style={styles.between}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>My Service Requests</Text>
              <Text style={styles.muted}>
                Create and track your service requests.
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </View>
        </Card>
      </Pressable>

      <Pressable onPress={() => navigate("workOrders")}>
        <Card>
          <View style={styles.between}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>My Work Orders</Text>
              <Text style={styles.muted}>
                See assigned work and current progress.
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </View>
        </Card>
      </Pressable>

      <View style={styles.between}>
        <Text style={styles.sectionTitle}>Recent Service Requests</Text>
        <Pressable onPress={() => navigate("requests")}>
          <Text style={styles.link}>View All →</Text>
        </Pressable>
      </View>

      {requests.length === 0 ? (
        <Card>
          <Text style={styles.cardTitle}>No requests yet</Text>
          <Text style={styles.muted}>
            Create a service request to get started.
          </Text>
          <Button
            title="+ New Service Request"
            onPress={() => navigate("newRequest")}
          />
        </Card>
      ) : (
        requests
          .slice(0, 5)
          .map((r, i) => (
            <RequestCard
              key={String(r.id ?? i)}
              item={r}
              onPress={() => void openRequest(r)}
            />
          ))
      )}
    </>
  );

  const renderRequests = () => (
    <>
      <Pressable onPress={() => navigate("dashboard")}>
        <Text style={styles.link}>← Back to Dashboard</Text>
      </Pressable>

      <Text style={styles.pageTitle}>My Service Requests</Text>
      <Text style={styles.muted}>
        Track and manage all your service requests.
      </Text>

      <Button
        title="+ New Service"
        onPress={() => navigate("newRequest")}
      />

      <Field
        label="Search requests, company, service..."
        value={search}
        onChangeText={setSearch}
      />

      <Text style={styles.label}>Filter by status</Text>

      <View style={styles.filterRow}>
        {[
          "All Status",
          "Pending",
          "Assigned",
          "In Progress",
          "Completed",
          "Closed",
          "Cancelled",
        ].map((s) => (
          <Pressable
            key={s}
            onPress={() => setStatusFilter(s)}
            style={[
              styles.filter,
              statusFilter === s && styles.filterActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                statusFilter === s && styles.filterTextActive,
              ]}
            >
              {s}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button
        title="↻ Refresh"
        secondary
        onPress={() => void refresh()}
      />

      <Text style={styles.muted}>
        {filteredRequests.length} request(s)
      </Text>

      {filteredRequests.length === 0 ? (
        <Card>
          <Text style={styles.cardTitle}>No matching requests</Text>
        </Card>
      ) : (
        filteredRequests.map((r, i) => (
          <RequestCard
            key={String(r.id ?? i)}
            item={r}
            onPress={() => void openRequest(r)}
          />
        ))
      )}
    </>
  );

  const renderNewRequest = () => (
    <>
      <Pressable onPress={() => navigate("requests")}>
        <Text style={styles.link}>← Back to My Requests</Text>
      </Pressable>

      <Text style={styles.pageTitle}>New Service Request</Text>
      <Text style={styles.muted}>
        Select a company and submit your service details.
      </Text>

      <Card>
        <Text style={styles.sectionTitle}>Service Company</Text>

        {companies.length === 0 ? (
          <Text style={styles.muted}>
            No companies are available right now.
          </Text>
        ) : (
          companies.map((company, i) => (
            <Pressable
              key={String(company.id ?? i)}
              onPress={() => setCompanyId(company.id)}
              style={[
                styles.companyOption,
                companyId === company.id &&
                  styles.companyOptionActive,
              ]}
            >
              <Text style={styles.cardTitle}>
                {companyId === company.id ? "🔘 " : "◯ "}
                {company.name ||
                  company.company_name ||
                  `Company ${i + 1}`}
              </Text>
              {!!company.address && (
                <Text style={styles.muted}>{company.address}</Text>
              )}
            </Pressable>
          ))
        )}
      </Card>

      <Card>
        <Field
          label="Service Title *"
          value={requestForm.title}
          onChangeText={(v) =>
            setRequestForm({ ...requestForm, title: v })
          }
          placeholder="Example: AC repair"
        />

        <Field
          label="Description *"
          value={requestForm.description}
          onChangeText={(v) =>
            setRequestForm({ ...requestForm, description: v })
          }
          multiline
          placeholder="Describe the service you need..."
        />

        <Field
          label="Phone Number"
          value={requestForm.phone}
          onChangeText={(v) =>
            setRequestForm({ ...requestForm, phone: v })
          }
          keyboardType="phone-pad"
        />

        <Field
          label="Service Address"
          value={requestForm.address}
          onChangeText={(v) =>
            setRequestForm({ ...requestForm, address: v })
          }
          multiline
          placeholder="Enter service address"
        />

<Text style={styles.muted}>
  Share your current location to help the service team find you.
</Text>

<Button
  title={
    loading
      ? "Getting Location..."
      : currentLocation
        ? "✓ Location Shared"
        : "📍 Share Current Location"
  }
  secondary
  disabled={loading}
  onPress={() => void shareCurrentLocation()}
/>

{currentLocation && (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>Location Captured</Text>

    <Text style={styles.infoValue}>
      Latitude: {currentLocation.latitude}
    </Text>

    <Text style={styles.infoValue}>
      Longitude: {currentLocation.longitude}
    </Text>

    <Text style={styles.muted}>
      Your coordinates will be included when you submit the request.
    </Text>
  </View>
)}

        <Button
          title={loading ? "Submitting..." : "Submit Service Request"}
          disabled={loading}
          onPress={() => void submitRequest()}
        />
      </Card>
    </>
  );

  const renderRequestDetails = () => {
    const r = selectedRequest;

    if (!r) {
      return <Text style={styles.muted}>No request selected.</Text>;
    }

    const related = workOrders.filter(
      (w) =>
        w.service_request === r.id ||
        w.service_request_id === r.id ||
        w.request_id === r.id
    );

    const company =
      r.company_details?.name ||
      r.company_name ||
      r.company?.name;

    return (
      <>
        <Pressable onPress={() => navigate("requests")}>
          <Text style={styles.link}>← Back to My Requests</Text>
        </Pressable>

        <Text style={styles.breadcrumb}>
          {platformName}  ›  {portalRole === "worker" ? "Worker Portal" : "Customer Portal"}
        </Text>
        <Text style={styles.pageTitle}>
          {r.title || "Service Request"}
        </Text>
        <Text style={styles.muted}>
          Request ID: {r.request_number || r.id}
        </Text>

        <Card>
          <Text style={styles.label}>CURRENT STATUS</Text>
          <Tag value={r.status} />
          <Text style={styles.muted}>
            Your request progress is shown here.
          </Text>
        </Card>


<Card>
  <Text style={styles.sectionTitle}>Request Details</Text>
  <Row label="Request ID" value={r.request_number || r.id} />
  <Row label="Company" value={company} />
  <Row label="Title" value={r.title} />
  <Row label="Description" value={r.description} />
  <Row label="Phone" value={r.phone || r.contact_phone} />
  <Row label="Service Location" value={r.address} />
  <Row label="Created" value={dateText(r.created_at)} />
  <Row label="Updated" value={dateText(r.updated_at)} />

  {r.latitude != null && r.longitude != null && (
    <>
      <Row
        label="GPS Coordinates"
        value={`${r.latitude}, ${r.longitude}`}
      />

      <Button
        title="📍 Open Location in Maps"
        secondary
        onPress={() =>
          void Linking.openURL(
            `https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`
          )
        }
      />
    </>
  )}
</Card>

        <Text style={styles.sectionTitle}>Work Orders</Text>

        {related.length ? (
          related.map((w, i) => (
            <Pressable
              key={String(w.id ?? i)}
              onPress={() => void openWorkOrder(w)}
            >
              <Card>
                <Text style={styles.cardTitle}>
                  {w.work_order_number || `WO-${w.id}`}
                </Text>
                <Tag value={w.status} />
                <Text style={styles.link}>View Work Order →</Text>
              </Card>
            </Pressable>
          ))
        ) : (
          <Card>
            <Text style={styles.muted}>
              No work orders linked to this request yet.
            </Text>
          </Card>
        )}
      </>
    );
  };

  const renderWorkOrders = () => (
    <>
      <Text style={styles.breadcrumb}>
        {platformName}  ›  {portalRole === "worker" ? "Worker Portal" : "Customer Portal"}
      </Text>
      <Text style={styles.pageTitle}>My Work Orders</Text>
      <Text style={styles.muted}>
        Track service work across companies.
      </Text>

      <Button
        title="↻ Refresh"
        secondary
        onPress={() => void refresh()}
      />

      <Field
        label="Search work orders, service, worker..."
        value={search}
        onChangeText={setSearch}
      />

      {filteredOrders.length === 0 ? (
        <Card>
          <Text style={styles.cardTitle}>
            No matching work orders
          </Text>
          <Text style={styles.muted}>
            Assigned work orders will appear here.
          </Text>
        </Card>
      ) : (
        filteredOrders.map((w, i) => (
          <Pressable
            key={String(w.id ?? i)}
            onPress={() => void openWorkOrder(w)}
          >
            <Card>
              <View style={styles.between}>
                <Text style={styles.smallBlue}>
                  {w.work_order_number || `WO-${w.id}`}
                </Text>
                <Tag value={w.status} />
              </View>

              <Text style={styles.cardTitle}>
                {w.title ||
                  w.service_request_title ||
                  w.service_request?.title ||
                  "Service work"}
              </Text>

              <Text style={styles.muted}>
                Worker:{" "}
                {w.worker_name ||
                  w.worker_details?.name ||
                  w.worker?.name ||
                  "Not assigned"}
              </Text>

              <Text style={styles.muted}>
                Created: {dateText(w.created_at)}
              </Text>

              <Text style={styles.link}>View Work Order →</Text>
            </Card>
          </Pressable>
        ))
      )}
    </>
  );

  const renderWorkOrderDetails = () => {
    const w = selectedWorkOrder;

    if (!w) {
      return <Text style={styles.muted}>No work order selected.</Text>;
    }

    const state = String(w.status || "").toLowerCase();
    const stages = [
      "assigned",
      "accepted",
      "on_the_way",
      "in_progress",
      "completed",
    ];
    const stageLabels = [
      "Assigned",
      "Accepted",
      "On The Way",
      "In Progress",
      "Completed",
    ];

    let active = stages.findIndex((s) => s === state);
    if (state === "customer_confirmed" || state === "closed") {
      active = 4;
    }

    return (
      <>
        <Pressable onPress={() => navigate("workOrders")}>
          <Text style={styles.link}>← Back to Work Orders</Text>
        </Pressable>

        <Text style={styles.breadcrumb}>
          {platformName}  ›  {portalRole === "worker" ? "Worker Portal" : "Customer Portal"}
        </Text>
        <Text style={styles.pageTitle}>
          {w.title || w.service_request_title || "Work Order"}
        </Text>
        <Text style={styles.muted}>
          {w.work_order_number || `WO-${w.id}`}
        </Text>

        <Card>
          <View style={styles.between}>
            <Text style={styles.sectionTitle}>Work Order Status</Text>
            <Tag value={w.status} />
          </View>

          <View style={styles.timeline}>
            {stageLabels.map((label, i) => (
              <View key={label} style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    i <= active && styles.timelineDotActive,
                  ]}
                >
                  <Text style={styles.timelineDotText}>
                    {i < active ? "✓" : String(i + 1)}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.timelineLabel,
                    i <= active && { color: C.primary },
                  ]}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Service Details</Text>
          <Row
            label="Work Order"
            value={w.work_order_number || w.id}
          />
          <Row
            label="Service"
            value={
              w.title ||
              w.service_request_title ||
              w.service_request?.title
            }
          />
          <Row
            label="Worker"
            value={
              w.worker_name ||
              w.worker_details?.name ||
              w.worker?.name
            }
          />
          <Row
            label="Service Location"
            value={
              w.address ||
              w.service_request?.address ||
              w.location
            }
          />
          <Row label="Created" value={dateText(w.created_at)} />
          <Row label="Updated" value={dateText(w.updated_at)} />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Work Updates</Text>
          {arr(w.logs || w.work_logs).length === 0 ? (
            <Text style={styles.muted}>
              No work updates are available in this response.
            </Text>
          ) : (
            arr(w.logs || w.work_logs).map((log, i) => (
              <View
                key={String(log.id ?? i)}
                style={styles.infoRow}
              >
                <Text style={styles.cardTitle}>
                  {log.log_type || log.title || "Work update"}
                </Text>
                <Text style={styles.infoValue}>
                  {log.description || log.notes || ""}
                </Text>
                <Text style={styles.muted}>
                  {dateText(log.created_at)}
                </Text>
              </View>
            ))
          )}
        </Card>

        <Text style={styles.muted}>
          Completion confirmation is available when enabled by your
          service team.
        </Text>
      </>
    );
  };

  const renderNotifications = () => (
    <>
      <Text style={styles.pageTitle}>Notifications</Text>
      <Text style={styles.muted}>
        Stay updated about your service requests.
      </Text>

      <Button
        title="↻ Refresh"
        secondary
        onPress={() => void refresh()}
      />

      {notifications.length === 0 ? (
        <Card>
          <Text style={styles.cardTitle}>No notifications</Text>
        </Card>
      ) : (
        notifications.map((n, i) => {
          const read = Boolean(n.is_read ?? n.read);

          return (
            <Card key={String(n.id ?? i)}>
              <View style={styles.between}>
                <Text style={styles.cardTitle}>
                  {n.title ||
                    n.notification_type ||
                    "SEIYALAM update"}
                </Text>
                <Tag value={read ? "Read" : "Unread"} />
              </View>

              <Text style={styles.description}>
                {n.message || n.body || n.description || ""}
              </Text>
              <Text style={styles.muted}>
                {dateText(n.created_at)}
              </Text>

              {!read && n.id != null && (
                <Button
                  title="Mark as Read"
                  secondary
                  onPress={() => void markRead(n)}
                />
              )}
            </Card>
          );
        })
      )}
    </>
  );

  const renderProfile = () => (
    <>
      <Text style={styles.pageTitle}>My Profile</Text>
      <Text style={styles.muted}>
        View and manage your account information.
      </Text>

      <Button
        title="↻ Refresh"
        secondary
        onPress={() => void refresh()}
      />

      <Card>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>👤</Text>
        </View>
        <Text style={[styles.cardTitle, { textAlign: "center" }]}>
          {user?.name || user?.username}
        </Text>
        <Text style={[styles.muted, { textAlign: "center" }]}>
          {user?.username}
        </Text>
        <Text
          style={[
            styles.tagText,
            { textAlign: "center", color: C.green },
          ]}
        >
          Active Account
        </Text>

        <Button
          title="Edit Profile"
          onPress={() => setProfileModal(true)}
        />
      </Card>

      <Card>
        <View style={styles.between}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <Pressable onPress={() => setProfileModal(true)}>
            <Text style={styles.link}>Edit</Text>
          </Pressable>
        </View>

        <Row label="Name" value={user?.name} />
        <Row label="Email" value={user?.email} />
        <Row label="Mobile Number" value={user?.phone} />
        <Row label="Address" value={user?.address} />
        <Row label="Role" value={user?.role} />

        {user?.phone_verified === false && (
          <Text style={styles.warning}>
            Your phone number is not verified. Use the verification
            options provided by your account portal.
          </Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Security</Text>
        <Text style={styles.muted}>
          Manage your account password.
        </Text>
        <Button
          title="Change Password"
          secondary
          onPress={() => setPasswordModal(true)}
        />
      </Card>
    </>
  );

  const openSupportEmail = async () => {
    if (!supportEmail) {
      notify("Support email", "The Founder has not configured a support email.");
      return;
    }
    const url = `mailto:${supportEmail}`;
    try {
      if (await Linking.canOpenURL(url)) await Linking.openURL(url);
      else notify("Unable to open email", `Contact: ${supportEmail}`);
    } catch {
      notify("Unable to open email", `Contact: ${supportEmail}`);
    }
  };

  const openSupportPhone = async () => {
    if (!supportPhone) {
      notify("Support phone", "The Founder has not configured a support phone.");
      return;
    }
    const url = `tel:${supportPhone}`;
    try {
      if (await Linking.canOpenURL(url)) await Linking.openURL(url);
      else notify("Unable to make a call", `Contact: ${supportPhone}`);
    } catch {
      notify("Unable to make a call", `Contact: ${supportPhone}`);
    }
  };

  const openSupportWebsite = async () => {
    if (!supportWebsite) {
      notify("Support website", "The Founder has not configured a support website.");
      return;
    }
    const url = /^https?:\/\//i.test(supportWebsite)
      ? supportWebsite
      : `https://${supportWebsite}`;
    try {
      await Linking.openURL(url);
    } catch {
      notify("Unable to open website", url);
    }
  };

  const renderSupport = () => (
    <>
      <Text style={styles.pageTitle}>Help & Support</Text>
      <Text style={styles.muted}>
        Get help with {platformName} and the platform services.
      </Text>

      <Card>
        <Text style={styles.sectionTitle}>Platform Support</Text>
        <Text style={styles.muted}>
          Contact the {platformName} support team for assistance.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => void openSupportEmail()}
          style={styles.supportBlock}
        >
          <Text style={styles.supportIcon}>✉</Text>
          <Text style={styles.label}>Support Email · Tap to email</Text>
          <Text selectable style={styles.supportValue}>
            {supportEmail || "Not configured by Founder"}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => void openSupportPhone()}
          style={styles.supportBlock}
        >
          <Text style={styles.supportIcon}>☎</Text>
          <Text style={styles.label}>Support Phone · Tap to call</Text>
          <Text selectable style={styles.supportValue}>
            {supportPhone || "Not configured by Founder"}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => void openSupportWebsite()}
          style={styles.supportBlock}
        >
          <Text style={styles.supportIcon}>◎</Text>
          <Text style={styles.label}>Support Website · Tap to open</Text>
          <Text selectable style={styles.supportValue}>
            {supportWebsite || "Not configured by Founder"}
          </Text>
        </Pressable>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Platform Preferences</Text>
        <Row label="Currency" value={platformCurrency} />
        <Row label="Language" value={platformLanguage} />
        <Row label="Timezone" value={platformTimezone} />
        <Button
          title="Refresh Founder Settings"
          secondary
          onPress={() => void refresh()}
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>
          Need help with a service request or work order?
        </Text>
        <Text style={styles.muted}>
          Contact the service company using the details available in
          your request or work order. Support contact information on
          this screen is fetched from platform settings.
        </Text>
        <Button
          title="Refresh Support Details"
          secondary
          onPress={() => void refresh()}
        />
      </Card>
    </>
  );

  const callWorkerAction = async (item: Data, action: "accept" | "start" | "complete" | "log") => {
    if (maintenanceEnabled) {
      setError(maintenanceMessage.trim() || `${platformName} is currently under maintenance.`);
      return;
    }
    if (item?.id == null) { setError("Work order ID is missing."); return; }
    if (action === "log" && !workProgress.trim()) { setError("Enter work progress before saving."); return; }
    clearMessages();
    setLoading(true);
    try {
      const id = item.id;
      // Django URL configuration exposes WorkOrderActionView at
      // /work-orders/<id>/<action>/; use that canonical route for status changes.
      if (action === "log") {
        await api.post("/work-logs/", {
          work_order: id,
          description: workProgress.trim(),
          notes: workProgress.trim(),
          log_type: "progress",
        });
      } else {
        await api.post(`/work-orders/${id}/${action}/`);
      }
      setSuccess(action === "log" ? "Work progress saved." : `Work order ${action === "start" ? "started" : action === "complete" ? "marked complete" : "accepted"}.`);
      if (action === "log") setWorkProgress("");
      await loadData();
      const detail = await api.get(`/work-orders/${id}/`);
      let updated: Data = detail.data?.data || detail.data || item;
      const requestId = updated.service_request_id ?? updated.service_request?.id ?? updated.request_id;
      if (requestId != null && (!updated.service_request || typeof updated.service_request !== "object" || !updated.service_request.description)) {
        try {
          const req = await api.get(`/service-requests/${requestId}/`);
          updated = { ...updated, service_request: req.data?.data || req.data };
        } catch { /* Request details are optional if API permissions deny the lookup. */ }
      }
      setSelectedWorkOrder(updated);
    } catch (e: any) {
      const status = e?.response?.status;
      const detail = e?.response?.data?.detail;
      if (status === 401 || String(detail || "").toLowerCase().includes("token")) {
        setError("Your session token was rejected by the server. Please log out and sign in again. If this repeats, the backend's worker action endpoint is using a different authentication/token configuration than /me/.");
      } else {
        setError(message(e));
      }
    } finally { setLoading(false); }
  };

  const uploadWorkEvidence = async (item: Data) => {
    if (maintenanceEnabled) {
      setError(maintenanceMessage.trim() || `${platformName} is currently under maintenance.`);
      return;
    }
    if (item?.id == null) { setError("Work order ID is missing."); return; }
    clearMessages();
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false, type: ["image/*", "application/pdf"] });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const form = new FormData();
      form.append("work_order", String(item.id));
      form.append("description", evidenceDescription.trim() || "Work evidence");
      form.append("file", { uri: asset.uri, name: asset.name || "work-evidence", type: asset.mimeType || "application/octet-stream" } as any);
      setLoading(true);
      await api.post("/work-evidence/", form, { headers: { "Content-Type": "multipart/form-data" } });
      setSuccess("Work evidence uploaded successfully.");
      setEvidenceDescription("");
      const detail = await api.get(`/work-orders/${item.id}/`);
      setSelectedWorkOrder(detail.data?.data || detail.data || item);
    } catch (e: any) {
      setError(message(e));
    } finally { setLoading(false); }
  };

  const renderWorkerDashboard = () => {
    const assigned = workOrders.filter((w) => ["assigned", "pending", "new"].includes(String(w.status || "").toLowerCase()));
    const active = workOrders.filter((w) => ["accepted", "on_the_way", "in_progress", "in progress"].includes(String(w.status || "").toLowerCase()));
    const completed = workOrders.filter((w) => ["completed", "closed", "customer_confirmed"].includes(String(w.status || "").toLowerCase()));
    return <>
      <Text style={styles.breadcrumb}>{platformName}  ›  Worker Portal</Text>
      <Text style={styles.pageTitle}>Worker Dashboard</Text>
      <Text style={styles.muted}>Review assigned jobs and keep customers updated.</Text>
      <Button title="↻ Refresh" secondary onPress={() => void refresh()} />
      <View style={styles.statsGrid}>
        <Card><Text style={styles.statLabel}>Total Jobs</Text><Text style={styles.statNumber}>{workOrders.length}</Text><Text style={styles.muted}>Assigned to you</Text></Card>
        <Card><Text style={styles.statLabel}>Pending Jobs</Text><Text style={styles.statNumber}>{assigned.length}</Text><Text style={styles.muted}>Awaiting acceptance</Text></Card>
        <Card><Text style={styles.statLabel}>In Progress</Text><Text style={styles.statNumber}>{active.length}</Text><Text style={styles.muted}>Currently active</Text></Card>
        <Card><Text style={styles.statLabel}>Completed</Text><Text style={styles.statNumber}>{completed.length}</Text><Text style={styles.muted}>Finished jobs</Text></Card>
      </View>
      <Text style={styles.sectionTitle}>Recent Work Orders</Text>
      {workOrders.length ? workOrders.slice(0, 8).map((w, i) => <Pressable key={String(w.id ?? i)} onPress={() => void openWorkOrder(w)}><Card><View style={styles.between}><Text style={styles.smallBlue}>{w.work_order_number || `WO-${w.id}`}</Text><Tag value={w.status} /></View><Text style={styles.cardTitle}>{w.title || w.service_request_title || w.service_request?.title || "Service job"}</Text><Text style={styles.muted}>Customer: {w.customer_name || w.customer_details?.name || w.customer?.name || "Not provided"}</Text><Text style={styles.muted}>Location: {w.address || w.service_request?.address || w.location || "Not provided"}</Text><Text style={styles.link}>Open Work Order →</Text></Card></Pressable>) : <Card><Text style={styles.cardTitle}>No work orders yet</Text><Text style={styles.muted}>New jobs assigned to your account will appear here.</Text></Card>}
      <Text style={styles.sectionTitle}>Recent Notifications</Text>
      {notifications.slice(0, 3).map((n, i) => <Card key={String(n.id ?? i)}><Text style={styles.cardTitle}>{n.title || n.notification_type || "Update"}</Text><Text style={styles.muted}>{n.message || n.body || n.description || ""}</Text></Card>)}
    </>;
  };

  const renderWorkerOrders = () => {
    const filtered = workOrders.filter((w) => `${w.title || w.service_request_details?.title || w.service_request?.title || ""} ${w.work_order_number || ""} ${w.id || ""} ${w.customer_name || w.service_request_details?.customer?.name || w.service_request?.customer?.name || ""} ${w.status || ""}`.toLowerCase().includes(search.toLowerCase()) && (statusFilter === "All Status" || statusText(w.status).toLowerCase() === statusFilter.toLowerCase()));
    return <>
      <Text style={styles.breadcrumb}>{platformName}  ›  Worker Portal</Text><Text style={styles.pageTitle}>My Work Orders</Text><Text style={styles.muted}>View assigned jobs, contact customers, and submit work progress.</Text>
      <Field label="Search work orders..." value={search} onChangeText={setSearch} />
      <View style={styles.filterRow}>{["All Status", "Assigned", "Accepted", "On The Way", "In Progress", "Completed", "Closed"].map((st) => <Pressable key={st} onPress={() => setStatusFilter(st)} style={[styles.filter, statusFilter === st && styles.filterActive]}><Text style={[styles.filterText, statusFilter === st && styles.filterTextActive]}>{st}</Text></Pressable>)}</View>
      <Button title="↻ Refresh" secondary onPress={() => void refresh()} />
      {filtered.length ? filtered.map((w, i) => <Pressable key={String(w.id ?? i)} onPress={() => void openWorkOrder(w)}><Card><View style={styles.between}><Text style={styles.smallBlue}>{w.work_order_number || `WO-${w.id}`}</Text><Tag value={w.status} /></View><Text style={styles.cardTitle}>{w.service_request_details?.title || w.service_request?.title || w.title || w.service_request_title || "Service job"}</Text><Row label="Service Request" value={w.service_request_details?.request_number || w.request_number || w.service_request_number || w.service_request?.request_number || w.service_request_id} /><Row label="Customer" value={w.service_request_details?.customer?.name || w.service_request_details?.customer?.username || w.customer_name || w.customer_details?.name || w.customer?.name || w.service_request?.customer?.name} /><Row label="Location" value={w.service_request_details?.address || w.address || w.service_request?.address || w.location} /><Text style={styles.link}>Open Work Order →</Text></Card></Pressable>) : <Card><Text style={styles.cardTitle}>No matching work orders</Text></Card>}
    </>;
  };

  const renderWorkerOrderDetails = () => {
    const w = selectedWorkOrder;
    if (!w) return <Text style={styles.muted}>No work order selected.</Text>;
    const status = String(w.status || "assigned").toLowerCase();
    // Match the working website portal's serializer contract first.
    const request = (w.service_request_details && typeof w.service_request_details === "object")
      ? w.service_request_details
      : (w.service_request && typeof w.service_request === "object")
        ? w.service_request
        : w.request_details || {};
    const customer = request.customer_details || request.customer || w.customer_details || w.customer || {};
    const phone = w.customer_phone || customer.phone || customer.mobile || request.phone || request.customer_phone || w.phone;
    const email = w.customer_email || customer.email || request.email;
    const address = request.address || w.address || request.location || w.location || customer.address || "";
    const customerName = customer.name || customer.full_name || customer.username || w.customer_name || request.customer_name || request.name;
    const serviceTitle = request.title || request.service_name || request.requested_service || w.service_request_title || w.service_title || w.title;
    const serviceDescription = request.description || request.details || request.problem_description || w.description || w.notes;
    const evidence = arr(w.evidence || w.work_evidence || w.attachments || request.evidence);
    const logs = arr(w.logs || w.work_logs || w.progress_logs);
    return <>
      <Pressable onPress={() => navigate("workOrders")}><Text style={styles.link}>← Back to Work Orders</Text></Pressable>
      <Text style={styles.breadcrumb}>{platformName}  ›  Worker Portal</Text><Text style={styles.pageTitle}>{w.title || serviceTitle || "Work Order"}</Text><Text style={styles.muted}>Work Order #{w.work_order_number || w.id}</Text>
      <Card>
        <View style={styles.between}><Text style={styles.sectionTitle}>Work Order Status</Text><Tag value={w.status} /></View>
        <Row label="Service Request" value={w.request_number || w.service_request_number || request.request_number || request.id || w.service_request_id} />
        <Row label="Assigned Date" value={dateText(w.assigned_at || w.assigned_date || w.created_at)} />
        <Row label="Customer" value={customerName} />
        <Row label="Location" value={address} />
        {!!phone && <Button title={`☎ Call Customer · ${phone}`} secondary onPress={() => void Linking.openURL(`tel:${phone}`)} />}
        {!!email && <Button title={`✉ Email Customer · ${email}`} secondary onPress={() => void Linking.openURL(`mailto:${email}`)} />}
        {!!address && <Button title="📍 Open in Google Maps" secondary onPress={() => void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`)} />}
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>Customer Service Request</Text>
        <Row label="Requested Service" value={serviceTitle} />
        <Text style={styles.muted}>Customer's description / issue</Text>
        <Text style={styles.description}>{serviceDescription || "The service request details were not included in the work-order response."}</Text>
        <Row label="Request ID" value={request.request_number || request.id || w.service_request_id} />
        <Row label="Request Status" value={request.status} />
        <Row label="Customer Contact" value={phone || email} />
      </Card>
      {(status === "assigned" || status === "pending" || status === "new") ? <Button title={loading ? "Please wait..." : "✓ Accept Job"} disabled={loading} onPress={() => void callWorkerAction(w, "accept")} /> : null}
      {["accepted", "on_the_way", "on the way"].includes(status) ? <Button title={loading ? "Please wait..." : "▶ Start Work"} disabled={loading} onPress={() => void callWorkerAction(w, "start")} /> : null}
      {! ["completed", "closed", "customer_confirmed"].includes(status) ? <Card>
        <Text style={styles.sectionTitle}>Work Progress</Text>
        <Field label="Work progress, issue found, parts used..." value={workProgress} onChangeText={setWorkProgress} multiline placeholder="Describe the work performed..." />
        <Button title={loading ? "Saving..." : "Save Work Progress"} disabled={loading || !workProgress.trim()} secondary onPress={() => void callWorkerAction(w, "log")} />
        <Text style={styles.sectionTitle}>Upload Work Evidence</Text>
        <Field label="Evidence description (optional)" value={evidenceDescription} onChangeText={setEvidenceDescription} placeholder="Before/after photo, invoice, issue proof..." />
        <Button title={loading ? "Uploading..." : "Choose Photo or PDF and Upload"} disabled={loading} secondary onPress={() => void uploadWorkEvidence(w)} />
        {evidence.length ? evidence.map((ev, i) => <Text key={String(ev.id ?? i)} style={styles.link}>{ev.file_name || ev.name || ev.title || ev.file || ev.url || "Uploaded evidence"}</Text>) : null}
        {["in_progress", "in progress"].includes(status) ? <Button title={loading ? "Please wait..." : "✓ Mark Work Completed"} disabled={loading} onPress={() => void callWorkerAction(w, "complete")} /> : null}
      </Card> : <Text style={styles.successText}>This work order is marked complete.</Text>}
      <Card><Text style={styles.sectionTitle}>Work Progress History</Text>{logs.length ? logs.map((log, i) => <View key={String(log.id ?? i)} style={styles.infoRow}><Text style={styles.cardTitle}>{log.log_type || log.title || "Work update"}</Text><Text style={styles.infoValue}>{log.description || log.notes || ""}</Text><Text style={styles.muted}>{dateText(log.created_at)}</Text></View>) : <Text style={styles.muted}>No progress logs are available yet.</Text>}</Card>
    </>;
  };

  const renderContent = () => {
    switch (page) {
      case "workerDashboard":
        return renderWorkerDashboard();
      case "dashboard":
        return portalRole === "worker" ? renderWorkerDashboard() : renderDashboard();
      case "requests":
        return renderRequests();
      case "newRequest":
        return renderNewRequest();
      case "requestDetails":
        return renderRequestDetails();
      case "workOrders":
        return portalRole === "worker" ? renderWorkerOrders() : renderWorkOrders();
      case "workOrderDetails":
        return portalRole === "worker" ? renderWorkerOrderDetails() : renderWorkOrderDetails();
      case "notifications":
        return renderNotifications();
      case "profile":
        return renderProfile();
      case "support":
        return renderSupport();
      default:
        return renderDashboard();
    }
  };

  const menuItems: {
    label: string;
    icon: string;
    target: Page;
  }[] = portalRole === "worker" ? [
    { label: "Dashboard", icon: "▦", target: "workerDashboard" },
    { label: "My Work Orders", icon: "▣", target: "workOrders" },
    { label: "Notifications", icon: "🔔", target: "notifications" },
    { label: "Profile", icon: "👤", target: "profile" },
    { label: "Help & Support", icon: "↗", target: "support" },
  ] : [
    { label: "Dashboard", icon: "▦", target: "dashboard" },
    { label: "My Requests", icon: "▤", target: "requests" },
    { label: "My Work Orders", icon: "▣", target: "workOrders" },
    { label: "Notifications", icon: "🔔", target: "notifications" },
    { label: "Profile", icon: "👤", target: "profile" },
    { label: "Help & Support", icon: "↗", target: "support" },
  ];

  if (loading && !authenticated) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.navy} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.muted}>Connecting to {platformName}...</Text>
        </View>
      </SafeAreaView>
    );
  }


if (!authenticated) {
  const registering = page === "register" && allowCustomerRegistration;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={C.navy}
      />

      <ScrollView
        contentContainerStyle={styles.authScreen}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* SEIYALAM branding */}
        <View style={styles.authHeader}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>S</Text>
          </View>

          <Text style={styles.authBrand}>{platformName}</Text>
<Text style={styles.authSubtitle}>
  SERVICE MANAGEMENT PLATFORM - UPDATE TEST
</Text>
        </View>

        {/* Login and registration card */}
        <View style={styles.authCard}>
          {renderMessage()}
          {renderPlatformNotices()}

          {!registering ? (
            <>
              <Text style={styles.pageTitle}>Welcome back</Text>

              <Text style={styles.authDescription}>
                Sign in to access your SEIYALAM portal. Worker
                accounts open the Worker Portal automatically.
              </Text>

              <Field
                label="Username or Mobile Number"
                value={loginData.username}
                onChangeText={(v) =>
                  setLoginData({ ...loginData, username: v })
                }
              />

              <Field
                label="Password"
                value={loginData.password}
                onChangeText={(v) =>
                  setLoginData({ ...loginData, password: v })
                }
                secure
              />

              <Button
                title={loading ? "Signing in..." : "Sign In"}
                disabled={loading}
                onPress={() => void login()}
              />

              <View style={styles.authDivider}>
                <View style={styles.dividerLine} />

                <Text style={styles.muted}>
                  New to {platformName}?
                </Text>

                <View style={styles.dividerLine} />
              </View>

              {allowCustomerRegistration ? (
                <Button
                  title="Create Customer Account"
                  secondary
                  disabled={loading || maintenanceEnabled}
                  onPress={() => {
                    clearMessages();
                    setPage("register");
                  }}
                />
              ) : (
                <Text style={styles.muted}>
                  New customer registration is currently disabled
                  by the Founder. Please contact platform support
                  for assistance.
                </Text>
              )}
            </>
          ) : (
            <>
              <Pressable
                onPress={() => {
                  clearMessages();
                  setPage("dashboard");
                }}
              >
                <Text style={styles.link}>
                  ← Back to Sign In
                </Text>
              </Pressable>

              <Text style={styles.pageTitle}>
                Create Customer Account
              </Text>

              <Text style={styles.authDescription}>
                Register to submit and track your service requests.
              </Text>

              <Field
                label="Full Name *"
                value={registerData.name}
                onChangeText={(v) =>
                  setRegisterData({ ...registerData, name: v })
                }
              />

              <Field
                label="Username *"
                value={registerData.username}
                onChangeText={(v) =>
                  setRegisterData({ ...registerData, username: v })
                }
              />

              <Field
                label="Email"
                value={registerData.email}
                onChangeText={(v) =>
                  setRegisterData({ ...registerData, email: v })
                }
                keyboardType="email-address"
              />

              <Field
                label="10-digit Phone *"
                value={registerData.phone}
                onChangeText={(v) =>
                  setRegisterData({
                    ...registerData,
                    phone: v.replace(/\D/g, "").slice(0, 10),
                  })
                }
                keyboardType="phone-pad"
              />

              <Field
                label="Password (minimum 8 characters) *"
                value={registerData.password}
                onChangeText={(v) =>
                  setRegisterData({
                    ...registerData,
                    password: v,
                  })
                }
                secure
              />

              <Field
                label="Confirm Password *"
                value={registerData.confirm_password}
                onChangeText={(v) =>
                  setRegisterData({
                    ...registerData,
                    confirm_password: v,
                  })
                }
                secure
              />

              <Button
                title={
                  loading ? "Registering..." : "Register Customer"
                }
                disabled={loading}
                onPress={() => void register()}
              />

              <View style={{ height: 12 }} />

              <Button
                title="Already have an account? Sign In"
                secondary
                disabled={loading}
                onPress={() => {
                  clearMessages();
                  setPage("dashboard");
                }}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
  barStyle="dark-content"
  backgroundColor={C.white}
  translucent={false}
/>

      {renderHeader()}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          key={page}
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh()}
            />
          }
        >
          {renderMessage()}
          {renderPlatformNotices()}
          {renderContent()}
          <Text style={styles.footer}>
            {platformName} • Service Management Platform
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Left navigation drawer */}
<Modal
  visible={sidebar}
  transparent
  animationType="slide"
  statusBarTranslucent={false}
  navigationBarTranslucent={false}
  onRequestClose={() => setSidebar(false)}
>
        <View style={styles.overlay}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <View>
                <Text style={styles.sidebarBrand}>{platformName}</Text>
                <Text style={styles.sidebarSubtitle}>
                  {portalRole === "worker" ? "Worker Portal" : "Customer Portal"}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => setSidebar(false)}
                hitSlop={12}
              >
                <Text style={styles.closeIcon}>×</Text>
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1 }}>
              {menuItems.map((item) => {
                const active =
                  page === item.target ||
                  (page === "requestDetails" &&
                    item.target === "requests") ||
                  (page === "workOrderDetails" &&
                    item.target === "workOrders");

                return (
                  <Pressable
                    key={item.target}
                    accessibilityRole="button"
                    onPress={() => navigate(item.target)}
                    style={[
                      styles.menuItem,
                      active && styles.menuItemActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.menuItemIcon,
                        active && { color: C.white },
                      ]}
                    >
                      {item.icon}
                    </Text>

                    <Text
                      style={[
                        styles.menuItemText,
                        active && { color: C.white },
                      ]}
                    >
                      {item.label}
                    </Text>

                    {item.target === "notifications" &&
                      unreadCount > 0 && (
                        <View style={styles.menuBadge}>
                          <Text style={styles.badgeText}>
                            {unreadCount}
                          </Text>
                        </View>
                      )}
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.sidebarUser}>
              <Text style={styles.sidebarUserName}>
                {displayName}
              </Text>
              <Text style={styles.sidebarUserEmail}>
                {user?.email || user?.username || ""}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => void logout()}
              style={styles.logoutItem}
            >
              <Text style={styles.logoutText}>↪   Logout</Text>
            </Pressable>
          </View>

          {/* The scrim comes after the drawer so the drawer stays on the left. */}
          <Pressable
            style={styles.scrim}
            onPress={() => setSidebar(false)}
          />
        </View>
      </Modal>

      {/* Profile dropdown */}
      <Modal
        visible={profileMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileMenu(false)}
      >
        <View style={styles.profileMenuBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setProfileMenu(false)}
          />

          <View style={styles.profileMenuCard}>
            <View style={styles.profileMenuHeading}>
              <View style={styles.profileMenuAvatar}>
                <Text style={styles.profileMenuAvatarText}>👤</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.profileMenuName}>
                  {displayName}
                </Text>
                <Text style={styles.profileMenuEmail}>
                  {user?.email || user?.username || ""}
                </Text>
              </View>
            </View>

            <View style={styles.profileMenuDivider} />

            <Pressable
              accessibilityRole="button"
              style={styles.profileMenuItem}
              onPress={() => {
                setProfileMenu(false);
                navigate("profile");
                setProfileModal(true);
              }}
            >
              <Text style={styles.profileMenuItemIcon}>👤</Text>
              <Text style={styles.profileMenuItemText}>
                Manage Profile
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={styles.profileMenuItem}
              onPress={() => void logout()}
            >
              <Text style={styles.profileMenuItemIcon}>↪</Text>
              <Text style={[styles.profileMenuItemText, { color: C.red }]}>
                Logout
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Edit profile modal */}
      <Modal
        visible={profileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setProfileModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <ScrollView
            style={styles.modalCard}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.between}>
              <Text style={styles.pageTitle}>Edit Profile</Text>
              <Pressable onPress={() => setProfileModal(false)}>
                <Text style={styles.closeDark}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.muted}>
              Update your personal information.
            </Text>

            <Field
              label="Name"
              value={profileForm.name}
              onChangeText={(v) =>
                setProfileForm({ ...profileForm, name: v })
              }
            />

            <Field
              label="Email"
              value={profileForm.email}
              onChangeText={(v) =>
                setProfileForm({ ...profileForm, email: v })
              }
              keyboardType="email-address"
            />

            <Field
              label="Mobile Number"
              value={profileForm.phone}
              onChangeText={(v) =>
                setProfileForm({
                  ...profileForm,
                  phone: v.replace(/\D/g, "").slice(0, 10),
                })
              }
              keyboardType="phone-pad"
            />

            <Field
              label="Address"
              value={profileForm.address}
              onChangeText={(v) =>
                setProfileForm({ ...profileForm, address: v })
              }
              multiline
            />

            <Text style={styles.muted}>
              Changing your phone number may require verification.
            </Text>

            <Button
              title={loading ? "Saving..." : "Save Changes"}
              disabled={loading}
              onPress={() => void saveProfile()}
            />

            <Button
              title="Cancel"
              secondary
              onPress={() => setProfileModal(false)}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Change password modal */}
      <Modal
        visible={passwordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPasswordModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <ScrollView
            style={styles.modalCard}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.between}>
              <Text style={styles.pageTitle}>Change Password</Text>
              <Pressable onPress={() => setPasswordModal(false)}>
                <Text style={styles.closeDark}>×</Text>
              </Pressable>
            </View>

            <Field
              label="Current Password"
              value={passwordForm.current_password}
              onChangeText={(v) =>
                setPasswordForm({
                  ...passwordForm,
                  current_password: v,
                })
              }
              secure
            />

            <Field
              label="New Password"
              value={passwordForm.new_password}
              onChangeText={(v) =>
                setPasswordForm({
                  ...passwordForm,
                  new_password: v,
                })
              }
              secure
            />

            <Field
              label="Confirm New Password"
              value={passwordForm.confirm_password}
              onChangeText={(v) =>
                setPasswordForm({
                  ...passwordForm,
                  confirm_password: v,
                })
              }
              secure
            />

            <Button
              title={loading ? "Updating..." : "Update Password"}
              disabled={loading}
              onPress={() => void changePassword()}
            />

            <Button
              title="Cancel"
              secondary
              onPress={() => setPasswordModal(false)}
            />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: C.background,
  },

header: {
  backgroundColor: C.white,
  minHeight: 64,
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 14,
  paddingTop: 50,
  gap: 12,
  borderBottomWidth: 1,
  borderBottomColor: C.border,
},

  menuButton: {
    width: 40,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIcon: {
    fontSize: 24,
    color: C.navy,
  },
  brandBlock: {
    flex: 1,
  },
  brand: {
    fontSize: 18,
    fontWeight: "900",
    color: C.navy,
    letterSpacing: 0.7,
  },
  brandSub: {
    color: C.muted,
    fontSize: 11,
    marginTop: 2,
  },
  headerIcon: {
    width: 38,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconText: {
    fontSize: 21,
    color: C.navy,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 17,
    height: 17,
    borderRadius: 10,
    backgroundColor: C.red,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: C.white,
    fontSize: 10,
    fontWeight: "900",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.paleBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: C.primary,
    fontSize: 20,
  },
  page: {
    padding: 14,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },

authScreen: {
  flexGrow: 1,
  backgroundColor: "#07152F",
  paddingHorizontal: 20,
  paddingTop: 24,
  paddingBottom: 32,
  alignItems: "center",
  justifyContent: "center",
},

authHeader: {
  width: "100%",
  alignItems: "center",
  justifyContent: "center",
  paddingTop: 10,
  paddingBottom: 28,
},

logoBox: {
  width: 68,
  height: 68,
  borderRadius: 20,
  backgroundColor: "#0866F5",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 12,
},

logoText: {
  color: "#FFFFFF",
  fontSize: 40,
  fontWeight: "900",
},

authBrand: {
  color: "#FFFFFF",
  fontSize: 29,
  fontWeight: "900",
  letterSpacing: 1.2,
  textAlign: "center",
},

authSubtitle: {
  color: "#CBD5E1",
  fontSize: 10,
  fontWeight: "700",
  letterSpacing: 1.2,
  marginTop: 8,
  textAlign: "center",
},

authPage: {
  paddingHorizontal: 20,
  paddingTop: 20,
  paddingBottom: 40,
  width: "100%",
  maxWidth: 480,
  alignSelf: "center",
  flexGrow: 1,
  justifyContent: "center",
},

authCard: {
  width: "100%",
  maxWidth: 480,
  backgroundColor: "#FFFFFF",
  borderRadius: 24,
  padding: 22,
  borderWidth: 1,
  borderColor: "#E2E8F0",
},

authDescription: {
  color: C.muted,
  fontSize: 15,
  lineHeight: 23,
  marginBottom: 24,
},

dividerLine: {
  flex: 1,
  height: 1,
  backgroundColor: "#D9E1EC",
},

pageTitle: {
  color: C.text,
  fontSize: 28,
  lineHeight: 36,
  fontWeight: "900",
  marginTop: 4,
  marginBottom: 8,
},

  breadcrumb: {
    color: C.muted,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  muted: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 10,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 12,
    marginBottom: 4,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  cardTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 4,
  },
  description: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  smallBlue: {
    color: C.primary,
    fontSize: 11,
    fontWeight: "900",
  },
  link: {
    color: C.primary,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 10,
  },
  arrow: {
    color: "#94A3B8",
    fontSize: 26,
    paddingLeft: 10,
  },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  statsGrid: {
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  statLabel: {
    color: C.muted,
    fontSize: 13,
  },
  statNumber: {
    color: C.text,
    fontSize: 31,
    fontWeight: "900",
    marginTop: 5,
  },
  tag: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  tagText: {
    fontSize: 10,
    fontWeight: "900",
  },
  button: {
    backgroundColor: C.navy,
    minHeight: 46,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonText: {
    color: C.white,
    fontSize: 13,
    fontWeight: "900",
  },
  buttonSecondary: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  buttonSecondaryText: {
    color: C.text,
  },
  field: {
    marginTop: 12,
    marginBottom: 3,
  },
  label: {
    color: C.text,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 7,
  },
  input: {
    backgroundColor: C.white,
    borderColor: "#CBD5E1",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 46,
    fontSize: 14,
    color: C.text,
  },
  infoRow: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  infoLabel: {
    color: C.muted,
    fontSize: 12,
  },
  infoValue: {
    color: C.text,
    fontSize: 14,
    marginTop: 5,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginVertical: 8,
  },
  filter: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  filterActive: {
    backgroundColor: C.navy,
    borderColor: C.navy,
  },
  filterText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  filterTextActive: {
    color: C.white,
  },
  companyOption: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 8,
  },
  companyOptionActive: {
    borderColor: C.primary,
    backgroundColor: C.paleBlue,
  },
  timeline: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 3,
    marginTop: 18,
  },
  timelineItem: {
    flex: 1,
    alignItems: "center",
  },
  timelineDot: {
    width: 27,
    height: 27,
    borderRadius: 15,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotActive: {
    backgroundColor: C.primary,
  },
  timelineDotText: {
    color: C.white,
    fontSize: 11,
    fontWeight: "900",
  },
  timelineLabel: {
    color: C.muted,
    fontSize: 9,
    textAlign: "center",
    marginTop: 7,
  },
  profileAvatar: {
    width: 68,
    height: 68,
    borderRadius: 35,
    alignSelf: "center",
    backgroundColor: C.paleBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  profileAvatarText: {
    fontSize: 35,
    color: C.primary,
  },
  warning: {
    color: "#B45309",
    backgroundColor: "#FFFBEB",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    fontSize: 12,
  },
  supportBlock: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  supportIcon: {
    fontSize: 20,
    color: C.primary,
    marginBottom: 8,
  },
  supportValue: {
    color: C.primary,
    fontSize: 13,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    lineHeight: 19,
  },
  successBox: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  successText: {
    color: "#166534",
    fontSize: 13,
  },
  footer: {
    color: "#94A3B8",
    fontSize: 10,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  authDivider: {
    alignItems: "center",
    marginTop: 14,
  },
  overlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  scrim: {
    flex: 1,
  },
  sidebar: {
    width: 290,
    maxWidth: "85%",
    backgroundColor: C.navy,
    padding: 20,
    paddingTop: 20,
  },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#263047",
  },
  sidebarBrand: {
    color: C.white,
    fontSize: 20,
    fontWeight: "900",
  },
  sidebarSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 3,
  },
  closeIcon: {
    color: C.white,
    fontSize: 30,
    paddingHorizontal: 6,
  },
  menuItem: {
    minHeight: 48,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 6,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: C.primary,
  },
  menuItemIcon: {
    width: 22,
    color: "#CBD5E1",
    fontSize: 19,
    textAlign: "center",
  },
  menuItemText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  menuBadge: {
    backgroundColor: C.red,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  sidebarUser: {
    backgroundColor: "#121B30",
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
  },
  sidebarUserName: {
    color: C.white,
    fontWeight: "800",
    fontSize: 13,
  },
  sidebarUserEmail: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 4,
  },
  logoutItem: {
    padding: 14,
    marginTop: 8,
  },
  logoutText: {
    color: "#FB7185",
    fontSize: 13,
    fontWeight: "900",
  },
  profileMenuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "flex-end",
    paddingTop: Platform.OS === "ios" ? 65 : 55,
    paddingHorizontal: 12,
  },
  profileMenuCard: {
    width: 250,
    maxWidth: "100%",
    backgroundColor: C.white,
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  profileMenuHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  profileMenuAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.paleBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  profileMenuAvatarText: {
    fontSize: 21,
  },
  profileMenuName: {
    color: C.text,
    fontSize: 14,
    fontWeight: "900",
  },
  profileMenuEmail: {
    color: C.muted,
    fontSize: 11,
    marginTop: 3,
  },
  profileMenuDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 8,
  },
  profileMenuItem: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 5,
  },
  profileMenuItemIcon: {
    fontSize: 18,
    width: 24,
    textAlign: "center",
  },
  profileMenuItemText: {
    color: C.text,
    fontSize: 13,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 14,
  },
  modalCard: {
    maxHeight: "90%",
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 18,
  },
  closeDark: {
    color: C.text,
    fontSize: 29,
    paddingHorizontal: 5,
  },
});