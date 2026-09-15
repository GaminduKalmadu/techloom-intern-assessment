import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as settingService from '../services/settingService';

const DEFAULT_SETTINGS = {
  storeName: 'Techloom POS Retail',
  storeEmail: 'support@techloom.ai',
  storePhone: '+1 (555) 019-2834',
  storeAddress: '100 Innovation Way, Suite 400, Tech Park, CA',
  currency: 'USD',
  currencySymbol: '$',
  taxRate: 8.25,
  taxId: 'TX-992014-A',
  lowStockThreshold: 10,
  receiptHeader: 'THANK YOU FOR SHOPPING AT TECHLOOM POS',
  receiptFooter: 'Goods once sold can be returned within 14 days with original receipt.',
  enableSound: true,
  autoPrintReceipt: false,
  showCashierOnReceipt: true,
  showBarcodeOnReceipt: true,
};

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  // 1. Initial state from localStorage or default
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('pos_system_settings');
      return cached ? { ...DEFAULT_SETTINGS, ...JSON.parse(cached) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // 2. Hydrate from backend API on mount
  useEffect(() => {
    const fetchRemoteSettings = async () => {
      try {
        setIsLoading(true);
        const res = await settingService.getSettings();
        if (res && res.data) {
          setSettings((prev) => {
            const merged = { ...prev, ...res.data };
            localStorage.setItem('pos_system_settings', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        console.warn('Could not sync remote settings, using local configuration:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRemoteSettings();
  }, []);

  // 3. Update settings handler
  const saveSettings = useCallback(async (newConfig) => {
    setIsLoading(true);
    try {
      // Optimistic update
      const updated = { ...settings, ...newConfig };
      setSettings(updated);
      localStorage.setItem('pos_system_settings', JSON.stringify(updated));

      // Sync with backend
      const res = await settingService.updateSettings(newConfig);
      if (res && res.data) {
        setSettings(res.data);
        localStorage.setItem('pos_system_settings', JSON.stringify(res.data));
      }
      setLastSaved(new Date());
      return { success: true, data: updated };
    } catch (err) {
      console.error('Failed to persist settings to server:', err);
      // Still persist locally
      setLastSaved(new Date());
      return { success: true, warning: 'Saved locally. Server sync pending.' };
    } finally {
      setIsLoading(false);
    }
  }, [settings]);

  // 4. Reset to factory defaults
  const resetToDefaults = useCallback(async () => {
    setIsLoading(true);
    try {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem('pos_system_settings', JSON.stringify(DEFAULT_SETTINGS));
      await settingService.resetSettings();
      setLastSaved(new Date());
      return { success: true };
    } catch (err) {
      console.warn('Backend reset failed, resetting local defaults:', err);
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 5. Utility helper to format currency
  const formatCurrency = useCallback(
    (amount) => {
      const num = Number(amount) || 0;
      return `${settings.currencySymbol || '$'}${num.toFixed(2)}`;
    },
    [settings.currencySymbol]
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        lastSaved,
        saveSettings,
        resetToDefaults,
        formatCurrency,
        currencySymbol: settings.currencySymbol || '$',
        lowStockThreshold: settings.lowStockThreshold || 10,
        taxRate: settings.taxRate !== undefined ? settings.taxRate : 8.25,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
