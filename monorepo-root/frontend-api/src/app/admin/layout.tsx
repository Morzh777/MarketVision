
interface Props {
  children: React.ReactNode
}

export default function AdminLayout({ children }: Props) {
  return (
    <div className="admin-layout">
      <main>{children}</main>
    </div>
  )
}