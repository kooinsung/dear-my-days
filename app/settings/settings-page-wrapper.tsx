'use client'

export function SettingsPageWrapper({
  pageId,
  children,
}: {
  pageId: string
  children: React.ReactNode
}) {
  return <>{children}</>
}
