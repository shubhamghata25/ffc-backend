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
  endDate: { type:String, default:'' },
  email:   { type:String, default:'' },
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

const attendanceSchema = new mongoose.Schema({
  _uid:      { type:String, default:uid, unique:true },
  memberId:  String,
  scanDate:  String,
  time:      String,
  memberName:String,
  phone:     String,
  plan:      String,
}, { timestamps:true })
attendanceSchema.index({ memberId:1, scanDate:1 }, { unique:true })

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
const Attendance  = mongoose.model('Attendance',   attendanceSchema)

/* ════════════════════════════════════════════
   SEED — runs once when collections are empty
════════════════════════════════════════════ */
/* ════════════════════════════════════════════
   SEED — uses updateOne + upsert:true
   This means:
   - If document with _uid exists → SKIP (never overwrite admin changes)
   - If document does not exist   → INSERT default
   Safe to run on every startup. Admin data is never lost on redeploy.
════════════════════════════════════════════ */
async function upsertOne(Model, _uid, data) {
  await Model.updateOne({ _uid }, { $setOnInsert: { _uid, ...data } }, { upsert:true })
}

async function seedIfEmpty() {
  /* Plans — only insert if _uid does not already exist */
  await upsertOne(Plan, 'plan1', { label:'Monthly',     period:'month',    price:1199, originalPrice:1199, discount:0, discountType:'percent', popular:false, active:true, features:['Full gym access','Locker facility','Diet consultation','Group classes'],                                                                     description:'Perfect for trying out our gym.',   order:1 })
  await upsertOne(Plan, 'plan2', { label:'Quarterly',   period:'3 months', price:2999, originalPrice:2999, discount:0, discountType:'percent', popular:true,  active:true, features:['Full gym access','Locker facility','Diet consultation','Group classes','1 Personal session'],                                              description:'Best value for short-term goals.',  order:2 })
  await upsertOne(Plan, 'plan3', { label:'Half Yearly', period:'6 months', price:4999, originalPrice:4999, discount:0, discountType:'percent', popular:false, active:true, features:['Full gym access','Locker facility','Diet consultation','Group classes','2 Personal sessions','Body analysis'],                          description:'Commit to 6 months and transform.', order:3 })
  await upsertOne(Plan, 'plan4', { label:'Yearly',      period:'year',     price:9999, originalPrice:9999, discount:0, discountType:'percent', popular:false, active:true, features:['Full gym access','Locker facility','Diet consultation','Group classes','5 Personal sessions','Body analysis','Priority support'], description:'Best value for serious athletes.',   order:4 })

  /* Trainers */
  await upsertOne(Trainer, 't1', { name:'Nagendra Singh', role:'Head Trainer',  exp:'8+ Years', spec:'Strength & Fat Loss',     status:'Active', photo:'' })
  await upsertOne(Trainer, 't2', { name:'Depankar Bera',  role:'Fitness Coach', exp:'5+ Years', spec:'Weight Loss & Nutrition', status:'Active', photo:'' })

  /* Store categories */
  await upsertOne(Category, 'cat1', { name:'Supplements',   image:'', order:1 })
  await upsertOne(Category, 'cat2', { name:'Gym Equipment', image:'', order:2 })
  await upsertOne(Category, 'cat3', { name:'Extra',         image:'', order:3 })

  /* Subcategories */
  await upsertOne(Subcategory, 'sub1', { categoryId:'cat1', name:'Protein',     image:'', order:1 })
  await upsertOne(Subcategory, 'sub2', { categoryId:'cat1', name:'Vitamins',    image:'', order:2 })
  await upsertOne(Subcategory, 'sub3', { categoryId:'cat1', name:'Creatine',    image:'', order:3 })
  await upsertOne(Subcategory, 'sub4', { categoryId:'cat2', name:'Dumbbells',   image:'', order:1 })
  await upsertOne(Subcategory, 'sub5', { categoryId:'cat2', name:'Resistance',  image:'', order:2 })
  await upsertOne(Subcategory, 'sub6', { categoryId:'cat3', name:'Accessories', image:'', order:1 })
  await upsertOne(Subcategory, 'sub7', { categoryId:'cat3', name:'Apparel',     image:'', order:2 })

  /* Products */
  await upsertOne(Product, 'p1', { subcategoryId:'sub1', categoryId:'cat1', name:'Whey Protein 1kg',   description:'Premium whey protein.',     price:1599, image:'', inStock:true })
  await upsertOne(Product, 'p2', { subcategoryId:'sub3', categoryId:'cat1', name:'Creatine 500g',       description:'Pure creatine.',            price:999,  image:'', inStock:true })
  await upsertOne(Product, 'p3', { subcategoryId:'sub4', categoryId:'cat2', name:'Adjustable Dumbbell', description:'5–25kg set.',              price:3499, image:'', inStock:true })
  await upsertOne(Product, 'p4', { subcategoryId:'sub5', categoryId:'cat2', name:'Resistance Band Set', description:'5-band home workout set.',  price:699,  image:'', inStock:true })
  await upsertOne(Product, 'p5', { subcategoryId:'sub6', categoryId:'cat3', name:'Gym Gloves',          description:'Anti-slip lifting gloves.', price:349,  image:'', inStock:true })

  /* Exercises */
  await upsertOne(Exercise, 'e1', { name:'Bench Press',    muscle:'Chest',     level:'Intermediate', description:'Classic chest exercise.',  ytLink:'https://www.youtube.com/watch?v=rT7DgCr-3pg', image:'' })
  await upsertOne(Exercise, 'e2', { name:'Squats',         muscle:'Legs',      level:'Beginner',     description:'King of leg exercises.',   ytLink:'https://www.youtube.com/watch?v=aclHkVaku9U', image:'' })
  await upsertOne(Exercise, 'e3', { name:'Dumbbell Curl',  muscle:'Biceps',    level:'Advanced',     description:'Isolation for biceps.',    ytLink:'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', image:'' })
  await upsertOne(Exercise, 'e4', { name:'Deadlift',       muscle:'Back',      level:'Advanced',     description:'Full-body compound lift.', ytLink:'https://www.youtube.com/watch?v=op9kVnSso6Q', image:'' })
  await upsertOne(Exercise, 'e5', { name:'Pull Ups',       muscle:'Back',      level:'Intermediate', description:'Upper body pulling.',      ytLink:'https://www.youtube.com/watch?v=eGo4IYlbE5g', image:'' })
  await upsertOne(Exercise, 'e6', { name:'Shoulder Press', muscle:'Shoulders', level:'Beginner',     description:'Overhead pressing.',       ytLink:'https://www.youtube.com/watch?v=qEwKCR5JCog', image:'' })

  /* Default offer — only if none exist */
  await upsertOne(Offer, 'o1', { status:'OFF', title:'Summer Flash Sale 💥', description:'Get 20% off on all plans!', btn:'Grab Now', link:'/pricing', poster:'' })

  /* Sample members */
  await upsertOne(Member, 'm1', { name:'Rahul Sharma',  phone:'9876543210', plan:'Monthly – ₹1199',     joined:'2026-01-15', status:'Active',   fee:'Paid'   })
  await upsertOne(Member, 'm2', { name:'Priya Yadav',   phone:'9812345670', plan:'Half Yearly – ₹4999', joined:'2025-10-01', status:'Active',   fee:'Paid'   })
  await upsertOne(Member, 'm3', { name:'Amit Kulkarni', phone:'9988776655', plan:'Quarterly – ₹2999',   joined:'2026-02-20', status:'Inactive', fee:'Unpaid' })

  /* Sample leads */
  await upsertOne(Lead, 'l1', { name:'Mohit Raut',  email:'mohit@mail.com', phone:'9911223344', message:'Interested in monthly plan', date:'2026-04-05' })
  await upsertOne(Lead, 'l2', { name:'Divya Singh', email:'divya@mail.com', phone:'9933445566', message:'Want personal training',     date:'2026-04-06' })

  console.log('✅ Seed complete — existing admin data preserved')
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
// Mailer created fresh per-send so env vars are always current
// EMAIL_PASS must be a Gmail App Password (not your login password)
// Setup: Google Account → Security → 2-Step Verification ON → App Passwords → Generate
function createMailer() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout:   10000,
    socketTimeout:     15000,
  })
}

