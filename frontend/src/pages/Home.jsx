import React, { useEffect } from 'react'
import { navigate } from '../router'
import { currentUser } from '../auth'

export default function Home() {
  useEffect(()=>{
    const me = currentUser()
    if (!me) { navigate('/login'); return }
    navigate(me.role === 'manager' ? '/manager/punch' : '/employee/punch')
  }, [])
  return null
}