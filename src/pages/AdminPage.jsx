import { useState, useEffect, useCallback, useRef } from 'react'
import AdminStore     from '../admin/AdminStore.jsx'
import AdminExercises from '../admin/AdminExercises.jsx'
import AdminPricing   from '../admin/AdminPricing.jsx'

const ADMIN_USER = 'admin'
const ADMIN_PASS = 'gym@admin123'
const API        = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const ADMIN_KEY  = import.meta.env.VITE_ADMIN_SECRET || 'ffc-admin-secret-2026'
const PLANS      = ['Monthly – ₹1199','Quarterly – ₹2999','Half Yearly – ₹4999','Yearly – ₹9999']
const uid        = () => Math.random().toString(36).slice(2,9)

/* ── API helper ── */
async function apiFetch(path, method='GET', body=null) {
  const opts = { method, headers:{'Content-Type':'application/json','x-admin-key':ADMIN_KEY} }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${API}${path}`, opts)
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`)
  return res.json()
}

/* ── Convert file to base64 string ── */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/* ── Resize image client-side before uploading (saves bandwidth) ── */
function resizeImage(dataUrl, maxW=800, quality=0.78) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  })
}

/* ── Upload image to Cloudinary via backend ──
   Returns permanent Cloudinary URL.
   Falls back gracefully if backend returns base64. */
