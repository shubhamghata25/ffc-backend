import 'dotenv/config'
import express    from 'express'
import cors       from 'cors'
import Razorpay   from 'razorpay'
import nodemailer from 'nodemailer'
import crypto     from 'crypto'

const app  = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: '*' }))
app.use(express.json({ limit: '15mb' }))

const uid = () => Math.random().toString(36).slice(2, 9)

/* ════════════════════════════════════════════
   IN-MEMORY DATA STORE
════════════════════════════════════════════ */
let db = {
  members: [
    { id:uid(), name:'Rahul Sharma',  phone:'9876543210', plan:'Monthly – ₹1199',    joined:'2026-01-15', status:'Active',   fee:'Paid'   },
    { id:uid(), name:'Priya Yadav',   phone:'9812345670', plan:'Half Yearly – ₹4999',joined:'2025-10-01', status:'Active',   fee:'Paid'   },
    { id:uid(), name:'Amit Kulkarni', phone:'9988776655', plan:'Quarterly – ₹2999',  joined:'2026-02-20', status:'Inactive', fee:'Unpaid' },
  ],
  leads: [
    { id:uid(), name:'Mohit Raut',  email:'mohit@mail.com', phone:'9911223344', message:'Interested in monthly plan', date:'2026-04-05' },
    { id:uid(), name:'Divya Singh', email:'divya@mail.com', phone:'9933445566', message:'Want personal training',     date:'2026-04-06' },
  ],
  offers: [
    { id:uid(), status:'OFF', title:'Summer Flash Sale 💥', description:'Get 20% off on all plans!', btn:'Grab Now', link:'/pricing', poster:'' },
  ],
  trainers: [
    { id:uid(), name:'Nagendra Singh', role:'Head Trainer',  exp:'8+ Years', spec:'Strength & Fat Loss',     status:'Active', photo:'' },
    { id:uid(), name:'Depankar Bera',  role:'Fitness Coach', exp:'5+ Years', spec:'Weight Loss & Nutrition', status:'Active', photo:'' },
  ],

  /* ─── MEMBERSHIP PLANS (admin-controlled) ─── */
  membershipPlans: [
    {
      id:'plan1', label:'Monthly', period:'month', price:1199, originalPrice:1199,
      discount:0, discountType:'percent',
      popular:false, active:true,
      features:['Full gym access','Locker facility','Diet consultation','Group classes'],
      description:'Perfect for trying out our gym. No long-term commitment.',
      order:1,
    },
    {
      id:'plan2', label:'Quarterly', period:'3 months', price:2999, originalPrice:2999,
      discount:0, discountType:'percent',
      popular:true, active:true,
      features:['Full gym access','Locker facility','Diet consultation','Group classes','1 Personal session'],
      description:'Best value for short-term fitness goals.',
      order:2,
    },
    {
      id:'plan3', label:'Half Yearly', period:'6 months', price:4999, originalPrice:4999,
      discount:0, discountType:'percent',
      popular:false, active:true,
      features:['Full gym access','Locker facility','Diet consultation','Group classes','2 Personal sessions','Body analysis'],
      description:'Commit to 6 months and see a real transformation.',
      order:3,
    },
    {
      id:'plan4', label:'Yearly', period:'year', price:9999, originalPrice:9999,
      discount:0, discountType:'percent',
      popular:false, active:true,
      features:['Full gym access','Locker facility','Diet consultation','Group classes','5 Personal sessions','Body analysis','Priority support'],
      description:'Our best value plan for serious fitness enthusiasts.',
      order:4,
    },
  ],

  /* ─── STORE ─── */
  storeCategories: [
    { id:'cat1', name:'Supplements',   image:'', order:1 },
    { id:'cat2', name:'Gym Equipment', image:'', order:2 },
    { id:'cat3', name:'Extra',         image:'', order:3 },
  ],
  storeSubcategories: [
    { id:'sub1', categoryId:'cat1', name:'Protein',     image:'', order:1 },
    { id:'sub2', categoryId:'cat1', name:'Vitamins',    image:'', order:2 },
    { id:'sub3', categoryId:'cat1', name:'Creatine',    image:'', order:3 },
    { id:'sub4', categoryId:'cat2', name:'Dumbbells',   image:'', order:1 },
    { id:'sub5', categoryId:'cat2', name:'Resistance',  image:'', order:2 },
    { id:'sub6', categoryId:'cat3', name:'Accessories', image:'', order:1 },
    { id:'sub7', categoryId:'cat3', name:'Apparel',     image:'', order:2 },
  ],
  storeProducts: [
    { id:'p1', subcategoryId:'sub1', categoryId:'cat1', name:'Whey Protein 1kg',   description:'Premium whey protein for muscle recovery.',price:1599,image:'',inStock:true },
    { id:'p2', subcategoryId:'sub3', categoryId:'cat1', name:'Creatine 500g',       description:'Pure creatine monohydrate for strength.',   price:999, image:'',inStock:true },
    { id:'p3', subcategoryId:'sub4', categoryId:'cat2', name:'Adjustable Dumbbell', description:'5–25kg adjustable dumbbell set.',            price:3499,image:'',inStock:true },
    { id:'p4', subcategoryId:'sub5', categoryId:'cat2', name:'Resistance Band Set', description:'5-band set for home workouts.',              price:699, image:'',inStock:true },
    { id:'p5', subcategoryId:'sub6', categoryId:'cat3', name:'Gym Gloves',          description:'Anti-slip gloves for lifting.',              price:349, image:'',inStock:true },
  ],

  /* ─── EXERCISES ─── */
  exercises: [
    { id:'e1', name:'Bench Press',    muscle:'Chest',     level:'Intermediate', description:'Classic chest exercise.', ytLink:'https://www.youtube.com/watch?v=rT7DgCr-3pg', image:'' },
    { id:'e2', name:'Squats',         muscle:'Legs',      level:'Beginner',     description:'King of leg exercises.',  ytLink:'https://www.youtube.com/watch?v=aclHkVaku9U', image:'' },
    { id:'e3', name:'Dumbbell Curl',  muscle:'Biceps',    level:'Advanced',     description:'Isolation for biceps.',   ytLink:'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', image:'' },
    { id:'e4', name:'Deadlift',       muscle:'Back',      level:'Advanced',     description:'Full-body compound lift.',ytLink:'https://www.youtube.com/watch?v=op9kVnSso6Q', image:'' },
    { id:'e5', name:'Pull Ups',       muscle:'Back',      level:'Intermediate', description:'Upper body pulling.',     ytLink:'https://www.youtube.com/watch?v=eGo4IYlbE5g', image:'' },
    { id:'e6', name:'Shoulder Press', muscle:'Shoulders', level:'Beginner',     description:'Overhead pressing.',      ytLink:'https://www.youtube.com/watch?v=qEwKCR5JCog', image:'' },
  ],

  /* ─── ORDERS ─── */
  orders: [],
}

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
function ytId(url) {
  if (!url) return ''
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : url
}

