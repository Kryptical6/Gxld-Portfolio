import React, { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((current) => current.filter((item) => item.id !== id)), []);

  const toast = useCallback(
    (message, type = "info") => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, message, type }]);
      setTimeout(() => remove(id), 3200);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((item) => (
          <button key={item.id} type="button" className={`toast toast-${item.type}`} onClick={() => remove(item.id)}>
            {item.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
