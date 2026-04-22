import React, { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const LEVELS  = ['All','Beginner','Intermediate','Advanced']
const MUSCLES = ['All','Chest','Legs','Biceps','Back','Shoulders','Cardio']
const LEVEL_COLORS = { Beginner:'#22c55e', Intermediate:'#f59e0b', Advanced:'#ef4444' }

function ytId(val) {
  if (!val) return ''
  const m = val.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : val.trim()
}

export default function Exercises() {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search,  setSearch]      = useState('')
  const [level,   setLevel]       = useState('All')
  const [muscle,  setMuscle]      = useState('All')
  const [playing, setPlaying]     = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/exercises`)
      .then(r => r.json())
      .then(d => { setExercises(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const visible = exercises.filter(e =>
    (level  === 'All' || e.level  === level)  &&
    (muscle === 'All' || e.muscle === muscle) &&
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const FilterPanel = () => (
    <div style={{ padding:'0 20px' }}>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:3, marginBottom:28,
        background:'linear-gradient(135deg,#bb86fc,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
        🏋 Fitness
      </div>
      <p style={{ color:'#6b6490', fontSize:11, letterSpacing:2, marginBottom:10, textTransform:'uppercase' }}>Muscle Group</p>
      {MUSCLES.map(m => (
        <div key={m} onClick={()=>{ setMuscle(m); setDrawerOpen(false) }} style={{
          padding:'9px 12px', marginBottom:4, borderRadius:10, cursor:'pointer',
          background: muscle===m ? 'rgba(124,58,237,0.15)' : 'transparent',
          color: muscle===m ? '#bb86fc' : '#6b6490',
          borderLeft: muscle===m ? '3px solid #7c3aed' : '3px solid transparent',
          fontSize:14, transition:'all .2s',
        }}>{m}</div>
      ))}
      <p style={{ color:'#6b6490', fontSize:11, letterSpacing:2, margin:'20px 0 10px', textTransform:'uppercase' }}>Level</p>
      {LEVELS.map(l => (
        <div key={l} onClick={()=>{ setLevel(l); setDrawerOpen(false) }} style={{
          padding:'9px 12px', marginBottom:4, borderRadius:10, cursor:'pointer',
          background: level===l ? 'rgba(124,58,237,0.15)' : 'transparent',
          color: level===l ? '#bb86fc' : '#6b6490',
          borderLeft: level===l ? '3px solid #7c3aed' : '3px solid transparent',
          fontSize:14, transition:'all .2s',
        }}>{l}</div>
      ))}
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .ex-sidebar{width:210px;min-height:100vh;background:rgba(13,11,26,0.95);border-right:1px solid rgba(124,58,237,0.12);padding:84px 0 30px;position:fixed;top:0;left:0;z-index:10}
        .ex-main{margin-left:210px;padding:84px 28px 60px}
        .ex-card{background:linear-gradient(145deg,#130f24,#1a1535);border-radius:18px;border:1px solid rgba(124,58,237,0.12);overflow:hidden;transition:transform .3s,box-shadow .3s,border-color .3s;animation:fadeUp .4s ease both}
        .ex-card:hover{transform:translateY(-5px);box-shadow:0 14px 40px rgba(124,58,237,0.2);border-color:rgba(124,58,237,0.3)}
        .filter-inp{padding:9px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(124,58,237,0.2);border-radius:10px;color:#f0eeff;font-family:'Poppins',sans-serif;font-size:13px;outline:none;width:200px}
        .filter-inp:focus{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,0.15)}
        @media(max-width:768px){
          .ex-sidebar{display:none}
          .ex-main{margin-left:0;padding:84px 16px 60px}
          .ex-grid{grid-template-columns:1fr!important}
          .mob-filter{display:flex!important}
        }
        .mob-filter{display:none;gap:8px;flex-wrap:wrap;margin-bottom:18px}
        .mob-chip{padding:6px 14px;border-radius:20px;border:none;font-size:12px;font-weight:600;cursor:pointer;font-family:'Poppins',sans-serif;background:rgba(124,58,237,0.15);color:#bb86fc;transition:all .2s}
        .drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:199;display:flex;align-items:flex-end}
        .drawer-content{background:#0d0b1a;border-radius:20px 20px 0 0;padding:24px 0 40px;width:100%;max-height:70vh;overflow-y:auto;border-top:1px solid rgba(124,58,237,0.2)}
        .mob-filter-btn{display:none;padding:9px 16px;background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);color:#bb86fc;border-radius:10px;font-weight:600;font-size:13px;cursor:pointer;font-family:'Poppins',sans-serif}
        @media(max-width:768px){.mob-filter-btn{display:block}}
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="ex-sidebar"><FilterPanel /></aside>

      <main className="ex-main">
        {/* Top bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:34, letterSpacing:2, background:'linear-gradient(135deg,#bb86fc,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            Workout Library
          </h1>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <input className="filter-inp" placeholder="🔍  Search exercise…" value={search} onChange={e=>setSearch(e.target.value)}/>
            <button className="mob-filter-btn" onClick={()=>setDrawerOpen(true)}>⚙ Filter</button>
          </div>
        </div>

        {/* Mobile active filters */}
        <div className="mob-filter">
          {level!=='All'  && <span className="mob-chip" onClick={()=>setLevel('All')}>Level: {level} ✕</span>}
          {muscle!=='All' && <span className="mob-chip" onClick={()=>setMuscle('All')}>Muscle: {muscle} ✕</span>}
        </div>

        {loading && (
          <div style={{ textAlign:'center', padding:80 }}>
            <div style={{ width:40,height:40,border:'3px solid rgba(124,58,237,0.2)',borderTopColor:'#7c3aed',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 14px' }}/>
            <p style={{ color:'#6b6490' }}>Loading exercises…</p>
          </div>
        )}

        {!loading && (
          <div className="ex-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:22 }}>
            {visible.map((ex, idx) => {
              const vid = ex.ytId || ytId(ex.ytLink)
              const thumb = ex.image || (vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : '')
              const lc = LEVEL_COLORS[ex.level] || '#888'
              return (
                <div key={ex.id||ex.name} className="ex-card" style={{ animationDelay:`${idx*0.04}s` }}>
                  <div style={{ padding:'18px 18px 0' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div>
                        <h3 style={{ color:'var(--text)', fontSize:16, fontWeight:700, marginBottom:3 }}>{ex.name}</h3>
                        <p style={{ color:'#6b6490', fontSize:12 }}>{ex.muscle}</p>
                      </div>
                      {ex.level && (
                        <span style={{ padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:`${lc}22`, color:lc, whiteSpace:'nowrap' }}>{ex.level}</span>
                      )}
                    </div>
                    {ex.description && <p style={{ color:'#6b6490', fontSize:12, lineHeight:1.6, marginBottom:10 }}>{ex.description}</p>}
                  </div>

                  <div style={{ padding:'0 0 14px' }}>
                    {playing===(ex.id||ex.name) && vid ? (
                      <iframe src={`https://www.youtube.com/embed/${vid}?autoplay=1`}
                        style={{ width:'100%', height:195, border:'none', display:'block' }}
                        allow="autoplay; encrypted-media" allowFullScreen title={ex.name}/>
                    ) : (
                      <div onClick={()=>vid&&setPlaying(ex.id||ex.name)} style={{
                        margin:'0 14px', height:165, borderRadius:12, overflow:'hidden',
                        background: thumb ? `url(${thumb}) center/cover` : 'rgba(124,58,237,0.06)',
                        cursor: vid ? 'pointer' : 'default',
                        display:'flex', alignItems:'center', justifyContent:'center', position:'relative',
                      }}>
                        {thumb && <div style={{ position:'absolute', inset:0, background:'rgba(6,5,15,0.4)' }}/>}
                        {vid && (
                          <div style={{ width:48,height:48,borderRadius:'50%',background:'rgba(124,58,237,0.85)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,zIndex:1,boxShadow:'0 0 24px rgba(124,58,237,0.6)' }}>▶</div>
                        )}
                        {!vid && !thumb && <p style={{ color:'#2a2347', fontSize:13 }}>No video</p>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {visible.length===0 && !loading && (
              <p style={{ color:'#6b6490', gridColumn:'1/-1', textAlign:'center', padding:60 }}>No exercises found.</p>
            )}
          </div>
        )}
      </main>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="drawer-overlay" onClick={()=>setDrawerOpen(false)}>
          <div className="drawer-content" onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 20px 16px', borderBottom:'1px solid rgba(124,58,237,0.12)' }}>
              <span style={{ fontWeight:700, fontSize:16, color:'#bb86fc' }}>Filter Exercises</span>
              <button onClick={()=>setDrawerOpen(false)} style={{ background:'none',border:'none',color:'#6b6490',fontSize:22,cursor:'pointer' }}>✕</button>
            </div>
            <FilterPanel/>
          </div>
        </div>
      )}
    </div>
  )
}
