import 'dotenv/config'
import express      from 'express'
import cors         from 'cors'
import mongoose     from 'mongoose'
import Razorpay     from 'razorpay'
import nodemailer   from 'nodemailer'
import crypto       from 'crypto'
import bcrypt       from 'bcryptjs'
import { v2 as cloudinary } from 'cloudinary'

const app  = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: '*' }))
app.use(express.json({ limit: '15mb' }))

/* ════════════════════════════════════════════
   CLOUDINARY — permanent image storage
════════════════════════════════════════════ */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key:    process.env.CLOUDINARY_API_KEY    || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
})

/* ════════════════════════════════════════════
   ADMIN CREDENTIALS
════════════════════════════════════════════ */
const adminCreds = {
  passwordHash: process.env.ADMIN_PASSWORD_HASH
    || bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'gym@admin123', 10),
}

const uid = () => Math.random().toString(36).slice(2, 9)

/* ════════════════════════════════════════════
   MONGODB SCHEMAS
   One collection per domain object.
   mongoose handles all persistence.
════════════════════════════════════════════ */
const memberSchema = new mongoose.Schema({
  _uid:    { type:String, default:uid, unique:true },
  name:    String, phone:String, plan:String,
  joined:  String, status:String, fee:String,
}, { timestamps:true })

const leadSchema = new mongoose.Schema({
  _uid:    { type:String, default:uid, unique:true },
  name:String, email:String, phone:String, message:String, date:String,
}, { timestamps:true })

const offerSchema = new mongoose.Schema({
  _uid:        { type:String, default:uid, unique:true },
  status:      { type:String, default:'OFF' },
  title:String, description:String, btn:String, link:String, poster:String,
}, { timestamps:true })

const trainerSchema = new mongoose.Schema({
  _uid:   { type:String, default:uid, unique:true },
  name:String, role:String, exp:String, spec:String,
  status: { type:String, default:'Active' },
  photo:  { type:String, default:'' },
}, { timestamps:true })

const planSchema = new mongoose.Schema({
  _uid:         { type:String, default:uid, unique:true },
  label:String, period:String,
  price:        { type:Number, default:0 },
  originalPrice:{ type:Number, default:0 },
  discount:     { type:Number, default:0 },
  discountType: { type:String, default:'percent' },
  popular:      { type:Boolean, default:false },
  active:       { type:Boolean, default:true },
  features:     [String],
  description:  String,
  order:        { type:Number, default:0 },
}, { timestamps:true })

const categorySchema = new mongoose.Schema({
  _uid:  { type:String, default:uid, unique:true },
  name:String, image:{ type:String, default:'' }, order:{ type:Number, default:0 },
}, { timestamps:true })

const subcategorySchema = new mongoose.Schema({
  _uid:       { type:String, default:uid, unique:true },
  categoryId: String, name:String,
  image:      { type:String, default:'' }, order:{ type:Number, default:0 },
}, { timestamps:true })

const productSchema = new mongoose.Schema({
  _uid:          { type:String, default:uid, unique:true },
  subcategoryId: String, categoryId:String,
  name:String, description:String,
  price:         { type:Number, default:0 },
  image:         { type:String, default:'' },
  inStock:       { type:Boolean, default:true },
}, { timestamps:true })

const exerciseSchema = new mongoose.Schema({
  _uid:   { type:String, default:uid, unique:true },
  name:String, muscle:String, level:String,
  description:String, ytLink:String,
  image:  { type:String, default:'' },
}, { timestamps:true })

const orderSchema = new mongoose.Schema({
  _uid:      { type:String, default:uid, unique:true },
  orderId:String, paymentId:String, status:String,
  meta:      mongoose.Schema.Types.Mixed,
}, { timestamps:true })

/* Models */
const Member      = mongoose.model('Member',      memberSchema)
const Lead        = mongoose.model('Lead',         leadSchema)
const Offer       = mongoose.model('Offer',        offerSchema)
const Trainer     = mongoose.model('Trainer',      trainerSchema)
const Plan        = mongoose.model('Plan',         planSchema)
const Category    = mongoose.model('Category',     categorySchema)
const Subcategory = mongoose.model('Subcategory',  subcategorySchema)
const Product     = mongoose.model('Product',      productSchema)
const Exercise    = mongoose.model('Exercise',     exerciseSchema)
const Order       = mongoose.model('Order',        orderSchema)

