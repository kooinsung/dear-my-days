import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { CategoryType } from '@/libs/supabase/database.types'

// UI 상태 타입
interface UIState {
  // 필터 상태
  selectedCategory: CategoryType | 'ALL'
  setSelectedCategory: (category: CategoryType | 'ALL') => void

  // 모달 상태
  isDeleteModalOpen: boolean
  openDeleteModal: () => void
  closeDeleteModal: () => void

  // 로딩 상태
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // 토스트 메시지
  toast: { message: string; type: 'success' | 'error' | 'info' } | null
  toastTimeoutId: NodeJS.Timeout | null
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
  hideToast: () => void

  // 사이드바 (모바일)
  isSidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // 필터 상태
        selectedCategory: 'ALL',
        setSelectedCategory: (category) => {
          set({ selectedCategory: category })
        },

        // 모달 상태
        isDeleteModalOpen: false,
        openDeleteModal: () => {
          set({ isDeleteModalOpen: true })
        },
        closeDeleteModal: () => {
          set({ isDeleteModalOpen: false })
        },

        // 로딩 상태
        isLoading: false,
        setIsLoading: (loading) => {
          set({ isLoading: loading })
        },

        // 토스트 메시지
        toast: null,
        toastTimeoutId: null,
        showToast: (message, type) => {
          const { toastTimeoutId } = get()
          if (toastTimeoutId) {
            clearTimeout(toastTimeoutId)
          }

          const newTimeoutId = setTimeout(() => {
            set({ toast: null, toastTimeoutId: null })
          }, 3000)

          set({ toast: { message, type }, toastTimeoutId: newTimeoutId })
        },
        hideToast: () => {
          const { toastTimeoutId } = get()
          if (toastTimeoutId) {
            clearTimeout(toastTimeoutId)
          }
          set({ toast: null, toastTimeoutId: null })
        },

        // 사이드바
        isSidebarOpen: false,
        toggleSidebar: () => {
          set((state) => ({ isSidebarOpen: !state.isSidebarOpen }))
        },
        closeSidebar: () => {
          set({ isSidebarOpen: false })
        },
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          selectedCategory: state.selectedCategory,
        }),
      },
    ),
    {
      name: 'UI Store',
    },
  ),
)
