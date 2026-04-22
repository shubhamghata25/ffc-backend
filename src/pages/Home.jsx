import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

function useCounter(target, duration=1800, trigger) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!trigger) return
    let start=0
    const step=Math.ceil(target/(duration/16))
    const t=setInterval(()=>{ start=Math.min(start+step,target); setVal(start); if(start>=target)clearInterval(t) },16)
    return ()=>clearInterval(t)
  }, [trigger,target,duration])
  return val
}

function useInView(threshold=0.3) {
  const ref=useRef(null); const [v,setV]=useState(false)
  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>{ if(e.isIntersecting)setV(true) },{threshold})
    if(ref.current)obs.observe(ref.current)
    return()=>obs.disconnect()
  },[threshold])
  return [ref,v]
}

const TESTIMONIALS=[
  {text:'Best gym in Nagpur! My transformation in 3 months was unbelievable.',name:'Rahul S.',rating:5},
  {text:'Trainer Nagendra is world-class. Lost 12 kg in 4 months!',name:'Priya Y.',rating:5},
  {text:'Affordable pricing with premium equipment. Totally worth it.',name:'Amit K.',rating:5},
]

const FEATURES=[
  {icon:'🏋',title:'Modern Equipment',desc:'International standard machines and free weights for complete body training.'},
  {icon:'🎯',title:'Certified Trainers',desc:'Professional trainers with years of experience in body transformation.'},
  {icon:'🥗',title:'Diet Planning',desc:'Customised nutrition plans tailored specifically to your fitness goals.'},
  {icon:'📈',title:'Proven Results',desc:'200+ members transformed with our scientifically-backed programs.'},
]

