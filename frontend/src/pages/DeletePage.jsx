import React from 'react'
import { Shell, Card } from '../components/Layout'
import { deleteAccount, currentUser } from '../auth'
import { navigate } from '../router'

export default function DeletePage({ backTo='/home' }) {
  const me = currentUser()
  function doDelete(){
    if (confirm('Supprimer définitivement votre compte ?')) {
      deleteAccount()
      navigate('/login')
    }
  }
  return (
    <Shell>
      <div className="login-wrap">
        <Card title="Supprimer mon compte" footer="Cette action est irréversible.">
          <p className="mb-4">Compte: <b>{me?.name}</b></p>
          <button className="btn-danger" onClick={doDelete}>Supprimer</button>
        </Card>
      </div>
    </Shell>
  )
}