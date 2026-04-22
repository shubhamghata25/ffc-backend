import { useState, useEffect, useCallback } from 'react'

/* extract YouTube ID */
function ytId(val) {
  if (!val) return ''
  const m = val.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : val.trim()
}

const LEVELS  = ['Beginner','Intermediate','Advanced']
const MUSCLES = ['Chest','Legs','Biceps','Back','Shoulders','Cardio','Full Body','Arms','Core']
const LEVEL_COLORS = { Beginner:'#22c55e', Intermediate:'#f59e0b', Advanced:'#ef4444' }

export default function AdminExercises({ apiFetch, ImageUploader, Btn, Card, Modal, FR, inp, Spinner, Table, Td, Badge, C, toast }) {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null)
  const [form,  setForm]          = useState({})
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState('')
  const [preview, setPreview]     = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = useCallback(async () => {
    try { const d = await apiFetch('/api/admin/exercises'); setExercises(d) }
    catch { toast('Failed to load exercises','err') }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const close = () => { setModal(null); setForm({}); setPreview(null) }

  const save = () => {
    setSaving(true)
    const run = async () => {
      if (!form.name?.trim()) return toast('Exercise name required','err')
      const payload = { ...form }
      form.id
        ? await apiFetch(`/api/admin/exercises/${form.id}`,'PUT',payload)
        : await apiFetch('/api/admin/exercises','POST',payload)
      await load(); toast('Exercise saved!','ok'); close()
    }
    run().catch(()=>toast('Save failed','err')).finally(()=>setSaving(false))
  }

  const del = (id) => {
    if (!confirm('Delete this exercise?')) return
    apiFetch(`/api/admin/exercises/${id}`,'DELETE')
      .then(()=>{ load(); toast('Deleted','ok') })
      .catch(()=>toast('Delete failed','err'))
  }

  const filtered = exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || (e.muscle||'').toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div style={{ textAlign:'center',padding:60 }}><Spinner size={32}/></div>

  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:26,flexWrap:'wrap',gap:12 }}>
        <div>
          <h2 style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:34,letterSpacing:2 }}>EXERCISE LIBRARY</h2>
          <p style={{ color:C.muted,fontSize:13,marginTop:2 }}>Manage exercises shown in the public Exercises page</p>
        </div>
        <Btn onClick={()=>{ setForm({}); setModal('add') }}>+ Add Exercise</Btn>
      </div>

      <div style={{ marginBottom:16 }}>
        <input style={{ ...inp,maxWidth:280 }} placeholder="🔍 Search exercises…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {/* Exercise cards grid */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:18 }}>
        {filtered.map(ex => {
          const vid = ex.ytId || ytId(ex.ytLink)
          const thumb = ex.image || (vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : '')
          const lc = LEVEL_COLORS[ex.level]||'#888'
          return (
            <Card key={ex.id} style={{ overflow:'hidden' }}>
              {/* thumbnail */}
              <div style={{ position:'relative', height:150, background:'#111', overflow:'hidden' }}>
                {thumb && <img src={thumb} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }}/>}
                {!thumb && <div style={{ height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#333',fontSize:13 }}>No image</div>}
                {vid && (
                  <div onClick={()=>setPreview(vid)} style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
                    <div style={{ width:42,height:42,borderRadius:'50%',background:'rgba(255,60,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>▶</div>
                  </div>
                )}
                {ex.level && <span style={{ position:'absolute',top:8,right:8,padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:`${lc}22`,color:lc }}>{ex.level}</span>}
              </div>
              <div style={{ padding:'14px 16px' }}>
                <div style={{ fontWeight:700,fontSize:15,marginBottom:4 }}>{ex.name}</div>
                {ex.muscle && <div style={{ fontSize:12,color:C.muted,marginBottom:4 }}>💪 {ex.muscle}</div>}
                {ex.description && <div style={{ fontSize:12,color:'#555',lineHeight:1.5,marginBottom:8 }}>{ex.description}</div>}
                {ex.ytLink && (
                  <div style={{ fontSize:11,color:'#444',marginBottom:10,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                    🎥 {ex.ytLink}
                  </div>
                )}
                <div style={{ display:'flex',gap:8 }}>
                  <Btn size="sm" variant="ghost"  onClick={()=>{ setForm({...ex}); setModal('edit') }}>Edit</Btn>
                  <Btn size="sm" variant="danger" onClick={()=>del(ex.id)}>Delete</Btn>
                </div>
              </div>
            </Card>
          )
        })}
        {filtered.length===0 && <p style={{ color:C.muted,gridColumn:'1/-1',padding:40,textAlign:'center' }}>No exercises found.</p>}
      </div>

      {/* Add/Edit Modal */}
      {(modal==='add'||modal==='edit') && (
        <Modal title={modal==='add'?'Add Exercise':'Edit Exercise'} onClose={close} wide>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20 }}>
            {/* Left col */}
            <div>
              <FR label="Exercise Name *"><input style={inp} value={form.name||''} onChange={e=>set('name',e.target.value)} placeholder="e.g. Bench Press"/></FR>
              <FR label="Description (optional)">
                <textarea style={{ ...inp,resize:'none',height:72 }} value={form.description||''} onChange={e=>set('description',e.target.value)} placeholder="Brief description of the exercise…"/>
              </FR>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <FR label="Muscle Group">
                  <select style={inp} value={form.muscle||''} onChange={e=>set('muscle',e.target.value)}>
                    <option value="">— Select —</option>
                    {MUSCLES.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </FR>
                <FR label="Difficulty">
                  <select style={inp} value={form.level||''} onChange={e=>set('level',e.target.value)}>
                    <option value="">— Select —</option>
                    {LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
                  </select>
                </FR>
              </div>
              <FR label="YouTube Video Link">
                <input style={inp} value={form.ytLink||''} onChange={e=>set('ytLink',e.target.value)} placeholder="https://www.youtube.com/watch?v=..."/>
              </FR>
              {/* YouTube preview */}
              {form.ytLink && ytId(form.ytLink) && (
                <div style={{ marginTop:8,borderRadius:10,overflow:'hidden',border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:11,color:C.muted,padding:'6px 10px',background:'rgba(255,255,255,0.03)' }}>YouTube Preview</div>
                  <img src={`https://img.youtube.com/vi/${ytId(form.ytLink)}/hqdefault.jpg`} alt="" style={{ width:'100%',height:140,objectFit:'cover',display:'block' }}/>
                </div>
              )}
            </div>
            {/* Right col */}
            <div>
              <ImageUploader
                value={form.image||''}
                onChange={v=>set('image',v)}
                label="Exercise Image (optional)"
                hint="If left blank, YouTube thumbnail is used automatically."
                maxW={700}
                aspect="wide"
              />
              <div style={{ background:'rgba(255,255,255,0.02)',border:`1px solid ${C.border}`,borderRadius:10,padding:14,marginTop:8 }}>
                <div style={{ fontSize:11,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:.06 }}>📋 Tips</div>
                <ul style={{ color:'#555',fontSize:12,lineHeight:1.9,paddingLeft:16 }}>
                  <li>Paste any YouTube URL — short or full</li>
                  <li>Image auto-fills from YouTube if no upload</li>
                  <li>Users can play video directly in the card</li>
                  <li>Description appears below exercise name</li>
                </ul>
              </div>
            </div>
          </div>
          <div style={{ display:'flex',gap:10,marginTop:16 }}>
            <Btn onClick={save} disabled={saving} style={{ flex:1,justifyContent:'center' }}>{saving?<Spinner/>:'Save Exercise'}</Btn>
            <Btn variant="muted" onClick={close} style={{ flex:1,justifyContent:'center' }}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {/* YouTube preview modal */}
      {preview && (
        <div onClick={()=>setPreview(null)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:'100%',maxWidth:720 }}>
            <iframe src={`https://www.youtube.com/embed/${preview}?autoplay=1`} style={{ width:'100%',height:400,border:'none',borderRadius:16 }} allow="autoplay; encrypted-media" allowFullScreen/>
            <button onClick={()=>setPreview(null)} style={{ display:'block',margin:'16px auto 0',background:'rgba(255,255,255,0.1)',border:'1px solid #333',color:'#ccc',borderRadius:30,padding:'8px 24px',cursor:'pointer',fontFamily:"'Poppins',sans-serif",fontSize:14 }}>Close ✕</button>
          </div>
        </div>
      )}
    </div>
  )
}
