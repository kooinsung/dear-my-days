import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./app/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],
  jsxFramework: 'react',
  // Useful for theme customization
  theme: {
    extend: {
      tokens: {
        colors: {
          primary: { value: '#007bff' },
          primaryLight: { value: '#e7f3ff' },
          danger: { value: '#dc3545' },
          border: { value: '#e0e0e0' },
          borderLight: { value: '#ddd' },
          text: { value: '#333' },
          background: { value: '#f5f5f5' },
        },
        spacing: {
          container: { value: '1200px' },
        },
      },
      recipes: {
        button: {
          className: 'button',
          description: 'A button component',
          base: {
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            border: 'none',
            transition: 'all 0.2s',
            textDecoration: 'none',
            display: 'inline-block',
          },
          variants: {
            variant: {
              primary: {
                backgroundColor: 'primary',
                color: 'white',
                _hover: {
                  opacity: 0.9,
                },
              },
              secondary: {
                backgroundColor: 'white',
                color: 'text',
                border: '1px solid {colors.border}',
                _hover: {
                  backgroundColor: '#f8f9fa',
                },
              },
              outline: {
                backgroundColor: 'transparent',
                color: 'primary',
                border: '1px solid {colors.primary}',
                _hover: {
                  backgroundColor: 'primaryLight',
                },
              },
            },
            size: {
              sm: {
                padding: '6px 12px',
                fontSize: '12px',
              },
              md: {
                padding: '8px 16px',
                fontSize: '14px',
              },
              lg: {
                padding: '12px 24px',
                fontSize: '16px',
              },
            },
          },
          defaultVariants: {
            variant: 'primary',
            size: 'md',
          },
        },
        input: {
          className: 'input',
          description: 'An input component',
          base: {
            width: '100%',
            padding: '12px',
            border: '1px solid {colors.borderLight}',
            borderRadius: '4px',
            fontSize: '16px',
            boxSizing: 'border-box',
            _focus: {
              outline: 'none',
              borderColor: 'primary',
            },
          },
        },
        label: {
          className: 'label',
          description: 'A label component',
          base: {
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: 'text',
          },
        },
        card: {
          className: 'card',
          description: 'A card component',
          base: {
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
          variants: {
            variant: {
              default: {
                border: '1px solid {colors.border}',
              },
              elevated: {
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              },
            },
          },
          defaultVariants: {
            variant: 'default',
          },
        },
        pageContainer: {
          className: 'pageContainer',
          description: 'A page container component',
          base: {
            maxWidth: 'container',
            margin: '0 auto',
            padding: '0 24px',
          },
        },
        formField: {
          className: 'formField',
          description: 'A form field wrapper',
          base: {
            marginBottom: '24px',
          },
        },
        categoryButton: {
          className: 'categoryButton',
          description: 'A category selection button',
          base: {
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'white',
            transition: 'all 0.2s',
          },
          variants: {
            selected: {
              true: {
                border: '2px solid {colors.primary}',
                backgroundColor: 'primaryLight',
              },
              false: {
                border: '1px solid {colors.borderLight}',
              },
            },
          },
          defaultVariants: {
            selected: false,
          },
        },
        textarea: {
          className: 'textarea',
          description: 'A textarea component',
          base: {
            width: '100%',
            padding: '12px',
            border: '1px solid {colors.borderLight}',
            borderRadius: '4px',
            fontSize: '16px',
            minHeight: '100px',
            resize: 'vertical',
            boxSizing: 'border-box',
            _focus: {
              outline: 'none',
              borderColor: 'primary',
            },
          },
        },
        eventCard: {
          className: 'eventCard',
          description: 'An event card component',
          base: {
            display: 'flex',
            gap: '16px',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'inherit',
            border: '1px solid {colors.border}',
            transition: 'box-shadow 0.2s',
            _hover: {
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            },
          },
        },
        ddayBadge: {
          className: 'ddayBadge',
          description: 'A D-day badge',
          base: {
            display: 'block',
            padding: '8px 12px',
            borderRadius: '4px',
            fontWeight: 'bold',
            color: 'white',
          },
          variants: {
            isToday: {
              true: {
                backgroundColor: 'danger',
              },
              false: {
                backgroundColor: 'primary',
              },
            },
          },
          defaultVariants: {
            isToday: false,
          },
        },
        badge: {
          className: 'badge',
          description: 'A badge component',
          base: {
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
          },
          variants: {
            variant: {
              default: {
                backgroundColor: '#f0f0f0',
                color: 'text',
              },
              light: {
                backgroundColor: '#f8f9fa',
                color: 'text',
              },
            },
          },
          defaultVariants: {
            variant: 'default',
          },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: 'styled-system',
})
