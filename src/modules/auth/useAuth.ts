import { defineStore } from 'pinia';
import type { UserReturnDto, AuthResponseDto, LoginUserDto, CreateUserDto } from '@/api/swagger/Auth/data-contracts.ts';
import { ref } from 'vue';
import { removeAuthToken, setAuthToken } from '@/helpers/token-helpers';
import { useAuth } from '@/api/swagger/Auth/Auth';
import { notifyAuthChange } from './auth-sync';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserReturnDto | null>(null);

  const isAuthLoading = ref(true);

  const { signin: signinApi, signup: signupApi, refresh, logout: logoutApi } = useAuth();

  const updateAuth = async (cb: () => Promise<AuthResponseDto>, notifyOtherTabs = false) => {
    isAuthLoading.value = true;
    try {
      const { accessToken, user: userResponse } = await cb();
      setAuthToken(accessToken);
      user.value = userResponse;
      if (notifyOtherTabs) notifyAuthChange();
      return { error: null, success: true };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      return { error: e?.response?.data || e, success: false };
    } finally {
      isAuthLoading.value = false;
    }
  };

  const signin = (data: LoginUserDto) => updateAuth(() => signinApi(data), true);

  const signup = (data: CreateUserDto) => updateAuth(() => signupApi(data), true);

  const refreshAuth = () => updateAuth(() => refresh());

  const logout = async () => {
    user.value = null;
    try {
      await logoutApi();
    } finally {
      removeAuthToken();
      notifyAuthChange();
    }
  };

  return { user, isAuthLoading, signin, signup, refreshAuth, logout };
});
