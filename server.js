import 'dotenv/config'
import express    from 'express'
import cors       from 'cors'
import Razorpay   from 'razorpay'
import nodemailer from 'nodemailer'

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

  /* ── NEW: Store with category → subcategory → products ── */
  storeCategories: [
    { id:'cat1', name:'Supplements',   image:'', order:1 },
    { id:'cat2', name:'Gym Equipment', image:'', order:2 },
    { id:'cat3', name:'Extra',         image:'', order:3 },
  ],
  storeSubcategories: [
    { id:'sub1', categoryId:'cat1', name:'Protein',    image:'', order:1 },
    { id:'sub2', categoryId:'cat1', name:'Vitamins',   image:'', order:2 },
    { id:'sub3', categoryId:'cat1', name:'Creatine',   image:'', order:3 },
    { id:'sub4', categoryId:'cat2', name:'Dumbbells',  image:'', order:1 },
    { id:'sub5', categoryId:'cat2', name:'Resistance', image:'', order:2 },
    { id:'sub6', categoryId:'cat3', name:'Accessories',image:'', order:1 },
    { id:'sub7', categoryId:'cat3', name:'Apparel',    image:'', order:2 },
  ],
  storeProducts: [
    { id:'p1', subcategoryId:'sub1', categoryId:'cat1', name:'Whey Protein 1kg',    description:'Premium whey protein for muscle recovery.',  price:1599, image:'', inStock:true },
    { id:'p2', subcategoryId:'sub3', categoryId:'cat1', name:'Creatine 500g',        description:'Pure creatine monohydrate for strength.',     price:999,  image:'', inStock:true },
    { id:'p3', subcategoryId:'sub4', categoryId:'cat2', name:'Adjustable Dumbbell',  description:'5–25kg adjustable dumbbell set.',             price:3499, image:'', inStock:true },
    { id:'p4', subcategoryId:'sub5', categoryId:'cat2', name:'Resistance Band Set',  description:'5-band set for home workouts.',               price:699,  image:'', inStock:true },
    { id:'p5', subcategoryId:'sub6', categoryId:'cat3', name:'Gym Gloves',           description:'Anti-slip gloves for lifting.',               price:349,  image:'', inStock:true },
  ],

  /* ── NEW: Exercises admin-controlled ── */
  exercises: [
    { id:'e1', name:'Bench Press',     muscle:'Chest',     level:'Intermediate', description:'Classic chest exercise using barbell or dumbbells.', ytLink:'https://www.youtube.com/watch?v=rT7DgCr-3pg', image:'' },
    { id:'e2', name:'Squats',          muscle:'Legs',      level:'Beginner',     description:'The king of leg exercises for overall lower body.',  ytLink:'https://www.youtube.com/watch?v=aclHkVaku9U', image:'' },
    { id:'e3', name:'Dumbbell Curl',   muscle:'Biceps',    level:'Advanced',     description:'Isolation exercise for building bicep peak.',        ytLink:'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', image:'' },
    { id:'e4', name:'Deadlift',        muscle:'Back',      level:'Advanced',     description:'Full-body compound lift for strength and mass.',      ytLink:'https://www.youtube.com/watch?v=op9kVnSso6Q', image:'' },
    { id:'e5', name:'Pull Ups',        muscle:'Back',      level:'Intermediate', description:'Upper body pulling movement for back width.',         ytLink:'https://www.youtube.com/watch?v=eGo4IYlbE5g', image:'' },
    { id:'e6', name:'Shoulder Press',  muscle:'Shoulders', level:'Beginner',     description:'Overhead pressing for shoulder size and strength.',   ytLink:'https://www.youtube.com/watch?v=qEwKCR5JCog', image:'' },
    { id:'e7', name:'Lat Pulldown',    muscle:'Back',      level:'Beginner',     description:'Cable exercise for lat width and back development.',   ytLink:'https://www.youtube.com/watch?v=CAwf7n6Luuc', image:'' },
    { id:'e8', name:'Treadmill Sprint',muscle:'Cardio',    level:'Beginner',     description:'High-intensity cardio for fat burning.',             ytLink:'https://www.youtube.com/watch?v=9L2b2khySLE', image:'' },
  ],

  /* simple cart (session-level, not persisted) */
  cart: [],
}

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
/* extract YouTube video ID from any YT URL format */
function ytId(url) {
  if (!url) return ''
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : url
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
app.get('/api/health', (_req, res) => res.json({ status:'ok', time:new Date().toISOString() }))

app.get('/api/offer',    (_req,res) => res.json(db.offers.find(o=>o.status==='ON') || {status:'OFF'}))
app.get('/api/trainers', (_req,res) => res.json(db.trainers))

/* ── PUBLIC STORE ── */
/* Full store tree: categories + subcategories + products */
app.get('/api/store', (_req, res) => {
  res.json({
    categories:    db.storeCategories.sort((a,b)=>a.order-b.order),
    subcategories: db.storeSubcategories.sort((a,b)=>a.order-b.order),
    products:      db.storeProducts.filter(p=>p.inStock),
  })
})

/* ── PUBLIC EXERCISES ── */
app.get('/api/exercises', (_req, res) => {
  res.json(db.exercises.map(e => ({ ...e, ytId: ytId(e.ytLink) })))
})

/* legacy /api/products (keep for compatibility) */
app.get('/api/products', async (_req, res) => {
  const url = process.env.PRODUCTS_SHEET_URL
  if (!url) {
    /* fall back to new store products in old format */
    return res.json(db.storeProducts.filter(p=>p.inStock).map(p=>({
      name: p.name, price: p.price, image: p.image,
      stock: p.inStock ? 10 : 0,
      category: (db.storeCategories.find(c=>c.id===p.categoryId)||{}).name || '',
      categoryImage: '',
    })))
  }
  try {
    const r = await fetch(url); const text = await r.text()
    const rows = text.split('\n').slice(1)
    res.json(rows.map(row=>{ const c=row.split(','); if(c.length<6)return null; return{name:c[1]?.trim(),price:Number(c[2])||0,image:c[3]?.trim(),stock:Number(c[4])||0,category:c[5]?.trim(),categoryImage:c[6]?.trim()} }).filter(p=>p&&p.stock>0))
  } catch { res.json([]) }
})

/* ── PAYMENT ── */
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount } = req.body
    if (!amount||amount<1) return res.status(400).json({error:'Invalid amount'})
    const order = await razorpay.orders.create({amount:Math.round(amount*100),currency:'INR'})
    res.json(order)
  } catch(err){ console.error('create-order:',err.message); res.status(500).json({error:'Order creation failed'}) }
})