/* Compute effective price from plan */
function effectivePrice(plan) {
  if (!plan.discount || plan.discount <= 0) return plan.originalPrice || plan.price
  if (plan.discountType === 'flat') return Math.max(0, (plan.originalPrice||plan.price) - plan.discount)
  return Math.round((plan.originalPrice||plan.price) * (1 - plan.discount/100))
}

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
})

const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
})

function adminOnly(req, res, next) {
  const secret = process.env.ADMIN_SECRET || 'ffc-admin-secret-2026'
  if (req.headers['x-admin-key'] !== secret) return res.status(401).json({ error:'Unauthorized' })
  next()
}

/* ════════════════════════════════════════════
   PUBLIC ROUTES
════════════════════════════════════════════ */
app.get('/api/health', (_req,res) => res.json({ status:'ok', time:new Date().toISOString() }))

app.get('/api/offer',    (_req,res) => res.json(db.offers.find(o=>o.status==='ON') || { status:'OFF' }))
app.get('/api/trainers', (_req,res) => res.json(db.trainers))

/* ─── PUBLIC: Membership Plans (with computed price) ─── */
app.get('/api/plans', (_req, res) => {
  const plans = db.membershipPlans
    .filter(p => p.active !== false)
    .sort((a,b) => a.order - b.order)
    .map(p => ({ ...p, price: effectivePrice(p) }))
  res.json(plans)
})

