import React from 'react'
import Header from '@/components/common/Header'

interface Props {
  children: React.ReactNode
}

export default function HomeLayout({ children }: Props) {
  return (
    <div className="home-layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
