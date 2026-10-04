import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';

import AppHeader from '@/components/layout/AppHeader.vue';
import { useAuthStore } from '@/modules/auth/useAuth';
import { i18n } from '@/plugins/i18n';

describe('AppHeader', () => {
  it('renders the game title and logs the user out', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const authStore = useAuthStore();
    const logout = vi.spyOn(authStore, 'logout').mockResolvedValue();
    const wrapper = mount(AppHeader, {
      global: { plugins: [pinia, i18n] }
    });

    expect(wrapper.text()).toContain('Starfall');
    expect(wrapper.text()).toContain('Logout');

    await wrapper.get('button[aria-label="Log out of Starfall"]').trigger('click');
    expect(logout).toHaveBeenCalledOnce();
  });
});
