import { useState, useEffect, useCallback } from 'react'

export default function AdminStore({ apiFetch, ImageUploader, Btn, Card, Modal, FR, inp, Spinner, Table, Td, Badge, C, toast }) {
  const [tab, setTab]     = useState('products')
  const [store, setStore] = useState({ categories:[], subcategories:[], products:[] })
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(null)
  const [form,  setForm]    = useState({})
  const [saving, setSaving] = useState(false)
  const [searchProd, setSearchProd] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = useCallback(async () => {
    try { const d = await apiFetch('/api/admin/store'); setStore(d) }
    catch { toast('Failed to load store', 'err') }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const close    = () => { setModal(null); setForm({}) }
  const wrap     = async (fn) => { setSaving(true); try { await fn() } catch { toast('Error saving','err') } setSaving(false) }

  /* Category CRUD */
  const saveCat = () => wrap(async () => {
    if (!form.name?.trim()) return toast('Name required','err')
    form.id ? await apiFetch(`/api/admin/store/categories/${form.id}`,'PUT',form)
             : await apiFetch('/api/admin/store/categories','POST',form)
    await load(); toast('Category saved!','ok'); close()
  })
  const delCat = (id) => wrap(async () => {
    if (!confirm('Delete category + all its subcategories and products?')) return
    await apiFetch(`/api/admin/store/categories/${id}`,'DELETE'); await load(); toast('Deleted','ok')
  })

  /* Subcategory CRUD */
  const saveSub = () => wrap(async () => {
    if (!form.name?.trim() || !form.categoryId) return toast('Name and category required','err')
    form.id ? await apiFetch(`/api/admin/store/subcategories/${form.id}`,'PUT',form)
             : await apiFetch('/api/admin/store/subcategories','POST',form)
    await load(); toast('Subcategory saved!','ok'); close()
  })
  const delSub = (id) => wrap(async () => {
    if (!confirm('Delete subcategory + its products?')) return
    await apiFetch(`/api/admin/store/subcategories/${id}`,'DELETE'); await load(); toast('Deleted','ok')
  })

  /* Product CRUD */
  const saveProd = () => wrap(async () => {
    if (!form.name?.trim())              return toast('Product name required','err')
    if (!form.subcategoryId)             return toast('Select a subcategory','err')
    if (!form.price||isNaN(Number(form.price))) return toast('Valid price required','err')
    const catId = (store.subcategories.find(s=>s.id===form.subcategoryId)||{}).categoryId || form.categoryId
    const payload = { ...form, price:Number(form.price), categoryId:catId, inStock:form.inStock!==false }
    form.id ? await apiFetch(`/api/admin/store/products/${form.id}`,'PUT',payload)
             : await apiFetch('/api/admin/store/products','POST',payload)
    await load(); toast('Product saved!','ok'); close()
  })
  const delProd = (id) => wrap(async () => {
    if (!confirm('Delete this product?')) return
    await apiFetch(`/api/admin/store/products/${id}`,'DELETE'); await load(); toast('Deleted','ok')
  })

  const catName = id => (store.categories.find(c=>c.id===id)||{}).name||'—'
  const subName = id => (store.subcategories.find(s=>s.id===id)||{}).name||'—'
  const ph = 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=200'

  const filteredProds = store.products.filter(p =>
    p.name.toLowerCase().includes(searchProd.toLowerCase()) ||
    catName(p.categoryId).toLowerCase().includes(searchProd.toLowerCase()) ||
    subName(p.subcategoryId).toLowerCase().includes(searchProd.toLowerCase())
  )

  const tabStyle = t => ({
    padding:'8px 20px', borderRadius:30, border:'none', cursor:'pointer',
    fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:13, transition:'all .2s',
    background: tab===t ? C.accent : 'rgba(255,255,255,0.06)',
    color: tab===t ? '#fff' : C.muted,
    boxShadow: tab===t ? '0 0 12px rgba(255,60,0,0.3)' : 'none',
  })

  if (loading) return <div style={{ textAlign:'center',padding:60 }}><Spinner size={32}/></div>

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22,flexWrap:'wrap',gap:12 }}>
        <h2 style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:34,letterSpacing:2 }}>STORE MANAGEMENT</h2>
        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
          {tab==='products'      && <Btn onClick={()=>{ setForm({inStock:true}); setModal('addProd') }}>+ Add Product</Btn>}
          {tab==='categories'    && <Btn onClick={()=>{ setForm({}); setModal('addCat') }}>+ Add Category</Btn>}
          {tab==='subcategories' && <Btn onClick={()=>{ setForm({}); setModal('addSub') }}>+ Add Subcategory</Btn>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex',gap:8,marginBottom:24,flexWrap:'wrap' }}>
        <button style={tabStyle('products')}      onClick={()=>setTab('products')}>🛒 Products ({store.products.length})</button>
        <button style={tabStyle('categories')}    onClick={()=>setTab('categories')}>📁 Categories ({store.categories.length})</button>
        <button style={tabStyle('subcategories')} onClick={()=>setTab('subcategories')}>📂 Subcategories ({store.subcategories.length})</button>
      </div>

      {/* ── PRODUCTS ── */}
      {tab==='products' && (
        <>
          <div style={{ marginBottom:14 }}>
            <input style={{ ...inp,maxWidth:300 }} placeholder="🔍 Search products…" value={searchProd} onChange={e=>setSearchProd(e.target.value)}/>
          </div>
          <Card>
            <Table heads={['Image','Name','Category','Subcategory','Price','Stock','Actions']} empty={filteredProds.length===0?'No products yet':''}>
              {filteredProds.map(p=>(
                <tr key={p.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                  <Td><img src={p.image||ph} alt="" style={{ width:52,height:52,borderRadius:10,objectFit:'cover',background:'#222' }}/></Td>
                  <Td style={{ fontWeight:600,maxWidth:150 }}>
                    <div>{p.name}</div>
                    {p.description && <div style={{ fontSize:11,color:C.muted,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:140 }}>{p.description}</div>}
                  </Td>
                  <Td style={{ fontSize:12,color:C.muted }}>{catName(p.categoryId)}</Td>
                  <Td style={{ fontSize:12,color:C.muted }}>{subName(p.subcategoryId)}</Td>
                  <Td style={{ color:C.accent,fontWeight:700 }}>₹{p.price}</Td>
                  <Td><Badge label={p.inStock?'In Stock':'Out'} color={p.inStock?'green':'red'}/></Td>
                  <Td><div style={{ display:'flex',gap:6 }}>
                    <Btn size="sm" variant="ghost"  onClick={()=>{ setForm({...p,price:String(p.price)}); setModal('editProd') }}>Edit</Btn>
                    <Btn size="sm" variant="danger" onClick={()=>delProd(p.id)}>Del</Btn>
                  </div></Td>
                </tr>
              ))}
            </Table>
          </Card>
        </>
      )}

      {/* ── CATEGORIES ── */}
      {tab==='categories' && (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:18 }}>
          {store.categories.map(cat=>(
            <Card key={cat.id} style={{ overflow:'hidden' }}>
              <img src={cat.image||'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400'} alt="" style={{ width:'100%',height:140,objectFit:'cover',display:'block' }}/>
              <div style={{ padding:18 }}>
                <div style={{ fontWeight:700,fontSize:16,marginBottom:4 }}>{cat.name}</div>
                <div style={{ color:C.muted,fontSize:12,marginBottom:14 }}>
                  {store.subcategories.filter(s=>s.categoryId===cat.id).length} subcategories · {store.products.filter(p=>p.categoryId===cat.id).length} products
                </div>
                <div style={{ display:'flex',gap:8 }}>
                  <Btn size="sm" variant="ghost"  onClick={()=>{ setForm({...cat}); setModal('editCat') }}>Edit</Btn>
                  <Btn size="sm" variant="danger" onClick={()=>delCat(cat.id)}>Delete</Btn>
                </div>
              </div>
            </Card>
          ))}
          {store.categories.length===0 && <p style={{ color:C.muted,padding:40 }}>No categories yet. Add one.</p>}
        </div>
      )}

      {/* ── SUBCATEGORIES ── */}
      {tab==='subcategories' && (
        <Card>
          <Table heads={['Image','Name','Category','Products','Actions']} empty={store.subcategories.length===0?'No subcategories yet':''}> 
            {store.subcategories.map(sub=>(
              <tr key={sub.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                <Td><img src={sub.image||ph} alt="" style={{ width:48,height:48,borderRadius:8,objectFit:'cover',background:'#222' }}/></Td>
                <Td style={{ fontWeight:600 }}>{sub.name}</Td>
                <Td><Badge label={catName(sub.categoryId)}/></Td>
                <Td style={{ color:C.muted,fontSize:13 }}>{store.products.filter(p=>p.subcategoryId===sub.id).length} items</Td>
                <Td><div style={{ display:'flex',gap:6 }}>
                  <Btn size="sm" variant="ghost"  onClick={()=>{ setForm({...sub}); setModal('editSub') }}>Edit</Btn>
                  <Btn size="sm" variant="danger" onClick={()=>delSub(sub.id)}>Del</Btn>
                </div></Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {/* ═══ MODALS ═══ */}

      {(modal==='addCat'||modal==='editCat') && (
        <Modal title={modal==='addCat'?'Add Category':'Edit Category'} onClose={close}>
          <FR label="Category Name *"><input style={inp} value={form.name||''} onChange={e=>set('name',e.target.value)} placeholder="e.g. Supplements"/></FR>
          <ImageUploader value={form.image||''} onChange={v=>set('image',v)} label="Cover Image" hint="Recommended: 800×500px" maxW={900} aspect="wide"/>
          <div style={{ display:'flex',gap:10,marginTop:8 }}>
            <Btn onClick={saveCat} disabled={saving} style={{ flex:1,justifyContent:'center' }}>{saving?<Spinner/>:'Save'}</Btn>
            <Btn variant="muted" onClick={close} style={{ flex:1,justifyContent:'center' }}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {(modal==='addSub'||modal==='editSub') && (
        <Modal title={modal==='addSub'?'Add Subcategory':'Edit Subcategory'} onClose={close}>
          <FR label="Parent Category *">
            <select style={inp} value={form.categoryId||''} onChange={e=>set('categoryId',e.target.value)}>
              <option value="">— Select —</option>
              {store.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FR>
          <FR label="Subcategory Name *"><input style={inp} value={form.name||''} onChange={e=>set('name',e.target.value)} placeholder="e.g. Whey Protein"/></FR>
          <ImageUploader value={form.image||''} onChange={v=>set('image',v)} label="Subcategory Image" hint="400×300px" maxW={600} aspect="wide"/>
          <div style={{ display:'flex',gap:10,marginTop:8 }}>
            <Btn onClick={saveSub} disabled={saving} style={{ flex:1,justifyContent:'center' }}>{saving?<Spinner/>:'Save'}</Btn>
            <Btn variant="muted" onClick={close} style={{ flex:1,justifyContent:'center' }}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {(modal==='addProd'||modal==='editProd') && (
        <Modal title={modal==='addProd'?'Add Product':'Edit Product'} onClose={close} wide>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20 }}>
            <div>
              <FR label="Product Name *"><input style={inp} value={form.name||''} onChange={e=>set('name',e.target.value)} placeholder="e.g. Whey Protein 1kg"/></FR>
              <FR label="Description">
                <textarea style={{ ...inp,resize:'none',height:76 }} value={form.description||''} onChange={e=>set('description',e.target.value)} placeholder="Brief description…"/>
              </FR>
              <FR label="Price (₹) *"><input style={inp} type="number" value={form.price||''} onChange={e=>set('price',e.target.value)} placeholder="1599"/></FR>
              <FR label="Category">
                <select style={inp} value={form.categoryId||''} onChange={e=>{ set('categoryId',e.target.value); set('subcategoryId','') }}>
                  <option value="">— Select Category —</option>
                  {store.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FR>
              <FR label="Subcategory *">
                <select style={inp} value={form.subcategoryId||''} onChange={e=>set('subcategoryId',e.target.value)}>
                  <option value="">— Select Subcategory —</option>
                  {store.subcategories.filter(s=>!form.categoryId||s.categoryId===form.categoryId).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FR>
              <FR label="Stock">
                <select style={inp} value={form.inStock===false?'out':'in'} onChange={e=>set('inStock',e.target.value==='in')}>
                  <option value="in">In Stock</option><option value="out">Out of Stock</option>
                </select>
              </FR>
            </div>
            <div>
              <ImageUploader value={form.image||''} onChange={v=>set('image',v)} label="Product Image *" hint="600×600px recommended" maxW={700} aspect="square"/>
              {(form.name||form.price) && (
                <div style={{ background:'rgba(255,255,255,0.03)',border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginTop:8 }}>
                  <div style={{ fontSize:11,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:.06 }}>Preview</div>
                  <div style={{ fontWeight:700,fontSize:14 }}>{form.name||'Name'}</div>
                  {form.description && <div style={{ fontSize:12,color:C.muted,marginTop:3,lineHeight:1.5 }}>{form.description}</div>}
                  {form.price && <div style={{ color:C.accent,fontWeight:800,fontSize:18,marginTop:6 }}>₹{form.price}</div>}
                </div>
              )}
            </div>
          </div>
          <div style={{ display:'flex',gap:10,marginTop:16 }}>
            <Btn onClick={saveProd} disabled={saving} style={{ flex:1,justifyContent:'center' }}>{saving?<Spinner/>:'Save Product'}</Btn>
            <Btn variant="muted" onClick={close} style={{ flex:1,justifyContent:'center' }}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
