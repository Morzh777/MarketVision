import type { ReactNode } from 'react'
import '@/app/styles/components/EmptyState.scss'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action, 
  className = '' 
}: EmptyStateProps) => {
  return (
    <div className={`emptyState ${className}`}>
      <div className="emptyState__content">
        {icon && (
          <div className="emptyState__icon">
            {icon}
          </div>
        )}
        
        <h2 className="emptyState__title">
          {title}
        </h2>
        
        <p className="emptyState__description">
          {description}
        </p>
        
        {action && (
          <div className="emptyState__action">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