/* ════════════════════════════════════════════
   SEED — runs once when collections are empty
════════════════════════════════════════════ */
async function seedIfEmpty() {
  /* Plans */
  if (await Plan.countDocuments() === 0) {
    await Plan.insertMany([
      { _uid:'plan1', label:'Monthly',     period:'month',    price:1199, originalPrice:1199, popular:false, active:true, features:['Full gym access','Locker facility','Diet consultation','Group classes'],                                                                     description:'Perfect for trying out our gym.',   order:1 },
      { _uid:'plan2', label:'Quarterly',   period:'3 months', price:2999, originalPrice:2999, popular:true,  active:true, features:['Full gym access','Locker facility','Diet consultation','Group classes','1 Personal session'],                                              description:'Best value for short-term goals.',  order:2 },
      { _uid:'plan3', label:'Half Yearly', period:'6 months', price:4999, originalPrice:4999, popular:false, active:true, features:['Full gym access','Locker facility','Diet consultation','Group classes','2 Personal sessions','Body analysis'],                          description:'Commit to 6 months and transform.', order:3 },
      { _uid:'plan4', label:'Yearly',      period:'year',     price:9999, originalPrice:9999, popular:false, active:true, features:['Full gym access','Locker facility','Diet consultation','Group classes','5 Personal sessions','Body analysis','Priority support'], description:'Best value for serious athletes.',   order:4 },
    ])
    console.log('✅ Seeded plans')
  }
  /* Trainers */
  if (await Trainer.countDocuments() === 0) {
    await Trainer.insertMany([
      { _uid:'t1', name:'Nagendra Singh', role:'Head Trainer',  exp:'8+ Years', spec:'Strength & Fat Loss',     status:'Active', photo:'' },
      { _uid:'t2', name:'Depankar Bera',  role:'Fitness Coach', exp:'5+ Years', spec:'Weight Loss & Nutrition', status:'Active', photo:'' },
    ])
    console.log('✅ Seeded trainers')
  }
  /* Categories */
  if (await Category.countDocuments() === 0) {
    await Category.insertMany([
      { _uid:'cat1', name:'Supplements',   image:'', order:1 },
      { _uid:'cat2', name:'Gym Equipment', image:'', order:2 },
      { _uid:'cat3', name:'Extra',         image:'', order:3 },
    ])
    await Subcategory.insertMany([
      { _uid:'sub1', categoryId:'cat1', name:'Protein',     image:'', order:1 },
      { _uid:'sub2', categoryId:'cat1', name:'Vitamins',    image:'', order:2 },
      { _uid:'sub3', categoryId:'cat1', name:'Creatine',    image:'', order:3 },
      { _uid:'sub4', categoryId:'cat2', name:'Dumbbells',   image:'', order:1 },
      { _uid:'sub5', categoryId:'cat2', name:'Resistance',  image:'', order:2 },
      { _uid:'sub6', categoryId:'cat3', name:'Accessories', image:'', order:1 },
      { _uid:'sub7', categoryId:'cat3', name:'Apparel',     image:'', order:2 },
    ])
    await Product.insertMany([
      { _uid:'p1', subcategoryId:'sub1', categoryId:'cat1', name:'Whey Protein 1kg',   description:'Premium whey protein.',    price:1599, image:'', inStock:true },
      { _uid:'p2', subcategoryId:'sub3', categoryId:'cat1', name:'Creatine 500g',       description:'Pure creatine.',           price:999,  image:'', inStock:true },
      { _uid:'p3', subcategoryId:'sub4', categoryId:'cat2', name:'Adjustable Dumbbell', description:'5–25kg set.',             price:3499, image:'', inStock:true },
      { _uid:'p4', subcategoryId:'sub5', categoryId:'cat2', name:'Resistance Band Set', description:'5-band home workout set.', price:699,  image:'', inStock:true },
      { _uid:'p5', subcategoryId:'sub6', categoryId:'cat3', name:'Gym Gloves',          description:'Anti-slip lifting gloves.',price:349,  image:'', inStock:true },
    ])
    console.log('✅ Seeded store')
  }
  /* Exercises */
  if (await Exercise.countDocuments() === 0) {
    await Exercise.insertMany([
      { _uid:'e1', name:'Bench Press',    muscle:'Chest',     level:'Intermediate', description:'Classic chest exercise.',  ytLink:'https://www.youtube.com/watch?v=rT7DgCr-3pg', image:'' },
      { _uid:'e2', name:'Squats',         muscle:'Legs',      level:'Beginner',     description:'King of leg exercises.',   ytLink:'https://www.youtube.com/watch?v=aclHkVaku9U', image:'' },
      { _uid:'e3', name:'Dumbbell Curl',  muscle:'Biceps',    level:'Advanced',     description:'Isolation for biceps.',    ytLink:'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', image:'' },
      { _uid:'e4', name:'Deadlift',       muscle:'Back',      level:'Advanced',     description:'Full-body compound lift.', ytLink:'https://www.youtube.com/watch?v=op9kVnSso6Q', image:'' },
      { _uid:'e5', name:'Pull Ups',       muscle:'Back',      level:'Intermediate', description:'Upper body pulling.',      ytLink:'https://www.youtube.com/watch?v=eGo4IYlbE5g', image:'' },
      { _uid:'e6', name:'Shoulder Press', muscle:'Shoulders', level:'Beginner',     description:'Overhead pressing.',       ytLink:'https://www.youtube.com/watch?v=qEwKCR5JCog', image:'' },
    ])
    console.log('✅ Seeded exercises')
  }
  /* Offer */
  if (await Offer.countDocuments() === 0) {
    await Offer.create({ _uid:'o1', status:'OFF', title:'Summer Flash Sale 💥', description:'Get 20% off on all plans!', btn:'Grab Now', link:'/pricing', poster:'' })
    console.log('✅ Seeded offer')
  }
  /* Sample members/leads */
  if (await Member.countDocuments() === 0) {
    await Member.insertMany([
      { _uid:'m1', name:'Rahul Sharma',  phone:'9876543210', plan:'Monthly – ₹1199',     joined:'2026-01-15', status:'Active',   fee:'Paid'   },
      { _uid:'m2', name:'Priya Yadav',   phone:'9812345670', plan:'Half Yearly – ₹4999', joined:'2025-10-01', status:'Active',   fee:'Paid'   },
      { _uid:'m3', name:'Amit Kulkarni', phone:'9988776655', plan:'Quarterly – ₹2999',   joined:'2026-02-20', status:'Inactive', fee:'Unpaid' },
    ])
    console.log('✅ Seeded members')
  }
  if (await Lead.countDocuments() === 0) {
    await Lead.insertMany([
      { _uid:'l1', name:'Mohit Raut',  email:'mohit@mail.com', phone:'9911223344', message:'Interested in monthly plan', date:'2026-04-05' },
      { _uid:'l2', name:'Divya Singh', email:'divya@mail.com', phone:'9933445566', message:'Want personal training',     date:'2026-04-06' },
    ])
    console.log('✅ Seeded leads')
  }
}

