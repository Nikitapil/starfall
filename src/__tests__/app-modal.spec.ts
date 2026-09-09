import { DOMWrapper, enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import AppModal from '@/components/ui/AppModal.vue';
import { mockDialog } from './helpers/mockDialog';

let nativeDialog: ReturnType<typeof mockDialog>;
beforeEach(() => {
  nativeDialog = mockDialog();
});
enableAutoUnmount((unmount) => {
  afterEach(() => {
    unmount();
    nativeDialog.restore();
    document.body.replaceChildren();
  });
});

const mountModal = () => {
  const wrapper = mount(AppModal, {
    props: { modelValue: false, title: 'New battle', description: 'Choose your settings.' },
    slots: { default: '<input autofocus>', actions: '<button>Confirm</button>' }
  });
  return { wrapper, getDialog: () => new DOMWrapper(document.body.querySelector('dialog')!) };
};

describe('AppModal', () => {
  it('opens a native dialog, renders its title, description and slots, and restores scrolling on close', async () => {
    document.body.style.overflow = 'auto';
    const { wrapper, getDialog } = mountModal();
    expect(document.body.querySelector('dialog')).toBeNull();
    await wrapper.setProps({ modelValue: true });
    const dialog = getDialog();

    expect(nativeDialog.showModal).toHaveBeenCalledOnce();
    expect(dialog.element.open).toBe(true);
    expect(dialog.get('h2').text()).toBe('New battle');
    expect(dialog.get('p').text()).toBe('Choose your settings.');
    expect(dialog.find('input[autofocus]').exists()).toBe(true);
    expect(dialog.text()).toContain('Confirm');
    expect(document.body.style.overflow).toBe('hidden');

    await wrapper.setProps({ modelValue: false });
    expect(dialog.element.open).toBe(false);
    expect(document.body.querySelector('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('auto');
    await wrapper.setProps({ modelValue: true });
    expect(getDialog().element.open).toBe(true);
    expect(nativeDialog.showModal).toHaveBeenCalledTimes(2);
    await wrapper.setProps({ modelValue: false });
    document.body.style.overflow = '';
  });

  it('requests closing through Escape and the close button, unless not dismissible', async () => {
    const { wrapper, getDialog } = mountModal();
    await wrapper.setProps({ modelValue: true, dismissible: false });
    const dialog = getDialog();
    const cancel = new Event('cancel', { cancelable: true });
    dialog.element.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.get('button[aria-label="Close dialog"]').attributes('disabled')).toBeDefined();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    await wrapper.setProps({ dismissible: true });
    await dialog.trigger('cancel');
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
    await wrapper.setProps({ modelValue: false });
    await wrapper.setProps({ modelValue: true });
    await getDialog().get('button[aria-label="Close dialog"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[false], [false]]);
  });

  it('only dismisses backdrop clicks that also started outside the panel', async () => {
    const { wrapper, getDialog } = mountModal();
    await wrapper.setProps({ modelValue: true });
    const dialog = getDialog();
    vi.spyOn(dialog.element, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      right: 500,
      top: 100,
      bottom: 400
    } as DOMRect);
    dialog.element.dispatchEvent(new MouseEvent('pointerdown', { clientX: 200, clientY: 200 }));
    await dialog.trigger('click', { clientX: 0, clientY: 0 });
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    dialog.element.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0, clientY: 0 }));
    await dialog.trigger('click', { clientX: 0, clientY: 0 });
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
  });

  it('closes the native dialog and restores scrolling when unmounted while open', async () => {
    const { wrapper } = mountModal();
    await wrapper.setProps({ modelValue: true });
    wrapper.unmount();
    await nextTick();
    expect(nativeDialog.close).toHaveBeenCalled();
    expect(document.body.style.overflow).toBe('');
    expect(document.body.querySelector('dialog')).toBeNull();
  });
});