// Brevo (formerly Sendinblue) HTTP API — FREE 300 emails/day
// Never blocked by Render. Get free key at brevo.com
// Set BREVO_API_KEY in Render env vars
async function sendViaBrevo({ to, subject, html, attachments=[] }) {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) return false

  const body = {
    sender:   { name:'Friends Fitness Club', email: process.env.EMAIL_USER || 'friendsfitnessclub18@gmail.com' },
    to:       [{ email: to }],
    subject,
    htmlContent: html,
  }

  if (attachments.length > 0) {
    body.attachment = attachments.map(a => ({
      name:    a.filename,
      content: a.content,  // base64 string
    }))
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const data = await res.json()
  if (res.ok) { console.log('✅ Email sent via Brevo to', to); return true }
  console.error('❌ Brevo error:', JSON.stringify(data))
  return false
}

// Master send function: tries Brevo first (no port blocking), falls back to Gmail SMTP
async function sendEmail({ to, subject, html, attachments=[] }) {
  // Try Brevo first if API key is set (recommended — no port issues)
  if (process.env.BREVO_API_KEY) {
    const sent = await sendViaBrevo({ to, subject, html, attachments }).catch(() => false)
    if (sent) return
  }
  // Fall back to Gmail SMTP
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const mailer = createMailer()
    await mailer.sendMail({
      from: '"Friends Fitness Club" <' + process.env.EMAIL_USER + '>',
      to, subject, html,
      attachments,
    })
    console.log('✅ Email sent via Gmail SMTP to', to)
  }
}

