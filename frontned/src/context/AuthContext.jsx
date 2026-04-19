import { createContext, useContext, useState, useEffect } from "react";
import api from '../api/axios';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  // ✅ After: reads localStorage synchronously during first render
  function getStoredUser() {
    try { return JSON.parse(localStorage.getItem("tiv_user")); }
    catch { return null; }
  }
  const [user, setUser] = useState(getStoredUser);  

  // 🔁 Load user from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem("tiv_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("tiv_user");
      }
    }
  }, []);

  // 🔐 LOGIN
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const { access_token, user } = res.data;

      // ✅ store token + user
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("tiv_user", JSON.stringify(user));

      setUser(user);

      return {
        success: true,
        role: user.role,
      };
    } catch (err) {
      return {
        success: false,
        error:
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // 📝 REGISTER
  const register = async (data) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", data);

      return {
        success: true,
        message: res.data.message,
        public_id: res.data.public_id,
      };
    } catch (err) {
      return {
        success: false,
        error:
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Registration failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // 🔓 LOGOUT
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("tiv_user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        login,
        register,
        logout,
        loading,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 🔑 Hook
export const useAuth = () => useContext(AuthContext);