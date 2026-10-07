import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { nextTick, ref } from 'vue';
import { i18n } from '@/plugins/i18n';
import { validation } from '@/plugins/validation';
import { getLangFromStorage } from '@/plugins/locale-storage';
import english from '@/locales/eng.json';
import russian from '@/locales/rus.json';
import Auth from '@/modules/auth/components/Auth.vue';
import LangSwitcher from '@/components/layout/LangSwitcher.vue';
import PendingActionPanel from '@/modules/games/components/board/PendingActionPanel.vue';
import CardDetailsModal from '@/modules/games/components/board/CardDetailsModal.vue';
import CreateGameModal from '@/modules/games/components/CreateGameModal.vue';
import { describeEffect, factionNames } from '@/modules/games/game-presentation';
import { useAuthStore } from '@/modules/auth/useAuth';
import { useCreateGame } from '@/modules/games/useCreateGame';
import { useGame } from '@/modules/games/useGame';
import { formatCreatedAt } from '@/helpers/date';
import { apiFailure, makeCard, makeGame, makeLobby } from './helpers/game-fixtures';
import { mockDialog } from './helpers/mockDialog';
import type { StarfallActionDto } from '@/api/swagger/Starfall/data-contracts';

const api = vi.hoisted(() => ({
  signin: vi.fn(),
  signup: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
  createStarfallGame: vi.fn(),
  getStarfallGame: vi.fn(),
  getStarfallLobby: vi.fn(),
  executeStarfallCommand: vi.fn()
}));
vi.mock('@/api/swagger/Auth/Auth', () => ({ useAuth: () => api }));
vi.mock('@/api/swagger/Starfall/Starfall', () => ({ useStarfall: () => api }));

let dialog: ReturnType<typeof mockDialog>;
beforeEach(() => {
  vi.resetAllMocks();
  localStorage.removeItem('lang');
  dialog = mockDialog();
});
enableAutoUnmount((unmount) =>
  afterEach(() => {
    unmount();
    dialog.restore();
    document.body.replaceChildren();
    localStorage.removeItem('lang');
  })
);

function flatten(value: Record<string, unknown>, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof child === 'string'
        ? [[path, child]]
        : Object.entries(flatten(child as Record<string, unknown>, path));
    })
  );
}
function mountAuth() {
  const pinia = createPinia();
  const store = useAuthStore(pinia);
  store.isAuthLoading = false;
  return mount(Auth, { global: { plugins: [pinia, validation] } });
}

