
import React from 'react'
import Search from '@components/forms/Search'
import CategoryMenu from '../menu/CategoryMenu'
import HeaderClient from './HeaderClient'
import '@/app/styles/components/Header.scss'

export default function Header() {
  return (
    <header className="header">
      <div className="header__content">
        {/* Search */}
        <Search />

        {/* Controls */}
        <div className="header__controls">
          <CategoryMenu />
          <HeaderClient />
        </div>
      </div>
    </header>
  )
}