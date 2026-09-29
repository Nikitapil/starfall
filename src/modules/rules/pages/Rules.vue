<script setup lang="ts">
import AppPageHeader from '@/components/layout/AppPageHeader.vue';
import AppCard from '@/components/ui/AppCard.vue';
import RuleSection from '../components/RuleSection.vue';
import RuleList from '../components/RuleList.vue';
import RuleInfoCard from '../components/RuleInfoCard.vue';
import RuleFactionCard from '../components/RuleFactionCard.vue';
import { rulesSections } from '../rules-sections';
import RulesTurn from '../components/sections/RulesTurn.vue';
import RulesAbilities from '../components/sections/RulesAbilities.vue';
import RulesReference from '../components/sections/RulesReference.vue';
const sections = Object.values(rulesSections);
</script>

<template>
  <div class="w-full pb-24 pt-12 sm:pt-16">
    <AppPageHeader
      eyebrow="Starfall manual"
      title="Rules of starfall"
      description="Everything you need to command a fleet: setup, turn structure, card abilities, combat, and the edge cases that matter when a battle comes down to a single point of Authority."
    />
    <div class="mt-10 grid gap-12 lg:grid-cols-[13rem_minmax(0,48rem)] lg:items-start">
      <aside class="lg:sticky lg:top-24">
        <p class="mb-3 font-mono text-xs uppercase text-ink-faint">On this page</p>
        <nav aria-label="Rules sections">
          <ol class="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
            <li
              v-for="section in sections"
              :key="section.id"
            >
              <a
                :href="`#${section.id}`"
                class="flex items-center gap-2 rounded-control px-2 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
              >
                <span class="font-mono text-[0.65rem] text-ink-faint">{{ section.number }}</span>
                {{ section.label }}
              </a>
            </li>
          </ol>
        </nav>
      </aside>
      <article class="min-w-0 space-y-14">
        <RuleSection :section="rulesSections.description">
          <p class="text-base leading-7 text-ink-muted [&_strong]:font-semibold [&_strong]:text-ink">
            Starfall is a two-player deckbuilding combat game. Each player begins a standard match with
            <strong>50 Authority</strong>. Generate Combat with your fleet and spend it to reduce the opposing
            commander’s Authority to zero. The first player to do so wins immediately.
          </p>
          <AppCard
            padding="sm"
            class="mt-6 flex items-center gap-4"
          >
            <span class="font-mono text-2xl font-semibold text-success">50</span>
            <div>
              <strong class="text-ink">Starting Authority</strong>
              <p class="text-sm text-ink-muted">
                A game host may choose a different starting value for a custom match.
              </p>
            </div>
          </AppCard>
        </RuleSection>
        <RuleSection :section="rulesSections.setup">
          <RuleList ordered>
            <li>
              <strong>Prepare personal decks.</strong> Each player starts with ten Ships: eight Scouts that produce
              Trade and two Troopers that produce Combat. Shuffle your deck and place it face down.
            </li>
            <li>
              <strong>Set Authority.</strong> Both players begin at 50 Authority in a standard game. Or host player may
              choose another starting value.
            </li>
          </RuleList>
          <p class="mt-4 text-sm leading-6 text-ink-muted">
            The battle starts automatically when the second player joins. The first player is chosen at random and draws
            three cards; the second player draws five.
          </p>
        </RuleSection>
        <RuleSection :section="rulesSections.cards">
          <div class="grid gap-4 sm:grid-cols-3">
            <RuleInfoCard title="Trade">
              Spend Trade to acquire Ships and Bases. Unspent Trade disappears at the end of your turn.
            </RuleInfoCard>
            <RuleInfoCard title="Combat">
              Spend Combat to destroy enemy Bases or attack the opposing player. It does not carry over.
            </RuleInfoCard>
            <RuleInfoCard title="Authority">
              Your survival total. Healing may raise it above its starting value; there is no normal maximum.
            </RuleInfoCard>
          </div>

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <RuleInfoCard title="Ships">
              Ships enter play, provide resources or abilities, and remain in your play area for the current turn. At
              the end of the turn they go to your discard pile.
            </RuleInfoCard>
            <RuleInfoCard title="Bases">
              Bases stay in play between turns and may provide their abilities again on each of your turns. Their
              Defense shows how much Combat is needed to destroy them.
            </RuleInfoCard>
          </div>
        </RuleSection>
        <RulesTurn />
        <RulesAbilities />
        <RuleSection :section="rulesSections.bases">
          <RuleList>
            <li>A Base enters your play area and remains there until destroyed, scrapped, or removed by an effect.</li>
            <li>To destroy a Base, spend Combat equal to its current Defense.</li>
            <li>A destroyed Base goes to its owner’s discard pile; it is not permanently removed from the deck.</li>
            <li>
              Combat beyond the required Defense is not assigned automatically. Unspent Combat remains available for
              another legal target.
            </li>
            <li>
              While an opponent controls an <strong>Outpost</strong>, destroy all of their Outposts before attacking
              that player or any non-Outpost Base they control.
            </li>
          </RuleList>
        </RuleSection>
        <RuleSection :section="rulesSections.factions">
          <p class="text-base leading-7 text-ink-muted [&_strong]:font-semibold [&_strong]:text-ink">
            Faction is the backbone of deck synergy. Specializing makes Ally abilities more reliable; mixing factions
            gives you broader tactical options.
          </p>
          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <RuleFactionCard
              title="Blob"
              tone="success"
            >
              Aggressive Combat, rapid card draw, and effects that scrap undesirable cards from the Trade Row.
            </RuleFactionCard>
            <RuleFactionCard
              title="Trade Federation"
              tone="accent"
            >
              Strong Trade generation and Authority recovery, supported by durable economic Bases.
            </RuleFactionCard>
            <RuleFactionCard
              title="Star Empire"
              tone="warning"
            >
              Combat pressure, card draw, and disruption that forces the opponent to discard.
            </RuleFactionCard>
            <RuleFactionCard
              title="Machine Cult"
              tone="danger"
            >
              Deck refinement through scrapping, efficient Combat, and resilient Bases.
            </RuleFactionCard>
          </div>
        </RuleSection>
        <RuleSection :section="rulesSections.deck">
          <RuleList>
            <li>Newly acquired cards normally go to your discard pile, not your hand.</li>
            <li>
              Never shuffle early. When you must draw and your deck is empty, shuffle the discard pile to form a new
              deck, then continue drawing.
            </li>
            <li>Cards in your discard pile are public information; the order of your face-down deck is not.</li>
            <li>
              Cards sent to the Scrap Heap are removed for the rest of the match unless an effect explicitly retrieves
              them.
            </li>
            <li>
              Scrapping weak starting cards strengthens future hands, but removing too much Trade can limit later
              purchases.
            </li>
          </RuleList>
        </RuleSection>
        <RuleSection :section="rulesSections.victory">
          <AppCard
            variant="danger"
            padding="none"
            class="relative overflow-hidden p-6 sm:p-8"
          >
            <div class="absolute -right-12 -top-12 size-40 rounded-full border border-danger/10" />
            <p class="relative font-display text-2xl font-semibold text-ink">Reduce enemy Authority to zero.</p>
            <p class="relative mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
              Victory is immediate. You do not need to finish resolving unused Trade, Combat, or optional effects after
              the opposing player reaches zero Authority.
            </p>
          </AppCard>
        </RuleSection>
        <RulesReference />
      </article>
    </div>
  </div>
</template>
