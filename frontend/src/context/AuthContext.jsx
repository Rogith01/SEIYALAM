
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginUser,
  getCurrentUser,
  logoutUser,
} from "../services/auth";

import { getPlatformSettings } from "../services/api";


const AuthContext = createContext();


export const AuthProvider = ({ children }) => {

  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(
      localStorage.getItem("access_token")
    )
  );


  const [user, setUser] = useState(() => {

    const savedUser =
      localStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });


  // ==========================================================
  // PLATFORM SETTINGS
  // ==========================================================

  const [platformSettings, setPlatformSettings] =
    useState(null);


  const [platformSettingsLoading, setPlatformSettingsLoading] =
    useState(true);


  const loadPlatformSettings = async () => {

    try {

      const data =
        await getPlatformSettings();

      if (data?.success) {

        setPlatformSettings(data);

      }

    } catch (error) {

      console.error(
        "Failed to load platform settings:",
        error
      );

    } finally {

      setPlatformSettingsLoading(false);

    }
  };


  // Load platform settings when
  // the application starts.

  useEffect(() => {

    loadPlatformSettings();

  }, []);


  // ==========================================================
  // LOGIN
  // ==========================================================

  const login = async (
    username,
    password
  ) => {

    await loginUser(
      username,
      password
    );


    const currentUser =
      await getCurrentUser();


    setUser(currentUser);

    setIsAuthenticated(true);


    return currentUser;
  };


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = () => {

    logoutUser();

    setUser(null);

    setIsAuthenticated(false);

  };


  // ==========================================================
  // CONTEXT
  // ==========================================================

  return (

    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,

        login,
        logout,

        // Platform configuration
        platformSettings,
        platformSettingsLoading,
        loadPlatformSettings,
      }}
    >

      {children}

    </AuthContext.Provider>

  );

};


export const useAuth = () =>
  useContext(AuthContext);
