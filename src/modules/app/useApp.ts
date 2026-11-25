import { useApp as useAppApi } from '@/api/swagger/App/App';

export const useApp = () => {
  const appApi = useAppApi();
  const healthcheck = () => appApi.healthcheck();

  return { healthcheck };
};