// SMS via Fast2SMS (free Indian SMS, no DLT needed for test mode)
// Set FAST2SMS_API_KEY in Render env vars — get free key at fast2sms.com
async function sendSMS(phone, message) {
  const apiKey = process.env.FAST2SMS_API_KEY
  if (!apiKey) { console.warn('SMS skipped: FAST2SMS_API_KEY not set'); return }
  // Normalize phone — strip +91 or 91 prefix, keep 10 digits
  const num = String(phone).replace(/^\+?91/, '').replace(/\D/g, '').slice(-10)
  if (num.length !== 10) { console.warn('SMS skipped: invalid phone', phone); return }
  try {
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { 'authorization': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route: 'q',           // transactional route
        message,
        language: 'english',
        flash: 0,
        numbers: num,
      }),
    })
    const data = await res.json()
    if (data.return) console.log('SMS sent to', num)
    else console.warn('SMS failed:', JSON.stringify(data))
  } catch(e) { console.error('SMS error:', e.message) }
}
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

/* ── Email diagnostic endpoint ── GET /api/test-email?to=you@gmail.com */
app.get('/api/test-email', async (req, res) => {
  const to = req.query.to || process.env.EMAIL_USER
  const diagnostics = {
    EMAIL_USER_set:  !!process.env.EMAIL_USER,
    EMAIL_PASS_set:  !!process.env.EMAIL_PASS,
    EMAIL_USER:      process.env.EMAIL_USER || 'NOT SET',
    sending_to:      to,
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return res.json({ success:false, diagnostics, error:'EMAIL_USER or EMAIL_PASS not set in environment variables' })
  }
  try {
    const m = createMailer()
    await m.verify()
    diagnostics.smtp_verify = 'PASSED'
    await sendEmail({
      to,
      subject: 'FFC Email Test - ' + new Date().toLocaleTimeString('en-IN'),
      html:    '<h2>Email is working!</h2><p>FFC backend can send emails successfully.</p><p>Time: ' + new Date().toISOString() + '</p>',
    })
    res.json({ success:true, diagnostics, method: process.env.BREVO_API_KEY ? 'Brevo' : 'Gmail SMTP', message: 'Test email sent to ' + to })
  } catch(e) {
    res.json({ success:false, diagnostics, error: e.message, code: e.code || '', hint:
      (e.message.includes('Invalid login') || e.message.includes('535') || e.message.includes('534'))
        ? 'Gmail App Password is wrong. Steps: 1) Go to myaccount.google.com 2) Security 3) App Passwords 4) Generate for Mail 5) Copy 16-char password 6) Update EMAIL_PASS on Render (no spaces)'
      : (e.message.includes('ECONNREFUSED') || e.message.includes('ETIMEDOUT') || e.message.includes('timeout'))
        ? 'SMTP connection timed out — port 587 may also be blocked on Render. Contact Render support or use a different email service.'
      : (e.message.includes('self signed') || e.message.includes('certificate'))
        ? 'TLS certificate error — already handled in config, redeploy and try again'
      : 'Unknown error — check full error message above'
    })
  }
})

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

  // 1. Verify Razorpay signature
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder')
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex')
  if (expected !== razorpay_signature)
    return res.status(400).json({ success:false, error:'Invalid signature' })

  // 2. Save order record
  const order = await Order.create({
    _uid:uid(), orderId:razorpay_order_id,
    paymentId:razorpay_payment_id, status:'paid', meta,
  })

  // 3. Auto-create Member from payment meta
  let newMember = null
  try {
    const { memberName, memberEmail, memberPhone, planLabel, planPeriod, planPrice } = meta || {}
    if (memberName && memberPhone) {
      const today  = new Date()
      const joined = today.toISOString().slice(0, 10)
      const DAYS   = { month:30, 'month':30, '3 months':91, '6 months':182, year:365, day:1, 'day':1 }
      const days   = DAYS[planPeriod] || 30
      const endDate = new Date(today.getTime() + days * 86400000).toISOString().slice(0, 10)
      const planStr = planLabel && planPrice ? planLabel + ' - Rs.' + planPrice : (planLabel || 'Monthly')

      newMember = await Member.create({
        _uid:uid(), name:memberName, phone:memberPhone,
        email:memberEmail || '', plan:planStr,
        joined, endDate, status:'Active', fee:'Paid',
      })
      console.log('Member auto-created:', newMember._uid, memberName)
    }
  } catch(e) { console.error('Member auto-create error:', e.message) }

  // 4a. Send SMS confirmation to member
  const memberPhone = meta?.memberPhone || ''
  if (newMember && memberPhone) {
    const smsMsg = `Welcome to Friends Fitness Club! Your ${meta.planLabel || 'membership'} is now ACTIVE. Valid till ${newMember.endDate}. Your QR attendance code has been sent to your email. Gym: +91 84848 05154`
    await sendSMS(memberPhone, smsMsg)
  }

  // 4b. Send confirmation email with QR attached
  // Runs even if member auto-create failed — email is always attempted
  const emailTo = meta?.memberEmail || ''
  console.log('Email check — to:', emailTo, '| EMAIL_USER set:', !!process.env.EMAIL_USER, '| EMAIL_PASS set:', !!process.env.EMAIL_PASS)
  if (emailTo && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const QRCode    = (await import('qrcode')).default
      const memberId  = newMember?._uid || 'guest'
      const qrPayload = JSON.stringify({ id: memberId, gym: 'FFC' })
      const qrDataUrl = await QRCode.toDataURL(qrPayload, { width:280, margin:2, color:{ dark:'#111111', light:'#ffffff' } })
      const qrBase64  = qrDataUrl.replace(/^data:image\/png;base64,/, '')

      const planDisplay  = meta.planLabel || 'Membership'
      const priceDisplay = meta.planPrice ? 'Rs.' + meta.planPrice : ''
      const endDisplay   = newMember?.endDate || ''
      const memberName   = meta.memberName || 'Member'

      console.log('Sending membership email to:', emailTo)
      await sendEmail({
        to:      emailTo,
        subject: 'Welcome to FFC! Your ' + planDisplay + ' Membership is Active',
        attachments: [{ filename:'FFC_QR_Code.png', content:qrBase64, encoding:'base64', cid:'qrcode', contentType:'image/png' }],
        html: `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#06050f;color:#f0eeff;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#7c3aed,#9c59f7);padding:32px;text-align:center;">
    <h1 style="margin:0;font-size:32px;letter-spacing:3px;color:#fff;">FFC</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:2px;">FRIENDS FITNESS CLUB</p>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#bb86fc;margin-top:0;">Welcome, ${memberName}!</h2>
    <p style="color:#b8b0d4;">Your membership is now <strong style="color:#22c55e;">active</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <tr style="border-bottom:1px solid #2a2347;"><td style="padding:10px 0;color:#6b6490;">Plan</td><td style="padding:10px 0;font-weight:600;">${planDisplay}</td></tr>
      <tr style="border-bottom:1px solid #2a2347;"><td style="padding:10px 0;color:#6b6490;">Amount Paid</td><td style="padding:10px 0;font-weight:600;color:#22c55e;">${priceDisplay}</td></tr>
      <tr style="border-bottom:1px solid #2a2347;"><td style="padding:10px 0;color:#6b6490;">Start Date</td><td style="padding:10px 0;">${newMember.joined}</td></tr>
      <tr><td style="padding:10px 0;color:#6b6490;">Valid Until</td><td style="padding:10px 0;font-weight:600;color:#f59e0b;">${endDisplay}</td></tr>
    </table>
    <div style="background:#130f24;border:1px solid #2a2347;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
      <p style="color:#bb86fc;font-weight:700;margin:0 0 12px;">Your Daily Attendance QR Code</p>
      <img src="cid:qrcode" alt="QR Code" style="width:200px;height:200px;border-radius:8px;display:block;margin:0 auto;"/>
      <p style="color:#6b6490;font-size:12px;margin:12px 0 0;">Show this QR at the gym counter every day to mark attendance. Works once per day.</p>
    </div>
    <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);border-radius:10px;padding:16px;">
      <p style="margin:0;font-size:13px;color:#b8b0d4;line-height:1.8;">
        Address: RT Complex 2nd Floor, Wardhaman Nagar, Nagpur<br/>
        Phone: +91 84848 05154<br/>
        Timings: 5:00 AM - 10:00 PM (Mon-Sat)
      </p>
    </div>
    <p style="color:#6b6490;font-size:11px;text-align:center;margin-top:20px;">Payment ID: ${razorpay_payment_id}</p>
  </div>
</div>`,
      })
      console.log('✅ Confirmation email sent successfully to', emailTo)
    } catch(e) {
      console.error('❌ EMAIL SEND FAILED:', e.message)
      console.error('❌ EMAIL ERROR CODE:', e.code || 'none')
      console.error('❌ EMAIL_USER used:', process.env.EMAIL_USER)
      if (e.message.includes('Invalid login') || e.message.includes('535') || e.message.includes('534')) {
        console.error('❌ FIX: Gmail App Password wrong → myaccount.google.com → Security → App Passwords → regenerate → update Render EMAIL_PASS')
      } else if (e.message.includes('timeout') || e.message.includes('ECONNREFUSED')) {
        console.error('❌ FIX: Render is blocking SMTP port. Use Brevo (formerly Sendinblue) instead — free 300 emails/day, no port blocking')
      }
    }
  }

  // 5. Store order confirmation — SMS + email
  const isStore = meta?.type === 'store_product' || meta?.type === 'store_cart'

  // SMS for store
  if (isStore && meta?.customerPhone) {
    const itemDesc = meta.type === 'store_cart'
      ? `cart order (Rs.${meta.totalAmount})`
      : `${meta.productName || meta.itemName} (Rs.${meta.productPrice})`
    const smsMsg = `FFC Store: Your order for ${itemDesc} is confirmed! Payment ID: ${razorpay_payment_id}. We will contact you for delivery. Call: +91 84848 05154`
    await sendSMS(meta.customerPhone, smsMsg)
  }

  if (isStore && meta?.customerEmail && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const customerName  = meta.customerName  || 'Customer'
      const customerEmail = meta.customerEmail
      const isCart        = meta.type === 'store_cart'

      let itemsHtml = ''
      if (isCart && Array.isArray(meta.items)) {
        itemsHtml = meta.items.map(i =>
          `<tr style="border-bottom:1px solid #2a2347;">
            <td style="padding:8px 0;color:#b8b0d4;">${i.name}</td>
            <td style="padding:8px 0;text-align:center;color:#b8b0d4;">x${i.qty}</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;">Rs.${(i.price * i.qty).toLocaleString()}</td>
          </tr>`
        ).join('')
        itemsHtml += `<tr><td colspan="2" style="padding:10px 0;font-weight:700;">Total</td><td style="padding:10px 0;text-align:right;font-weight:700;color:#bb86fc;">Rs.${meta.totalAmount?.toLocaleString() || ''}</td></tr>`
      } else {
        itemsHtml = `<tr><td style="padding:8px 0;color:#b8b0d4;">${meta.productName || meta.itemName}</td><td style="padding:8px 0;text-align:right;font-weight:600;" colspan="2">Rs.${meta.productPrice?.toLocaleString() || ''}</td></tr>`
      }

      await sendEmail({
        to:      customerEmail,
        subject: 'Order Confirmed! - FFC Store',
        html: `
<div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#06050f;color:#f0eeff;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#7c3aed,#9c59f7);padding:28px;text-align:center;">
    <h1 style="margin:0;font-size:28px;letter-spacing:3px;color:#fff;">FFC STORE</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Order Confirmed</p>
  </div>
  <div style="padding:28px;">
    <h2 style="color:#bb86fc;margin-top:0;">Thank you, ${customerName}!</h2>
    <p style="color:#b8b0d4;margin-bottom:20px;">Your order has been placed successfully. We'll contact you shortly to arrange delivery.</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr style="border-bottom:2px solid #2a2347;">
        <th style="padding:8px 0;text-align:left;color:#6b6490;font-size:12px;">ITEM</th>
        <th style="padding:8px 0;text-align:center;color:#6b6490;font-size:12px;">QTY</th>
        <th style="padding:8px 0;text-align:right;color:#6b6490;font-size:12px;">PRICE</th>
      </tr>
      ${itemsHtml}
    </table>
    <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);border-radius:10px;padding:14px;">
      <p style="margin:0;font-size:13px;color:#b8b0d4;line-height:1.8;">
        For queries, contact us:<br/>
        WhatsApp / Call: +91 84848 05154<br/>
        Address: RT Complex 2nd Floor, Wardhaman Nagar, Nagpur
      </p>
    </div>
    <p style="color:#6b6490;font-size:11px;text-align:center;margin-top:18px;">Payment ID: ${razorpay_payment_id}</p>
  </div>
</div>`,
      console.log('✅ Store order email sent to', customerEmail)
    } catch(e) { console.error('Store email failed:', e.message) }
  }

  // 6. Admin notification for ANY payment
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const who   = meta?.memberName || meta?.customerName || 'Unknown'
      const what  = meta?.planLabel  || meta?.productName  || meta?.description || meta?.type || 'Payment'
      const email = meta?.memberEmail || meta?.customerEmail || 'not provided'
      const phone = meta?.memberPhone || meta?.customerPhone || 'not provided'
      await sendEmail({
        to:      process.env.EMAIL_USER || 'friendsfitnessclub18@gmail.com',
        subject: 'New Payment: ' + who + ' - ' + what,
        html: `<h2>New Payment - FFC</h2>
          <p><b>Name:</b> ${who}</p>
          <p><b>Phone:</b> ${phone}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Type:</b> ${meta?.type || 'unknown'}</p>
          <p><b>Item:</b> ${what}</p>
          <p><b>Amount:</b> Rs.${meta?.planPrice || meta?.productPrice || meta?.totalAmount || meta?.amount || ''}</p>
          <p><b>Payment ID:</b> ${razorpay_payment_id}</p>
          <p><b>Member Created:</b> ${newMember ? 'Yes — ' + newMember._uid : 'N/A'}</p>`,
      })
    } catch {}
  }

  res.json({ success:true, order:toObj(order), memberCreated:!!newMember })
})

