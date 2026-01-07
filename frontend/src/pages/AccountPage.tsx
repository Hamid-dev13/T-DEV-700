import React, { useState, FormEvent, useEffect } from 'react'
import { Shell, Card } from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { updateMyProfile } from '../utils/api'

export default function AccountPage() {
  useEffect(() => {
    document.title = "Compte • Time Manager"
  }, [])

  const { user, refreshUser } = useAuth()

  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [oldPassword, setOldPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [oldPasswordError, setOldPasswordError] = useState(false)
  const [newPasswordError, setNewPasswordError] = useState(false)
  const [showPasswordError, setShowPasswordError] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [passwordValidation, setPasswordValidation] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    isLongEnough: false
  })

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
    }
  }, [user])

  async function save(e: FormEvent) {
    e.preventDefault()

    if (!user?.id) return

    setOldPasswordError(false)
    setNewPasswordError(false)

    if (oldPassword && !newPassword) {
      setNewPasswordError(true)
      return
    }
    if (!oldPassword && newPassword) {
      setOldPasswordError(true)
      return
    }

    if (oldPassword) {
      const hasUpperCase = /[A-Z]/.test(newPassword)
      const hasLowerCase = /[a-z]/.test(newPassword)
      const hasNumber = /[0-9]/.test(newPassword)
      const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword)
      const isLongEnough = newPassword.length > 4

      if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar || !isLongEnough) {
        setPasswordValidation({ hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar, isLongEnough })
        setShowPasswordError(true)
        return
      }
    }

    try {
      await updateMyProfile({ firstName, lastName, email, phone, ...(oldPassword ? { old_password: oldPassword, new_password: newPassword } : {}) })
      await refreshUser()
      setShowSuccessModal(true)
      setOldPassword('')
      setNewPassword('')
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour:', err)
      const errorMsg = err.message || 'Erreur inconnue'
      setErrorMessage(errorMsg)
      setShowErrorModal(true)
    }
  }

  async function deleteAccount() {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      return
    }

    alert('Fonctionnalité de suppression à implémenter')
  }

  return (
    <div className="h-screen overflow-hidden">
      <Shell>
        {showPasswordError && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn"
            style={{ background: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setShowPasswordError(false)}
          >
            <div
              className="glass-modal rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 animate-slideIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">❌</div>
                <h3 className="text-xl font-semibold text-gray-900">Mot de passe invalide</h3>
              </div>
              <p className="text-gray-600 mb-4">Le mot de passe ne respecte pas les exigences de sécurité.</p>
              <div className="space-y-2 mb-6">
                <div className={`flex items-center gap-2 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="text-lg">{passwordValidation.hasUpperCase ? '✓' : '✗'}</span>
                  <span>Au moins une majuscule (A-Z)</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="text-lg">{passwordValidation.hasLowerCase ? '✓' : '✗'}</span>
                  <span>Au moins une minuscule (a-z)</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="text-lg">{passwordValidation.hasNumber ? '✓' : '✗'}</span>
                  <span>Au moins un chiffre (0-9)</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="text-lg">{passwordValidation.hasSpecialChar ? '✓' : '✗'}</span>
                  <span>Au moins un caractère spécial (!@#$%^&*...)</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.isLongEnough ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="text-lg">{passwordValidation.isLongEnough ? '✓' : '✗'}</span>
                  <span>Plus de 4 caractères</span>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordError(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                Compris
              </button>
            </div>
          </div>
        )}

        {showSuccessModal && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn"
            style={{ background: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setShowSuccessModal(false)}
          >
            <div
              className="glass-modal rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 animate-slideIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">✓</div>
                <h3 className="text-xl font-semibold text-gray-900">Compte mis à jour</h3>
              </div>
              <p className="text-gray-600 mb-6">Vos informations ont été enregistrées avec succès.</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                Parfait
              </button>
            </div>
          </div>
        )}

        {showErrorModal && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn"
            style={{ background: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setShowErrorModal(false)}
          >
            <div
              className="glass-modal rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 animate-slideIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">✗</div>
                <h3 className="text-xl font-semibold text-gray-900">Erreur de mise à jour</h3>
              </div>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        <div className="px-4 py-4 max-w-4xl mx-auto">
          <Card title="Modifier mon compte">
            <form onSubmit={save} className="grid-2">
              <div>
                <label className="label">Prénom</label>
                <input className="input mt-1"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={"Votre prénom"}
                />
              </div>
              <div>
                <label className="label">Nom</label>
                <input className="input mt-1"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input mt-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: prenom@exemple.com"
                />
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input className="input mt-1"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 ..."
                />
              </div>
              <hr className="col-span-2 border-gray-100 my-4" />

              <div className="flex gap-4 flex-col">
                <div>
                  <label className="label">Ancien mot de passe</label>
                  <input className={`input mt-1 ${oldPasswordError ? 'border-2 border-red-500' : ''}`}
                    type="password"
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value)
                      setOldPasswordError(false)
                    }}
                  />
                  {oldPasswordError && (
                    <div className="text-xs text-red-500 mt-1">
                      Veuillez saisir l'ancien mot de passe
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">Nouveau mot de passe</label>
                  <input className={`input mt-1 ${newPasswordError ? 'border-2 border-red-500' : ''}`}
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setNewPasswordError(false)
                    }}
                  />
                  {newPasswordError ? (
                    <div className="text-xs text-red-500 mt-1">
                      Veuillez saisir le nouveau mot de passe
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 mt-1">
                      Doit contenir : une majuscule, une minuscule, un chiffre et un caractère spécial
                    </div>
                  )}
                </div>
              </div>
              <div className="col-span-2 mt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={deleteAccount}
                  className="px-6 py-2 rounded-xl font-semibold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.1), rgba(244, 63, 94, 0.05))',
                    border: '2px solid rgba(244, 63, 94, 0.3)',
                    color: 'rgb(244 63 94)'
                  }}
                >
                  Supprimer mon compte
                </button>
                <button
                  type="submit"
                  className="btn-accent"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </Card>
        </div>
      </Shell>
    </div>
  )
}