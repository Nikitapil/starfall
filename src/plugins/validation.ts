import { defineRule } from 'vee-validate';
import { integer, max_value, min_value, required } from '@vee-validate/rules';
import { i18n } from './i18n';

const { t } = i18n.global;

export const validation = () => {
  defineRule(
    'required',
    (value: unknown, _, ctx) =>
      required(value) || t('validation.required', { field: ctx.label || t('validation.field') })
  );

  defineRule('integer', (value: unknown) => integer(value) || t('validation.integer'));

  defineRule('email', (value: string) => {
    if (!value || !value.length) {
      return true;
    }
    if (
      !/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        value
      )
    ) {
      return t('validation.email');
    }
    return true;
  });

  defineRule('max_value', (value: unknown, params: Parameters<typeof max_value>[1]) => {
    const max = Array.isArray(params) ? params[0] : params.max;
    return max_value(value, params) || t('validation.max', { max });
  });

  defineRule('min_value', (value: unknown, params: Parameters<typeof min_value>[1]) => {
    const min = Array.isArray(params) ? params[0] : params.min;
    return min_value(value, params) || t('validation.min', { min });
  });
};
