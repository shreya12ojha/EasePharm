"use client"
import { useToast } from "../../hooks/useToast"

export const Toaster = () => {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg max-w-sm ${
            toast.variant === "destructive" ? "bg-red-500 text-white" : "bg-white border border-gray-200"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              {toast.title && <div className="font-semibold text-sm">{toast.title}</div>}
              {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
            </div>
            <button onClick={() => dismiss(toast.id)} className="ml-2 text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export const ToastProvider = ({ children }) => {
  return <>{children}</>
}
