import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Rules from '@/modules/rules/pages/Rules.vue';

describe('Rules page', () => {
  it('connects every contents link to a rendered section in reading order', () => {
    const wrapper = mount(Rules, { global: { stubs: { RouterLink: RouterLinkStub } } });
    const links = wrapper.findAll('nav[aria-label="Rules sections"] a');
    const sections = wrapper.findAll('article > section');

    expect(links).toHaveLength(10);
    expect(sections.map((section) => `#${section.attributes('id')}`)).toEqual(
      links.map((link) => link.attributes('href'))
    );
    for (const section of sections) {
      expect(section.get('h2').text()).not.toBe('');
    }
  });

  it('renders nested rule content and navigation after splitting the page into components', () => {
    const wrapper = mount(Rules, { global: { stubs: { RouterLink: RouterLinkStub } } });

    expect(wrapper.findAll('#setup ol li')).toHaveLength(4);
    expect(wrapper.findAll('#cards h3').map((heading) => heading.text())).toEqual([
      'Trade',
      'Combat',
      'Authority',
      'Ships',
      'Bases'
    ]);
    expect(wrapper.findAll('#turn h3')).toHaveLength(5);
    expect(wrapper.get('#turn').text()).toContain('Discard every Ship you played');
    expect(wrapper.findAll('#abilities dt')).toHaveLength(4);
    expect(wrapper.get('#abilities').text()).toContain(
      'scrapping a card from your hand or discard pile does not activate'
    );
    expect(wrapper.findAll('#factions h3')).toHaveLength(4);
    expect(wrapper.findAll('#reference tbody tr')).toHaveLength(10);
    expect(wrapper.get('#reference').text()).toContain('8 Scouts + 2 Vipers');
    expect(wrapper.findAllComponents(RouterLinkStub).map((link) => link.props('to'))).toEqual([
      { name: 'home' },
      { name: 'games' },
      { name: 'home' }
    ]);
  });
});
