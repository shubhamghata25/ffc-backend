import React, { useState, useEffect } from 'react'
import { openRazorpay } from '../hooks/useRazorpay.jsx'
import { useToast, ToastContainer } from '../hooks/useToast.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const PERKS = ['🔒 Secure Payments','💯 No Hidden Charges','🔄 Easy Renewal','📞 24/7 Support']

function PlanCard({ plan, onPay, paying }) {
  const discounted = plan.originalPrice && plan.originalPrice > plan.price
  const saving = discounted ? plan.originalPrice - plan.price : 0

  return (
    <div style={{
      background: plan.popular
        ? 'linear-gradient(145deg,#1a0a3e,#2d1260)'
        : 'linear-gradient(145deg,#130f24,#1a1535)',
      borderRadius: 24, padding:'36px 28px', textAlign:'center', position:'relative',
      border: plan.popular
        ? '2px solid rgba(156,89,247,0.7)'
        : '1px solid rgba(124,58,237,0.15)',
      boxShadow: plan.popular ? '0 0 48px rgba(124,58,237,0.3)' : 'none',
      transition:'transform .3s,box-shadow .3s',
    }}
      onMouseEnter={e=>{ if(!plan.popular){e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(124,58,237,0.2)'} }}
      onMouseLeave={e=>{ if(!plan.popular){e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''} }}>

      {plan.popular && (
        <div style={{
          position:'absolute', top:-15, left:'50%', transform:'translateX(-50%)',
          background:'linear-gradient(135deg,#7c3aed,#9c59f7)',
          color:'#fff', borderRadius:20, padding:'5px 20px',
          fontSize:11, fontWeight:800, letterSpacing:1.5, whiteSpace:'nowrap',
          boxShadow:'0 4px 16px rgba(124,58,237,0.5)',
        }}>⭐ MOST POPULAR</div>
      )}

      {plan.discount > 0 && (
        <div style={{
          position:'absolute', top:16, right:16,
          background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)',
          color:'#4ade80', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700,
        }}>
          {plan.discountType==='flat' ? `₹${plan.discount} OFF` : `${plan.discount}% OFF`}
        </div>
      )}

      <h2 style={{ color:'#bb86fc', fontSize:19, marginBottom:4, fontWeight:700 }}>{plan.label}</h2>
      <p style={{ color:'rgba(184,176,212,0.5)', fontSize:12, marginBottom:18 }}>per {plan.period}</p>

      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:60, letterSpacing:2, lineHeight:1,
          background:'linear-gradient(135deg,#f0eeff,#bb86fc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
          ₹{plan.price.toLocaleString()}
        </div>
        {discounted && (
          <div style={{ color:'rgba(184,176,212,0.4)', fontSize:13, textDecoration:'line-through', marginTop:4 }}>
            ₹{plan.originalPrice.toLocaleString()}
            {saving > 0 && <span style={{ color:'#4ade80', textDecoration:'none', marginLeft:8, fontWeight:600 }}>Save ₹{saving}</span>}
          </div>
        )}
      </div>

      {plan.description && (
        <p style={{ color:'rgba(184,176,212,0.55)', fontSize:13, marginBottom:18, lineHeight:1.6 }}>{plan.description}</p>
      )}

      <ul style={{ listStyle:'none', marginBottom:28, textAlign:'left' }}>
        {(plan.features||[]).map(f=>(
          <li key={f} style={{ color:'rgba(240,238,255,0.75)', fontSize:13, marginBottom:9, display:'flex', alignItems:'flex-start', gap:8 }}>
            <span style={{ color:'#9c59f7', fontWeight:700, flexShrink:0 }}>✓</span>{f}
          </li>
        ))}
      </ul>

      <button onClick={() => onPay(plan)} disabled={paying===plan.id}
        style={{
          width:'100%', padding:'13px 24px', border:'none', borderRadius:40,
          background: paying===plan.id ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#9c59f7)',
          color:'#fff', fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:14,
          cursor: paying===plan.id ? 'not-allowed':'pointer',
          transition:'all .2s', letterSpacing:.3,
          boxShadow: paying===plan.id ? 'none' : '0 4px 20px rgba(124,58,237,0.4)',
          display:'flex', alignItems:'center', justifyContent:'center', gap:10,
        }}>
        {paying===plan.id
          ? <><span style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block'}}/> Processing…</>
          : 'Pay Now'
        }
      </button>
    </div>
  )
}

export default function Pricing() {
  const [plans,  setPlans]  = useState([])
  const [loading,setLoading]=useState(true)
  const [paying, setPaying] = useState(null)
  const { toasts, success, error, info } = useToast()

  const loadPlans = () => {
    fetch(`${API}/api/plans`)
      .then(r=>r.json())
      .then(d=>{ setPlans(d); setLoading(false) })
      .catch(()=>{ setLoading(false) })
  }
  useEffect(loadPlans, [])

  async function handlePay(plan) {
    setPaying(plan.id)
    info(`Opening payment for ${plan.label} plan…`)
    await openRazorpay({
      amount:      plan.price,
      name:        `${plan.label} Membership`,
      description: `FFC ${plan.label} membership — ₹${plan.price}`,
      meta:        { type:'membership', itemId:plan.id, itemName:plan.label, planId:plan.id },
      onSuccess: (resp) => {
        success(`🎉 Payment successful! ID: ${resp.razorpay_payment_id}`)
        setPaying(null)
      },
      onFailure: (msg) => {
        if (!msg.includes('cancelled')) error(msg)
        setPaying(null)
      },
    })
    setPaying(null)
  }

  return (
    <div className="page-wrapper">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <section className="section" style={{textAlign:'center'}}>
        {/* Header */}
        <div className="fade-up">
          <div className="accent-line" style={{margin:'0 auto 16px'}}/>
          <h1 className="section-title">
            Membership <span style={{background:'linear-gradient(135deg,#bb86fc,#7c3aed)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>Plans</span>
          </h1>
          <p className="section-sub" style={{margin:'0 auto 56px'}}>
            No hidden fees. Cancel anytime. Pick the plan that fits your journey.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{padding:60}}>
            <div style={{width:44,height:44,border:'3px solid rgba(124,58,237,0.2)',borderTopColor:'#7c3aed',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 16px'}}/>
            <p style={{color:'var(--muted)'}}>Loading plans…</p>
          </div>
        )}

        {/* Plans grid */}
        {!loading && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:24,maxWidth:1120,margin:'0 auto'}}>
            {plans.map(plan=>(
              <PlanCard key={plan.id} plan={plan} onPay={handlePay} paying={paying}/>
            ))}
            {plans.length===0 && (
              <p style={{color:'var(--muted)',gridColumn:'1/-1',padding:40}}>No plans available right now.</p>
            )}
          </div>
        )}

        {/* Perks */}
        <div style={{display:'flex',justifyContent:'center',flexWrap:'wrap',gap:24,marginTop:52}}>
          {PERKS.map(p=>(
            <div key={p} style={{color:'rgba(184,176,212,0.5)',fontSize:13,display:'flex',alignItems:'center',gap:6}}>{p}</div>
          ))}
        </div>
      </section>

      <ToastContainer toasts={toasts}/>
    </div>
  )
}
