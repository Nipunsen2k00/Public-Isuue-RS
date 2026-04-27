// src/App.jsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './Dashboard'
import Login from './Login'
import Register from './Register'
import SubmitIdea from './SubmitIdea'
import Community from './Community'
import AdminPortal from './AdminPortal'
import UserDashboard from './UserDashboard'
import ProtectedRoute from './ProtectedRoute'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/submit" element={<ProtectedRoute><SubmitIdea /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPortal /></ProtectedRoute>} />
        <Route path="/user-dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
