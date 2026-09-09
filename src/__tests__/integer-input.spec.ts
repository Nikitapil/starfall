import { enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AppInput from '@/components/ui/AppInput.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import IntegerInput from '@/components/ui/IntegerInput.vue';
import { validation } from '@/plugins/validation';

enableAutoUnmount(afterEach);

describe('IntegerInput', () => {
  it('forwards input props and attributes while enforcing integer input settings', () => {
    const wrapper = mount(IntegerInput, {
      props: { name: 'quantity', id: 'quantity', label: 'Quantity', hint: 'Choose an amount', inputClass: 'font-mono' },
      attrs: {
        class: 'mt-4',
        min: '-10',
        max: '500',
        autocomplete: 'off',
        type: 'text',
        step: '0.5',
        inputmode: 'decimal'
      }
    });
    const input = wrapper.get('input');

    expect(wrapper.findComponent(AppInput).exists()).toBe(true);
    expect(wrapper.classes()).toContain('mt-4');
    expect(input.classes()).toContain('font-mono');
    expect(input.classes()).not.toContain('mt-4');
    expect(input.attributes()).toMatchObject({
      name: 'quantity',
      id: 'quantity',
      type: 'number',
      inputmode: 'numeric',
      step: '1',
      min: '-10',
      max: '500',
      autocomplete: 'off'
    });
    expect(wrapper.get('label').text()).toBe('Quantity');
    expect(wrapper.get('label').attributes('for')).toBe('quantity');
    expect(wrapper.get('p').text()).toBe('Choose an amount');
    expect(input.attributes('aria-describedby')).toBe(wrapper.get('p').attributes('id'));
  });

  it('preserves defaults and forwards changing size, error, disabled and loading props', async () => {
    const wrapper = mount(IntegerInput, { props: { name: 'quantity' } });
    const input = wrapper.get('input');
    expect(input.classes()).toContain('min-h-11');
    expect(input.classes()).not.toContain('pl-10');
    expect(input.classes()).not.toContain('pr-10');
    expect(input.attributes('disabled')).toBeUndefined();

    await wrapper.setProps({ size: 'lg', error: 'Invalid amount', disabled: true });
    expect(input.classes()).toContain('min-h-12');
    expect(input.attributes('disabled')).toBeDefined();
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(wrapper.get('[role="alert"]').text()).toBe('Invalid amount');

    await wrapper.setProps({ error: undefined, disabled: false, loading: true });
    expect(wrapper.findComponent(AppSpinner).exists()).toBe(true);
    expect(input.attributes('aria-busy')).toBe('true');
    expect(input.attributes('disabled')).toBeDefined();
  });

  it('syncs the model in both directions, including negative integers and clearing', async () => {
    const wrapper = mount(IntegerInput, { props: { name: 'quantity', modelValue: 50 } });
    const input = wrapper.get('input');
    expect(input.element.value).toBe('50');
    await input.setValue('-25');
    expect(wrapper.emitted('update:modelValue')).toEqual([[-25]]);
    await wrapper.setProps({ modelValue: '100' });
    expect(input.element.value).toBe('100');
    await input.setValue('');
    expect(wrapper.emitted('update:modelValue')).toEqual([[-25], ['']]);
    await wrapper.setProps({ modelValue: null });
    expect(input.element.value).toBe('');
  });

  it('forwards leading and trailing slots', () => {
    const wrapper = mount(IntegerInput, {
      props: { name: 'quantity' },
      slots: { leading: '<span>Count</span>', trailing: '<button>Reset</button>' }
    });
    expect(wrapper.text()).toContain('Count');
    expect(wrapper.get('button').text()).toBe('Reset');
    expect(wrapper.get('input').classes()).toContain('pl-10');
    expect(wrapper.get('input').classes()).toContain('pr-10');
  });

  it('preserves parent event listeners alongside its own restrictions', async () => {
    const onBeforeinput = vi.fn();
    const onPaste = vi.fn();
    const onBlur = vi.fn();
    const onInput = vi.fn();
    const wrapper = mount(IntegerInput, {
      props: { name: 'quantity' },
      attrs: { onBeforeinput, onPaste, onBlur, onInput }
    });
    const input = wrapper.get('input');
    const event = new InputEvent('beforeinput', { data: '.', cancelable: true });
    input.element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(onBeforeinput).toHaveBeenCalledExactlyOnceWith(event);
    const paste = new Event('paste', { cancelable: true });
    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => '1.5' } });
    input.element.dispatchEvent(paste);
    expect(paste.defaultPrevented).toBe(true);
    expect(onPaste).toHaveBeenCalledExactlyOnceWith(paste);
    await input.setValue('25');
    await input.trigger('blur');
    expect(onInput).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it('passes validation rules and field labels to AppInput', async () => {
    const wrapper = mount(IntegerInput, {
      props: { name: 'quantity', rules: 'integer|required', validationName: 'Quantity' },
      global: { plugins: [validation] }
    });
    await wrapper.get('input').trigger('blur');
    await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('Quantity is required'));
    await wrapper.get('input').setValue('50.5');
    await wrapper.get('input').trigger('blur');
    await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('Must be a whole number'));
  });

  it.each(['.', ',', 'e', 'E', '50.5', '50,5', '5e-1'])('prevents inserting %s into an integer field', async (data) => {
    const wrapper = mount(IntegerInput, { props: { name: 'quantity', modelValue: 50 } });
    const event = new InputEvent('beforeinput', { data, inputType: 'insertText', cancelable: true });
    wrapper.get('input').element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(wrapper.get('input').element.value).toBe('50');
  });

  it.each(['5', '100', null])('allows integer input and deletion: %s', async (data) => {
    const wrapper = mount(IntegerInput, { props: { name: 'quantity', modelValue: 50 } });
    const event = new InputEvent('beforeinput', {
      data,
      inputType: data === null ? 'deleteContentBackward' : 'insertText',
      cancelable: true
    });
    wrapper.get('input').element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it.each([
    ['50.5', true],
    ['50,5', true],
    ['5e-1', true],
    ['75', false]
  ] as const)('checks pasted values %s without rounding it', async (text, prevented) => {
    const wrapper = mount(IntegerInput, { props: { name: 'quantity', modelValue: 50 } });
    const event = new Event('paste', { cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } });
    wrapper.get('input').element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(prevented);
  });
});
