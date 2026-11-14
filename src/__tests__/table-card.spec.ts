import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import TableCard from '@/modules/games/components/board/TableCard.vue';
import { makeCard } from './helpers/game-fixtures';

beforeEach(() => vi.useFakeTimers());
enableAutoUnmount((unmount) =>
  afterEach(() => {
    unmount();
    vi.useRealTimers();
    document.body.replaceChildren();
  })
);
const setup = () => mount(TableCard, { props: { card: makeCard() }, attachTo: document.body });
const click = async (element: Element, detail: number) => {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail }));
  await nextTick();
};

describe('table card gestures', () => {
  it('waits for a second pointer click before opening details', async () => {
    const wrapper = setup();
    await click(wrapper.element, 1);
    await vi.advanceTimersByTimeAsync(200);
    expect(wrapper.emitted('inspect')).toBeUndefined();
    expect(wrapper.emitted('activate')).toBeUndefined();
    await vi.advanceTimersByTimeAsync(150);
    expect(wrapper.emitted('inspect')).toEqual([[makeCard()]]);
    expect(wrapper.emitted('activate')).toBeUndefined();
  });

  it.each([1, 2])('activates once for two clicks with second detail %i, including touch clicks', async (detail) => {
    const wrapper = setup();
    await click(wrapper.element, 1);
    await vi.advanceTimersByTimeAsync(100);
    await wrapper.trigger('pointerdown');
    await click(wrapper.element, detail);
    wrapper.element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, detail: 2 }));
    await click(wrapper.element, 3);
    await vi.advanceTimersByTimeAsync(500);
    expect(wrapper.emitted('activate')).toEqual([[makeCard()]]);
    expect(wrapper.emitted('inspect')).toBeUndefined();
  });

  it('opens immediately for keyboard or assistive activation without a quick action', async () => {
    const wrapper = setup();
    await click(wrapper.element, 0);
    expect(wrapper.emitted('inspect')).toHaveLength(1);
    await click(wrapper.element, 0);
    await vi.advanceTimersByTimeAsync(500);
    expect(wrapper.emitted('inspect')).toHaveLength(2);
    expect(wrapper.emitted('activate')).toBeUndefined();
  });

  it.each(['blur', 'escape', 'outside', 'unmount'])('cancels delayed inspection on %s', async (reason) => {
    const wrapper = setup();
    await click(wrapper.element, 1);
    if (reason === 'blur') await wrapper.trigger('blur');
    if (reason === 'escape') await wrapper.trigger('keydown', { key: 'Escape' });
    if (reason === 'outside') document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    if (reason === 'unmount') wrapper.unmount();
    await vi.advanceTimersByTimeAsync(500);
    expect(wrapper.emitted('inspect')).toBeUndefined();
    expect(wrapper.emitted('activate')).toBeUndefined();
  });
});
