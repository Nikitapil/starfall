import type { HTMLAttributes, MaybeRef } from 'vue';
import type { RuleExpression } from 'vee-validate';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputValue = string | number | null;

export interface AppInputProps {
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  size?: InputSize;
  loading?: boolean;
  inputClass?: HTMLAttributes['class'];
  disabled?: boolean;
  name: string;
  rules?: MaybeRef<RuleExpression<unknown>>;
  validationName?: string;
}
