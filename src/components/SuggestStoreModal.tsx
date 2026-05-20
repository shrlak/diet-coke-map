import { useState } from 'react'
import { X, Send, MapPin } from 'lucide-react'
import { submitStore } from '../services/api'

interface SuggestStoreModalProps {
  onClose: () => void
}

const STORE_TYPES = [
  { value: 'convenience', label: 'Convenience Store' },
  { value: 'grocery', label: 'Grocery Store' },
  { value: 'gas', label: 'Gas Station' },
  { value: 'drugstore', label: 'Drugstore / Pharmacy' },
  { value: 'fast_food', label: 'Fast Food' },
  { value: 'other', label: 'Other' },
]

export default function SuggestStoreModal({ onClose }: SuggestStoreModalProps) {
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: 'PA',
    zip: '',
    store_type: '',
    submitter_email: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) {
      setError('Store name, address, and city are required.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error: apiError } = await submitStore({
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zip: form.zip.trim() || undefined,
      store_type: form.store_type || undefined,
      submitter_email: form.submitter_email.trim() || undefined,
      notes: form.notes.trim() || undefined,
    })
    setSubmitting(false)
    if (apiError) {
      setError('Failed to submit. Please try again.')
    } else {
      setSuccess(true)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[2000]" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-[2001] bg-white rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-[#E8192C]" />
            <h2 className="font-bold text-[#1A1A1A] text-lg">Suggest a Store</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="px-5 py-10 text-center">
            <p className="text-4xl mb-3">🥤</p>
            <h3 className="font-bold text-[#1A1A1A] text-lg mb-2">Thanks!</h3>
            <p className="text-gray-500 text-sm mb-6">
              Your suggestion has been submitted for review. We'll add it to the map once verified.
            </p>
            <button
              onClick={onClose}
              className="bg-[#E8192C] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#c8102e] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <p className="text-sm text-gray-500">
              Know a store that sells Diet Coke but isn't on the map? Tell us about it!
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-[#E8192C] text-sm rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Store Name <span className="text-[#E8192C]">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Wawa, Giant Eagle"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8192C] focus:ring-1 focus:ring-[#E8192C]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Street Address <span className="text-[#E8192C]">*</span>
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="e.g. 123 Main St"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8192C] focus:ring-1 focus:ring-[#E8192C]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    City <span className="text-[#E8192C]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Pittsburgh"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8192C] focus:ring-1 focus:ring-[#E8192C]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={form.zip}
                    onChange={(e) => handleChange('zip', e.target.value)}
                    placeholder="15222"
                    maxLength={5}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8192C] focus:ring-1 focus:ring-[#E8192C]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Store Type</label>
                <select
                  value={form.store_type}
                  onChange={(e) => handleChange('store_type', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8192C] bg-white"
                >
                  <option value="">Select type (optional)</option>
                  {STORE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Your Email (optional)
                </label>
                <input
                  type="email"
                  value={form.submitter_email}
                  onChange={(e) => handleChange('submitter_email', e.target.value)}
                  placeholder="We'll credit you when it's added"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8192C] focus:ring-1 focus:ring-[#E8192C]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Any extra info (products available, hours, etc.)"
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8192C] focus:ring-1 focus:ring-[#E8192C]/20 resize-none"
                />
              </div>
            </div>

            <div className="pb-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#E8192C] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#c8102e] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send size={14} />
                {submitting ? 'Submitting…' : 'Submit Suggestion'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
