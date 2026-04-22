import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const LINKS = [
  { to:'/',          label:'Home'      },
  { to:'/about',     label:'About'     },
  { to:'/pricing',   label:'Pricing'   },
  { to:'/store',     label:'Store'     },
  { to:'/exercises', label:'Exercises' },
  { to:'/contact',   label:'Contact'   },
]

export default function Navbar() {
  const [open, setOpen]       = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname }          = useLocation()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  return (
    <>
      <style>{`
        .nav-link-item {
          color: rgba(240,238,255,0.65);
          font-weight: 500;
          font-size: 14px;
          letter-spacing: .4px;
          transition: color .2s;
          position: relative;
          padding-bottom: 4px;
          text-decoration: none;
          border-bottom: 2px solid transparent;
        }
        .nav-link-item:hover { color: #bb86fc; }
        .nav-link-item.active-link {
          color: #bb86fc;
          border-bottom-color: #7c3aed;
        }
        @media(max-width:768px){
          .nav-desktop { display:none !important; }
          .nav-ham     { display:flex !important; }
        }
      `}</style>

      <header style={{
        position:'fixed', top:0, left:0, width:'100%', zIndex:1000,
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding: scrolled ? '12px 8%' : '18px 8%',
        background: scrolled ? 'rgba(6,5,15,0.96)' : 'rgba(6,5,15,0.7)',
        backdropFilter:'blur(20px)',
        borderBottom:`1px solid ${scrolled ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.08)'}`,
        transition:'all .3s',
        boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.4)' : 'none',
      }}>
        {/* Logo */}
        <NavLink to="/" style={{
          fontFamily:"'Bebas Neue',sans-serif",
          fontSize: 26, letterSpacing: 3,
          background:'linear-gradient(135deg,#bb86fc,#7c3aed)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          backgroundClip:'text',
        }}>
          Friends Fitness Club
        </NavLink>

        {/* Desktop nav */}
        <nav className="nav-desktop" style={{ display:'flex', gap:28, alignItems:'center' }}>
          {LINKS.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to==='/'} className={({ isActive }) => `nav-link-item${isActive?' active-link':''}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Hamburger */}
        <button className="nav-ham" onClick={() => setOpen(o=>!o)}
          style={{ display:'none', flexDirection:'column', gap:5, background:'none', border:'none', cursor:'pointer', padding:4 }}>
          {[0,1,2].map(i => {
            let style = { width:26, height:3, background:'#9c59f7', borderRadius:2, transition:'all .3s' }
            if (open) {
              if (i===0) style = { ...style, transform:'rotate(45deg) translate(5px,6px)' }
              if (i===1) style = { ...style, opacity:0 }
              if (i===2) style = { ...style, transform:'rotate(-45deg) translate(5px,-6px)' }
            }
            return <span key={i} style={style}/>
          })}
        </button>
      </header>

      {/* Mobile overlay */}
      {open && <div onClick={()=>setOpen(false)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:998 }}/>}

      {/* Mobile drawer */}
      <nav style={{
        position:'fixed', top:0, right: open ? 0 : '-280px',
        width:260, height:'100vh', zIndex:999,
        background:'rgba(13,11,26,0.98)', backdropFilter:'blur(20px)',
        borderLeft:'1px solid rgba(124,58,237,0.2)',
        display:'flex', flexDirection:'column',
        paddingTop:100, gap:2,
        transition:'right .4s cubic-bezier(.4,0,.2,1)',
        boxShadow: open ? '-8px 0 40px rgba(0,0,0,.7)' : 'none',
      }}>
        {LINKS.map(l => (
          <NavLink key={l.to} to={l.to} end={l.to=='/'}
            className={({ isActive }) => `nav-link-item${isActive?' active-link':''}`}
            style={{ padding:'14px 32px', fontSize:17, borderBottom:'none', borderLeft:'3px solid transparent' }}
            onClick={()=>setOpen(false)}>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
