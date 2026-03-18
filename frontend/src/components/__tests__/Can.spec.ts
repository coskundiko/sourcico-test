import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import Can from '@/components/ui/Can.vue'

function createAdmin() {
  const auth = useAuthStore()
  auth.user = {
    id: 1,
    name: 'Admin',
    email: 'admin@test.com',
    roles: ['Admin'],
    permissions: ['user.view', 'user.create', 'user.edit', 'user.delete', 'role.view', 'role.edit'],
  }
}

function createViewer() {
  const auth = useAuthStore()
  auth.user = {
    id: 3,
    name: 'Viewer',
    email: 'viewer@test.com',
    roles: ['Viewer'],
    permissions: ['user.view'],
  }
}

describe('Can component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders slot content when user has permission', () => {
    createAdmin()
    const wrapper = mount(Can, {
      props: { permission: 'user.create' },
      slots: { default: '<button>Add User</button>' },
    })
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.text()).toContain('Add User')
  })

  it('does not render slot content when user lacks permission', () => {
    createViewer()
    const wrapper = mount(Can, {
      props: { permission: 'user.create' },
      slots: { default: '<button>Add User</button>' },
    })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('renders slot content for viewer with user.view permission', () => {
    createViewer()
    const wrapper = mount(Can, {
      props: { permission: 'user.view' },
      slots: { default: '<span>Users List</span>' },
    })
    expect(wrapper.find('span').exists()).toBe(true)
  })

  it('hides roles section from viewer', () => {
    createViewer()
    const wrapper = mount(Can, {
      props: { permission: 'role.view' },
      slots: { default: '<nav>Roles</nav>' },
    })
    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('shows edit button to admin but not viewer', () => {
    createViewer()
    const viewerWrapper = mount(Can, {
      props: { permission: 'user.delete' },
      slots: { default: '<button>Delete</button>' },
    })
    expect(viewerWrapper.find('button').exists()).toBe(false)

    setActivePinia(createPinia())
    createAdmin()
    const adminWrapper = mount(Can, {
      props: { permission: 'user.delete' },
      slots: { default: '<button>Delete</button>' },
    })
    expect(adminWrapper.find('button').exists()).toBe(true)
  })
})