/* ════════════════════════════════════════════
   CONTACT
════════════════════════════════════════════ */
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body
  if (!name||!email||!phone||!message) return res.status(400).json({ error:'All fields required' })
  const lead = await Lead.create({ _uid:uid(), name, email, phone, message, date:new Date().toISOString().slice(0,10) })
  // SMS to admin about new lead
  await sendSMS('8484805154', `New FFC enquiry from ${name} (${phone}): ${message.slice(0,80)}`)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      await sendEmail({ to: process.env.EMAIL_USER || 'friendsfitnessclub18@gmail.com', subject:`New Lead: ${name}`, html:`<h2>New Contact - FFC</h2><p><b>Name:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Phone:</b> ${phone}</p><p><b>Message:</b> ${message}</p>` })
    } catch(e) { console.error('Contact email error:', e.message) }
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
   ADMIN — Attendance (QR scan)
════════════════════════════════════════════ */

// POST /api/admin/attendance/scan — called by QRScanner component
app.post('/api/admin/attendance/scan', adminOnly, async (req, res) => {
  try {
    const { memberId } = req.body
    if (!memberId) return res.status(400).json({ success:false, message:'Missing memberId' })

    const member = await Member.findOne({ _uid: memberId })
    if (!member) return res.json({ success:false, code:'NOT_FOUND', message:'Member not found in system.' })

    // Check membership active (use endDate field, or compute from plan + joined)
    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone:'Asia/Kolkata' })
    if (member.endDate && member.endDate < todayIST)
      return res.json({ success:false, code:'EXPIRED', memberName:member.name, message:'Membership expired on ' + member.endDate + '. Please renew.' })

    // Check already scanned today
    const already = await Attendance.findOne({ memberId, scanDate:todayIST })
    if (already)
      return res.json({ success:false, code:'ALREADY', memberName:member.name, message:'Already checked in today at ' + already.time })

    // Mark attendance
    const timeIST = new Date().toLocaleTimeString('en-IN', { timeZone:'Asia/Kolkata', hour:'2-digit', minute:'2-digit' })
    await Attendance.create({
      _uid:uid(), memberId, scanDate:todayIST, time:timeIST,
      memberName:member.name, phone:member.phone, plan:member.plan,
    })

    res.json({ success:true, code:'OK', memberName:member.name, message:'Welcome, ' + member.name + '! Attendance marked.' })
  } catch(e) {
    if (e.code === 11000) // duplicate key — race condition
      return res.json({ success:false, code:'ALREADY', message:'Already checked in today.' })
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET /api/admin/attendance/today — today's check-in log
app.get('/api/admin/attendance/today', adminOnly, async (_req, res) => {
  try {
    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone:'Asia/Kolkata' })
    const logs = await Attendance.find({ scanDate:todayIST }).sort('-createdAt')
    res.json(logs.map(a => ({ id:a._uid, memberName:a.memberName, phone:a.phone, plan:a.plan, time:a.time })))
  } catch { res.json([]) }
})

