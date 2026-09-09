import { defineRule } from 'vee-validate';
import { max_value, min_value } from '@vee-validate/rules';

export const validation = () => {
  defineRule('required', (value: string, _, ctx) => {
    if (!value || !value.length) {
      return `${ctx.label || 'This Field'} is required`;
    }
    return true;
  });

  defineRule('email', (value: string) => {
    if (!value || !value.length) {
      return true;
    }
    if (
      !/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        value
      )
    ) {
      return 'This field must be a valid email';
    }
    return true;
  });

  defineRule('max_value', (value: unknown, params: Parameters<typeof max_value>[1]) => {
    const max = Array.isArray(params) ? params[0] : params.max;
    return max_value(value, params) || `Max value is ${max}`;
  });

  defineRule('min_value', (value: unknown, params: Parameters<typeof min_value>[1]) => {
    const min = Array.isArray(params) ? params[0] : params.min;
    return min_value(value, params) || `Min value is ${min}`;
  });
};