/* ── Helper: convert mongoose doc to plain object with id field ── */
function toObj(doc) {
  if (!doc) return null
  const o = doc.toObject ? doc.toObject() : { ...doc }
  o.id = o._uid || String(o._id)
  delete o._uid; delete o.__v
  return o
}
function toArr(docs) { return docs.map(toObj) }

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
function ytId(url) {
  if (!url) return ''
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : url
}
function effectivePrice(plan) {
  if (!plan.discount || plan.discount <= 0) return plan.originalPrice || plan.price
  if (plan.discountType === 'flat') return Math.max(0, (plan.originalPrice||plan.price) - plan.discount)
  return Math.round((plan.originalPrice||plan.price) * (1 - plan.discount / 100))
}

async function uploadToCloudinary(imageData, folder='ffc') {
  if (!imageData) return ''
  if (imageData.startsWith('https://')) return imageData
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.warn('⚠️  CLOUDINARY_CLOUD_NAME not set — returning base64')
    return imageData
  }
  const result = await cloudinary.uploader.upload(imageData, {
    folder,
    transformation:[{ quality:'auto', fetch_format:'auto' }],
  })
  return result.secure_url
}

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
})
const mailer = nodemailer.createTransport({
  service:'gmail', auth:{ user:process.env.EMAIL_USER, pass:process.env.EMAIL_PASS },
})
function adminOnly(req, res, next) {
  if (req.headers['x-admin-key'] !== (process.env.ADMIN_SECRET||'ffc-admin-secret-2026'))
    return res.status(401).json({ error:'Unauthorized' })
  next()
}

