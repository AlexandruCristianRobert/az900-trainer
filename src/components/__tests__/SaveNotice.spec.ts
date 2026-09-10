import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import SaveNotice from '@/components/SaveNotice.vue'
import { useProgressStore } from '@/stores/progress'

describe('SaveNotice', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders nothing until a write fails, then an alert with a dismiss button', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const progress = useProgressStore()
    const wrapper = mount(SaveNotice, { global: { plugins: [pinia] } })
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)

    progress.saveFailed = true
    await nextTick()
    expect(wrapper.find('[role="alert"]').text()).toContain("Couldn't save")

    await wrapper.find('button').trigger('click')
    expect(progress.saveFailed).toBe(false)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})
