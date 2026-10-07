<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
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

const { t } = useI18n();
</script>

<template>
  <div class="w-full pb-24 pt-12 sm:pt-16">
    <AppPageHeader
      :eyebrow="t('rules.eyebrow')"
      :title="t('rules.title')"
      :description="t('rules.description')"
    />
    <div class="mt-10 grid gap-12 lg:grid-cols-[13rem_minmax(0,48rem)] lg:items-start">
      <aside class="lg:sticky lg:top-24">
        <p class="mb-3 font-mono text-xs uppercase text-ink-faint">{{ t('rules.onPage') }}</p>
        <nav :aria-label="t('rules.navigation')">
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
                {{ t(section.label) }}
              </a>
            </li>
          </ol>
        </nav>
      </aside>
      <article class="min-w-0 space-y-14">
        <RuleSection :section="rulesSections.description">
          <p class="text-base leading-7 text-ink-muted [&_strong]:font-semibold [&_strong]:text-ink">
            <i18n-t
              keypath="rules.intro"
              tag="span"
              scope="global"
            >
              <template #emphasis
                ><strong>{{ t('rules.introEmphasis') }}</strong>
              </template>
            </i18n-t>
          </p>
          <AppCard
            padding="sm"
            class="mt-6 flex items-center gap-4"
          >
            <span class="font-mono text-2xl font-semibold text-success">50</span>
            <div>
              <strong class="text-ink">{{ t('rules.startingAuthority') }}</strong>
              <p class="text-sm text-ink-muted">
                {{ t('rules.customAuthority') }}
              </p>
            </div>
          </AppCard>
        </RuleSection>
        <RuleSection :section="rulesSections.setup">
          <RuleList ordered>
            <li>
              <i18n-t
                keypath="rules.prepare"
                tag="span"
                scope="global"
              >
                <template #emphasis>
                  <strong>{{ t('rules.prepareEmphasis') }}</strong>
                </template>
              </i18n-t>
            </li>
            <li>
              <i18n-t
                keypath="rules.setAuthority"
                tag="span"
                scope="global"
              >
                <template #emphasis>
                  <strong>{{ t('rules.setAuthorityEmphasis') }}</strong>
                </template>
              </i18n-t>
            </li>
          </RuleList>
          <p class="mt-4 text-sm leading-6 text-ink-muted">
            {{ t('rules.autoStart') }}
          </p>
        </RuleSection>
        <RuleSection :section="rulesSections.cards">
          <div class="grid gap-4 sm:grid-cols-3">
            <RuleInfoCard :title="t('game.terms.trade')">
              {{ t('rules.tradeDescription') }}
            </RuleInfoCard>
            <RuleInfoCard :title="t('game.terms.combat')">
              {{ t('rules.combatDescription') }}
            </RuleInfoCard>
            <RuleInfoCard :title="t('game.terms.authority')">
              {{ t('rules.authorityDescription') }}
            </RuleInfoCard>
          </div>

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <RuleInfoCard :title="t('game.terms.ships')">
              {{ t('rules.shipsDescription') }}
            </RuleInfoCard>
            <RuleInfoCard :title="t('game.terms.bases')">
              {{ t('rules.basesDescription') }}
            </RuleInfoCard>
          </div>
        </RuleSection>
        <RulesTurn />
        <RulesAbilities />
        <RuleSection :section="rulesSections.bases">
          <RuleList>
            <li>{{ t('rules.baseStays') }}</li>
            <li>{{ t('rules.baseCost') }}</li>
            <li>{{ t('rules.baseDiscard') }}</li>
            <li>
              {{ t('rules.baseExcess') }}
            </li>
            <li>
              <i18n-t
                keypath="rules.outpostPriority"
                tag="span"
                scope="global"
              >
                <template #emphasis>
                  <strong>{{ t('rules.outpostPriorityEmphasis') }}</strong>
                </template>
              </i18n-t>
            </li>
          </RuleList>
        </RuleSection>
        <RuleSection :section="rulesSections.factions">
          <p class="text-base leading-7 text-ink-muted [&_strong]:font-semibold [&_strong]:text-ink">
            {{ t('rules.factionDescription') }}
          </p>
          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <RuleFactionCard
              :title="t('game.factions.blobs')"
              tone="success"
            >
              {{ t('rules.blobDescription') }}
            </RuleFactionCard>
            <RuleFactionCard
              :title="t('game.factions.trades')"
              tone="accent"
            >
              {{ t('rules.tradeFactionDescription') }}
            </RuleFactionCard>
            <RuleFactionCard
              :title="t('game.factions.empire')"
              tone="warning"
            >
              {{ t('rules.empireDescription') }}
            </RuleFactionCard>
            <RuleFactionCard
              :title="t('game.factions.techno')"
              tone="danger"
            >
              {{ t('rules.machineDescription') }}
            </RuleFactionCard>
          </div>
        </RuleSection>
        <RuleSection :section="rulesSections.deck">
          <RuleList>
            <li>{{ t('rules.acquireDiscard') }}</li>
            <li>
              {{ t('rules.shuffle') }}
            </li>
            <li>{{ t('rules.publicDiscard') }}</li>
            <li>
              {{ t('rules.scrapHeap') }}
            </li>
            <li>
              {{ t('rules.scrapStrategy') }}
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
            <p class="relative font-display text-2xl font-semibold text-ink">{{ t('rules.victoryTitle') }}</p>
            <p class="relative mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
              {{ t('rules.victoryText') }}
            </p>
          </AppCard>
        </RuleSection>
        <RulesReference />
      </article>
    </div>
  </div>
</template>
