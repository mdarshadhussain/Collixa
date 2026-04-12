import { ReactNode } from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: ReactNode
}

export default function Textarea({
  label,
  error,
  helperText,
  icon,
  className = '',
  ...props
}: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-3 text-gray-400">
            {icon}
          </div>
        )}
        <textarea
          className={`w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-sage-light focus:ring-1 focus:ring-sage-light bg-white text-gray-900 placeholder-gray-400 ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-red-300' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
}
