import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("barber_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("barber_token");
  });

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("barber_token"));
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("barber_token", newToken);
    localStorage.setItem("barber_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("barber_token");
    localStorage.removeItem("barber_user");
    setToken(null);
    setUser(null);
  };

  const updateUserData = (updatedUser: User) => {
    localStorage.setItem("barber_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser: updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
