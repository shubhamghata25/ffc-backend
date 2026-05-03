// ═══════════════════════════════════════════════════════════════════════════
//  KIOSK ROUTES  — Add these routes to server.js BEFORE the admin routes
//
//  These routes are PUBLIC (no JWT login needed) but secured by a
//  KIOSK_TOKEN env var — a simple shared secret just for the kiosk device.
//
//  Why separate from admin JWT?
//  - The kiosk runs 24/7 unattended. A JWT expires in 8h → would log out.
//  - A long-lived kiosk token is fine because it can ONLY scan attendance.
//    It cannot read member data, delete anything, or do admin actions.
// ═══════════════════════════════════════════════════════════════════════════

// ── Kiosk middleware: validates x-kiosk-token header ──
function kioskOnly(req, res, next) {
  const KIOSK_TOKEN = process.env.KIOSK_TOKEN
  if (!KIOSK_TOKEN) {
    // If not set, allow (dev mode) — warn in logs
    console.warn('[WARN] KIOSK_TOKEN not set — kiosk endpoints are unprotected!')
    return next()
  }
  const token = req.headers['x-kiosk-token'] || ''
  if (token !== KIOSK_TOKEN) return res.status(401).json({ error: 'Invalid kiosk token' })
  next()
}

// ── POST /api/kiosk/scan ──────────────────────────────────────────────────
// Called by KioskPage when a QR is detected.
// Returns: { success, code, memberName, message, plan }
// Codes: OK | ALREADY | EXPIRED | NOT_FOUND | ERROR
app.post('/api/kiosk/scan', kioskOnly, async (req, res) => {
  try {
    const { memberId } = req.body
    if (!memberId) return res.status(400).json({ success: false, code: 'ERROR', message: 'Missing member ID.' })

    const member = await Member.findOne({ _uid: memberId })
    if (!member) return res.json({ success: false, code: 'NOT_FOUND', message: 'Member not found. Please contact reception.' })

    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

    // Check membership expiry
    if (member.endDate && member.endDate < todayIST) {
      return res.json({
        success: false,
        code: 'EXPIRED',
        memberName: member.name,
        plan: member.plan,
        message: `Membership expired on ${member.endDate}. Please renew at reception.`,
      })
    }

    // Check already scanned today
    const already = await Attendance.findOne({ memberId, scanDate: todayIST })
    if (already) {
      return res.json({
        success: false,
        code: 'ALREADY',
        memberName: member.name,
        plan: member.plan,
        message: `Already checked in today at ${already.time}. Welcome back!`,
      })
    }

    // Mark attendance
    const timeIST = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
    await Attendance.create({
      _uid: uid(),
      memberId,
      scanDate: todayIST,
      time: timeIST,
      memberName: member.name,
      phone: member.phone,
      plan: member.plan,
    })

    // Optional: send SMS notification to member
    if (process.env.FAST2SMS_API_KEY && member.phone) {
      sendSMS(member.phone, `FFC: Hi ${member.name}! Your attendance has been marked at ${timeIST}. Have a great workout! 💪`).catch(() => {})
    }

    return res.json({
      success: true,
      code: 'OK',
      memberName: member.name,
      plan: member.plan,
      message: `Welcome, ${member.name}! Have a great workout! 💪`,
    })

  } catch (e) {
    if (e.code === 11000) {
      // Race condition: concurrent scan — treat as already checked in
      return res.json({ success: false, code: 'ALREADY', message: 'Already checked in today.' })
    }
    console.error('[ERROR] kiosk/scan:', e.message)
    return res.status(500).json({ success: false, code: 'ERROR', message: 'Server error. Try again.' })
  }
})

// ── GET /api/kiosk/today-count ────────────────────────────────────────────
// Returns how many members checked in today (for the kiosk stats bar)
app.get('/api/kiosk/today-count', kioskOnly, async (_req, res) => {
  try {
    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const count = await Attendance.countDocuments({ scanDate: todayIST })
    res.json({ count })
  } catch {
    res.json({ count: 0 })
  }
})
