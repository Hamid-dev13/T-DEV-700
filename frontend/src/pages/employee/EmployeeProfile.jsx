import React, { useState } from 'react'
import PageShell from '../../components/PageShell.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function EmployeeProfile() {
  const { user, updateProfile, deleteAccount } = useAuth()
  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || ''
  })
  const [saved, setSaved] = useState(false)

  const onSave = async () => {
    await updateProfile(form)
    setSaved(true)
    setTimeout(()=>setSaved(false), 1500)
  }
  const onDelete = async () => {
    if (confirm('Supprimer votre compte ? Cette action est définitive.')) {
      await deleteAccount()
    }
  }

  return (
    <PageShell title="Mon compte" description="Modifier ou supprimer votre compte."
      actions={<button onClick={onDelete} className="btn btn-danger">Supprimer le compte</button>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm opacity-70">Prénom</label>
          <input className="input" value={form.firstName} onChange={e=>setForm({...form, firstName: e.target.value})} />
        </div>
        <div>
          <label className="text-sm opacity-70">Nom</label>
          <input className="input" value={form.lastName} onChange={e=>setForm({...form, lastName: e.target.value})} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm opacity-70">Téléphone</label>
          <input className="input" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} />
        </div>
      </div>
      <div className="mt-4">
        <button onClick={onSave} className="btn btn-primary">Enregistrer</button>
        {saved && <span className="ml-3 opacity-80">✅ Modifications enregistrées</span>}
      </div>
    </PageShell>
  )
}
