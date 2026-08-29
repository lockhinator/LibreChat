import { useQuery } from '@tanstack/react-query';
import { QueryKeys, dataService } from 'librechat-data-provider';
import type { QueryObserverResult } from '@tanstack/react-query';
import type { DeveloperAccess } from 'librechat-data-provider';

export function useDeveloperAccessQuery(): QueryObserverResult<DeveloperAccess> {
  return useQuery([QueryKeys.developerAccess], () => dataService.getDeveloperAccess(), {
    enabled: false,
    retry: false,
    cacheTime: 0,
    staleTime: 0,
  });
}