describe('locale dictionaries', () => {
  it('has matching keys and interpolation parameters, and compiles every message in both languages', () => {
    const eng = flatten(english);
    const rus = flatten(russian);
    expect(Object.keys(rus).sort()).toEqual(Object.keys(eng).sort());
    const params = (value: string) => [...new Set([...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]))].sort();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      for (const [key, value] of Object.entries(eng)) {
        expect(params(rus[key]!)).toEqual(params(value));
        for (const locale of ['eng', 'rus'] as const) {
          i18n.global.locale.value = locale;
          const result = i18n.global.t(key, Object.fromEntries(params(value).map((name) => [name, '2'])));
          expect(result).not.toBe(key);
        }
      }
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it.each([
    [0, 'карт', 'игроков'],
    [1, 'карту', 'игрок'],
    [2, 'карты', 'игрока'],
    [5, 'карт', 'игроков'],
    [11, 'карт', 'игроков'],
    [21, 'карту', 'игрок']
  ])('uses Russian plural forms for %i', (count, cards, players) => {
    i18n.global.locale.value = 'rus';
    expect(i18n.global.t('game.effects.draw', Number(count))).toBe(`Возьмите ${count} ${cards}`);
    expect(i18n.global.t('lobby.playerCount', Number(count))).toBe(`${count} ${players}`);
  });

  it('keeps English plurals and formats dates for the chosen locale', () => {
    expect(i18n.global.t('lobby.gameCount', 0)).toBe('0 games');
    expect(i18n.global.t('lobby.gameCount', 1)).toBe('1 game');
    expect(i18n.global.t('lobby.gameCount', 2)).toBe('2 games');
    const date = '2026-10-04T12:30:00Z';
    expect(formatCreatedAt(date, 'eng')).toContain('Oct');
    expect(formatCreatedAt(date, 'rus')).toContain('окт');
    expect(formatCreatedAt('invalid', 'rus')).toBe('');
  });
});

describe('live language switching', () => {
  it('preserves the open create form and translates existing numeric validation errors', async () => {
    mount(CreateGameModal, { props: { modelValue: true }, global: { plugins: [validation] }, attachTo: document.body });
    const input = document.querySelector<HTMLInputElement>('dialog input')!;
    input.value = '8';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();
    input.dispatchEvent(new Event('blur'));
    await vi.waitFor(() => expect(document.body.textContent).toContain('Min value is 10'));
    i18n.global.locale.value = 'rus';
    await vi.waitFor(() => expect(document.body.textContent).toContain('Минимальное значение — 10'));
    expect(document.querySelector('dialog h2')?.textContent).toBe('Создание игры');
    expect(input.value).toBe('8');
    expect(api.createStarfallGame).not.toHaveBeenCalled();
  });

  it('updates both switchers and persists the chosen language', async () => {
    const first = mount(LangSwitcher);
    const second = mount(LangSwitcher);
    await first.get('button[lang="ru"]').trigger('click');
    expect(second.get('button[lang="ru"]').attributes('aria-pressed')).toBe('true');
    expect(first.attributes('aria-label')).toBe('Язык');
    expect(getLangFromStorage()).toBe('rus');
    const remounted = mount(LangSwitcher);
    expect(remounted.get('button[lang="ru"]').attributes('aria-pressed')).toBe('true');
  });

  it('preserves form values and translates only errors already shown', async () => {
    const wrapper = mountAuth();
    const email = wrapper.get('input[name="email"]');
    await email.setValue('not-an-email');
    await email.trigger('blur');
    await vi.waitFor(() => expect(wrapper.text()).toContain('This field must be a valid email'));
    await wrapper.get('button[lang="ru"]').trigger('click');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Введите корректный адрес электронной почты'));
    expect(wrapper.get('h2').text()).toBe('Войти');
    expect((email.element as HTMLInputElement).value).toBe('not-an-email');
    expect(wrapper.get('input[name="password"]').attributes('aria-invalid')).not.toBe('true');
    expect(api.signin).not.toHaveBeenCalled();
    await email.setValue('');
    await email.trigger('blur');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Заполните поле «Электронная почта»'));
    await wrapper.get('button[lang="en"]').trigger('click');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Email is required'));
  });

  it('translates an existing sign-in error without resubmitting', async () => {
    api.signin.mockRejectedValue(new Error('rejected'));
    const wrapper = mountAuth();
    await wrapper.get('input[name="email"]').setValue('pilot@example.com');
    await wrapper.get('input[name="password"]').setValue('secret');
    await wrapper.get('form').trigger('submit');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Wrong email or password'));
    await wrapper.get('button[lang="ru"]').trigger('click');
    expect(wrapper.text()).toContain('Неверная почта или пароль');
    expect(api.signin).toHaveBeenCalledOnce();
  });

  it('keeps unknown registration errors verbatim', async () => {
    api.signup.mockRejectedValue({ message: ['This username is already taken'] });
    const wrapper = mountAuth();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Sign up')!
      .trigger('click');
    await wrapper.get('input[name="email"]').setValue('pilot@example.com');
    await wrapper.get('input[name="password"]').setValue('secret');
    await wrapper.get('input[name="username"]').setValue('Pilot');
    await wrapper.get('form').trigger('submit');
    await vi.waitFor(() => expect(wrapper.text()).toContain('This username is already taken'));
    await wrapper.get('button[lang="ru"]').trigger('click');
    expect(wrapper.text()).toContain('This username is already taken');
    expect((wrapper.get('input[name="username"]').element as HTMLInputElement).value).toBe('Pilot');
    expect(api.signup).toHaveBeenCalledOnce();
  });

  it('retranslates a failed request without repeating it', async () => {
    api.createStarfallGame.mockRejectedValue(new Error('offline'));
    const state = useCreateGame();
    await state.createGame({ startingHp: 50 });
    expect(state.error.value).toBe('We couldn’t create the game. Please try again.');
    i18n.global.locale.value = 'rus';
    expect(state.error.value).toBe('Не удалось создать игру. Попробуйте снова.');
    expect(api.createStarfallGame).toHaveBeenCalledOnce();
  });

  it('preserves selected cards while translating pending choices', async () => {
    const game = makeGame();
    game.pendingAction = {
      type: 'choose_cards_to_scrap',
      playerId: '1',
      min: 1,
      max: 1,
      zones: ['player-hand']
    } as NonNullable<typeof game.pendingAction>;
    const wrapper = mount(PendingActionPanel, { props: { game, playerId: '1', disabled: false, loading: false } });
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Select card')!
      .trigger('click');
    i18n.global.locale.value = 'rus';
    await nextTick();
    expect(wrapper.text()).toContain('Выберите карты для утилизации');
    expect(wrapper.text()).toContain('Рука');
    expect(wrapper.get('button[aria-pressed="true"]').text()).toBe('Выбрано — убрать');
    expect(wrapper.emitted('action')).toBeUndefined();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Подтвердить выбор')!
      .trigger('click');
    expect(wrapper.emitted('action')?.[0]).toEqual([{ type: 'resolve_pending', payload: { cardIds: ['scout-1'] } }]);
  });

  it('translates recursive effects and open card details without changing card names', async () => {
    const effect = {
      name: 'sequence',
      actions: [
        { name: 'get_cards', value: 2 },
        { name: 'choose_one', options: [[{ name: 'plus_money', value: 3 }], [{ name: 'plus_attack', value: 4 }]] }
      ]
    } as StarfallActionDto;
    const card = makeCard({
      abilityStates: [
        { id: 'primary', kind: 'primary', action: effect, isUsed: false, isAvailable: true }
      ] as ReturnType<typeof makeCard>['abilityStates']
    });
    mount(CardDetailsModal, { props: { card, dismissible: true }, attachTo: document.body });
    expect(document.querySelector('dialog')?.textContent).toContain('Draw 2 cards');
    i18n.global.locale.value = 'rus';
    await nextTick();
    expect(describeEffect(effect)).toBe(
      'Возьмите 2 карты; затем Выберите один эффект: Получите 3 торговли ИЛИ Получите 4 боевой мощи'
    );
    expect(document.querySelector('dialog h2')?.textContent).toBe('Scout');
    expect(document.querySelector('dialog')?.textContent).toContain('Основная');
    expect(document.querySelector('dialog')?.textContent).toContain('Возьмите 2 карты');
    expect(factionNames.trades).toBe('Торговая федерация');
  });

  it('keeps server command errors verbatim and translates local HTTP errors', async () => {
    api.getStarfallLobby.mockResolvedValue(makeLobby());
    api.getStarfallGame.mockResolvedValue(makeGame());
    api.executeStarfallCommand.mockRejectedValue(apiFailure(400, 'A server-specific reason'));
    const state = useGame('game-1', ref('1'));
    try {
      await state.init();
      await state.act({ type: 'end_turn', payload: {} });
      await flushPromises();
      i18n.global.locale.value = 'rus';
      expect(state.commandError.value).toBe('A server-specific reason');
      expect(api.executeStarfallCommand).toHaveBeenCalledOnce();
      api.getStarfallGame.mockRejectedValue(apiFailure(404));
      await state.refresh();
      expect(state.error.value).toBe('Игра не найдена.');
      i18n.global.locale.value = 'eng';
      expect(state.error.value).toBe('This game could not be found.');
    } finally {
      state.clear();
    }
  });
});
