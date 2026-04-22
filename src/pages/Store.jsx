import React, { useEffect, useState, useRef } from 'react'
import { openRazorpay } from '../hooks/useRazorpay.jsx'
import { useToast, ToastContainer } from '../hooks/useToast.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const PH  = 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400'

/* ── Cart ── */
function useCart() {
  const [cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('ffc_cart')||'[]')}catch{return []}})
  const persist=(c)=>{setCart(c);localStorage.setItem('ffc_cart',JSON.stringify(c))}
  const add=(p)=>{
    setCart(prev=>{
      const ex=prev.find(i=>i.id===p.id)
      const next=ex?prev.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i):[...prev,{...p,qty:1}]
      localStorage.setItem('ffc_cart',JSON.stringify(next))
      return next
    })
  }
  const remove=(id)=>persist(cart.filter(i=>i.id!==id))
  const clear=()=>persist([])
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0)
  const count=cart.reduce((s,i)=>s+i.qty,0)
  return{cart,add,remove,clear,total,count}
}

export default function Store() {
  const [storeData,setStoreData]=useState({categories:[],subcategories:[],products:[]})
  const [loading,setLoading]=useState(true)
  const [view,setView]=useState('categories')
  const [activeCat,setActiveCat]=useState(null)
  const [activeSub,setActiveSub]=useState(null)
  const [search,setSearch]=useState('')
  const [showCart,setShowCart]=useState(false)
  const [paying,setPaying]=useState(null)
  const [flashAdd,setFlashAdd]=useState(null)
  const cartRef=useRef(null)
  const {cart,add,remove,clear,total,count}=useCart()
  const {toasts,success,error,info}=useToast()

  useEffect(()=>{
    fetch(`${API}/api/store`).then(r=>r.json())
      .then(d=>{setStoreData(d);setLoading(false)}).catch(()=>setLoading(false))
  },[])

  /* close cart when clicking outside */
  useEffect(()=>{
    const fn=(e)=>{ if(cartRef.current&&!cartRef.current.contains(e.target))setShowCart(false) }
    document.addEventListener('mousedown',fn)
    return()=>document.removeEventListener('mousedown',fn)
  },[])

  const subsForCat = activeCat ? storeData.subcategories.filter(s=>s.categoryId===activeCat.id) : []
  const prodsForSub= activeSub ? storeData.products.filter(p=>p.subcategoryId===activeSub.id) : []
  const displayed  = search ? prodsForSub.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())) : prodsForSub

  const selectCat=(c)=>{ setActiveCat(c); setActiveSub(null); setSearch(''); setView('subcategories') }
  const selectSub=(s)=>{ setActiveSub(s); setSearch(''); setView('products') }
  const goBack=()=>{
    if(view==='products')          { setView('subcategories'); setActiveSub(null) }
    else if(view==='subcategories'){ setView('categories');    setActiveCat(null) }
  }

  function handleAddCart(p){
    add(p); setFlashAdd(p.id); setTimeout(()=>setFlashAdd(null),1400)
    info(`${p.name} added to cart`)
  }

  async function handleBuyNow(product){
    setPaying(product.id)
    info(`Opening payment for ${product.name}…`)
    await openRazorpay({
      amount:      product.price,
      name:        product.name,
      description: `${product.name} — ₹${product.price}`,
      meta:        { type:'store_product', itemId:product.id, itemName:product.name },
      onSuccess: (resp)=>{
        success(`🎉 Payment successful! Order confirmed.`)
        setPaying(null)
      },
      onFailure: (msg)=>{
        if(!msg.includes('cancelled')) error(msg)
        setPaying(null)
      },
    })
    setPaying(null)
  }

  async function handleCartCheckout(){
    if(cart.length===0) return
    const totalAmt = cart.reduce((s,i)=>s+i.price*i.qty,0)
    const desc = cart.map(i=>`${i.name} x${i.qty}`).join(', ')
    setPaying('cart')
    info('Opening payment for cart…')
    await openRazorpay({
      amount: totalAmt,
      name: 'FFC Store Order',
      description: desc,
      meta: { type:'store_cart', items: cart.map(i=>({id:i.id,name:i.name,qty:i.qty,price:i.price})) },
      onSuccess: (resp)=>{
        success(`🎉 Order placed! Payment ID: ${resp.razorpay_payment_id}`)
        clear(); setShowCart(false); setPaying(null)
      },
      onFailure: (msg)=>{ if(!msg.includes('cancelled')) error(msg); setPaying(null) },
    })
    setPaying(null)
  }

  const crumb=[]
  if(activeCat) crumb.push({label:activeCat.name,action:()=>{setView('subcategories');setActiveSub(null)}})
  if(activeSub) crumb.push({label:activeSub.name,action:null})

  return (
    <div className="page-wrapper">
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .s-card{background:linear-gradient(145deg,#130f24,#1a1535);border-radius:20px;border:1px solid rgba(124,58,237,0.15);overflow:hidden;transition:transform .25s,box-shadow .25s,border-color .25s;cursor:pointer}
        .s-card:hover{transform:translateY(-6px);box-shadow:0 14px 40px rgba(124,58,237,0.22);border-color:rgba(124,58,237,0.35)}
        .s-card-static{background:linear-gradient(145deg,#130f24,#1a1535);border-radius:20px;border:1px solid rgba(124,58,237,0.15);overflow:hidden;animation:fadeIn .35s ease both}
        .pay-btn{border:none;border-radius:30px;font-family:'Poppins',sans-serif;font-weight:600;font-size:13px;cursor:pointer;transition:all .2s;padding:11px 0;width:100%}
        .pay-btn-primary{background:linear-gradient(135deg,#7c3aed,#9c59f7);color:#fff;box-shadow:0 4px 16px rgba(124,58,237,0.35)}
        .pay-btn-primary:hover{filter:brightness(1.12);transform:translateY(-1px)}
        .pay-btn-ghost{background:transparent;border:1px solid rgba(124,58,237,0.4);color:#bb86fc}
        .pay-btn-ghost:hover{background:rgba(124,58,237,0.12)}
        .pay-btn-success{background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff}
        @media(max-width:640px){.s-grid{grid-template-columns:repeat(2,1fr)!important;gap:12px!important}}
      `}</style>

      <section className="section">
        {/* ─── Header ─── */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:36,flexWrap:'wrap',gap:16}}>
          <div>
            <div className="accent-line"/>
            <h1 className="section-title" style={{marginBottom:6}}>
              Our <span style={{background:'linear-gradient(135deg,#bb86fc,#7c3aed)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>Store</span>
            </h1>
            {crumb.length>0 && (
              <div style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:'var(--muted)'}}>
                <span onClick={()=>{setView('categories');setActiveCat(null);setActiveSub(null)}} style={{cursor:'pointer',color:'#9c59f7'}}>Store</span>
                {crumb.map((c,i)=>(
                  <React.Fragment key={i}>
                    <span>›</span>
                    <span onClick={c.action||undefined} style={{color:i===crumb.length-1?'var(--textSub)':'#9c59f7',cursor:c.action?'pointer':'default'}}>{c.label}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Cart button */}
          <div ref={cartRef} style={{position:'relative'}}>
            <button onClick={()=>setShowCart(s=>!s)} style={{
              display:'flex',alignItems:'center',gap:8,
              background:'rgba(124,58,237,0.12)',border:'1px solid rgba(124,58,237,0.3)',
              color:'#bb86fc',borderRadius:30,padding:'10px 20px',fontWeight:600,fontSize:14,cursor:'pointer',
              transition:'all .2s',
            }}>
              🛒 Cart
              {count>0 && <span style={{background:'linear-gradient(135deg,#7c3aed,#9c59f7)',color:'#fff',borderRadius:20,padding:'1px 9px',fontSize:12}}>{count}</span>}
            </button>

            {/* Cart dropdown */}
            {showCart && (
              <div style={{position:'absolute',top:'calc(100%+10px)',right:0,width:330,
                background:'linear-gradient(145deg,#130f24,#1a1535)',border:'1px solid rgba(124,58,237,0.25)',
                borderRadius:20,padding:22,zIndex:300,boxShadow:'0 12px 48px rgba(0,0,0,0.7)'}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:16,color:'#bb86fc'}}>🛒 Your Cart</div>
                {cart.length===0
                  ? <p style={{color:'var(--muted)',fontSize:13,textAlign:'center',padding:'18px 0'}}>Cart is empty</p>
                  : <>
                    {cart.map(item=>(
                      <div key={item.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid rgba(124,58,237,0.1)'}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:600}}>{item.name}</div>
                          <div style={{fontSize:12,color:'var(--muted)'}}>₹{item.price} × {item.qty}</div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <span style={{color:'#9c59f7',fontWeight:700,fontSize:14}}>₹{item.price*item.qty}</span>
                          <button onClick={()=>remove(item.id)} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:16,lineHeight:1}}>✕</button>
                        </div>
                      </div>
                    ))}
                    <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,margin:'14px 0 16px',color:'var(--text)'}}>
                      <span>Total</span>
                      <span style={{background:'linear-gradient(135deg,#bb86fc,#7c3aed)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',fontSize:18}}>₹{total.toLocaleString()}</span>
                    </div>
                    <button className="pay-btn pay-btn-primary" onClick={handleCartCheckout} disabled={paying==='cart'}
                      style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                      {paying==='cart'
                        ? <><span style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block'}}/> Processing…</>
                        : '🔒 Checkout via Razorpay'
                      }
                    </button>
                  </>
                }
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div style={{textAlign:'center',padding:80}}>
            <div style={{width:44,height:44,border:'3px solid rgba(124,58,237,0.2)',borderTopColor:'#7c3aed',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 16px'}}/>
            <p style={{color:'var(--muted)'}}>Loading store…</p>
          </div>
        )}

        {/* ── CATEGORIES ── */}
        {!loading&&view==='categories'&&(
          <div className="s-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:22,maxWidth:1100,margin:'0 auto'}}>
            {storeData.categories.map(cat=>(
              <div key={cat.id} className="s-card" onClick={()=>selectCat(cat)}>
                <img src={cat.image||PH} alt={cat.name} style={{width:'100%',height:190,objectFit:'cover',display:'block'}}/>
                <div style={{padding:'18px 22px',textAlign:'center'}}>
                  <h3 style={{color:'#bb86fc',fontSize:19,marginBottom:4}}>{cat.name}</h3>
                  <p style={{color:'var(--muted)',fontSize:12}}>{storeData.products.filter(p=>p.categoryId===cat.id&&p.inStock).length} products</p>
                </div>
              </div>
            ))}
            {storeData.categories.length===0&&<p style={{color:'var(--muted)',textAlign:'center',gridColumn:'1/-1',padding:40}}>No categories yet.</p>}
          </div>
        )}

        {/* ── SUBCATEGORIES ── */}
        {!loading&&view==='subcategories'&&(
          <>
            <button onClick={goBack} style={{background:'none',border:'none',color:'#9c59f7',cursor:'pointer',fontSize:15,fontWeight:600,display:'flex',alignItems:'center',gap:8,marginBottom:28}}>← Back</button>
            <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,letterSpacing:2,marginBottom:22}}>{activeCat?.name}</h2>
            <div className="s-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:18,maxWidth:1100,margin:'0 auto'}}>
              {subsForCat.map(sub=>(
                <div key={sub.id} className="s-card" onClick={()=>selectSub(sub)}>
                  <img src={sub.image||PH} alt={sub.name} style={{width:'100%',height:150,objectFit:'cover',display:'block'}}/>
                  <div style={{padding:'14px 18px',textAlign:'center'}}>
                    <h3 style={{color:'#bb86fc',fontSize:16}}>{sub.name}</h3>
                    <p style={{color:'var(--muted)',fontSize:12,marginTop:4}}>{storeData.products.filter(p=>p.subcategoryId===sub.id&&p.inStock).length} items</p>
                  </div>
                </div>
              ))}
              {subsForCat.length===0&&<p style={{color:'var(--muted)',gridColumn:'1/-1',textAlign:'center',padding:40}}>No subcategories.</p>}
            </div>
          </>
        )}

        {/* ── PRODUCTS ── */}
        {!loading&&view==='products'&&(
          <>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:12}}>
              <button onClick={goBack} style={{background:'none',border:'none',color:'#9c59f7',cursor:'pointer',fontSize:15,fontWeight:600,display:'flex',alignItems:'center',gap:8}}>← Back</button>
              <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,letterSpacing:2,flex:1,textAlign:'center'}}>{activeSub?.name}</h2>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search…"
                style={{padding:'9px 14px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(124,58,237,0.25)',borderRadius:10,color:'var(--text)',fontFamily:'Poppins,sans-serif',fontSize:13,outline:'none',width:200}}/>
            </div>

            <div className="s-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:22,maxWidth:1100,margin:'0 auto'}}>
              {displayed.map((p,idx)=>(
                <div key={p.id} className="s-card-static" style={{animationDelay:`${idx*0.04}s`}}>
                  <div style={{position:'relative'}}>
                    <img src={p.image||PH} alt={p.name} style={{width:'100%',height:200,objectFit:'cover',display:'block'}}/>
                    {!p.inStock&&(
                      <div style={{position:'absolute',inset:0,background:'rgba(6,5,15,0.75)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <span style={{color:'rgba(240,238,255,0.6)',fontWeight:700,fontSize:14}}>Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div style={{padding:18}}>
                    <h3 style={{fontSize:16,fontWeight:700,marginBottom:5}}>{p.name}</h3>
                    {p.description&&<p style={{color:'var(--textSub)',fontSize:13,lineHeight:1.6,marginBottom:10}}>{p.description}</p>}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                      <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,background:'linear-gradient(135deg,#bb86fc,#7c3aed)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>₹{p.price.toLocaleString()}</span>
                      {p.inStock&&<span style={{color:'#4ade80',fontSize:12,fontWeight:600}}>● In Stock</span>}
                    </div>
                    {p.inStock&&(
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        <button className={`pay-btn ${paying===p.id?'pay-btn-success':flashAdd===p.id?'pay-btn-success':'pay-btn-primary'}`}
                          onClick={()=>handleBuyNow(p)} disabled={!!paying}>
                          {paying===p.id
                            ? <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><span style={{width:13,height:13,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block'}}/> Processing…</span>
                            : '🔒 Buy Now — Razorpay'
                          }
                        </button>
                        <button className={`pay-btn pay-btn-ghost ${flashAdd===p.id?'pay-btn-success':''}`}
                          onClick={()=>handleAddCart(p)}>
                          {flashAdd===p.id ? '✓ Added!' : '🛒 Add to Cart'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {displayed.length===0&&<p style={{color:'var(--muted)',gridColumn:'1/-1',textAlign:'center',padding:60}}>No products found.</p>}
            </div>
          </>
        )}
      </section>

      <ToastContainer toasts={toasts}/>
    </div>
  )
}
