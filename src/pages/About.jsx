import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const DEFAULT_TRAINERS = [
  { id:'1', name:'Nagendra Singh', role:'Head Trainer',  exp:'8+ Years', spec:'Strength & Fat Loss Expert',     status:'Active', photo:'' },
  { id:'2', name:'Depankar Bera',  role:'Fitness Coach', exp:'5+ Years', spec:'Weight Loss & Nutrition Expert', status:'Active', photo:'' },
]

const FEATURES = [
  { icon:'🏋', title:'Modern Equipment',   desc:'International standard machines and free weights for complete body training.' },
  { icon:'🎯', title:'Certified Trainers', desc:'Professional trainers with years of experience in body transformation.' },
  { icon:'🥗', title:'Personal Coaching',  desc:'Customised workout and diet plans tailored to your fitness goals.' },
]

const PROGRAMS = [
  'Weight Loss & Body Transformation',
  'Muscle Gain & Strength Training',
  'Functional Fitness Training',
  'Personal Diet & Nutrition Planning',
  'Beginner to Advanced Programs',
]

export default function About() {
  const [trainers, setTrainers] = useState(DEFAULT_TRAINERS)

  useEffect(() => {
    fetch(`${API}/api/trainers`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length > 0) setTrainers(d) })
      .catch(() => {})
  }, [])

  return (
    <div className="page-wrapper">
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        .feat-card{background:linear-gradient(145deg,rgba(19,15,36,0.85),rgba(26,21,53,0.85));border-radius:20px;border:1px solid rgba(124,58,237,0.15);padding:32px 26px;text-align:center;backdrop-filter:blur(10px);transition:transform .3s,box-shadow .3s,border-color .3s}
        .feat-card:hover{transform:translateY(-8px);box-shadow:0 16px 48px rgba(124,58,237,0.22);border-color:rgba(124,58,237,0.35)}
        .trainer-card{background:linear-gradient(145deg,#130f24,#1a1535);border-radius:22px;border:1px solid rgba(124,58,237,0.15);padding:34px 28px;text-align:center;transition:transform .3s,box-shadow .3s,border-color .3s}
        .trainer-card:hover{transform:translateY(-8px);box-shadow:0 16px 48px rgba(124,58,237,0.25);border-color:rgba(124,58,237,0.4)}
        .prog-tag{padding:10px 22px;border-radius:40px;background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);color:#bb86fc;font-weight:600;font-size:14px;transition:all .2s}
        .prog-tag:hover{background:rgba(124,58,237,0.2);border-color:rgba(124,58,237,0.5)}
      `}</style>

      <section className="section" style={{ textAlign:'center' }}>

        {/* ─── Header ─── */}
        <div className="fade-up" style={{ marginBottom:52 }}>
          <div className="accent-line" style={{ margin:'0 auto 16px' }}/>
          <p style={{ color:'#9c59f7', letterSpacing:4, fontSize:12, fontWeight:700, marginBottom:12, textTransform:'uppercase' }}>EST. JANUARY 2023</p>
          <h1 className="section-title">
            About <span style={{ background:'linear-gradient(135deg,#bb86fc,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Friends Fitness Club
            </span>
          </h1>
        </div>

        {/* ─── Story ─── */}
        <div className="fade-up card-glass" style={{ maxWidth:860, margin:'0 auto 56px', padding:'36px 44px', textAlign:'left', borderRadius:24 }}>
          <p style={{ fontSize:17, lineHeight:2, color:'var(--text)', marginBottom:18 }}>
            <strong style={{ color:'#bb86fc' }}>Friends Fitness Club</strong>, founded on{' '}
            <strong style={{ color:'#9c59f7' }}>5th January 2023</strong>, is one of the fastest-growing
            and most result-driven gyms in Nagpur. Started by fitness-driven owners who wanted to build
            a space where members can work out daily without restrictions and stay consistent with their goals.
          </p>
          <p style={{ fontSize:15, lineHeight:1.9, color:'var(--textSub)' }}>
            If you are searching for the <strong style={{ color:'var(--text)' }}>best gym in Nagpur for transformation</strong>,
            Friends Fitness Club offers expert trainers, modern equipment, and a motivating environment
            to help you achieve real results.
          </p>
        </div>

        {/* ─── Programs ─── */}
        <div className="accent-line" style={{ margin:'0 auto 16px' }}/>
        <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:36, letterSpacing:2, color:'var(--text)', marginBottom:28 }}>
          Our Training <span style={{ background:'linear-gradient(135deg,#bb86fc,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Programs</span>
        </h2>
        <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:12, marginBottom:60 }}>
          {PROGRAMS.map(p => <div key={p} className="prog-tag">{p}</div>)}
        </div>

        {/* ─── Features ─── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:22, maxWidth:960, margin:'0 auto 64px' }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className="feat-card" style={{ animationDelay:`${i*0.1}s` }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 18px', animation:'float 3s ease-in-out infinite' }}>
                {f.icon}
              </div>
              <h3 style={{ color:'#bb86fc', marginBottom:10, fontSize:17, fontWeight:700 }}>{f.title}</h3>
              <p style={{ color:'var(--textSub)', fontSize:14, lineHeight:1.75 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* ─── Trainers ─── */}
        <div className="accent-line" style={{ margin:'0 auto 16px' }}/>
        <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:40, letterSpacing:2, color:'var(--text)', marginBottom:36 }}>
          Meet Our <span style={{ background:'linear-gradient(135deg,#bb86fc,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Trainers</span>
        </h2>
        <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:26, marginBottom:56 }}>
          {trainers.filter(t => t.status !== 'Inactive').map(t => (
            <div key={t.id||t.name} className="trainer-card" style={{ width:280 }}>
              {t.photo
                ? <img src={t.photo} alt={t.name} style={{ width:90, height:90, borderRadius:'50%', objectFit:'cover', border:'3px solid #7c3aed', margin:'0 auto 18px', display:'block', boxShadow:'0 0 24px rgba(124,58,237,0.4)' }}/>
                : <div style={{ width:90, height:90, borderRadius:'50%', background:'rgba(124,58,237,0.12)', border:'3px solid #7c3aed', margin:'0 auto 18px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, boxShadow:'0 0 24px rgba(124,58,237,0.3)' }}>🏋</div>
              }
              <h4 style={{ color:'#bb86fc', fontSize:18, marginBottom:5, fontWeight:700 }}>{t.name}</h4>
              <p style={{ color:'var(--textSub)', fontSize:13, marginBottom:4 }}>{t.role} · {t.exp}</p>
              <p style={{ color:'var(--muted)', fontSize:13, marginBottom:24 }}>{t.spec}</p>
              <Link to="/contact" className="btn" style={{ fontSize:13, padding:'10px 24px' }}>Book Session</Link>
            </div>
          ))}
        </div>

        <Link to="/pricing" className="btn" style={{ fontSize:16, padding:'14px 42px' }}>Join Now →</Link>
      </section>
    </div>
  )
}