async function uploadImageToCloud(base64, folder='ffc') {
  const res = await fetch(`${API}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'x-admin-key': ADMIN_KEY },
    body: JSON.stringify({ image: base64, folder }),
  })
  if (!res.ok) {
    const err = await res.json().catch(()=>({error:'Upload failed'}))
    throw new Error(err.error || 'Image upload failed')
  }
  const data = await res.json()
  return data.url  // permanent Cloudinary URL
}

/* ─── COLOURS ─────────────────────────────────────────────── */
const C = {
  bg:'#06050f', surface:'#0d0b1a', card:'#130f24', border:'#2a2347',
  accent:'#7c3aed', accentL:'#9c59f7', accentG:'rgba(124,58,237,0.12)',
  text:'#f0eeff', muted:'#6b6490', success:'#22c55e', warn:'#f59e0b', danger:'#ef4444',
}

const CSS = `
  @keyframes spin   { to{transform:rotate(360deg)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow   { 0%,100%{text-shadow:0 0 18px rgba(124,58,237,.7)} 50%{text-shadow:0 0 36px rgba(124,58,237,1)} }
  .adm-fade { animation:fadeUp .4s ease both }
  .adm-row:hover td { background:rgba(255,255,255,0.025) }
  .adm-nav { display:flex;align-items:center;gap:11px;padding:13px 22px;cursor:pointer;transition:all .2s;font-size:14px;font-weight:500;border-left:3px solid transparent }
  .adm-nav:hover { color:${C.accent};background:${C.accentG} }

  /* image upload drop zone */
  .img-drop {
    border:2px dashed ${C.border};border-radius:12px;
    padding:28px 20px;text-align:center;cursor:pointer;
    transition:border-color .2s,background .2s;
    background:rgba(255,255,255,0.02);
  }
  .img-drop:hover,.img-drop.drag { border-color:${C.accent};background:${C.accentG} }
  .img-drop input[type=file]{ display:none }

  @media(max-width:768px){ .adm-sidebar{display:none!important} .adm-main{margin-left:0!important} }
`

/* ─── SMALL COMPONENTS ────────────────────────────────────── */
const Btn = ({ children, onClick, variant='primary', size='md', disabled=false, style:s={} }) => {
  const base = { display:'inline-flex',alignItems:'center',gap:6,cursor:disabled?'not-allowed':'pointer',border:'none',borderRadius:30,fontFamily:"'Poppins',sans-serif",fontWeight:600,transition:'all .2s',whiteSpace:'nowrap',opacity:disabled?0.6:1,padding:size==='sm'?'7px 15px':'10px 22px',fontSize:size==='sm'?12:14 }
  const V = { primary:{background:'linear-gradient(135deg,#7c3aed,#9c59f7)',color:'#fff',boxShadow:'0 4px 16px rgba(124,58,237,0.35)'}, ghost:{background:'transparent',color:'#bb86fc',border:'1px solid rgba(124,58,237,0.5)'}, danger:{background:C.danger,color:'#fff'}, muted:{background:'rgba(255,255,255,0.07)',color:C.text}, success:{background:C.success,color:'#fff'} }
  return <button onClick={disabled?undefined:onClick} style={{...base,...V[variant],...s}}>{children}</button>
}

const Badge = ({ label, color }) => {
  const M = { green:[C.success,'rgba(34,197,94,0.15)'], orange:[C.warn,'rgba(245,158,11,0.15)'], red:[C.danger,'rgba(239,68,68,0.15)'], accent:[C.accent,C.accentG] }
  const [fg,bg] = M[color]||M.accent
  return <span style={{display:'inline-block',padding:'3px 11px',borderRadius:20,fontSize:11,fontWeight:700,background:bg,color:fg}}>{label}</span>
}

const Card = ({ children, style:s={} }) => (
  <div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,overflow:'hidden',...s}}>{children}</div>
)

const Modal = ({ title, children, onClose, wide=false }) => (
  <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(4px)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20,overflowY:'auto'}}>
    <div className="adm-fade" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:32,width:'100%',maxWidth:wide?680:500,maxHeight:'92vh',overflowY:'auto',margin:'auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <h3 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:1,color:C.accent}}>{title}</h3>
        <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,fontSize:22,cursor:'pointer'}}>✕</button>
      </div>
      {children}
    </div>
  </div>
)

const FR = ({ label, children }) => (
  <div style={{marginBottom:14}}>
    <label style={{fontSize:12,color:C.muted,display:'block',marginBottom:5}}>{label}</label>
    {children}
  </div>
)

const inp = {width:'100%',padding:'10px 14px',background:'rgba(255,255,255,0.04)',border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontFamily:"'Poppins',sans-serif",fontSize:13,outline:'none',transition:'border-color .2s'}
const Spinner = ({size=16}) => <span style={{width:size,height:size,border:'2px solid rgba(255,255,255,0.2)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block'}}/>

const Table = ({ heads, children, empty }) => (
  <div style={{overflowX:'auto'}}>
    <table style={{width:'100%',borderCollapse:'collapse'}}>
      <thead><tr>{heads.map(h=><th key={h} style={{padding:'12px 16px',fontSize:11,textTransform:'uppercase',letterSpacing:.08,color:C.muted,borderBottom:`1px solid ${C.border}`,textAlign:'left',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
    {empty && <p style={{textAlign:'center',color:C.muted,padding:40,fontSize:14}}>{empty}</p>}
  </div>
)
const Td = ({children,style:s={}}) => <td className="adm-row" style={{padding:'13px 16px',borderBottom:`1px solid ${C.border}`,fontSize:14,verticalAlign:'middle',...s}}>{children}</td>

/* ── Toast notification ── */
function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div style={{position:'fixed',bottom:24,right:24,zIndex:99999,background:type==='ok'?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)',border:`1px solid ${type==='ok'?C.success:C.danger}`,color:type==='ok'?C.success:C.danger,borderRadius:10,padding:'12px 20px',fontSize:14,fontWeight:600,animation:'fadeUp .3s ease',maxWidth:340}}>
      {type==='ok'?'✅':'❌'} {msg}
    </div>
  )
}

/* ════════════════════════════════════════════
   IMAGE UPLOADER COMPONENT
   Used in Offers (poster) and Trainers (photo)
════════════════════════════════════════════ */
function ImageUploader({ value, onChange, label='Upload Image', hint='', maxW=800, aspect='wide' }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [drag, setDrag] = useState(false)

  const [uploadError, setUploadError] = useState('')

  const processFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) { setUploadError('Image must be under 10MB'); return }
    setUploading(true)
    setUploadError('')
    try {
      /* 1. Resize locally to reduce upload size */
      const base64 = await fileToBase64(file)
      const resized = await resizeImage(base64, maxW, aspect==='square' ? 0.8 : 0.78)
      /* 2. Upload to Cloudinary via backend — returns permanent URL */
      const cloudUrl = await uploadImageToCloud(resized, 'ffc')
      onChange(cloudUrl)
    } catch (e) {
      console.error('Image upload error:', e)
      setUploadError(e.message || 'Upload failed. Try again.')
    }
    setUploading(false)
  }

  return (
    <div style={{marginBottom:16}}>
      <label style={{fontSize:12,color:C.muted,display:'block',marginBottom:8}}>{label}</label>

      {/* Preview */}
      {value && (
        <div style={{position:'relative',marginBottom:10,display:'inline-block'}}>
          <img src={value} alt="preview" style={{
            width: aspect==='square' ? 100 : '100%',
            height: aspect==='square' ? 100 : 180,
            objectFit:'cover',
            borderRadius: aspect==='square' ? '50%' : 12,
            display:'block',
            border:`2px solid ${C.accent}`,
            maxWidth: aspect==='square' ? 100 : '100%',
          }}/>
          <button onClick={()=>onChange('')} style={{position:'absolute',top:-8,right:-8,width:24,height:24,borderRadius:'50%',background:C.danger,border:'none',color:'#fff',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>✕</button>
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`img-drop${drag?' drag':''}`}
        onClick={()=>inputRef.current?.click()}
        onDragOver={e=>{e.preventDefault();setDrag(true)}}
        onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);processFile(e.dataTransfer.files[0])}}
      >
        <input ref={inputRef} type="file" accept="image/*" onChange={e=>processFile(e.target.files[0])}/>
        {uploading
          ? <><Spinner size={24}/><p style={{color:C.muted,fontSize:13,marginTop:8}}>Uploading to cloud…</p></>
          : <>
              <div style={{fontSize:32,marginBottom:8}}>📸</div>
              <p style={{color:C.muted,fontSize:13,marginBottom:4}}>{value ? 'Click or drop to replace' : 'Click or drop image here'}</p>
              {hint && <p style={{color:'#555',fontSize:12}}>{hint}</p>}
            </>
        }
        {uploadError && <p style={{color:C.danger,fontSize:12,marginTop:6}}>⚠ {uploadError}</p>}
        {value && value.startsWith('https://res.cloudinary.com') && (
          <p style={{color:C.success,fontSize:11,marginTop:6}}>✓ Stored permanently on Cloudinary</p>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   LOGIN
════════════════════════════════════════════ */
function LoginPage({ onLogin }) {
  const [u,setU]=useState(''); const [p,setP]=useState(''); const [err,setErr]=useState(''); const [loading,setLoading]=useState(false)
  const handle = () => { setLoading(true); setErr(''); setTimeout(()=>{ if(u===ADMIN_USER&&p===ADMIN_PASS) onLogin(); else{setErr('Invalid credentials');setLoading(false)} },700) }
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:`radial-gradient(ellipse at 60% 40%,rgba(124,58,237,0.15) 0%,${C.bg} 65%)`}}>
      <div className="adm-fade" style={{width:380,textAlign:'center'}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,letterSpacing:4,background:'linear-gradient(135deg,#bb86fc,#7c3aed)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',animation:'glow 2.5s infinite',marginBottom:4}}>FFC</div>
        <div style={{fontSize:11,color:C.muted,letterSpacing:3,marginBottom:36}}>ADMIN PORTAL</div>
        <Card style={{padding:36}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:2,marginBottom:24}}>SIGN IN</div>
          <FR label="Username"><input style={inp} placeholder="admin" value={u} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handle()}/></FR>
          <FR label="Password"><input style={inp} type="password" placeholder="••••••••" value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handle()}/></FR>
          {err && <p style={{color:C.danger,fontSize:12,marginBottom:12,textAlign:'left'}}>⚠ {err}</p>}
          <Btn onClick={handle} disabled={loading} style={{width:'100%',justifyContent:'center',marginTop:8}}>{loading?<Spinner/>:'Login →'}</Btn>
          <p style={{fontSize:11,color:C.muted,marginTop:14}}>admin / gym@admin123</p>
        </Card>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════════ */
function Dashboard({ members, products, leads, offers }) {
  const active = members.filter(m=>m.status==='Active').length
  const unpaid = members.filter(m=>m.fee==='Unpaid').length
  const revenue = members.filter(m=>m.fee==='Paid').reduce((s,m)=>{ const n=parseInt(m.plan.replace(/[^\d]/g,'')); return s+(isNaN(n)?0:n) },0)
  const liveOffer = offers.find(o=>o.status==='ON')

  const Stat = ({icon,label,value,color}) => (
    <Card className="adm-fade" style={{padding:'22px 24px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:-6,right:-6,fontSize:60,opacity:.05}}>{icon}</div>
      <div style={{fontSize:24,marginBottom:7}}>{icon}</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:40,color:color||C.accent,letterSpacing:1}}>{value}</div>
      <div style={{fontSize:11,color:C.muted,marginTop:2,textTransform:'uppercase',letterSpacing:.05}}>{label}</div>
    </Card>
  )

  return (
    <div>
      <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,letterSpacing:2,marginBottom:6}}>DASHBOARD</h2>
      <p style={{color:C.muted,fontSize:14,marginBottom:24}}>Welcome back, Admin 👋 — {new Date().toDateString()}</p>

      {liveOffer && (
        <div style={{marginBottom:20,padding:'14px 18px',borderRadius:12,background:'rgba(124,58,237,0.1)',border:`1px solid ${C.accent}`,fontSize:14,display:'flex',alignItems:'center',gap:12}}>
          {liveOffer.poster && <img src={liveOffer.poster} alt="" style={{width:48,height:48,objectFit:'cover',borderRadius:8,flexShrink:0}}/>}
          <div><strong style={{color:C.accent}}>🔴 LIVE on website:</strong> {liveOffer.title}</div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:16,marginBottom:28}}>
        <Stat icon="👥" label="Total Members"  value={members.length}/>
        <Stat icon="✅" label="Active"          value={active} color={C.success}/>
        <Stat icon="⚠️" label="Unpaid Fees"    value={unpaid} color={C.warn}/>
        <Stat icon="💰" label="Est. Revenue"   value={`₹${(revenue/1000).toFixed(1)}k`}/>
        <Stat icon="📬" label="Leads"          value={leads.length}/>
        <Stat icon="🛒" label="Products"       value={products.length} color={C.muted}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <Card>
          <div style={{padding:'16px 18px 12px',fontWeight:600,fontSize:14,borderBottom:`1px solid ${C.border}`}}>Recent Members</div>
          <Table heads={['Name','Plan','Status','Fee']}>
            {members.slice(0,5).map(m=>(
              <tr key={m.id} className="adm-row">
                <Td><div style={{fontWeight:500,fontSize:13}}>{m.name}</div><div style={{fontSize:11,color:C.muted}}>{m.phone}</div></Td>
                <Td style={{fontSize:12,color:C.muted}}>{m.plan.split('–')[0].trim()}</Td>
                <Td><Badge label={m.status} color={m.status==='Active'?'green':'red'}/></Td>
                <Td><Badge label={m.fee}    color={m.fee==='Paid'?'green':'orange'}/></Td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card>
          <div style={{padding:'16px 18px 12px',fontWeight:600,fontSize:14,borderBottom:`1px solid ${C.border}`}}>Recent Leads</div>
          <Table heads={['Name','Phone','Date']}>
            {leads.slice(0,5).map(l=>(
              <tr key={l.id} className="adm-row">
                <Td><div style={{fontWeight:500,fontSize:13}}>{l.name}</div><div style={{fontSize:11,color:C.muted}}>{l.email}</div></Td>
                <Td style={{fontSize:13}}>{l.phone}</Td>
                <Td style={{fontSize:12,color:C.muted}}>{l.date}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   MEMBERS
════════════════════════════════════════════ */
function Members({ members, reload, toast }) {
  const [modal,setModal]=useState(null); const [search,setSearch]=useState(''); const [saving,setSaving]=useState(false)
  const blank={name:'',phone:'',plan:PLANS[0],joined:new Date().toISOString().slice(0,10),status:'Active',fee:'Unpaid'}
  const [form,setForm]=useState(blank); const set=(k,v)=>setForm(f=>({...f,[k]:v}))
  const filtered=members.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())||m.phone.includes(search))
  const save=async()=>{
    if(!form.name||!form.phone)return; setSaving(true)
    try{ if(modal==='add')await apiFetch('/api/admin/members','POST',form); else await apiFetch(`/api/admin/members/${modal.id}`,'PUT',form); await reload(); toast('Member saved!','ok'); setModal(null) }catch{toast('Save failed','err')}
    setSaving(false)
  }
  const del=async id=>{if(!confirm('Delete this member?'))return; try{await apiFetch(`/api/admin/members/${id}`,'DELETE');await reload();toast('Deleted','ok')}catch{toast('Failed','err')}}
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:26,flexWrap:'wrap',gap:12}}>
        <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,letterSpacing:2}}>MEMBERS</h2>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <input style={{...inp,width:230}} placeholder="🔍 Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
          <Btn onClick={()=>{setForm(blank);setModal('add')}}>+ Add Member</Btn>
        </div>
      </div>
      <Card>
        <Table heads={['Name','Phone','Plan','Joined','Status','Fee','Actions']} empty={filtered.length===0?'No members found':''}>
          {filtered.map(m=>(
            <tr key={m.id} className="adm-row">
              <Td style={{fontWeight:500}}>{m.name}</Td><Td style={{color:C.muted,fontSize:13}}>{m.phone}</Td>
              <Td style={{fontSize:13}}>{m.plan.split('–')[0].trim()}</Td><Td style={{color:C.muted,fontSize:13}}>{m.joined}</Td>
              <Td><Badge label={m.status} color={m.status==='Active'?'green':'red'}/></Td>
              <Td><Badge label={m.fee}    color={m.fee==='Paid'?'green':'orange'}/></Td>
              <Td><div style={{display:'flex',gap:6}}>
                <Btn size="sm" variant="ghost"  onClick={()=>{setForm({...m});setModal(m)}}>Edit</Btn>
                <Btn size="sm" variant="danger" onClick={()=>del(m.id)}>Del</Btn>
              </div></Td>
            </tr>
          ))}
        </Table>
      </Card>
      {modal&&(
        <Modal title={modal==='add'?'Add Member':'Edit Member'} onClose={()=>setModal(null)}>
          <FR label="Full Name"><input style={inp} value={form.name} onChange={e=>set('name',e.target.value)}/></FR>
          <FR label="Phone"><input style={inp} value={form.phone} onChange={e=>set('phone',e.target.value)}/></FR>
          <FR label="Plan"><select style={inp} value={form.plan} onChange={e=>set('plan',e.target.value)}>{PLANS.map(p=><option key={p}>{p}</option>)}</select></FR>
          <FR label="Joined"><input style={inp} type="date" value={form.joined} onChange={e=>set('joined',e.target.value)}/></FR>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FR label="Status"><select style={inp} value={form.status} onChange={e=>set('status',e.target.value)}><option>Active</option><option>Inactive</option></select></FR>
            <FR label="Fee"><select style={inp} value={form.fee} onChange={e=>set('fee',e.target.value)}><option>Paid</option><option>Unpaid</option></select></FR>
          </div>
          <div style={{display:'flex',gap:10,marginTop:8}}>
            <Btn onClick={save} disabled={saving} style={{flex:1,justifyContent:'center'}}>{saving?<Spinner/>:'Save'}</Btn>
            <Btn variant="muted" onClick={()=>setModal(null)} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   OFFERS — with POSTER image upload
════════════════════════════════════════════ */
function Offers({ offers, reload, toast }) {
  const [modal,setModal]=useState(null); const [saving,setSaving]=useState(false)
  const blank={title:'',description:'',btn:'Join Now',link:'/pricing',status:'OFF',poster:''}
  const [form,setForm]=useState(blank); const set=(k,v)=>setForm(f=>({...f,[k]:v}))

  const save=async()=>{
    if(!form.title)return; setSaving(true)
    try{ if(modal==='add')await apiFetch('/api/admin/offers','POST',form); else await apiFetch(`/api/admin/offers/${modal.id}`,'PUT',form); await reload(); toast('Offer saved!','ok'); setModal(null) }catch{toast('Save failed','err')}
    setSaving(false)
  }
  const toggle=async o=>{
    const updated={...o,status:o.status==='ON'?'OFF':'ON'}
    try{await apiFetch(`/api/admin/offers/${o.id}`,'PUT',updated);await reload();toast(updated.status==='ON'?'🔴 Offer is LIVE on homepage!':'Offer deactivated','ok')}catch{toast('Update failed','err')}
  }
  const del=async id=>{try{await apiFetch(`/api/admin/offers/${id}`,'DELETE');await reload();toast('Deleted','ok')}catch{toast('Failed','err')}}

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,letterSpacing:2}}>OFFERS</h2>
        <Btn onClick={()=>{setForm(blank);setModal('add')}}>+ New Offer</Btn>
      </div>

      <div style={{background:'rgba(124,58,237,0.08)',border:'1px solid rgba(124,58,237,0.25)',borderRadius:10,padding:'12px 18px',fontSize:13,color:'#ddd',marginBottom:24}}>
        💡 <strong style={{color:C.accent}}>Activate</strong> an offer → banner + poster appears on homepage. Upload a poster image for a visual banner.
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:20}}>
        {offers.map(o=>(
          <Card key={o.id} className="adm-fade" style={{overflow:'hidden',border:o.status==='ON'?`2px solid ${C.accent}`:`1px solid ${C.border}`,boxShadow:o.status==='ON'?'0 0 24px rgba(124,58,237,0.2)':'none',transition:'all .3s'}}>
            {/* Poster image */}
            {o.poster
              ? <div style={{position:'relative'}}>
                  <img src={o.poster} alt="" style={{width:'100%',height:160,objectFit:'cover',display:'block'}}/>
                  {o.status==='ON' && <div style={{position:'absolute',top:10,left:10,background:C.accent,color:'#fff',borderRadius:20,padding:'4px 12px',fontSize:11,fontWeight:700}}>🔴 LIVE</div>}
                </div>
              : o.status==='ON' && <div style={{height:6,background:C.accent}}/>
            }
            <div style={{padding:22}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <Badge label={o.status==='ON'?'🔴 LIVE':'⚫ Hidden'} color={o.status==='ON'?'green':'red'}/>
                <div style={{display:'flex',gap:6}}>
                  <Btn size="sm" variant="ghost"  onClick={()=>{setForm({...o});setModal(o)}}>Edit</Btn>
                  <Btn size="sm" variant="danger" onClick={()=>del(o.id)}>Del</Btn>
                </div>
              </div>
              <div style={{fontSize:17,fontWeight:700,marginBottom:6}}>{o.title}</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.6}}>{o.description}</div>
              <Btn variant={o.status==='ON'?'muted':'primary'} onClick={()=>toggle(o)} style={{fontSize:13}}>
                {o.status==='ON'?'⏸ Deactivate':'▶ Activate on Homepage'}
              </Btn>
            </div>
          </Card>
        ))}
        {offers.length===0&&<p style={{color:C.muted,padding:40}}>No offers yet.</p>}
      </div>

      {modal&&(
        <Modal title={modal==='add'?'New Offer':'Edit Offer'} onClose={()=>setModal(null)} wide>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            <div>
              <FR label="Offer Title *"><input style={inp} value={form.title||''} onChange={e=>set('title',e.target.value)} placeholder="e.g. Summer Sale 🔥"/></FR>
              <FR label="Description"><input style={inp} value={form.description||''} onChange={e=>set('description',e.target.value)}/></FR>
              <FR label="Button Text"><input style={inp} value={form.btn||''} onChange={e=>set('btn',e.target.value)} placeholder="Join Now"/></FR>
              <FR label="Button Link"><input style={inp} value={form.link||''} onChange={e=>set('link',e.target.value)} placeholder="/pricing"/></FR>
              <FR label="Status">
                <select style={inp} value={form.status} onChange={e=>set('status',e.target.value)}>
                  <option value="OFF">OFF – Hidden from website</option>
                  <option value="ON">ON – Show on homepage</option>
                </select>
              </FR>
            </div>
            <div>
              <ImageUploader
                value={form.poster}
                onChange={v=>set('poster',v)}
                label="Offer Poster / Banner Image"
                hint="Recommended: 1200×400px, JPG or PNG. Max 5MB."
                maxW={1200}
                aspect="wide"
              />
              {form.poster && (
                <div style={{fontSize:12,color:C.success,marginTop:-8,marginBottom:8}}>✅ Poster uploaded — will show on homepage banner</div>
              )}
            </div>
          </div>
          <div style={{display:'flex',gap:10,marginTop:8}}>
            <Btn onClick={save} disabled={saving} style={{flex:1,justifyContent:'center'}}>{saving?<Spinner/>:'Save Offer'}</Btn>
            <Btn variant="muted" onClick={()=>setModal(null)} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   LEADS
════════════════════════════════════════════ */
function Leads({ leads, reload, toast }) {
  const [search,setSearch]=useState('')
  const filtered=leads.filter(l=>l.name.toLowerCase().includes(search.toLowerCase())||l.phone.includes(search))
  const wa=(phone,name)=>window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(`Hello ${name}! Thank you for contacting Friends Fitness Club. How can we help you?`)}`, '_blank')
  const del=async id=>{try{await apiFetch(`/api/admin/leads/${id}`,'DELETE');await reload();toast('Removed','ok')}catch{toast('Failed','err')}}
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:26,flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,letterSpacing:2}}>LEADS</h2>
          <p style={{color:C.muted,fontSize:13,marginTop:2}}>Real-time contact form submissions from website</p>
        </div>
        <input style={{...inp,width:240}} placeholder="🔍 Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      <Card>
        <Table heads={['Name','Email','Phone','Message','Date','Actions']} empty={filtered.length===0?'No leads yet':''}>
          {filtered.map(l=>(
            <tr key={l.id} className="adm-row">
              <Td style={{fontWeight:500}}>{l.name}</Td>
              <Td style={{color:C.muted,fontSize:13}}>{l.email}</Td>
              <Td style={{fontSize:13}}>{l.phone}</Td>
              <Td style={{fontSize:12,color:C.muted,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.message}</Td>
              <Td style={{fontSize:12,color:C.muted,whiteSpace:'nowrap'}}>{l.date}</Td>
              <Td><div style={{display:'flex',gap:6}}>
                <Btn size="sm" variant="primary" onClick={()=>wa(l.phone,l.name)}>💬 WhatsApp</Btn>
                <Btn size="sm" variant="danger"  onClick={()=>del(l.id)}>Del</Btn>
              </div></Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}

/* ════════════════════════════════════════════
   TRAINERS — with PHOTO upload
════════════════════════════════════════════ */
function Trainers({ trainers, reload, toast }) {
  const [modal,setModal]=useState(null); const [saving,setSaving]=useState(false)
  const blank={name:'',role:'',exp:'',spec:'',status:'Active',photo:''}
  const [form,setForm]=useState(blank); const set=(k,v)=>setForm(f=>({...f,[k]:v}))

  const save=async()=>{
    if(!form.name)return; setSaving(true)
    try{ if(modal==='add')await apiFetch('/api/admin/trainers','POST',form); else await apiFetch(`/api/admin/trainers/${modal.id}`,'PUT',form); await reload(); toast('Trainer saved!','ok'); setModal(null) }catch{toast('Save failed','err')}
    setSaving(false)
  }
  const del=async id=>{try{await apiFetch(`/api/admin/trainers/${id}`,'DELETE');await reload();toast('Deleted','ok')}catch{toast('Failed','err')}}

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:26}}>
        <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,letterSpacing:2}}>TRAINERS</h2>
        <Btn onClick={()=>{setForm(blank);setModal('add')}}>+ Add Trainer</Btn>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20}}>
        {trainers.map(t=>(
          <Card key={t.id} className="adm-fade" style={{padding:26,transition:'all .3s'}}>
            {/* Photo + name row */}
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
              <div style={{position:'relative',flexShrink:0}}>
                {t.photo
                  ? <img src={t.photo} alt={t.name} style={{width:72,height:72,borderRadius:'50%',objectFit:'cover',border:`3px solid ${C.accent}`}}/>
                  : <div style={{width:72,height:72,borderRadius:'50%',background:C.accentG,border:`3px solid ${C.accent}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>🏋</div>
                }
              </div>
              <div>
                <div style={{fontSize:17,fontWeight:700,marginBottom:2}}>{t.name}</div>
                <div style={{fontSize:13,color:C.accent,fontWeight:600}}>{t.role}</div>
                <Badge label={t.status} color={t.status==='Active'?'green':'red'}/>
              </div>
            </div>
            <div style={{fontSize:13,color:C.muted,marginBottom:2}}>⏱ {t.exp}</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:20}}>🎯 {t.spec}</div>
            <div style={{display:'flex',gap:8}}>
              <Btn size="sm" variant="ghost"  onClick={()=>{setForm({...t});setModal(t)}}>Edit</Btn>
              <Btn size="sm" variant="danger" onClick={()=>del(t.id)}>Delete</Btn>
            </div>
          </Card>
        ))}
      </div>

      {modal&&(
        <Modal title={modal==='add'?'Add Trainer':'Edit Trainer'} onClose={()=>setModal(null)} wide>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            {/* Left — details */}
            <div>
              <FR label="Full Name *"><input style={inp} value={form.name||''} onChange={e=>set('name',e.target.value)}/></FR>
              <FR label="Role"><input style={inp} value={form.role||''} onChange={e=>set('role',e.target.value)} placeholder="e.g. Head Trainer"/></FR>
              <FR label="Experience"><input style={inp} value={form.exp||''} onChange={e=>set('exp',e.target.value)} placeholder="e.g. 8+ Years"/></FR>
              <FR label="Specialization"><input style={inp} value={form.spec||''} onChange={e=>set('spec',e.target.value)} placeholder="e.g. Weight Loss & Nutrition"/></FR>
              <FR label="Status">
                <select style={inp} value={form.status} onChange={e=>set('status',e.target.value)}>
                  <option>Active</option><option>Inactive</option>
                </select>
              </FR>
            </div>
            {/* Right — photo */}
            <div>
              <ImageUploader
                value={form.photo}
                onChange={v=>set('photo',v)}
                label="Trainer Profile Photo"
                hint="Square photo recommended. JPG or PNG. Max 5MB."
                maxW={400}
                aspect="square"
              />
              {form.photo && (
                <div style={{fontSize:12,color:C.success,marginTop:-8}}>✅ Photo uploaded</div>
              )}
            </div>
          </div>
          <div style={{display:'flex',gap:10,marginTop:16}}>
            <Btn onClick={save} disabled={saving} style={{flex:1,justifyContent:'center'}}>{saving?<Spinner/>:'Save Trainer'}</Btn>
            <Btn variant="muted" onClick={()=>setModal(null)} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   SETTINGS
════════════════════════════════════════════ */
function Settings({ onLogout }) {
  const [saved,setSaved]=useState(false)
  const save=()=>{setSaved(true);setTimeout(()=>setSaved(false),2200)}
  return(
    <div>
      <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,letterSpacing:2,marginBottom:26}}>SETTINGS</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:20}}>
        <Card style={{padding:26}}>
          <div style={{fontWeight:700,fontSize:15,color:C.accent,marginBottom:16}}>Gym Info</div>
          <FR label="Gym Name"><input style={inp} defaultValue="Friends Fitness Club"/></FR>
          <FR label="Phone"><input style={inp} defaultValue="+91 84848 05154"/></FR>
          <FR label="Email"><input style={inp} defaultValue="friendsfitnessclub18@gmail.com"/></FR>
          <FR label="Address"><input style={inp} defaultValue="RT Complex, 2nd Floor, Wardhaman Nagar, Nagpur"/></FR>
          <Btn onClick={save}>{saved?'✓ Saved!':'Save Changes'}</Btn>
        </Card>
        <Card style={{padding:26}}>
          <div style={{fontWeight:700,fontSize:15,color:C.accent,marginBottom:16}}>Timings</div>
          <FR label="Opening"><input style={inp} defaultValue="5:00 AM"/></FR>
          <FR label="Closing"><input style={inp} defaultValue="10:00 PM"/></FR>
          <FR label="Days"><input style={inp} defaultValue="Monday – Saturday"/></FR>
          <FR label="Holiday"><input style={inp} defaultValue="Closed on Sunday"/></FR>
          <Btn onClick={save}>{saved?'✓ Saved!':'Save Timings'}</Btn>
        </Card>
        <Card style={{padding:26,border:'1px solid rgba(239,68,68,0.25)'}}>
          <div style={{fontWeight:700,fontSize:15,color:C.danger,marginBottom:10}}>Danger Zone</div>
          <p style={{fontSize:13,color:C.muted,marginBottom:18,lineHeight:1.7}}>Logging out will end your admin session.</p>
          <Btn variant="danger" onClick={onLogout}>🚪 Logout</Btn>
        </Card>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════════ */
const NAV = [
  {id:'dashboard', icon:'⚡', label:'Dashboard'  },
  {id:'members',   icon:'👥', label:'Members'    },
  {id:'offers',    icon:'🔥', label:'Offers'     },
  {id:'leads',     icon:'📬', label:'Leads'      },
  {id:'trainers',  icon:'🏋', label:'Trainers'  },
  {id:'store',     icon:'🛒', label:'Store'      },
  {id:'pricing',   icon:'💳', label:'Pricing'    },
  {id:'exercises', icon:'🏃', label:'Exercises'  },
  {id:'settings',  icon:'⚙️',  label:'Settings'   },
]

function Sidebar({ active, onChange, onLogout, collapsed }) {
  const W=collapsed?64:220
  return(
    <aside className="adm-sidebar" style={{width:W,minHeight:'100vh',background:C.surface,borderRight:`1px solid ${C.border}`,position:'fixed',top:0,left:0,zIndex:100,display:'flex',flexDirection:'column',transition:'width .3s',overflow:'hidden'}}>
      <div style={{padding:collapsed?'22px 0':'24px 20px',borderBottom:`1px solid ${C.border}`,textAlign:collapsed?'center':'left',whiteSpace:'nowrap'}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:3,background:'linear-gradient(135deg,#bb86fc,#7c3aed)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>{collapsed?'F':'FFC'}</div>
        {!collapsed&&<div style={{fontSize:9,color:C.muted,letterSpacing:2,marginTop:2}}>ADMIN PORTAL</div>}
      </div>
      <nav style={{flex:1,padding:'10px 0'}}>
        {NAV.map(n=>(
          <div key={n.id} className="adm-nav" onClick={()=>onChange(n.id)} style={{justifyContent:collapsed?'center':'flex-start',color:active===n.id?C.accent:C.muted,background:active===n.id?C.accentG:'transparent',borderLeft:active===n.id?`3px solid ${C.accent}`:'3px solid transparent'}}>
            <span style={{fontSize:17}}>{n.icon}</span>
            {!collapsed&&<span>{n.label}</span>}
          </div>
        ))}
      </nav>
      <div style={{padding:collapsed?'14px 0':'14px 20px',borderTop:`1px solid ${C.border}`}}>
        <div onClick={onLogout} style={{cursor:'pointer',color:C.danger,display:'flex',alignItems:'center',gap:8,fontSize:13,fontWeight:600,justifyContent:collapsed?'center':'flex-start'}}>
          <span>🚪</span>{!collapsed&&'Logout'}
        </div>
      </div>
    </aside>
  )
}

/* ════════════════════════════════════════════
   ROOT
════════════════════════════════════════════ */
export default function AdminPage() {
  const [auth,setAuth]           = useState(false)
  const [page,setPage]           = useState('dashboard')
  const [collapsed,setCollapsed] = useState(false)
  const [members,setMembers]     = useState([])
  const [leads,setLeads]         = useState([])
  const [offers,setOffers]       = useState([])
  const [trainers,setTrainers]   = useState([])
  const [products,setProducts]   = useState([])
  const [loading,setLoading]     = useState(true)
  const [toastData,setToastData] = useState(null)

  const showToast = (msg, type='ok') => { setToastData({msg,type}); setTimeout(()=>setToastData(null),3200) }

  const loadAll = useCallback(async () => {
    if (!auth) return
    setLoading(true)
    try {
      const [m,l,o,t,p] = await Promise.all([
        apiFetch('/api/admin/members'),
        apiFetch('/api/admin/leads'),
        apiFetch('/api/admin/offers'),
        apiFetch('/api/admin/trainers'),
        fetch(`${API}/api/products`).then(r=>r.json()).catch(()=>[]),
      ])
      setMembers(m); setLeads(l); setOffers(o); setTrainers(t); setProducts(p)
    } catch(e) { console.error('loadAll',e) }
    setLoading(false)
  }, [auth])

  useEffect(()=>{ loadAll() }, [loadAll])

  if (!auth) return <><style>{CSS}</style><LoginPage onLogin={()=>setAuth(true)}/></>

  const SL=collapsed?64:220
  /* shared props for sub-panels */
  const shared = { apiFetch, ImageUploader, Btn, Card, Modal, FR, inp, Spinner, Table, Td, Badge, C, toast:showToast }

  const PAGES = {
    dashboard: <Dashboard members={members} products={products} leads={leads} offers={offers}/>,
    members:   <Members   members={members}  reload={loadAll} toast={showToast}/>,
    offers:    <Offers    offers={offers}     reload={loadAll} toast={showToast}/>,
    leads:     <Leads     leads={leads}       reload={loadAll} toast={showToast}/>,
    trainers:  <Trainers  trainers={trainers} reload={loadAll} toast={showToast}/>,
    store:     <AdminStore     {...shared}/>,
    pricing:   <AdminPricing   {...shared}/>,
    exercises: <AdminExercises {...shared}/>,
    settings:  <Settings  onLogout={()=>setAuth(false)}/>,
  }

  return (
    <>
      <style>{CSS}</style>
      <div style={{display:'flex',minHeight:'100vh',background:C.bg,color:C.text,fontFamily:"'Poppins',sans-serif"}}>
        <Sidebar active={page} onChange={setPage} onLogout={()=>setAuth(false)} collapsed={collapsed}/>
        <div className="adm-main" style={{marginLeft:SL,flex:1,display:'flex',flexDirection:'column',transition:'margin-left .3s'}}>
          {/* topbar */}
          <div style={{position:'sticky',top:0,zIndex:50,background:C.bg,borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 26px'}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <button onClick={()=>setCollapsed(c=>!c)} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:20}}>
                {collapsed?'☰':'✕'}
              </button>
              {offers.find(o=>o.status==='ON') && (
                <div style={{fontSize:12,background:'rgba(124,58,237,0.15)',color:C.accent,border:'1px solid rgba(124,58,237,0.3)',borderRadius:20,padding:'3px 12px',fontWeight:600}}>
                  🔴 Offer live on website
                </div>
              )}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <button onClick={loadAll} style={{background:'none',border:`1px solid ${C.border}`,color:C.muted,cursor:'pointer',fontSize:13,borderRadius:8,padding:'5px 12px'}}>
                {loading?<Spinner size={12}/>:'↻ Refresh'}
              </button>
              <span style={{fontSize:12,color:C.muted}}>{new Date().toDateString()}</span>
              <div style={{width:32,height:32,borderRadius:'50%',background:C.accentG,border:`2px solid ${C.accent}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>👤</div>
            </div>
          </div>
          {/* content */}
          <main key={page} className="adm-fade" style={{padding:'30px 26px',flex:1}}>
            {loading && page==='dashboard'
              ? <div style={{textAlign:'center',padding:80}}><Spinner size={36}/><p style={{color:C.muted,marginTop:16,fontSize:14}}>Loading data…</p></div>
              : PAGES[page]
            }
          </main>
        </div>
      </div>
      {toastData && <Toast msg={toastData.msg} type={toastData.type}/>}
    </>
  )
}
