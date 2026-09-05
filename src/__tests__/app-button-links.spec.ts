import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import AppButton from '@/components/ui/AppButton.vue';

describe('AppButton links', () => {
  it('renders a real route link and navigates on click', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: {} },
        { path: '/games', name: 'games', component: {} }
      ]
    });
    await router.push('/');
    const wrapper = mount(AppButton, {
      props: { to: { name: 'games' } },
      global: { plugins: [router] },
      slots: { default: 'Find a game' }
    });

    expect(wrapper.element.tagName).toBe('A');
    expect(wrapper.attributes('href')).toBe('/games');
    expect(wrapper.attributes('type')).toBeUndefined();
    await wrapper.trigger('click', { button: 0 });
    await flushPromises();
    expect(router.currentRoute.value.name).toBe('games');
  });

  it('forwards native external link attributes', () => {
    const wrapper = mount(AppButton, {
      props: { href: 'https://example.com/rules' },
      attrs: { target: '_blank', rel: 'noopener noreferrer' }
    });

    expect(wrapper.element.tagName).toBe('A');
    expect(wrapper.attributes('href')).toBe('https://example.com/rules');
    expect(wrapper.attributes('target')).toBe('_blank');
    expect(wrapper.attributes('rel')).toBe('noopener noreferrer');
  });

  it.each([
    { to: '/games', disabled: true },
    { to: '/games', loading: true },
    { href: 'https://example.com', disabled: true },
    { href: 'https://example.com', loading: true }
  ])('blocks navigation and click handlers for unavailable links: %o', async (props) => {
    const onClick = vi.fn();
    const wrapper = mount(AppButton, {
      props: { to: props.to, href: props.href, disabled: props.disabled, loading: props.loading },
      attrs: { onClick }
    });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    wrapper.element.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onClick).not.toHaveBeenCalled();
    expect(wrapper.attributes('href')).toBeUndefined();
    expect(wrapper.attributes('aria-disabled')).toBe('true');
    expect(wrapper.attributes('tabindex')).toBe('-1');
    expect(wrapper.attributes('disabled')).toBeUndefined();
  });
});
