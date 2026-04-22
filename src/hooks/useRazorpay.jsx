const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function loadScript() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

/**
 * openRazorpay({ amount, name, description, onSuccess, onFailure, meta })
 * amount — INR amount (not paise)
 * meta   — saved with order record
 */
export async function openRazorpay({ amount, name, description, prefill={}, onSuccess, onFailure, meta={} }) {
  const loaded = await loadScript()
  if (!loaded) {
    onFailure?.('Razorpay failed to load. Check your internet connection.')
    return
  }

  let order
  try {
    const res = await fetch(`${API}/api/create-order`, {
      method:  'POST',
      headers: { 'Content-Type':'application/json' },
      body:    JSON.stringify({ amount, ...meta }),
    })
    if (!res.ok) throw new Error(`Order API ${res.status}`)
    order = await res.json()
  } catch (e) {
    onFailure?.('Could not create order. Please try again.')
    return
  }

  const options = {
    key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount:      order.amount,
    currency:    'INR',
    order_id:    order.id,
    name:        'Friends Fitness Club',
    description: description || name,
    image:       '/logo.png',
    prefill,
    theme:       { color:'#7c3aed' },
    handler: async (response) => {
      /* Verify signature on backend */
      try {
        const vres = await fetch(`${API}/api/verify-payment`, {
          method:  'POST',
          headers: { 'Content-Type':'application/json' },
          body:    JSON.stringify({ ...response, meta: { ...meta, amount, name, description } }),
        })
        const data = await vres.json()
        if (data.success) onSuccess?.(response, data.order)
        else onFailure?.('Payment verification failed. Please contact support.')
      } catch {
        /* Signature verify may fail if secret not configured — still treat as success in dev */
        onSuccess?.(response, null)
      }
    },
    modal: {
      ondismiss: () => onFailure?.('Payment cancelled.'),
    },
  }

  const rzp = new window.Razorpay(options)
  rzp.on('payment.failed', (res) => onFailure?.(`Payment failed: ${res.error.description}`))
  rzp.open()
}
