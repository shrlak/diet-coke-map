import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithApple,
  resetPassword,
} from '../services/supabase'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

type AuthMode = 'login' | 'signup' | 'forgot'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>('login')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'login') {
        const { error } = await signInWithEmail(data.email, data.password)
        if (error) throw error
        navigate('/')
      } else if (mode === 'signup') {
        const { error } = await signUpWithEmail(data.email, data.password, data.fullName)
        if (error) throw error
        setSuccess('Account created! Check your email to confirm your account.')
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(data.email)
        if (error) throw error
        setSuccess('Password reset email sent! Check your inbox.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // Redirect happens automatically via Supabase OAuth
  }

  const handleAppleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await signInWithApple()
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError(null)
    setSuccess(null)
    reset()
  }

  const title = mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'
  const subtitle =
    mode === 'login'
      ? 'Sign in to save your favorite stores'
      : mode === 'signup'
        ? 'Join to save and track your favorite Diet Coke stores'
        : 'Enter your email to receive a password reset link'

  return (
    <div className="min-h-full flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl">🥤</span>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-gray-600 text-sm">{subtitle}</p>
        </div>

        {/* Card */}
        <div className="bg-white shadow-md rounded-xl p-6">
          {/* Error / Success messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Social Login (only for login/signup modes) */}
          {mode !== 'forgot' && (
            <>
              <div className="flex flex-col gap-3 mb-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="flex items-center justify-center gap-3 w-full border border-gray-300 rounded-lg py-2.5 px-4 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>

                <button
                  onClick={handleAppleLogin}
                  disabled={loading}
                  className="flex items-center justify-center gap-3 w-full bg-black text-white rounded-lg py-2.5 px-4 font-medium hover:bg-gray-900 transition-colors disabled:opacity-60"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  Continue with Apple
                </button>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-gray-500 text-sm">or</span>
                </div>
              </div>
            </>
          )}

          {/* Email Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name (optional)
                </label>
                <input
                  {...register('fullName')}
                  type="text"
                  placeholder="Your name"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="Min. 8 characters"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
                />
                {errors.password && (
                  <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 text-white py-2.5 rounded-lg font-semibold hover:bg-red-800 transition-colors disabled:opacity-60"
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Sign In'
                  : mode === 'signup'
                    ? 'Create Account'
                    : 'Send Reset Email'}
            </button>
          </form>

          {/* Mode Links */}
          <div className="mt-4 text-center text-sm text-gray-600 space-y-2">
            {mode === 'login' && (
              <>
                <p>
                  No account?{' '}
                  <button onClick={() => switchMode('signup')} className="text-red-700 font-semibold hover:underline">
                    Sign up for free
                  </button>
                </p>
                <p>
                  <button onClick={() => switchMode('forgot')} className="text-red-700 hover:underline">
                    Forgot password?
                  </button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button onClick={() => switchMode('login')} className="text-red-700 font-semibold hover:underline">
                  Sign in
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p>
                Remember your password?{' '}
                <button onClick={() => switchMode('login')} className="text-red-700 font-semibold hover:underline">
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Back to Home */}
        <p className="text-center mt-4 text-sm">
          <Link to="/" className="text-gray-500 hover:text-gray-700">
            ← Back to Store Locator
          </Link>
        </p>
      </div>
    </div>
  )
}
