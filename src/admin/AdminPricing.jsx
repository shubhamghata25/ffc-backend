import { useState, useEffect, useCallback } from 'react'

const DEFAULT_FEATURES = ['Full gym access','Locker facility','Diet consultation','Group classes']

export default function AdminPricing({ apiFetch, ImageUploader, Btn, Card, Modal, FR, inp, Spinner, Table, Td, Badge, C, toast }) {
  const [plans,   setPlans]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)   // null | 'add' | plan-obj
  const [form,    setForm]    = useState({})
  const [saving,  setSaving]  = useState(false)
  const [featInput, setFeatInput] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = useCallback(async () => {
    try { const d = await apiFetch('/api/admin/plans'); setPlans(d) }
    catch { toast('Failed to load plans', 'err') }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const close = () => { setModal(null); setForm({}); setFeatInput('') }

  const blank = {
    label:'', period:'month', price:'', originalPrice:'',
    discount:0, discountType:'percent',
    popular:false, active:true,
    features:[...DEFAULT_FEATURES],
    description:'',
  }

  const openAdd  = () => { setForm({...blank, features:[...DEFAULT_FEATURES]}); setModal('add') }
  const openEdit = (p) => { setForm({ ...p, price:String(p.originalPrice||p.price), features:[...(p.features||[])] }); setModal(p) }

  /* Add feature tag */
  const addFeature = () => {
    const f = featInput.trim()
    if (!f) return
    set('features', [...(form.features||[]), f])
    setFeatInput('')
  }
  const removeFeature = (i) => set('features', form.features.filter((_,idx)=>idx!==i))

  const save = async () => {
    if (!form.label?.trim()) return toast('Plan name required', 'err')
    if (!form.price || isNaN(Number(form.price))) return toast('Valid price required', 'err')
    setSaving(true)
    try {
      const payload = {
        ...form,
        price:        Number(form.price),
        originalPrice:Number(form.price),
        discount:     Number(form.discount)||0,
        discountType: form.discountType||'percent',
        popular:      !!form.popular,
        active:       form.active!==false,
      }
      if (modal==='add') await apiFetch('/api/admin/plans','POST',payload)
      else               await apiFetch(`/api/admin/plans/${modal.id}`,'PUT',payload)
      await load(); toast('Plan saved!','ok'); close()
    } catch { toast('Save failed','err') }
    setSaving(false)
  }

  const del = async (id) => {
    if (!confirm('Delete this plan?')) return
    try { await apiFetch(`/api/admin/plans/${id}`,'DELETE'); await load(); toast('Plan deleted','ok') }
    catch { toast('Delete failed','err') }
  }

  const toggleActive = async (plan) => {
    try {
      await apiFetch(`/api/admin/plans/${plan.id}`,'PUT',{...plan,active:!plan.active})
      await load(); toast(`Plan ${plan.active?'hidden':'activated'}!`,'ok')
    } catch { toast('Update failed','err') }
  }

  const togglePopular = async (plan) => {
    /* Only one plan can be popular at a time — clear others */
    const willBePopular = !plan.popular
    try {
      for (const p of plans) {
        if (p.id === plan.id) await apiFetch(`/api/admin/plans/${p.id}`,'PUT',{...p,popular:willBePopular})
        else if (p.popular && willBePopular) await apiFetch(`/api/admin/plans/${p.id}`,'PUT',{...p,popular:false})
      }
      await load(); toast(willBePopular?'Set as most popular!':'Removed popular tag','ok')
    } catch { toast('Update failed','err') }
  }

  /* Effective price preview */
  const previewPrice = () => {
    const p = Number(form.price)||0
    const d = Number(form.discount)||0
    if (!d) return p
    if (form.discountType==='flat') return Math.max(0,p-d)
    return Math.round(p*(1-d/100))
  }

  if (loading) return <div style={{textAlign:'center',padding:60}}><Spinner size={32}/></div>

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14,flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,letterSpacing:2}}>PRICING PLANS</h2>
          <p style={{color:C.muted,fontSize:13,marginTop:2}}>Changes reflect instantly on the public Pricing page</p>
        </div>
        <Btn onClick={openAdd}>+ New Plan</Btn>
      </div>

      {/* Info bar */}
      <div style={{background:'rgba(124,58,237,0.08)',border:'1px solid rgba(124,58,237,0.2)',borderRadius:10,padding:'12px 18px',fontSize:13,color:'#bb86fc',marginBottom:24}}>
        💡 Edit prices, add discounts, toggle visibility, and set the "Most Popular" badge — all changes are instant.
      </div>

      {/* Plans grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20}}>
        {plans.map(plan=>{
          const eff = plan.effectivePrice || plan.price
          const discounted = (plan.originalPrice||plan.price) > eff

          return (
            <Card key={plan.id} style={{
              padding:26, opacity: plan.active?1:0.55,
              border: plan.popular ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
              boxShadow: plan.popular ? `0 0 24px ${C.accentG}` : 'none',
              transition:'all .3s',
            }}>
              {/* Status badges row */}
              <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
                <Badge label={plan.active?'Active':'Hidden'} color={plan.active?'green':'red'}/>
                {plan.popular && <Badge label="⭐ Popular" color="accent"/>}
                {plan.discount>0 && <Badge label={plan.discountType==='flat'?`₹${plan.discount} off`:`${plan.discount}% off`} color="green"/>}
              </div>

              {/* Price */}
              <div style={{marginBottom:10}}>
                <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:2}}>{plan.label}</div>
                <div style={{fontSize:11,color:C.muted,marginBottom:8}}>per {plan.period}</div>
                <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                  <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:38,color:C.accent}}>₹{eff.toLocaleString()}</span>
                  {discounted && <span style={{fontSize:13,color:C.muted,textDecoration:'line-through'}}>₹{(plan.originalPrice||plan.price).toLocaleString()}</span>}
                </div>
              </div>

              {/* Features preview */}
              {plan.features?.slice(0,3).map(f=>(
                <div key={f} style={{fontSize:12,color:C.muted,marginBottom:3}}>✓ {f}</div>
              ))}
              {(plan.features?.length||0)>3&&<div style={{fontSize:11,color:C.muted}}>+{plan.features.length-3} more…</div>}

              {/* Actions */}
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:18}}>
                <Btn size="sm" variant="ghost"  onClick={()=>openEdit(plan)}>Edit</Btn>
                <Btn size="sm" variant={plan.active?'muted':'primary'} onClick={()=>toggleActive(plan)}>
                  {plan.active?'Hide':'Show'}
                </Btn>
                <Btn size="sm" variant={plan.popular?'muted':'ghost'} onClick={()=>togglePopular(plan)}>
                  {plan.popular?'Unpin':'⭐ Popular'}
                </Btn>
                <Btn size="sm" variant="danger" onClick={()=>del(plan.id)}>Del</Btn>
              </div>
            </Card>
          )
        })}
        {plans.length===0&&<p style={{color:C.muted,padding:40,gridColumn:'1/-1'}}>No plans yet. Create one.</p>}
      </div>

      {/* ═══ ADD / EDIT MODAL ═══ */}
      {modal && (
        <Modal title={modal==='add'?'New Membership Plan':'Edit Plan'} onClose={close} wide>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            {/* Left */}
            <div>
              <FR label="Plan Name *"><input style={inp} value={form.label||''} onChange={e=>set('label',e.target.value)} placeholder="e.g. Monthly"/></FR>
              <FR label="Period"><input style={inp} value={form.period||''} onChange={e=>set('period',e.target.value)} placeholder="e.g. month, 3 months, year"/></FR>
              <FR label="Base Price (₹) *"><input style={inp} type="number" value={form.price||''} onChange={e=>set('price',e.target.value)} placeholder="1199"/></FR>

              {/* Discount */}
              <div style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${C.border}`,borderRadius:12,padding:'14px 16px',marginBottom:14}}>
                <div style={{fontSize:12,color:C.muted,marginBottom:10,fontWeight:600,textTransform:'uppercase',letterSpacing:.05}}>Discount (optional)</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                  <FR label="Discount Amount">
                    <input style={inp} type="number" value={form.discount||''} onChange={e=>set('discount',e.target.value)} placeholder="0"/>
                  </FR>
                  <FR label="Type">
                    <select style={inp} value={form.discountType||'percent'} onChange={e=>set('discountType',e.target.value)}>
                      <option value="percent">% Percentage</option>
                      <option value="flat">₹ Flat</option>
                    </select>
                  </FR>
                </div>
                {(form.discount>0&&form.price) && (
                  <div style={{fontSize:12,color:'#4ade80'}}>
                    ✓ Customer pays: ₹{previewPrice().toLocaleString()} (saves ₹{(Number(form.price)-previewPrice()).toLocaleString()})
                  </div>
                )}
              </div>

              <FR label="Description">
                <textarea style={{...inp,resize:'none',height:70}} value={form.description||''} onChange={e=>set('description',e.target.value)} placeholder="Brief description…"/>
              </FR>

              {/* Toggles */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <FR label="Status">
                  <select style={inp} value={form.active===false?'hidden':'active'} onChange={e=>set('active',e.target.value==='active')}>
                    <option value="active">Active (visible)</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </FR>
                <FR label="Most Popular">
                  <select style={inp} value={form.popular?'yes':'no'} onChange={e=>set('popular',e.target.value==='yes')}>
                    <option value="no">No</option>
                    <option value="yes">Yes — show badge</option>
                  </select>
                </FR>
              </div>
            </div>

            {/* Right — features */}
            <div>
              <div style={{fontSize:12,color:C.muted,marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:.05}}>Features List</div>
              <div style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${C.border}`,borderRadius:12,padding:14,minHeight:180,marginBottom:14}}>
                {(form.features||[]).map((f,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${C.border}`,fontSize:13}}>
                    <span style={{color:C.text}}>✓ {f}</span>
                    <button onClick={()=>removeFeature(i)} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:16}}>✕</button>
                  </div>
                ))}
                {(form.features||[]).length===0 && <p style={{color:C.muted,fontSize:13,textAlign:'center',padding:20}}>No features yet</p>}
              </div>
              <div style={{display:'flex',gap:8}}>
                <input style={{...inp,flex:1}} value={featInput} onChange={e=>setFeatInput(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&addFeature()}
                  placeholder="e.g. Personal trainer session"/>
                <Btn size="sm" onClick={addFeature}>+ Add</Btn>
              </div>
              <p style={{fontSize:11,color:C.muted,marginTop:6}}>Press Enter or click Add to append a feature.</p>

              {/* Plan preview card */}
              {(form.label||form.price) && (
                <div style={{marginTop:18,background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:16}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:.06}}>Live Preview</div>
                  <div style={{fontWeight:700,fontSize:15,color:C.accent}}>{form.label||'Plan Name'}</div>
                  <div style={{fontSize:11,color:C.muted,marginBottom:6}}>per {form.period||'period'}</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,color:'#bb86fc'}}>₹{previewPrice().toLocaleString()}</div>
                  {Number(form.discount)>0&&form.price&&(
                    <div style={{fontSize:12,color:C.muted,textDecoration:'line-through'}}>₹{Number(form.price).toLocaleString()}</div>
                  )}
                  {form.popular&&<div style={{marginTop:6,fontSize:11,color:C.accent,fontWeight:700}}>⭐ MOST POPULAR</div>}
                </div>
              )}
            </div>
          </div>

          <div style={{display:'flex',gap:10,marginTop:16}}>
            <Btn onClick={save} disabled={saving} style={{flex:1,justifyContent:'center'}}>{saving?<Spinner/>:'Save Plan'}</Btn>
            <Btn variant="muted" onClick={close} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
