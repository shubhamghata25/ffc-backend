import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar    from './components/Navbar.jsx'
import Footer    from './components/Footer.jsx'
import Home      from './pages/Home.jsx'
import About     from './pages/About.jsx'
import Pricing   from './pages/Pricing.jsx'
import Store     from './pages/Store.jsx'
import Contact   from './pages/Contact.jsx'
import Exercises from './pages/Exercises.jsx'
import AdminPage from './pages/AdminPage.jsx'

function Layout() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <>
      {!isAdmin && <Navbar />}
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/about"     element={<About />} />
        <Route path="/pricing"   element={<Pricing />} />
        <Route path="/store"     element={<Store />} />
        <Route path="/contact"   element={<Contact />} />
        <Route path="/exercises" element={<Exercises />} />
        <Route path="/admin"     element={<AdminPage />} />
      </Routes>
      {!isAdmin && <Footer />}
    </>
  )
}

export default function App() {
  return <Layout />
}