/* ════════════════════════════════════════════
   CONNECT TO MONGODB THEN START SERVER
════════════════════════════════════════════ */
async function startServer() {
  const MONGO_URI = process.env.MONGODB_URI
  if (!MONGO_URI) {
    console.error('❌ MONGODB_URI env var is not set! Add it to Render environment variables.')
    console.error('   Get a free URI from https://mongodb.com/atlas (free forever, 512MB)')
    process.exit(1)
  }
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  console.log('✅ MongoDB connected')
  await seedIfEmpty()
  app.listen(PORT, () => console.log(`✅ FFC backend on port ${PORT}`))
}

/* ════════════════════════════════════════════
   KEEP-ALIVE — pings itself every 14 min so
   Render never spins down (free tier sleeps
   after 15 min of no traffic)
════════════════════════════════════════════ */
function startKeepAlive() {
  const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
  setInterval(async () => {
    try {
      await fetch(`${url}/api/health`)
      console.log('🏓 Keep-alive ping sent')
    } catch {}
  }, 14 * 60 * 1000)   // every 14 minutes
}

/* ════════════════════════════════════════════
   PUBLIC ROUTES
════════════════════════════════════════════ */
app.get('/api/health', (_req, res) => res.json({ status:'ok', time:new Date().toISOString() }))

app.get('/api/offer', async (_req, res) => {
  try {
    const o = await Offer.findOne({ status:'ON' })
    res.json(o ? toObj(o) : { status:'OFF' })
  } catch { res.json({ status:'OFF' }) }
})

app.get('/api/trainers', async (_req, res) => {
  try { res.json(toArr(await Trainer.find({ status:{ $ne:'Inactive' } }).sort('name'))) }
  catch { res.json([]) }
})

app.get('/api/plans', async (_req, res) => {
  try {
    const plans = await Plan.find({ active:true }).sort('order')
    res.json(plans.map(p => { const o=toObj(p); return { ...o, price:effectivePrice(o) } }))
  } catch { res.json([]) }
})

app.get('/api/store', async (_req, res) => {
  try {
    const [cats, subs, prods] = await Promise.all([
      Category.find().sort('order'),
      Subcategory.find().sort('order'),
      Product.find({ inStock:true }),
    ])
    res.json({ categories:toArr(cats), subcategories:toArr(subs), products:toArr(prods) })
  } catch { res.json({ categories:[], subcategories:[], products:[] }) }
})

app.get('/api/exercises', async (_req, res) => {
  try {
    const exs = await Exercise.find()
    res.json(exs.map(e => { const o=toObj(e); return { ...o, ytId:ytId(o.ytLink) } }))
  } catch { res.json([]) }
})

app.get('/api/products', async (_req, res) => {
  try {
    const prods = await Product.find({ inStock:true })
    const cats  = await Category.find()
    const catMap = Object.fromEntries(cats.map(c => [c._uid||String(c._id), c.name]))
    res.json(prods.map(p => ({
      name:p.name, price:p.price, image:p.image, stock:10,
      category: catMap[p.categoryId] || '',
    })))
  } catch { res.json([]) }
})

/* ════════════════════════════════════════════
   IMAGE UPLOAD → Cloudinary
════════════════════════════════════════════ */
app.post('/api/upload', adminOnly, async (req, res) => {
  const { image, folder } = req.body
  if (!image) return res.status(400).json({ error:'No image provided' })
  try {
    const url = await uploadToCloudinary(image, folder||'ffc')
    res.json({ url })
  } catch(err) { res.status(500).json({ error:err.message }) }
})