/* ─── PUBLIC: Store ─── */
app.get('/api/store', (_req, res) => {
  res.json({
    categories:    db.storeCategories.sort((a,b)=>a.order-b.order),
    subcategories: db.storeSubcategories.sort((a,b)=>a.order-b.order),
    products:      db.storeProducts.filter(p=>p.inStock),
  })
})

/* ─── PUBLIC: Exercises ─── */
app.get('/api/exercises', (_req, res) => {
  res.json(db.exercises.map(e => ({ ...e, ytId: ytId(e.ytLink) })))
})

/* legacy products endpoint */
app.get('/api/products', (_req, res) => {
  res.json(db.storeProducts.filter(p=>p.inStock).map(p=>({
    name:p.name, price:p.price, image:p.image, stock:p.inStock?10:0,
    category:(db.storeCategories.find(c=>c.id===p.categoryId)||{}).name||'',
  })))
})

/* ════════════════════════════════════════════
   PAYMENT ROUTES
════════════════════════════════════════════ */

/* ─── Create Razorpay order (membership + store products) ─── */
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, type, itemId, itemName } = req.body
    if (!amount || amount < 1) return res.status(400).json({ error:'Invalid amount' })

    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100),
      currency: 'INR',
      notes:    { type: type || 'membership', itemId: itemId || '', itemName: itemName || '' },
    })
    res.json(order)
  } catch(err) {
    console.error('create-order:', err.message)
    res.status(500).json({ error:'Order creation failed', details: err.message })
  }
})

/* ─── Verify Razorpay payment signature ─── */
app.post('/api/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, meta } = req.body
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder'

  const body      = razorpay_order_id + '|' + razorpay_payment_id
  const expected  = crypto.createHmac('sha256', key_secret).update(body).digest('hex')

  if (expected !== razorpay_signature) {
    return res.status(400).json({ success:false, error:'Invalid signature' })
  }

  /* Save order record */
  const order = {
    id:          uid(),
    orderId:     razorpay_order_id,
    paymentId:   razorpay_payment_id,
    ...meta,
    status:      'paid',
    createdAt:   new Date().toISOString(),
  }
  db.orders.unshift(order)

  res.json({ success:true, order })
})

/* ─── Save unverified store order (no signature) fallback ─── */
app.post('/api/save-order', adminOnly, (req, res) => {
  const o = { ...req.body, id:uid(), createdAt:new Date().toISOString() }
  db.orders.unshift(o)
  res.json(o)
})

/* ════════════════════════════════════════════
   CONTACT
════════════════════════════════════════════ */
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body
  if (!name||!email||!phone||!message) return res.status(400).json({ error:'All fields required' })
  const lead = { id:uid(), name, email, phone, message, date:new Date().toISOString().slice(0,10) }
  db.leads.unshift(lead)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      await mailer.sendMail({ from:process.env.EMAIL_USER, to:process.env.EMAIL_USER,
        subject:`🏋 New Lead: ${name}`,
        html:`<h2 style="color:#7c3aed">New Contact – FFC</h2><p><b>Name:</b>${name}</p><p><b>Email:</b>${email}</p><p><b>Phone:</b>${phone}</p><p><b>Message:</b>${message}</p>` })
    } catch(e) { console.warn('Email failed:', e.message) }
  }
  res.json({ success:true })
})

