import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSystemHealth } from '../services/healthService';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState({
    status: 'checking',
    uptime: null,
    database: { isConnected: false },
    lastChecked: null,
  });

  const checkHealth = async () => {
    try {
      const res = await getSystemHealth();
      if (res && res.success) {
        setSystemHealth({
          status: 'online',
          uptime: res.data.uptime,
          database: res.data.database,
          lastChecked: new Date().toLocaleTimeString(),
        });
      } else {
        setSystemHealth((prev) => ({ ...prev, status: 'degraded' }));
      }
    } catch (err) {
      setSystemHealth({
        status: 'offline',
        uptime: null,
        database: { isConnected: false },
        lastChecked: new Date().toLocaleTimeString(),
        error: err.message,
      });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        mobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
        systemHealth,
        refreshHealth: checkHealth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
