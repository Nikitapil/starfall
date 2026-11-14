<script setup lang="ts">
import { useId } from 'vue';
import type { GameCard } from '../../game-types';

defineProps<{ type: 'ship' | 'base'; fraction: GameCard['fraction']; outpost?: boolean }>();
const id = useId();

type Artwork = { hull: string; panels: string; lines: string; lights: string };
const artByFaction: Record<GameCard['fraction'], Record<'ship' | 'base', Artwork>> = {
  none: {
    ship: {
      hull: 'M80 7L132 62L94 52L80 66L66 52L28 62Z',
      panels: 'M80 24L89 43L71 43ZM47 49L62 43L65 49ZM98 43L113 49L95 49Z',
      lines: 'M80 7V24M80 46V66M28 62L71 43M132 62L89 43',
      lights: 'M76 47H84V50H76ZM66 57L71 59L69 72L64 64ZM89 59L94 57L96 64L91 72Z'
    },
    base: {
      hull: 'M80 10L104 25V55L80 70L56 55V25ZM56 30L23 24V48L56 52ZM104 30L137 24V48L104 52Z',
      panels: 'M80 24L94 32V48L80 57L66 48V32ZM29 30L48 34V45L29 42ZM112 34L131 30V42L112 45Z',
      lines: 'M80 10V24M80 57V70M36 27V46M44 29V48M116 29V48M124 27V46',
      lights: 'M80 34A7 7 0 1 0 80 48A7 7 0 1 0 80 34ZM72 17H88V20H72ZM72 61H88V64H72Z'
    }
  },
  trades: {
    ship: {
      hull: 'M67 20L80 10L93 20V34H101V19L113 14L125 22V64L113 70L101 64V48H93V60L80 67L67 60V48H59V64L47 70L35 64V22L47 14L59 19V34H67Z',
      panels: 'M72 25L80 19L88 25V38H72ZM40 26H54V54H40ZM106 26H120V54H106Z',
      lines: 'M35 35H59M35 44H59M35 53H59M101 35H125M101 44H125M101 53H125M67 45H93M80 45V67',
      lights: 'M41 59H53V63H41ZM107 59H119V63H107ZM74 49H86V52H74ZM73 64H87V72H73Z'
    },
    base: {
      hull: 'M80 9C116 9 138 23 138 41S116 73 80 73S22 59 22 41S44 9 80 9ZM25 28H48V54H25ZM112 28H135V54H112Z',
      panels: 'M80 23C105 23 122 30 122 41S105 59 80 59S38 52 38 41S55 23 80 23ZM30 33H43V49H30ZM117 33H130V49H117Z',
      lines: 'M52 13L59 26M108 13L101 26M52 69L59 56M108 69L101 56M80 9V23M80 59V73',
      lights: 'M65 32H95V50H65ZM55 15H66V18H55ZM94 15H105V18H94ZM55 64H66V67H55ZM94 64H105V67H94Z'
    }
  },
  empire: {
    ship: {
      hull: 'M80 5L94 31L111 26L146 58L105 50L97 66L86 57L80 73L74 57L63 66L55 50L14 58L49 26L66 31Z',
      panels: 'M80 21L86 37L80 44L74 37ZM47 35L61 39L51 47L29 51ZM113 35L131 51L109 47L99 39Z',
      lines: 'M80 5V21M80 44V73M14 58L66 31M146 58L94 31M63 66L74 45M97 66L86 45',
      lights: 'M46 27L49 24L58 33L55 36ZM102 33L111 24L114 27L105 36ZM67 59H73V69H67ZM87 59H93V69H87Z'
    },
    base: {
      hull: 'M80 5L99 22L122 17L117 33L146 41L117 49L122 65L99 60L80 77L61 60L38 65L43 49L14 41L43 33L38 17L61 22Z',
      panels: 'M80 20L103 41L80 62L57 41ZM32 39H49V43H32ZM111 39H128V43H111Z',
      lines: 'M80 5V20M80 62V77M38 17L57 35M122 17L103 35M38 65L57 47M122 65L103 47',
      lights: 'M80 31L90 41L80 51L70 41ZM76 11H84V15H76ZM76 67H84V71H76ZM43 22L52 25L49 29ZM108 25L117 22L111 29Z'
    }
  },
  blobs: {
    ship: {
      hull: 'M80 10C94 9 98 27 107 32C123 39 136 15 142 29C151 52 125 68 104 58C94 54 92 73 80 70C68 73 66 54 56 58C35 68 9 52 18 29C24 15 37 39 53 32C62 27 66 9 80 10Z',
      panels:
        'M80 22C95 22 97 45 80 51C63 45 65 22 80 22ZM28 40C42 49 50 39 57 43C50 57 32 56 28 40ZM132 40C128 56 110 57 103 43C110 39 118 49 132 40Z',
      lines: 'M80 51V69M56 58Q61 46 70 43M104 58Q99 46 90 43M21 30Q32 43 53 32M139 30Q128 43 107 32',
      lights: 'M80 30C88 30 88 40 80 44C72 40 72 30 80 30ZM69 57Q74 54 77 60L73 67ZM91 57L87 67L83 60Q86 54 91 57Z'
    },
    base: {
      hull: 'M80 9C93 3 107 13 108 25C130 11 150 33 135 48C149 66 121 77 108 62C103 78 85 79 80 69C67 80 51 73 49 62C28 79 9 59 25 45C10 26 32 10 51 25C51 12 67 3 80 9Z',
      panels:
        'M80 23C106 15 117 42 99 57C78 74 53 51 61 34C65 26 70 24 80 23ZM30 28Q44 21 48 35Q39 48 30 37ZM116 28Q130 22 132 36Q122 48 114 37Z',
      lines: 'M51 25L63 34M108 25L100 32M49 62L66 53M108 62L98 53M80 9V23M80 58V69',
      lights:
        'M80 31C94 27 100 43 89 51C74 60 64 39 80 31ZM36 57A4 4 0 1 0 44 57A4 4 0 1 0 36 57ZM117 57A4 4 0 1 0 125 57A4 4 0 1 0 117 57Z'
    }
  },
  techno: {
    ship: {
      hull: 'M66 9H94V24H105V17H126V34H139V60H116V48H104V66H90V73H70V66H56V48H44V60H21V34H34V17H55V24H66Z',
      panels: 'M72 16H88V30H72ZM66 37H94V55H66ZM27 39H38V52H27ZM122 39H133V52H122ZM40 23H49V34H40ZM111 23H120V34H111Z',
      lines: 'M55 30H66V37M105 30H94V37M56 48H66M94 48H104M72 55V65M88 55V65M80 30V37',
      lights: 'M73 42H87V47H73ZM28 56H37V64H28ZM123 56H132V64H123ZM75 66H85V76H75Z'
    },
    base: {
      hull: 'M50 12H110V24H138V58H110V70H50V58H22V24H50ZM66 5H94V12H66ZM66 70H94V77H66Z',
      panels: 'M59 22H101V60H59ZM28 31H43V51H28ZM117 31H132V51H117Z',
      lines: 'M50 24V58M110 24V58M22 41H43M117 41H138M70 12V22M90 12V22M70 60V70M90 60V70',
      lights: 'M70 31H90V51H70ZM29 27H42V30H29ZM118 27H131V30H118ZM29 53H42V56H29ZM118 53H131V56H118ZM74 7H86V10H74Z'
    }
  }
};
</script>

