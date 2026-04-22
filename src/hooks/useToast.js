import { useState, useCallback } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const show = useCallback((msg, type='info', duration=4000) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
  }, [])

  const success = (msg) => show(msg, 'success')
  const error   = (msg) => show(msg, 'error')
  const info    = (msg) => show(msg, 'info')

  return { toasts, show, success, error, info }
}

export function ToastContainer({ toasts }) {
  const icons = { success:'✅', error:'❌', info:'ℹ️' }
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{icons[t.type]}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
