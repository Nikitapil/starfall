import { defineRule } from 'vee-validate';

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
};
