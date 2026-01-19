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
  maxWidth: '800px',
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

export const formContainer = style({
  maxWidth: '800px',
  margin: '0 auto',
  padding: vars.space.xl,
})

export const formCard = style({
  backgroundColor: vars.color.white,
  padding: vars.space.xxl,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border}`,
})