export default function Home() {
  const [countersRef, countersVisible] = useInView()
  const members  = useCounter(200,1600,countersVisible)
  const trainers = useCounter(5,1000,countersVisible)
  const years    = useCounter(3,1000,countersVisible)
  const [tIdx,setTIdx]=useState(0)
  useEffect(()=>{ const t=setInterval(()=>setTIdx(i=>(i+1)%TESTIMONIALS.length),3400); return()=>clearInterval(t) },[])
  const [offer,setOffer]=useState(null)
  useEffect(()=>{
    const api=import.meta.env.VITE_API_URL
    if(!api)return
    fetch(`${api}/api/offer`).then(r=>r.json()).then(d=>{if(d&&d.status==='ON')setOffer(d)}).catch(()=>{})
  },[])

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes glow{0%,100%{text-shadow:0 0 24px rgba(156,89,247,.7)}50%{text-shadow:0 0 52px rgba(156,89,247,1)}}
        .fade-hero{animation:fadeUp .8s ease both}
        .feat-card{transition:transform .3s,box-shadow .3s;cursor:default}
        .feat-card:hover{transform:translateY(-8px);box-shadow:0 16px 48px rgba(124,58,237,0.25)!important}
        .star{color:#f59e0b;font-size:14px}
      `}</style>

      {/* ─────────── HERO ─────────── */}
      <section style={{position:'relative',height:'100vh',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <video autoPlay muted loop playsInline style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',zIndex:1}}>
          <source src="/gym-video.mp4" type="video/mp4"/>
        </video>
        {/* Gradient overlay — deep purple tint */}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(6,5,15,0.88) 0%,rgba(44,16,101,0.75) 50%,rgba(6,5,15,0.88) 100%)',zIndex:2}}/>
        {/* Glow orb */}
        <div style={{position:'absolute',top:'20%',left:'50%',transform:'translateX(-50%)',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 70%)',zIndex:2,pointerEvents:'none'}}/>

        <div className="fade-hero" style={{position:'relative',zIndex:3,textAlign:'center',padding:'0 24px',width:'100%',maxWidth:800}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(124,58,237,0.15)',border:'1px solid rgba(124,58,237,0.35)',borderRadius:30,padding:'6px 18px',fontSize:12,fontWeight:700,letterSpacing:3,color:'#bb86fc',marginBottom:22,textTransform:'uppercase'}}>
            🏋 Nagpur's #1 Fitness Club — Est. 2023
          </div>

          <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'clamp(46px,10vw,100px)',letterSpacing:4,lineHeight:1.02,marginBottom:22,animation:'glow 3s ease-in-out infinite'}}>
            Push Harder<br/>
            <span style={{background:'linear-gradient(135deg,#bb86fc,#7c3aed)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
              Than Yesterday
            </span>
          </h1>

          <p style={{color:'rgba(240,238,255,0.75)',fontSize:'clamp(14px,2.2vw,17px)',lineHeight:1.75,maxWidth:520,margin:'0 auto 38px'}}>
            Transform your body with expert trainers, modern equipment &amp; personalised diet plans — all under one roof in Nagpur.
          </p>

          <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
            <Link to="/pricing" className="btn">Join Now →</Link>
            <Link to="/about"   className="btn btn-ghost">Learn More</Link>
          </div>
        </div>

        <div style={{position:'absolute',bottom:32,left:'50%',transform:'translateX(-50%)',zIndex:3,textAlign:'center'}}>
          <div style={{width:2,height:44,background:'linear-gradient(#7c3aed,transparent)',margin:'0 auto'}}/>
          <p style={{color:'rgba(107,100,144,0.8)',fontSize:10,marginTop:7,letterSpacing:3}}>SCROLL</p>
        </div>
      </section>

      {/* ─────────── COUNTERS ─────────── */}
      <section ref={countersRef} style={{background:'rgba(13,11,26,0.95)',padding:'72px 8%',borderBottom:'1px solid rgba(124,58,237,0.12)',position:'relative'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 0%,rgba(124,58,237,0.1) 0%,transparent 60%)',pointerEvents:'none'}}/>
        <div style={{display:'flex',justifyContent:'center',flexWrap:'wrap',gap:64,position:'relative'}}>
          {[
            {val:members, label:'Active Members',    suffix:'+'},
            {val:trainers,label:'Expert Trainers',   suffix:''},
            {val:years,   label:'Years of Excellence',suffix:'+'},
          ].map(c=>(
            <div key={c.label} style={{textAlign:'center',minWidth:140}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:70,lineHeight:1,background:'linear-gradient(135deg,#bb86fc,#7c3aed)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                {c.val}{c.suffix}
              </div>
              <p style={{color:'rgba(184,176,212,0.6)',fontSize:13,letterSpacing:1,marginTop:8,textTransform:'uppercase'}}>{c.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── OFFER BANNER ─────────── */}
      {offer && (
        <section style={{borderBottom:'1px solid rgba(124,58,237,0.2)',position:'relative',overflow:'hidden'}}>
          {offer.poster
            ? <div style={{position:'relative'}}>
                <img src={offer.poster} alt={offer.title} style={{width:'100%',maxHeight:400,objectFit:'cover',display:'block'}}/>
                <div style={{position:'absolute',inset:0,background:'rgba(6,5,15,0.6)'}}/>
                <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px 8%',textAlign:'center'}}>
                  <div className="badge-purple" style={{marginBottom:14,fontSize:12,letterSpacing:2}}>LIMITED TIME OFFER</div>
                  <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'clamp(30px,6vw,60px)',letterSpacing:3,marginBottom:12}}>{offer.title}</h2>
                  <p style={{color:'rgba(240,238,255,0.8)',marginBottom:28,fontSize:16,lineHeight:1.7,maxWidth:500}}>{offer.description}</p>
                  <a href={offer.link} className="btn">{offer.btn}</a>
                </div>
              </div>
            : <div style={{background:'linear-gradient(135deg,#0d0b1a,#1a0a3e)',padding:'52px 8%',textAlign:'center'}}>
                <div className="badge-purple" style={{marginBottom:14}}>LIMITED TIME OFFER</div>
                <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'clamp(28px,5vw,52px)',letterSpacing:2,marginBottom:12}}>{offer.title}</h2>
                <p style={{color:'rgba(240,238,255,0.8)',marginBottom:26,fontSize:16,lineHeight:1.7}}>{offer.description}</p>
                <a href={offer.link} className="btn">{offer.btn}</a>
              </div>
          }
        </section>
      )}

      {/* ─────────── WHY CHOOSE US ─────────── */}
      <section className="section" style={{background:'var(--bg)',textAlign:'center'}}>
        <div className="accent-line"/>
        <h2 className="section-title">Why Choose <span>Us</span></h2>
        <p className="section-sub" style={{margin:'0 auto 52px'}}>We combine cutting-edge equipment with personalised coaching to deliver real, visible results.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:22,maxWidth:1100,margin:'0 auto'}}>
          {FEATURES.map(f=>(
            <div key={f.title} className="feat-card card-glass" style={{padding:'32px 26px',textAlign:'center',borderRadius:20}}>
              <div style={{width:60,height:60,borderRadius:'50%',background:'rgba(124,58,237,0.15)',border:'1px solid rgba(124,58,237,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,margin:'0 auto 18px',animation:'float 3s ease-in-out infinite'}}>
                {f.icon}
              </div>
              <h3 style={{color:'#bb86fc',marginBottom:10,fontSize:17,fontWeight:700}}>{f.title}</h3>
              <p style={{color:'var(--textSub)',fontSize:14,lineHeight:1.75}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── TESTIMONIALS ─────────── */}
      <section style={{background:'rgba(13,11,26,0.8)',padding:'80px 8%',textAlign:'center',borderTop:'1px solid rgba(124,58,237,0.1)'}}>
        <div className="accent-line"/>
        <h2 className="section-title" style={{marginBottom:36}}>Member <span>Stories</span></h2>
        <div style={{maxWidth:620,margin:'0 auto',background:'linear-gradient(145deg,rgba(19,15,36,0.9),rgba(26,21,53,0.9))',border:'1px solid rgba(124,58,237,0.25)',borderRadius:24,padding:'40px 36px',backdropFilter:'blur(12px)'}}>
          <div style={{marginBottom:14}}>{'★'.repeat(TESTIMONIALS[tIdx].rating).split('').map((_,i)=><span key={i} className="star">★</span>)}</div>
          <p style={{fontSize:'clamp(15px,2vw,18px)',lineHeight:1.85,color:'var(--text)',marginBottom:20}}>"{TESTIMONIALS[tIdx].text}"</p>
          <p style={{color:'#9c59f7',fontWeight:700}}>— {TESTIMONIALS[tIdx].name}</p>
          <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:22}}>
            {TESTIMONIALS.map((_,i)=>(
              <div key={i} onClick={()=>setTIdx(i)} style={{width:i===tIdx?24:8,height:8,borderRadius:4,background:i===tIdx?'#7c3aed':'rgba(124,58,237,0.25)',cursor:'pointer',transition:'all .3s'}}/>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── SHOP PREVIEW ─────────── */}
      <section className="section" style={{background:'var(--bg)',textAlign:'center'}}>
        <div className="accent-line"/>
        <h2 className="section-title">Shop Our <span>Products</span></h2>
        <p className="section-sub" style={{margin:'0 auto 36px'}}>Premium supplements, equipment &amp; accessories at the best prices.</p>
        <div style={{maxWidth:480,margin:'0 auto',borderRadius:24,overflow:'hidden',border:'1px solid rgba(124,58,237,0.2)',background:'var(--card)'}}>
          <img src="https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800" alt="Gym Supplements" style={{width:'100%',height:260,objectFit:'cover',display:'block'}}/>
          <div style={{padding:28}}>
            <Link to="/store" className="btn">Shop Now →</Link>
          </div>
        </div>
      </section>

      {/* ─────────── CTA ─────────── */}
      <section style={{padding:'90px 8%',textAlign:'center',background:'linear-gradient(135deg,#0d0b1a,#1a0a3e,#0d0b1a)',borderTop:'1px solid rgba(124,58,237,0.15)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-80,left:'50%',transform:'translateX(-50%)',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,0.14) 0%,transparent 65%)',pointerEvents:'none'}}/>
        <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'clamp(36px,7vw,70px)',letterSpacing:3,marginBottom:14,position:'relative'}}>
          Ready to <span style={{background:'linear-gradient(135deg,#bb86fc,#7c3aed)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>Transform?</span>
        </h2>
        <p style={{color:'var(--textSub)',fontSize:'clamp(14px,1.8vw,16px)',marginBottom:34,lineHeight:1.7,maxWidth:500,margin:'0 auto 34px',position:'relative'}}>
          Join 200+ members who already changed their lives at Friends Fitness Club, Nagpur.
        </p>
        <Link to="/pricing" className="btn" style={{fontSize:16,padding:'14px 42px',position:'relative'}}>View Membership Plans</Link>
      </section>
    </>
  )
}