/* ════════════════════════════════════════════
   ADMIN PASSWORD
════════════════════════════════════════════ */
app.post('/api/admin/verify-password', adminOnly, async (req, res) => {
  const valid = await bcrypt.compare(req.body.password||'', adminCreds.passwordHash)
  res.json({ valid })
})
app.post('/api/admin/change-password', adminOnly, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword||!newPassword) return res.status(400).json({ error:'Both fields required' })
  if (newPassword.length < 8) return res.status(400).json({ error:'Min 8 characters' })
  const valid = await bcrypt.compare(currentPassword, adminCreds.passwordHash)
  if (!valid) return res.status(401).json({ error:'Current password is incorrect' })
  adminCreds.passwordHash = await bcrypt.hash(newPassword, 12)
  res.json({ success:true })
})

/* ════════════════════════════════════════════
   PAYMENT
════════════════════════════════════════════ */
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, type, itemId, itemName } = req.body
    if (!amount||amount<1) return res.status(400).json({ error:'Invalid amount' })
    const order = await razorpay.orders.create({ amount:Math.round(amount*100), currency:'INR', notes:{type:type||'membership',itemId:itemId||'',itemName:itemName||''} })
    res.json(order)
  } catch(err) { res.status(500).json({ error:'Order creation failed' }) }
})
app.post('/api/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, meta } = req.body
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET||'placeholder').update(razorpay_order_id+'|'+razorpay_payment_id).digest('hex')
  if (expected !== razorpay_signature) return res.status(400).json({ success:false, error:'Invalid signature' })
  const order = await Order.create({ _uid:uid(), orderId:razorpay_order_id, paymentId:razorpay_payment_id, status:'paid', meta })
  res.json({ success:true, order:toObj(order) })
})

/* ════════════════════════════════════════════
   CONTACT
════════════════════════════════════════════ */
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body
  if (!name||!email||!phone||!message) return res.status(400).json({ error:'All fields required' })
  const lead = await Lead.create({ _uid:uid(), name, email, phone, message, date:new Date().toISOString().slice(0,10) })
  if (process.env.EMAIL_USER&&process.env.EMAIL_PASS) {
    try { await mailer.sendMail({ from:process.env.EMAIL_USER, to:process.env.EMAIL_USER, subject:`🏋 New Lead: ${name}`, html:`<h2>New Contact – FFC</h2><p><b>Name:</b>${name}</p><p><b>Email:</b>${email}</p><p><b>Phone:</b>${phone}</p><p><b>Message:</b>${message}</p>` }) }
    catch {}
  }
  res.json({ success:true })
})

/* ════════════════════════════════════════════
   ADMIN — Members
════════════════════════════════════════════ */
app.get('/api/admin/members',        adminOnly, async (_req,res) => { try{ res.json(toArr(await Member.find().sort('-createdAt'))) }catch{ res.json([]) } })
app.post('/api/admin/members',       adminOnly, async (req,res) => { try{ const m=await Member.create({...req.body,_uid:uid()}); res.json(toObj(m)) }catch(e){ res.status(500).json({error:e.message}) } })
app.put('/api/admin/members/:id',    adminOnly, async (req,res) => { try{ await Member.findOneAndUpdate({_uid:req.params.id},{...req.body}); res.json({ok:true}) }catch(e){ res.status(500).json({error:e.message}) } })
app.delete('/api/admin/members/:id', adminOnly, async (req,res) => { try{ await Member.findOneAndDelete({_uid:req.params.id}); res.json({ok:true}) }catch(e){ res.status(500).json({error:e.message}) } })

/* ════════════════════════════════════════════
   ADMIN — Leads
════════════════════════════════════════════ */
app.get('/api/admin/leads',          adminOnly, async (_req,res) => { try{ res.json(toArr(await Lead.find().sort('-createdAt'))) }catch{ res.json([]) } })
app.delete('/api/admin/leads/:id',   adminOnly, async (req,res) => { try{ await Lead.findOneAndDelete({_uid:req.params.id}); res.json({ok:true}) }catch(e){ res.status(500).json({error:e.message}) } })