<template>
  <svg
    viewBox="0 0 160 80"
    fill="none"
    class="h-20 w-full"
    aria-hidden="true"
  >
    <defs>
      <radialGradient :id="`${id}-nebula`">
        <stop
          stop-color="currentColor"
          stop-opacity=".28"
        />
        <stop
          offset="1"
          stop-color="currentColor"
          stop-opacity="0"
        />
      </radialGradient>
      <linearGradient
        :id="`${id}-hull`"
        x1="40"
        y1="12"
        x2="105"
        y2="70"
        gradientUnits="userSpaceOnUse"
      >
        <stop
          stop-color="var(--color-ink)"
          stop-opacity=".85"
        />
        <stop
          offset=".45"
          stop-color="currentColor"
          stop-opacity=".55"
        />
        <stop
          offset="1"
          stop-color="var(--color-surface)"
        />
      </linearGradient>
    </defs>
    <ellipse
      cx="84"
      cy="42"
      rx="78"
      ry="42"
      :fill="`url(#${id}-nebula)`"
    />
    <g
      fill="var(--color-ink)"
      opacity=".5"
    >
      <circle
        cx="18"
        cy="14"
        r=".7"
      />
      <circle
        cx="139"
        cy="18"
        r="1"
      />
      <circle
        cx="128"
        cy="65"
        r=".7"
      />
      <circle
        cx="42"
        cy="61"
        r="1"
      />
      <circle
        cx="112"
        cy="8"
        r=".6"
      />
      <circle
        cx="9"
        cy="55"
        r=".6"
      />
    </g>
    <path
      d="M8 70L149 12M29 80L160 26"
      stroke="currentColor"
      opacity=".1"
    />
    <g
      stroke="currentColor"
      stroke-width="1.3"
      stroke-linejoin="round"
    >
      <path
        :d="artByFaction[fraction][type].hull"
        :fill="`url(#${id}-hull)`"
      />
      <path
        :d="artByFaction[fraction][type].panels"
        fill="var(--color-canvas)"
        fill-opacity=".8"
      />
      <path
        :d="artByFaction[fraction][type].lines"
        stroke="var(--color-ink)"
        opacity=".5"
      />
      <path
        :d="artByFaction[fraction][type].lights"
        fill="currentColor"
        stroke="none"
        opacity=".8"
      />
      <g v-if="type === 'base' && outpost">
        <path
          d="M80 28L91 33V43Q91 51 80 58Q69 51 69 43V33Z"
          fill="var(--color-canvas)"
          stroke-width="2"
        />
        <path
          d="M74 41L78 45L86 36"
          stroke-width="2"
        />
      </g>
    </g>
  </svg>
</template>