// GET /api/admin/members/expiring — members expiring within 10 days
app.get('/api/admin/members/expiring', adminOnly, async (_req, res) => {
  try {
    const todayIST    = new Date().toLocaleDateString('en-CA', { timeZone:'Asia/Kolkata' })
    const in10        = new Date(new Date().getTime() + 10 * 86400000).toLocaleDateString('en-CA', { timeZone:'Asia/Kolkata' })
    const DAYS        = { Monthly:30, Quarterly:91, 'Half Yearly':182, Yearly:365, Daily:1 }
    const allActive   = await Member.find({ status:'Active' })
    const expiring    = []

    for (const m of allActive) {
      let endStr = m.endDate || ''
      if (!endStr || !endStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const planLabel = (m.plan || '').split(/[-–]/)[0].trim()
        const days = DAYS[planLabel]
        if (!days || !m.joined) continue
        endStr = new Date(new Date(m.joined).getTime() + days * 86400000)
          .toLocaleDateString('en-CA', { timeZone:'Asia/Kolkata' })
      }
      if (endStr >= todayIST && endStr <= in10) {
        const ms = new Date(endStr) - new Date(todayIST)
        expiring.push({ id:m._uid, name:m.name, phone:m.phone, plan:m.plan, endDate:endStr, daysLeft:Math.max(0, Math.round(ms / 86400000)) })
      }
    }
    expiring.sort((a, b) => a.daysLeft - b.daysLeft)
    res.json(expiring)
  } catch(e) { res.status(500).json({ error:e.message }) }
})

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