/* ════════════════════════════════════════════
   ADMIN — Offers  (poster URL stored in MongoDB)
════════════════════════════════════════════ */
app.get('/api/admin/offers',         adminOnly, async (_req,res) => { try{ res.json(toArr(await Offer.find().sort('-createdAt'))) }catch{ res.json([]) } })
app.post('/api/admin/offers',        adminOnly, async (req,res) => { try{ const o=await Offer.create({...req.body,_uid:uid()}); res.json(toObj(o)) }catch(e){ res.status(500).json({error:e.message}) } })
app.put('/api/admin/offers/:id',     adminOnly, async (req,res) => { try{ await Offer.findOneAndUpdate({_uid:req.params.id},{...req.body}); res.json({ok:true}) }catch(e){ res.status(500).json({error:e.message}) } })
app.delete('/api/admin/offers/:id',  adminOnly, async (req,res) => { try{ await Offer.findOneAndDelete({_uid:req.params.id}); res.json({ok:true}) }catch(e){ res.status(500).json({error:e.message}) } })

/* ════════════════════════════════════════════
   ADMIN — Trainers  (photo URL stored in MongoDB)
════════════════════════════════════════════ */
app.get('/api/admin/trainers',        adminOnly, async (_req,res) => { try{ res.json(toArr(await Trainer.find().sort('name'))) }catch{ res.json([]) } })
app.post('/api/admin/trainers',       adminOnly, async (req,res) => { try{ const t=await Trainer.create({...req.body,_uid:uid()}); res.json(toObj(t)) }catch(e){ res.status(500).json({error:e.message}) } })
app.put('/api/admin/trainers/:id',    adminOnly, async (req,res) => { try{ await Trainer.findOneAndUpdate({_uid:req.params.id},{...req.body}); res.json({ok:true}) }catch(e){ res.status(500).json({error:e.message}) } })
app.delete('/api/admin/trainers/:id', adminOnly, async (req,res) => { try{ await Trainer.findOneAndDelete({_uid:req.params.id}); res.json({ok:true}) }catch(e){ res.status(500).json({error:e.message}) } })

/* ════════════════════════════════════════════
   ADMIN — Plans
════════════════════════════════════════════ */
app.get('/api/admin/plans', adminOnly, async (_req,res) => {
  try {
    const plans = await Plan.find().sort('order')
    res.json(plans.map(p => { const o=toObj(p); return { ...o, effectivePrice:effectivePrice(o) } }))
  } catch { res.json([]) }
})
app.post('/api/admin/plans', adminOnly, async (req,res) => {
  try {
    const count = await Plan.countDocuments()
    const plan  = await Plan.create({ ...req.body, _uid:uid(), order:count+1, originalPrice:Number(req.body.price)||0, price:Number(req.body.price)||0, discount:Number(req.body.discount)||0 })
    const o = toObj(plan); res.json({ ...o, effectivePrice:effectivePrice(o) })
  } catch(e) { res.status(500).json({error:e.message}) }
})
app.put('/api/admin/plans/:id', adminOnly, async (req,res) => {
  try {
    const update = { ...req.body, originalPrice:Number(req.body.price)||0, price:Number(req.body.price)||0, discount:Number(req.body.discount)||0 }
    await Plan.findOneAndUpdate({ _uid:req.params.id }, update)
    const plan = await Plan.findOne({ _uid:req.params.id })
    res.json({ ok:true, effectivePrice: plan ? effectivePrice(toObj(plan)) : 0 })
  } catch(e) { res.status(500).json({error:e.message}) }
})
app.delete('/api/admin/plans/:id', adminOnly, async (req,res) => { try{ await Plan.findOneAndDelete({_uid:req.params.id}); res.json({ok:true}) }catch(e){ res.status(500).json({error:e.message}) } })

/* ════════════════════════════════════════════
   ADMIN — Store: Categories, Subcategories, Products
   All image URLs stored permanently in MongoDB
════════════════════════════════════════════ */
app.get('/api/admin/store', adminOnly, async (_req,res) => {
  try {
    const [cats,subs,prods] = await Promise.all([Category.find().sort('order'),Subcategory.find().sort('order'),Product.find()])
    res.json({ categories:toArr(cats), subcategories:toArr(subs), products:toArr(prods) })
  } catch { res.json({categories:[],subcategories:[],products:[]}) }
})

