'use client'

import { ReactNode, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
  helperText?: string
}

export default function Input({
  label,
  error,
  icon,
  helperText,
  className = '',
  type,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false)
  
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-secondary)] mb-3 ml-2">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-accent)] transition-colors z-10">
            {icon}
          </div>
        )}
        
        <input
          type={inputType}
          className={`w-full px-6 py-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/20 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]/40 text-sm font-medium transition-all ${
            icon ? 'pl-12' : ''
          } ${isPassword ? 'pr-12' : ''} ${
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''
          } ${className} autofill-fix`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors p-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-widest ml-4">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest ml-4 opacity-50">{helperText}</p>
      )}

      <style jsx>{`
        .autofill-fix:-webkit-autofill,
        .autofill-fix:-webkit-autofill:hover,
        .autofill-fix:-webkit-autofill:focus {
          -webkit-text-fill-color: var(--color-text-primary);
          -webkit-box-shadow: 0 0 0px 1000px var(--color-bg-secondary) inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  )
}
