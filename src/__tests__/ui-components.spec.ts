import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';

describe('AppButton', () => {
  it('applies the selected variant and size', () => {
    const wrapper = mount(AppButton, {
      props: { variant: 'danger', size: 'lg' },
      slots: { default: 'Delete' }
    });

    expect(wrapper.classes()).toContain('bg-danger');
    expect(wrapper.classes()).toContain('min-h-12');
    expect(wrapper.text()).toContain('Delete');
  });

  it('disables the button while loading', () => {
    const wrapper = mount(AppButton, {
      props: { loading: true },
      slots: { default: 'Save' }
    });

    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.attributes('aria-busy')).toBe('true');
    expect(wrapper.find('svg').exists()).toBe(true);
  });
});

describe('AppInput', () => {
  it('connects the label, error and input accessibly', () => {
    const wrapper = mount(AppInput, {
      props: { label: 'Login', error: 'Login is required' }
    });

    const input = wrapper.get('input');
    const label = wrapper.get('label');
    const message = wrapper.get('[role="alert"]');

    expect(label.attributes('for')).toBe(input.attributes('id'));
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-describedby')).toBe(message.attributes('id'));
  });

  it('supports v-model and forwards native attributes', async () => {
    const wrapper = mount(AppInput, {
      props: {
        name: 'login',
        autocomplete: 'username'
      }
    });

    const input = wrapper.get('input');
    await input.setValue('star-pilot');

    expect(input.attributes('name')).toBe('login');
    expect(input.attributes('autocomplete')).toBe('username');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['star-pilot']);
  });

  it('applies external classes to the wrapper and inputClass to the input', () => {
    const wrapper = mount(AppInput, {
      props: { inputClass: 'font-mono' },
      attrs: { class: 'mt-4' }
    });

    expect(wrapper.classes()).toContain('mt-4');
    expect(wrapper.get('input').classes()).toContain('font-mono');
    expect(wrapper.get('input').classes()).not.toContain('mt-4');
  });

  it('shows a contrasting spinner while loading', () => {
    const wrapper = mount(AppInput, {
      props: { loading: true }
    });

    expect(wrapper.findComponent(AppSpinner).exists()).toBe(true);
    expect(wrapper.get('.text-accent').findComponent(AppSpinner).exists()).toBe(true);
    expect(wrapper.get('input').attributes('aria-busy')).toBe('true');
  });
});

describe('AppSpinner', () => {
  it('supports sizing and an accessible label', () => {
    const wrapper = mount(AppSpinner, {
      props: { size: 'lg', label: 'Loading game' }
    });

    expect(wrapper.attributes('role')).toBe('status');
    expect(wrapper.attributes('aria-label')).toBe('Loading game');
    expect(wrapper.get('svg').classes()).toContain('size-6');
  });
});
