import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const show = (message, title = '', type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, title, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const toast = {
    success: (msg, title) => show(msg, title, 'success'),
    error: (msg, title) => show(msg, title, 'error'),
    info: (msg, title) => show(msg, title, 'info'),
    warning: (msg, title) => show(msg, title, 'warning'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2 rounded shadow-lg text-white text-sm font-bold transition-all ${
              t.type === 'success' ? 'bg-green-500' :
              t.type === 'error' ? 'bg-red-500' :
              t.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
