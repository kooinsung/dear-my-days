import { style } from '@vanilla-extract/css'
import { vars } from '@/styles/theme.css'

export const pageContainer = style({
  minHeight: '100vh',
  backgroundColor: vars.color.background,
})

export const header = style({
  backgroundColor: vars.color.white,
  padding: vars.space.md,
  borderBottom: `1px solid ${vars.color.border}`,
})

export const headerContent = style({
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
})

export const backLink = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  textDecoration: 'none',
  ':hover': {
    color: vars.color.primary,
  },
})

export const yearNavigation = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
})

export const yearButton = style({
  padding: `${vars.space.xs} ${vars.space.sm}`,
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  textDecoration: 'none',
  ':hover': {
    color: vars.color.primary,
  },
})

export const yearTitle = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
  color: vars.color.text,
})

export const spacer = style({
  width: '60px',
})

export const contentContainer = style({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: vars.space.xl,
})

export const content = style({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: vars.space.xl,
})

export const monthGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: vars.space.md,
})

export const monthsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: vars.space.md,
})

export const monthCard = style({
  backgroundColor: vars.color.white,
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border}`,
  transition: 'all 0.2s',
  ':hover': {
    boxShadow: vars.shadow.md,
  },
})

export const monthName = style({
  fontSize: vars.fontSize.lg,
  fontWeight: 'bold',
  color: vars.color.text,
  marginBottom: vars.space.md,
  textAlign: 'center',
})

export const monthTitle = style({
  fontSize: vars.fontSize.lg,
  fontWeight: 'bold',
  color: vars.color.text,
  marginBottom: vars.space.md,
  textAlign: 'center',
})

export const categoryList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
})

export const categoryItem = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: vars.space.sm,
  borderRadius: vars.radius.base,
  backgroundColor: vars.color.gray50,
})

export const categoryDot = style({
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  marginRight: vars.space.sm,
})

export const eventCategories = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
})

export const categoryRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: vars.space.sm,
  borderRadius: vars.radius.base,
  backgroundColor: vars.color.gray50,
})

export const categoryLabel = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.text,
})

export const categoryCount = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 'bold',
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
  backgroundColor: vars.color.white,
})

export const emptyText = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  textAlign: 'center',
  padding: vars.space.lg,
})

export const emptyMonth = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  textAlign: 'center',
  padding: vars.space.lg,
})