app.get('/api/admin/store/categories',        adminOnly, async (_req,res) => { try{ res.json(toArr(await Category.find().sort('order'))) }catch{ res.json([]) } })
app.post('/api/admin/store/categories',       adminOnly, async (req,res) => { try{ const count=await Category.countDocuments(); const c=await Category.create({...req.body,_uid:uid(),order:count+1}); res.json(toObj(c)) }catch(e){ res.status(500).json({error:e.message}) } })
app.put('/api/admin/store/categories/:id',    adminOnly, async (req,res) => { try{ await Category.findOneAndUpdate({_uid:req.params.id},{...req.body}); res.json({ok:true}) }catch(e){ res.status(500).json({error:e.message}) } })
app.delete('/api/admin/store/categories/:id', adminOnly, async (req,res) => { try{ await Promise.all([Category.findOneAndDelete({_uid:req.params.id}),Subcategory.deleteMany({categoryId:req.params.id}),Product.deleteMany({categoryId:req.params.id})]); res.json({ok:true}) }catch(e){ res.status(500).json({error:e.message}) } })

app.get('/api/admin/store/subcategories',        adminOnly, async (_req,res) => { try{ res.json(toArr(await Subcategory.find().sort('order'))) }catch{ res.json([]) } })
app.post('/api/admin/store/subcategories',       adminOnly, async (req,res) => { try{ const s=await Subcategory.create({...req.body,_uid:uid()}); res.json(toObj(s)) }catch(e){ res.status(500).json({error:e.message}) } })
app.put('/api/admin/store/subcategories/:id',    adminOnly, async (req,res) => { try{ await Subcategory.findOneAndUpdate({_uid:req.params.id},{...req.body}); res.json({ok:true}) }catch(e){ res.status(500).json({error:e.message}) } })
app.delete('/api/admin/store/subcategories/:id', adminOnly, async (req,res) => { try{ await Promise.all([Subcategory.findOneAndDelete({_uid:req.params.id}),Product.deleteMany({subcategoryId:req.params.id})]); res.json({ok:true}) }catch(e){ res.status(500).json({error:e.message}) } })

app.get('/api/admin/store/products',        adminOnly, async (_req,res) => { try{ res.json(toArr(await Product.find())) }catch{ res.json([]) } })
app.post('/api/admin/store/products',       adminOnly, async (req,res) => { try{ const p=await Product.create({...req.body,_uid:uid()}); res.json(toObj(p)) }catch(e){ res.status(500).json({error:e.message}) } })
app.put('/api/admin/store/products/:id',    adminOnly, async (req,res) => { try{ await Product.findOneAndUpdate({_uid:req.params.id},{...req.body}); res.json({ok:true}) }catch(e){ res.status(500).json({error:e.message}) } })
app.delete('/api/admin/store/products/:id', adminOnly, async (req,res) => { try{ await Product.findOneAndDelete({_uid:req.params.id}); res.json({ok:true}) }catch(e){ res.status(500).json({error:e.message}) } })

/* ════════════════════════════════════════════
   ADMIN — Exercises  (image URLs in MongoDB)
════════════════════════════════════════════ */
app.get('/api/admin/exercises',        adminOnly, async (_req,res) => { try{ res.json(toArr(await Exercise.find())) }catch{ res.json([]) } })
app.post('/api/admin/exercises',       adminOnly, async (req,res) => { try{ const e=await Exercise.create({...req.body,_uid:uid()}); res.json(toObj(e)) }catch(e){ res.status(500).json({error:e.message}) } })
app.put('/api/admin/exercises/:id',    adminOnly, async (req,res) => { try{ await Exercise.findOneAndUpdate({_uid:req.params.id},{...req.body}); res.json({ok:true}) }catch(e){ res.status(500).json({error:e.message}) } })
app.delete('/api/admin/exercises/:id', adminOnly, async (req,res) => { try{ await Exercise.findOneAndDelete({_uid:req.params.id}); res.json({ok:true}) }catch(e){ res.status(500).json({error:e.message}) } })

/* ════════════════════════════════════════════
   ADMIN — Orders
════════════════════════════════════════════ */
app.get('/api/admin/orders', adminOnly, async (_req,res) => { try{ res.json(toArr(await Order.find().sort('-createdAt'))) }catch{ res.json([]) } })

/* ════════════════════════════════════════════
   START
════════════════════════════════════════════ */
startServer()
  .then(() => startKeepAlive())
  .catch(err => { console.error('❌ Startup failed:', err.message); process.exit(1) })
