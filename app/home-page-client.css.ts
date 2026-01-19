import { style } from '@vanilla-extract/css'
import { vars } from '@/styles/theme.css'

export const pageContainer = style({
  minHeight: '100vh',
  backgroundColor: vars.color.background,
})

export const header = style({
  backgroundColor: vars.color.white,
  padding: vars.space.lg,
  borderBottom: `1px solid ${vars.color.border}`,
})

export const headerContent = style({
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
})

export const logo = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
  color: vars.color.text,
})

export const headerButtons = style({
  display: 'flex',
  gap: vars.space.md,
})

export const addButton = style({
  padding: `${vars.space.sm} ${vars.space.lg}`,
  backgroundColor: vars.color.primary,
  color: vars.color.white,
  borderRadius: vars.radius.base,
  textDecoration: 'none',
  fontSize: vars.fontSize.base,
  fontWeight: '600',
  transition: 'background-color 0.2s',

  ':hover': {
    backgroundColor: vars.color.primaryHover,
  },
})

export const calendarButton = style({
  padding: `${vars.space.sm} ${vars.space.lg}`,
  backgroundColor: vars.color.gray100,
  borderRadius: vars.radius.base,
  textDecoration: 'none',
  color: vars.color.gray600,
  fontSize: vars.fontSize.base,
  transition: 'background-color 0.2s',

  ':hover': {
    backgroundColor: vars.color.gray200,
  },
})

export const content = style({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: vars.space.xl,
})
