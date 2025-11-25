import NetInfo, { type NetInfoStateType } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  connectionType: NetInfoStateType;
}

const resolveOnlineFlag = (isConnected: boolean | null, isInternetReachable: boolean | null): boolean => {
  if (isInternetReachable === false) return false;
  if (isConnected === false) return false;
  return true;
};

export const useNetworkStatus = (): NetworkStatus => {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    connectionType: 'unknown'
  });

  useEffect(() => {
    let mounted = true;

    const handleUpdate = (next: Awaited<ReturnType<typeof NetInfo.fetch>>) => {
      if (!mounted) return;
      setStatus({
        isOnline: resolveOnlineFlag(next.isConnected, next.isInternetReachable ?? null),
        connectionType: next.type
      });
    };

    NetInfo.fetch().then(handleUpdate).catch(() => {
      if (!mounted) return;
      setStatus((prev) => ({ ...prev, isOnline: true }));
    });

    const unsubscribe = NetInfo.addEventListener(handleUpdate);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return status;
};
