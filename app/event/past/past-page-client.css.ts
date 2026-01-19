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

export const title = style({
  fontSize: vars.fontSize.lg,
  fontWeight: 'bold',
})

export const spacer = style({
  width: '60px',
})

export const filterSection = style({
  backgroundColor: vars.color.white,
  borderBottom: `1px solid ${vars.color.border}`,
})

export const filterContainer = style({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: `${vars.space.sm} ${vars.space.md}`,
})

export const filterList = style({
  display: 'flex',
  gap: vars.space.sm,
  overflowX: 'auto',
})

export const filterButton = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: '20px',
  textDecoration: 'none',
  fontSize: vars.fontSize.sm,
  whiteSpace: 'nowrap',
  fontWeight: '400',
  transition: 'all 0.2s',
})

export const filterButtonActive = style({
  backgroundColor: vars.color.primary,
  color: vars.color.white,
  border: `1px solid ${vars.color.primary}`,
})

export const filterButtonInactive = style({
  backgroundColor: vars.color.white,
  color: vars.color.textSecondary,
  border: `1px solid ${vars.color.border}`,
  ':hover': {
    borderColor: vars.color.primary,
  },
})

export const contentContainer = style({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: vars.space.xl,
})

export const emptyState = style({
  backgroundColor: vars.color.white,
  padding: '48px',
  borderRadius: vars.radius.lg,
  textAlign: 'center',
  color: vars.color.textMuted,
})

export const emptyText = style({
  fontSize: vars.fontSize.md,
})

export const eventList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xxl,
})

export const monthGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
})

export const monthTitle = style({
  fontSize: vars.fontSize.md,
  fontWeight: '600',
  color: vars.color.textSecondary,
  textAlign: 'center',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  '::before': {
    content: '',
    flex: 1,
    height: '1px',
    backgroundColor: vars.color.border,
  },
  '::after': {
    content: '',
    flex: 1,
    height: '1px',
    backgroundColor: vars.color.border,
  },
})

export const eventGrid = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
})

export const eventCard = style({
  backgroundColor: vars.color.white,
  padding: vars.space.md,
  borderRadius: vars.radius.lg,
  display: 'flex',
  gap: vars.space.md,
  alignItems: 'center',
  border: `1px solid ${vars.color.border}`,
  textDecoration: 'none',
  transition: 'all 0.2s',
  ':hover': {
    boxShadow: vars.shadow.md,
    transform: 'translateY(-2px)',
  },
})

export const daysAgoContainer = style({
  minWidth: '70px',
  textAlign: 'center',
  backgroundColor: vars.color.gray50,
  padding: `${vars.space.sm} ${vars.space.xs}`,
  borderRadius: vars.radius.md,
})

export const daysAgoLabel = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  marginBottom: '4px',
})

export const daysAgoValue = style({
  fontSize: vars.fontSize.md,
  fontWeight: 'bold',
  color: vars.color.textSecondary,
})

export const eventInfo = style({
  flex: 1,
})

export const eventHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  marginBottom: vars.space.sm,
})

export const eventIcon = style({
  fontSize: vars.fontSize.xl,
})

export const eventTitle = style({
  fontSize: vars.fontSize.md,
  fontWeight: '600',
  color: vars.color.text,
})

export const eventMeta = style({
  display: 'flex',
  gap: vars.space.sm,
  alignItems: 'center',
})

export const eventDate = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
})

export const calendarBadge = style({
  fontSize: vars.fontSize.xs,
  padding: `2px ${vars.space.sm}`,
  backgroundColor: vars.color.gray100,
  borderRadius: vars.radius.sm,
  color: vars.color.textSecondary,
})

export const categoryLabel = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
})

export const eventDaysAgo = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 'bold',
  color: vars.color.textSecondary,
})

export const eventCategory = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
})

export const arrow = style({
  color: vars.color.gray400,
  fontSize: vars.fontSize.xl,
})
