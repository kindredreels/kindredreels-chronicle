import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  )
}
