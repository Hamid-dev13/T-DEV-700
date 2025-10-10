import React, { useEffect, useMemo, useState } from 'react'
import { Shell, Card } from '../components/Layout'
import { currentUser, seedUsers } from '../auth'
import { navigate } from '../router'
import { seedTeams, myTeam, teamMembersObjects, createUserInManagerTeam, ensureManagerHasTeam, updateUserInTeam, removeUserFromManagerTeam } from '../teams'

export default function TeamManagePage({ backTo = '/manager' }) {
  const me = currentUser()
  const [refresh, setRefresh] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [editUserId, setEditUserId] = useState(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    try { seedUsers() } catch {}
    try { seedTeams() } catch {}
    if (me?.id) ensureManagerHasTeam(me.id)
  }, [])

  const team = useMemo(() => myTeam(me?.id), [me, refresh])
  const members = useMemo(() => team ? teamMembersObjects(team) : [], [team, refresh])

  if (!me || me.role !== 'manager') {
    return (
      <Shell>
        <div className="login-wrap">
          <div className="mb-4">
            <button className="btn-ghost" onClick={() => navigate(backTo)}>&larr; Retour</button>
          </div>
          <div className="glass p-6">
            <h1 className="text-2xl font-semibold mb-2">Accès réservé</h1>
            <p className="subtle">Cette page est réservée aux managers.</p>
          </div>
        </div>
      </Shell>
    )
  }

  function openCreate() { setName(''); setEmail(''); setErr(''); setMsg(''); setShowCreate(true) }
  function closeCreate() { setShowCreate(false) }
  function onCreate(e) {
    e?.preventDefault?.()
    setErr(''); setMsg('')
    try {
      const user = createUserInManagerTeam(me.id, { name, email })
      setMsg(`${user.name} a été créé et ajouté à votre équipe.`)
      setShowCreate(false)
      setRefresh(x => x + 1)
    } catch (e) {
      setErr(e?.message || 'Impossible de créer l’utilisateur')
    }
  }

  function openEdit(u) { setEditUserId(u.id); setName(u.name||''); setEmail(u.email||''); setErr(''); setMsg(''); setShowEdit(true) }
  function closeEdit() { setShowEdit(false) }
  function onEdit(e) {
    e?.preventDefault?.()
    setErr(''); setMsg('')
    try {
      const user = updateUserInTeam(me.id, editUserId, { name, email })
      setMsg(`${user.name} a été mis à jour.`)
      setShowEdit(false)
      setRefresh(x => x + 1)
    } catch (e) {
      setErr(e?.message || 'Impossible de modifier l’utilisateur')
    }
  }

  function onRemove(u) {
    if (!confirm(`Retirer ${u.name} de l’équipe ?`)) return
    try {
      removeUserFromManagerTeam(me.id, u.id)
      setMsg(`${u.name} a été retiré de votre équipe.`)
      setRefresh(x => x + 1)
    } catch (e) {
      setErr(e?.message || 'Impossible de retirer ce membre')
    }
  }

  return (
    <Shell>
      <div className="login-wrap">
        <div className="mb-4 flex items-center justify-between">
          <button className="btn-ghost" onClick={() => navigate(backTo)}>&larr; Retour</button>
          <div />
        </div>
        <div className="grid-3">
          <Card title="Mon équipe" actions={<button className="btn-ghost" onClick={openCreate}>Créer un utilisateur</button>}>
            <div className="space-y-1 text-sm">
              <p><span className="subtle">Manager:</span> {me.name}</p>
              <p><span className="subtle">Email:</span> {me.email||'—'}</p>
              <p><span className="subtle">Équipe:</span> {team?.name || '—'}</p>
              <p><span className="subtle">ID équipe:</span> {team?.id || '—'}</p>
            </div>
          </Card>

          <Card title="Membres">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Nom</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2">Rôle</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-3">{m.name}</td>
                      <td className="py-2 pr-3">{m.email||'—'}</td>
                      <td className="py-2 uppercase tracking-wide text-xs">{m.role}</td>
                      <td className="py-2">
                        <div className="flex justify-end gap-2">
                          <button className="btn-ghost" onClick={()=>openEdit(m)}>Modifier</button>
                          <button className="btn-danger" onClick={()=>onRemove(m)}>Retirer</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {members.length === 0 ? (
                    <tr><td colSpan="4" className="py-3 text-center subtle">Aucun membre pour l’instant.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Tests rapides">
            <p className="subtle mb-2">Deux équipes et deux managers sont seedés pour les tests (Alpha & Beta).</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Manager 1: <code>manager@demo.com</code> / <code>demo123</code></li>
              <li>Manager 2: <code>manager2@demo.com</code> / <code>demo123</code></li>
            </ul>
          </Card>
        </div>

        {(msg || err) ? (
          <div className={"mt-4 rounded-xl border p-3 " + (err ? "border-red-300" : "border-green-300")}>
            <p className={err ? "text-red-700" : "text-green-700"}>{err || msg}</p>
          </div>
        ) : null}
      </div>

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Créer un utilisateur</h2>
              <button className="btn-ghost" onClick={closeCreate}>Fermer</button>
            </div>
            <form onSubmit={onCreate} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Nom</label>
                <input className="w-full rounded-xl border px-3 py-2" value={name} onChange={e=>setName(e.target.value)} placeholder="Prénom Nom" />
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input type="email" className="w-full rounded-xl border px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} placeholder="prenom@exemple.com" />
              </div>
              <p className="text-xs subtle">L’utilisateur sera automatiquement rattaché à l’équipe du manager connecté.</p>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={closeCreate}>Annuler</button>
                <button type="submit" className="rounded-xl px-4 py-2 bg-black text-white">Créer</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showEdit ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Modifier l’utilisateur</h2>
              <button className="btn-ghost" onClick={closeEdit}>Fermer</button>
            </div>
            <form onSubmit={onEdit} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Nom</label>
                <input className="w-full rounded-xl border px-3 py-2" value={name} onChange={e=>setName(e.target.value)} placeholder="Prénom Nom" />
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input type="email" className="w-full rounded-xl border px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} placeholder="prenom@exemple.com" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={closeEdit}>Annuler</button>
                <button type="submit" className="rounded-xl px-4 py-2 bg-black text-white">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </Shell>
  )
}