/* ── CONTACT ── */
app.post('/api/contact', async (req, res) => {
  const {name,email,phone,message} = req.body
  if(!name||!email||!phone||!message) return res.status(400).json({error:'All fields required'})
  const lead = {id:uid(),name,email,phone,message,date:new Date().toISOString().slice(0,10)}
  db.leads.unshift(lead)
  if(process.env.GOOGLE_SHEET_WEBHOOK){try{await fetch(process.env.GOOGLE_SHEET_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(lead)})}catch{}}
  if(process.env.EMAIL_USER&&process.env.EMAIL_PASS){
    try{await mailer.sendMail({from:process.env.EMAIL_USER,to:process.env.EMAIL_USER,subject:`🏋 New Lead: ${name}`,html:`<h2 style="color:#ff3c00">New Contact</h2><p><b>Name:</b>${name}</p><p><b>Email:</b>${email}</p><p><b>Phone:</b>${phone}</p><p><b>Message:</b>${message}</p>`})}
    catch(e){console.warn('Email:',e.message)}
  }
  res.json({success:true})
})

/* ════════════════════════════════════════════
   ADMIN — existing
════════════════════════════════════════════ */
app.get('/api/admin/members',        adminOnly,(_req,res)=>res.json(db.members))
app.post('/api/admin/members',       adminOnly,(req,res)=>{const m={...req.body,id:uid()};db.members.unshift(m);res.json(m)})
app.put('/api/admin/members/:id',    adminOnly,(req,res)=>{db.members=db.members.map(m=>m.id===req.params.id?{...req.body,id:req.params.id}:m);res.json({ok:true})})
app.delete('/api/admin/members/:id', adminOnly,(req,res)=>{db.members=db.members.filter(m=>m.id!==req.params.id);res.json({ok:true})})

app.get('/api/admin/leads',          adminOnly,(_req,res)=>res.json(db.leads))
app.delete('/api/admin/leads/:id',   adminOnly,(req,res)=>{db.leads=db.leads.filter(l=>l.id!==req.params.id);res.json({ok:true})})

app.get('/api/admin/offers',         adminOnly,(_req,res)=>res.json(db.offers))
app.post('/api/admin/offers',        adminOnly,(req,res)=>{const o={...req.body,id:uid()};db.offers.unshift(o);res.json(o)})
app.put('/api/admin/offers/:id',     adminOnly,(req,res)=>{db.offers=db.offers.map(o=>o.id===req.params.id?{...req.body,id:req.params.id}:o);res.json({ok:true})})
app.delete('/api/admin/offers/:id',  adminOnly,(req,res)=>{db.offers=db.offers.filter(o=>o.id!==req.params.id);res.json({ok:true})})