/* ════════════════════════════════════════════
   ADMIN — existing features
════════════════════════════════════════════ */
app.get('/api/admin/members',        adminOnly,(_req,res)=>res.json(db.members))
app.post('/api/admin/members',       adminOnly,(req,res)=>{ const m={...req.body,id:uid()}; db.members.unshift(m); res.json(m) })
app.put('/api/admin/members/:id',    adminOnly,(req,res)=>{ db.members=db.members.map(m=>m.id===req.params.id?{...req.body,id:req.params.id}:m); res.json({ok:true}) })
app.delete('/api/admin/members/:id', adminOnly,(req,res)=>{ db.members=db.members.filter(m=>m.id!==req.params.id); res.json({ok:true}) })

app.get('/api/admin/leads',          adminOnly,(_req,res)=>res.json(db.leads))
app.delete('/api/admin/leads/:id',   adminOnly,(req,res)=>{ db.leads=db.leads.filter(l=>l.id!==req.params.id); res.json({ok:true}) })

app.get('/api/admin/offers',         adminOnly,(_req,res)=>res.json(db.offers))
app.post('/api/admin/offers',        adminOnly,(req,res)=>{ const o={...req.body,id:uid()}; db.offers.unshift(o); res.json(o) })
app.put('/api/admin/offers/:id',     adminOnly,(req,res)=>{ db.offers=db.offers.map(o=>o.id===req.params.id?{...req.body,id:req.params.id}:o); res.json({ok:true}) })
app.delete('/api/admin/offers/:id',  adminOnly,(req,res)=>{ db.offers=db.offers.filter(o=>o.id!==req.params.id); res.json({ok:true}) })

app.get('/api/admin/trainers',        adminOnly,(_req,res)=>res.json(db.trainers))
app.post('/api/admin/trainers',       adminOnly,(req,res)=>{ const t={...req.body,id:uid()}; db.trainers.push(t); res.json(t) })
app.put('/api/admin/trainers/:id',    adminOnly,(req,res)=>{ db.trainers=db.trainers.map(t=>t.id===req.params.id?{...req.body,id:req.params.id}:t); res.json({ok:true}) })
app.delete('/api/admin/trainers/:id', adminOnly,(req,res)=>{ db.trainers=db.trainers.filter(t=>t.id!==req.params.id); res.json({ok:true}) })

/* ════════════════════════════════════════════
   ADMIN — Membership Plans CRUD
════════════════════════════════════════════ */
app.get('/api/admin/plans', adminOnly, (_req,res) => {
  res.json(db.membershipPlans.sort((a,b)=>a.order-b.order).map(p=>({...p,effectivePrice:effectivePrice(p)})))
})

app.post('/api/admin/plans', adminOnly, (req,res) => {
  const plan = {
    ...req.body,
    id: uid(),
    order: db.membershipPlans.length + 1,
    active: req.body.active !== false,
    originalPrice: Number(req.body.price) || 0,
    price: Number(req.body.price) || 0,
    discount: Number(req.body.discount) || 0,
    discountType: req.body.discountType || 'percent',
  }
  db.membershipPlans.push(plan)
  res.json({ ...plan, effectivePrice: effectivePrice(plan) })
})

app.put('/api/admin/plans/:id', adminOnly, (req,res) => {
  db.membershipPlans = db.membershipPlans.map(p => {
    if (p.id !== req.params.id) return p
    const updated = {
      ...p, ...req.body, id: req.params.id,
      originalPrice: Number(req.body.price) || p.originalPrice,
      price: Number(req.body.price) || p.price,
      discount: Number(req.body.discount) || 0,
      discountType: req.body.discountType || p.discountType || 'percent',
    }
    return updated
  })
  const plan = db.membershipPlans.find(p=>p.id===req.params.id)
  res.json({ ok:true, effectivePrice: plan ? effectivePrice(plan) : 0 })
})

app.delete('/api/admin/plans/:id', adminOnly, (req,res) => {
  db.membershipPlans = db.membershipPlans.filter(p=>p.id!==req.params.id)
  res.json({ ok:true })
})

