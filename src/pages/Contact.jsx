import React, { useState } from 'react'
import { useToast, ToastContainer } from '../hooks/useToast.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const COUNTRY_CODES = [
  { code:'+91', flag:'🇮🇳', label:'India'     },
  { code:'+1',  flag:'🇺🇸', label:'USA'       },
  { code:'+44', flag:'🇬🇧', label:'UK'        },
  { code:'+61', flag:'🇦🇺', label:'Australia' },
  { code:'+971',flag:'🇦🇪', label:'UAE'       },
]

const INFO = [
  { icon:'📍', title:'Address',  lines:['RT Complex, 2nd Floor,','Wardhaman Nagar, Nagpur'] },
  { icon:'📞', title:'Phone',    lines:['+91 84848 05154'] },
  { icon:'✉️', title:'Email',    lines:['friendsfitnessclub18@gmail.com'] },
  { icon:'🕐', title:'Timings',  lines:['Mon–Sat: 5:00 AM – 10:00 PM','Sunday: Closed'] },
]

export default function Contact() {
  const [form, setForm]     = useState({ name:'', email:'', phone:'', message:'', countryCode:'+91' })
  const [status, setStatus] = useState('idle')
  const { toasts, success, error } = useToast()

  const set = (k, v) => setForm(f => ({ ...f, [k]:v }))

  async function submit(e) {
    e.preventDefault()
    if (!form.name||!form.email||!form.phone||!form.message) { error('Please fill in all fields'); return }
    setStatus('loading')
    try {
      const res = await fetch(`${API}/api/contact`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ...form, phone: form.countryCode + form.phone }),
      })
      if (res.ok) {
        setStatus('idle')
        setForm({ name:'', email:'', phone:'', message:'', countryCode:'+91' })
        success('✅ Message sent! We\'ll get back to you soon.')
      } else { setStatus('idle'); error('Something went wrong. Please try WhatsApp instead.') }
    } catch { setStatus('idle'); error('Network error. Please try again.') }
  }

  return (
    <div className="page-wrapper">
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .info-item{display:flex;gap:16px;margin-bottom:26px}
        .form-inp{width:100%;padding:13px 16px;background:rgba(255,255,255,0.05);border:1px solid rgba(124,58,237,0.2);border-radius:12px;color:#f0eeff;font-family:'Poppins',sans-serif;font-size:14px;outline:none;transition:border-color .2s,box-shadow .2s,background .2s}
        .form-inp:focus{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,0.18);background:rgba(124,58,237,0.06)}
        .form-inp::placeholder{color:#6b6490}
        @media(max-width:768px){.contact-wrap{grid-template-columns:1fr!important}}
      `}</style>

      <section className="section">
        <div style={{ maxWidth:980, margin:'0 auto' }}>

          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <div className="accent-line" style={{ margin:'0 auto 16px' }}/>
            <h1 className="section-title">
              Get In <span style={{ background:'linear-gradient(135deg,#bb86fc,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Touch</span>
            </h1>
            <p className="section-sub" style={{ margin:'0 auto' }}>
              Have questions about membership, training, or anything else? We'd love to hear from you.
            </p>
          </div>

          <div className="contact-wrap" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'start' }}>

            {/* ─── LEFT: Info ─── */}
            <div className="fade-up">
              {INFO.map(c => (
                <div key={c.title} className="info-item">
                  <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{c.icon}</div>
                  <div>
                    <h4 style={{ color:'#bb86fc', marginBottom:5, fontSize:13, fontWeight:700, letterSpacing:.05, textTransform:'uppercase' }}>{c.title}</h4>
                    {c.lines.map(l => <p key={l} style={{ color:'var(--textSub)', fontSize:14, lineHeight:1.7 }}>{l}</p>)}
                  </div>
                </div>
              ))}

              {/* Map embed */}
              <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(124,58,237,0.2)', marginTop:10 }}>
                <iframe title="gym-map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3721.1!2d79.08!3d21.13!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDA3JzQ4LjAiTiA3OcKwMDQnNDguMCJF!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin"
                  width="100%" height="220" style={{ border:0, display:'block', filter:'hue-rotate(250deg) saturate(0.6) brightness(0.7)' }} allowFullScreen loading="lazy"/>
              </div>

              <div style={{ display:'flex', gap:12, marginTop:20 }}>
                <a href="https://www.instagram.com/friends_fitness.club" target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ padding:'10px 22px', fontSize:13 }}>Instagram</a>
                <a href="https://wa.me/918484805154" target="_blank" rel="noreferrer" className="btn" style={{ padding:'10px 22px', fontSize:13 }}>💬 WhatsApp</a>
              </div>
            </div>

            {/* ─── RIGHT: Form ─── */}
            <form className="fade-up card-glass" style={{ padding:'38px 34px', borderRadius:24 }} onSubmit={submit}>
              <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, letterSpacing:2, marginBottom:26, color:'#bb86fc' }}>
                Send Us a Message
              </h2>

              <div style={{ marginBottom:14 }}>
                <input className="form-inp" placeholder="Your Name *" required value={form.name} onChange={e=>set('name',e.target.value)}/>
              </div>
              <div style={{ marginBottom:14 }}>
                <input className="form-inp" type="email" placeholder="Your Email *" required value={form.email} onChange={e=>set('email',e.target.value)}/>
              </div>
              <div style={{ marginBottom:14, display:'flex', gap:10 }}>
                <select className="form-inp" value={form.countryCode} onChange={e=>set('countryCode',e.target.value)} style={{ width:130, flexShrink:0 }}>
                  {COUNTRY_CODES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <input className="form-inp" type="tel" placeholder="10-digit number *" maxLength={10} required
                  value={form.phone} onChange={e=>set('phone',e.target.value.replace(/\D/,''))}/>
              </div>
              <div style={{ marginBottom:22 }}>
                <textarea className="form-inp" placeholder="Your Message *" required rows={4}
                  value={form.message} onChange={e=>set('message',e.target.value)} style={{ resize:'none' }}/>
              </div>

              <button type="submit" className="btn" disabled={status==='loading'}
                style={{ width:'100%', justifyContent:'center', opacity:status==='loading'?0.7:1 }}>
                {status==='loading'
                  ? <><span style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block'}}/> Sending…</>
                  : 'Send Message →'
                }
              </button>
            </form>
          </div>
        </div>
      </section>

      <ToastContainer toasts={toasts}/>
    </div>
  )
}