app.get('/api/admin/trainers',        adminOnly,(_req,res)=>res.json(db.trainers))
app.post('/api/admin/trainers',       adminOnly,(req,res)=>{const t={...req.body,id:uid()};db.trainers.push(t);res.json(t)})
app.put('/api/admin/trainers/:id',    adminOnly,(req,res)=>{db.trainers=db.trainers.map(t=>t.id===req.params.id?{...req.body,id:req.params.id}:t);res.json({ok:true})})
app.delete('/api/admin/trainers/:id', adminOnly,(req,res)=>{db.trainers=db.trainers.filter(t=>t.id!==req.params.id);res.json({ok:true})})

/* ════════════════════════════════════════════
   ADMIN — NEW: Store Management
════════════════════════════════════════════ */

/* Categories */
app.get('/api/admin/store/categories',        adminOnly,(_req,res)=>res.json(db.storeCategories.sort((a,b)=>a.order-b.order)))
app.post('/api/admin/store/categories',       adminOnly,(req,res)=>{const c={...req.body,id:uid(),order:db.storeCategories.length+1};db.storeCategories.push(c);res.json(c)})
app.put('/api/admin/store/categories/:id',    adminOnly,(req,res)=>{db.storeCategories=db.storeCategories.map(c=>c.id===req.params.id?{...req.body,id:req.params.id}:c);res.json({ok:true})})
app.delete('/api/admin/store/categories/:id', adminOnly,(req,res)=>{
  db.storeCategories=db.storeCategories.filter(c=>c.id!==req.params.id)
  db.storeSubcategories=db.storeSubcategories.filter(s=>s.categoryId!==req.params.id)
  db.storeProducts=db.storeProducts.filter(p=>p.categoryId!==req.params.id)
  res.json({ok:true})
})

/* Subcategories */
app.get('/api/admin/store/subcategories',        adminOnly,(_req,res)=>res.json(db.storeSubcategories.sort((a,b)=>a.order-b.order)))
app.post('/api/admin/store/subcategories',       adminOnly,(req,res)=>{const s={...req.body,id:uid(),order:db.storeSubcategories.filter(x=>x.categoryId===req.body.categoryId).length+1};db.storeSubcategories.push(s);res.json(s)})
app.put('/api/admin/store/subcategories/:id',    adminOnly,(req,res)=>{db.storeSubcategories=db.storeSubcategories.map(s=>s.id===req.params.id?{...req.body,id:req.params.id}:s);res.json({ok:true})})
app.delete('/api/admin/store/subcategories/:id', adminOnly,(req,res)=>{
  db.storeSubcategories=db.storeSubcategories.filter(s=>s.id!==req.params.id)
  db.storeProducts=db.storeProducts.filter(p=>p.subcategoryId!==req.params.id)
  res.json({ok:true})
})

/* Products */
app.get('/api/admin/store/products',        adminOnly,(_req,res)=>res.json(db.storeProducts))
app.post('/api/admin/store/products',       adminOnly,(req,res)=>{const p={...req.body,id:uid()};db.storeProducts.push(p);res.json(p)})
app.put('/api/admin/store/products/:id',    adminOnly,(req,res)=>{db.storeProducts=db.storeProducts.map(p=>p.id===req.params.id?{...req.body,id:req.params.id}:p);res.json({ok:true})})
app.delete('/api/admin/store/products/:id', adminOnly,(req,res)=>{db.storeProducts=db.storeProducts.filter(p=>p.id!==req.params.id);res.json({ok:true})})

/* Full admin store snapshot */
app.get('/api/admin/store', adminOnly, (_req,res)=>res.json({
  categories:    db.storeCategories.sort((a,b)=>a.order-b.order),
  subcategories: db.storeSubcategories.sort((a,b)=>a.order-b.order),
  products:      db.storeProducts,
}))

/* ════════════════════════════════════════════
   ADMIN — NEW: Exercise Management
════════════════════════════════════════════ */
app.get('/api/admin/exercises',        adminOnly,(_req,res)=>res.json(db.exercises))
app.post('/api/admin/exercises',       adminOnly,(req,res)=>{const e={...req.body,id:uid()};db.exercises.push(e);res.json(e)})
app.put('/api/admin/exercises/:id',    adminOnly,(req,res)=>{db.exercises=db.exercises.map(e=>e.id===req.params.id?{...req.body,id:req.params.id}:e);res.json({ok:true})})
app.delete('/api/admin/exercises/:id', adminOnly,(req,res)=>{db.exercises=db.exercises.filter(e=>e.id!==req.params.id);res.json({ok:true})})

app.listen(PORT, () => console.log(`✅ FFC backend on port ${PORT}`))