/* ════════════════════════════════════════════
   ADMIN — Orders
════════════════════════════════════════════ */
app.get('/api/admin/orders', adminOnly, (_req,res) => res.json(db.orders))

/* ════════════════════════════════════════════
   ADMIN — Store
════════════════════════════════════════════ */
app.get('/api/admin/store', adminOnly, (_req,res) => res.json({
  categories:    db.storeCategories.sort((a,b)=>a.order-b.order),
  subcategories: db.storeSubcategories.sort((a,b)=>a.order-b.order),
  products:      db.storeProducts,
}))

app.get('/api/admin/store/categories',        adminOnly,(_req,res)=>res.json(db.storeCategories.sort((a,b)=>a.order-b.order)))
app.post('/api/admin/store/categories',       adminOnly,(req,res)=>{ const c={...req.body,id:uid(),order:db.storeCategories.length+1}; db.storeCategories.push(c); res.json(c) })
app.put('/api/admin/store/categories/:id',    adminOnly,(req,res)=>{ db.storeCategories=db.storeCategories.map(c=>c.id===req.params.id?{...req.body,id:req.params.id}:c); res.json({ok:true}) })
app.delete('/api/admin/store/categories/:id', adminOnly,(req,res)=>{ db.storeCategories=db.storeCategories.filter(c=>c.id!==req.params.id); db.storeSubcategories=db.storeSubcategories.filter(s=>s.categoryId!==req.params.id); db.storeProducts=db.storeProducts.filter(p=>p.categoryId!==req.params.id); res.json({ok:true}) })

app.get('/api/admin/store/subcategories',        adminOnly,(_req,res)=>res.json(db.storeSubcategories.sort((a,b)=>a.order-b.order)))
app.post('/api/admin/store/subcategories',       adminOnly,(req,res)=>{ const s={...req.body,id:uid()}; db.storeSubcategories.push(s); res.json(s) })
app.put('/api/admin/store/subcategories/:id',    adminOnly,(req,res)=>{ db.storeSubcategories=db.storeSubcategories.map(s=>s.id===req.params.id?{...req.body,id:req.params.id}:s); res.json({ok:true}) })
app.delete('/api/admin/store/subcategories/:id', adminOnly,(req,res)=>{ db.storeSubcategories=db.storeSubcategories.filter(s=>s.id!==req.params.id); db.storeProducts=db.storeProducts.filter(p=>p.subcategoryId!==req.params.id); res.json({ok:true}) })

app.get('/api/admin/store/products',        adminOnly,(_req,res)=>res.json(db.storeProducts))
app.post('/api/admin/store/products',       adminOnly,(req,res)=>{ const p={...req.body,id:uid()}; db.storeProducts.push(p); res.json(p) })
app.put('/api/admin/store/products/:id',    adminOnly,(req,res)=>{ db.storeProducts=db.storeProducts.map(p=>p.id===req.params.id?{...req.body,id:req.params.id}:p); res.json({ok:true}) })
app.delete('/api/admin/store/products/:id', adminOnly,(req,res)=>{ db.storeProducts=db.storeProducts.filter(p=>p.id!==req.params.id); res.json({ok:true}) })

/* ════════════════════════════════════════════
   ADMIN — Exercises
════════════════════════════════════════════ */
app.get('/api/admin/exercises',        adminOnly,(_req,res)=>res.json(db.exercises))
app.post('/api/admin/exercises',       adminOnly,(req,res)=>{ const e={...req.body,id:uid()}; db.exercises.push(e); res.json(e) })
app.put('/api/admin/exercises/:id',    adminOnly,(req,res)=>{ db.exercises=db.exercises.map(e=>e.id===req.params.id?{...req.body,id:req.params.id}:e); res.json({ok:true}) })
app.delete('/api/admin/exercises/:id', adminOnly,(req,res)=>{ db.exercises=db.exercises.filter(e=>e.id!==req.params.id); res.json({ok:true}) })

app.listen(PORT, () => console.log(`✅ FFC backend on port ${PORT}`))
