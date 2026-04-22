import React from 'react'
import { Link } from 'react-router-dom'

/* SVG Social Icons — no external icon library needed */
const Icons = {
  Instagram: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  ),
  YouTube: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#06050f"/>
    </svg>
  ),
  Facebook: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  WhatsApp: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  ),
}

const SOCIAL = [
  { key:'Instagram', label:'Instagram',   url:'https://www.instagram.com/friends_fitness.club', color:'#E1306C' },
  { key:'YouTube',   label:'YouTube',     url:'https://www.youtube.com/@friendsfitnessclub',    color:'#FF0000' },
  { key:'Facebook',  label:'Facebook',    url:'https://www.facebook.com/friendsfitnessclub',    color:'#1877F2' },
  { key:'WhatsApp',  label:'WhatsApp',    url:'https://wa.me/918484805154',                     color:'#25D366' },
]

export default function Footer() {
  return (
    <footer style={{
      background:'rgba(6,5,15,0.98)',
      borderTop:'1px solid rgba(124,58,237,0.15)',
      padding:'60px 8% 28px',
      position:'relative',
      overflow:'hidden',
    }}>
      {/* decorative orb */}
      <div style={{ position:'absolute', bottom:-80, left:'10%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents:'none' }}/>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:40, marginBottom:48, position:'relative' }}>

        {/* ── Brand ── */}
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:3, marginBottom:14,
            background:'linear-gradient(135deg,#bb86fc,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            Friends Fitness Club
          </div>
          <p style={{ color:'rgba(184,176,212,0.6)', fontSize:14, lineHeight:1.8, marginBottom:18 }}>
            Your transformation begins here. Train hard, stay strong, and achieve your fitness goals with us.
          </p>
          {/* Small social icon row in brand column */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {SOCIAL.map(s => {
              const IconComp = Icons[s.key]
              return (
                <a key={s.key} href={s.url} target="_blank" rel="noreferrer" title={s.label}
                  style={{ width:34, height:34, borderRadius:'50%', background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.25)', display:'flex', alignItems:'center', justifyContent:'center', color:'#9c59f7', transition:'all .25s', textDecoration:'none' }}
                  onMouseEnter={e=>{ e.currentTarget.style.background=s.color+'33'; e.currentTarget.style.borderColor=s.color+'88'; e.currentTarget.style.color=s.color; e.currentTarget.style.transform='translateY(-3px)' }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='rgba(124,58,237,0.12)'; e.currentTarget.style.borderColor='rgba(124,58,237,0.25)'; e.currentTarget.style.color='#9c59f7'; e.currentTarget.style.transform='' }}>
                  <IconComp/>
                </a>
              )
            })}
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div>
          <h4 style={{ color:'#bb86fc', marginBottom:16, fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase' }}>Quick Links</h4>
          {[['Home','/'],['About','/about'],['Pricing','/pricing'],['Store','/store'],['Exercises','/exercises'],['Contact','/contact']].map(([label,path]) => (
            <Link key={path} to={path} style={{ display:'block', color:'rgba(184,176,212,0.6)', fontSize:14, marginBottom:9, transition:'color .2s', textDecoration:'none' }}
              onMouseEnter={e=>e.target.style.color='#bb86fc'} onMouseLeave={e=>e.target.style.color='rgba(184,176,212,0.6)'}>
              {label}
            </Link>
          ))}
        </div>

        {/* ── Contact Info ── */}
        <div>
          <h4 style={{ color:'#bb86fc', marginBottom:16, fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase' }}>Contact</h4>
          {[
            '📍 RT Complex, 2nd Floor',
            '   Wardhaman Nagar, Nagpur',
            '📞 +91 84848 05154',
            '✉️ friendsfitnessclub18@gmail.com',
            '🕐 Mon–Sat: 5:00 AM – 10:00 PM',
          ].map((t,i) => <p key={i} style={{ color:'rgba(184,176,212,0.6)', fontSize:13, marginBottom:7, lineHeight:1.6 }}>{t}</p>)}
        </div>

        {/* ── Follow Us (full social cards column) ── */}
        <div>
          <h4 style={{ color:'#bb86fc', marginBottom:20, fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase' }}>Follow Us</h4>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {SOCIAL.map(s => {
              const IconComp = Icons[s.key]
              return (
                <a key={s.key} href={s.url} target="_blank" rel="noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:12, background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.12)', color:'rgba(184,176,212,0.7)', textDecoration:'none', fontSize:14, fontWeight:500, transition:'all .25s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.background=s.color+'18'; e.currentTarget.style.borderColor=s.color+'44'; e.currentTarget.style.color=s.color; e.currentTarget.style.transform='translateX(4px)' }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='rgba(124,58,237,0.06)'; e.currentTarget.style.borderColor='rgba(124,58,237,0.12)'; e.currentTarget.style.color='rgba(184,176,212,0.7)'; e.currentTarget.style.transform='' }}>
                  <span style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <IconComp/>
                  </span>
                  {s.label}
                </a>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ borderTop:'1px solid rgba(124,58,237,0.1)', paddingTop:22, textAlign:'center', color:'rgba(107,100,144,0.8)', fontSize:13 }}>
        © {new Date().getFullYear()} Friends Fitness Club | All Rights Reserved | Nagpur, Maharashtra
      </div>
    </footer>
  )
}
