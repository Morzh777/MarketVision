'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon } from '@/components/ui/Icons'
import '@/app/styles/components/CustomSelect.scss'

interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Выберите опцию',
  className = '',
  disabled = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const selectRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedOption = options.find(option => option.value === value)

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Обработка клавиатуры
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (isOpen && highlightedIndex >= 0) {
          onChange(options[highlightedIndex].value)
          setIsOpen(false)
          setHighlightedIndex(-1)
        } else {
          setIsOpen(!isOpen)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          )
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          )
        }
        break
    }
  }

  // Прокрутка к выделенному элементу
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      setHighlightedIndex(-1)
    }
  }

  return (
    <div 
      ref={selectRef}
      className={`custom-select ${className} ${isOpen ? 'custom-select--open' : ''} ${disabled ? 'custom-select--disabled' : ''}`}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
    >
      <button
        type="button"
        className="custom-select__trigger"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="custom-select__value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon 
          size={16} 
          className={`custom-select__caret ${isOpen ? 'custom-select__caret--open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="custom-select__dropdown">
          <ul 
            ref={listRef}
            className="custom-select__list"
            role="listbox"
            aria-label="Выберите опцию"
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                className={`custom-select__option ${
                  option.value === value ? 'custom-select__option--selected' : ''
                } ${
                  index === highlightedIndex ? 'custom-select__option--highlighted' : ''
                }`}
                onClick={() => handleOptionClick(option.value)}
                role="option"
                aria-selected={option.value === value}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
