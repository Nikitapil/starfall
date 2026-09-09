import { vi } from 'vitest';

// jsdom does not implement the native dialog API or the browser's focus trap.
export const mockDialog = () => {
  const prototype = HTMLDialogElement.prototype;
  const originalShow = Object.getOwnPropertyDescriptor(prototype, 'showModal');
  const originalClose = Object.getOwnPropertyDescriptor(prototype, 'close');
  const showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  const close = vi.fn(function (this: HTMLDialogElement) {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new Event('close'));
  });

  Object.defineProperties(prototype, {
    showModal: { configurable: true, value: showModal },
    close: { configurable: true, value: close }
  });

  return {
    showModal,
    close,
    restore: () => {
      if (originalShow) Object.defineProperty(prototype, 'showModal', originalShow);
      else Reflect.deleteProperty(prototype, 'showModal');
      if (originalClose) Object.defineProperty(prototype, 'close', originalClose);
      else Reflect.deleteProperty(prototype, 'close');
    }
  };
};
