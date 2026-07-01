import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useRealtimeSubscription
 * Subscribes to one or more Supabase realtime channels and calls `onUpdate`
 * whenever an INSERT / UPDATE / DELETE event fires on the given tables.
 *
 * @param {Array<{table: string, schema?: string, filter?: string}>} subscriptions
 * @param {Function} onUpdate  - called with (payload) on any change
 * @param {Array}    deps      - extra deps that should re-create the subscription
 */
const useRealtimeSubscription = (subscriptions, onUpdate, deps = []) => {
  const channelRef = useRef(null);
  const onUpdateRef = useRef(onUpdate);

  // Keep callback ref fresh without re-subscribing
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const subscribe = useCallback(() => {
    if (!subscriptions?.length) return;

    // Clean up any existing channel first
    if (channelRef?.current) {
      supabase?.removeChannel(channelRef?.current);
      channelRef.current = null;
    }

    const channelName = `realtime-${subscriptions?.map(s => s?.table)?.join('-')}-${Date.now()}`;
    let channel = supabase?.channel(channelName);

    subscriptions?.forEach(({ table, schema = 'public', filter }) => {
      const config = { event: '*', schema, table };
      if (filter) config.filter = filter;

      channel = channel?.on('postgres_changes', config, (payload) => {
        onUpdateRef?.current?.(payload);
      });
    });

    channel?.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Subscribed to: ${subscriptions?.map(s => s?.table)?.join(', ')}`);
      }
    });

    channelRef.current = channel;
  }, [subscriptions]);

  useEffect(() => {
    subscribe();
    return () => {
      if (channelRef?.current) {
        supabase?.removeChannel(channelRef?.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);
};

export default useRealtimeSubscription;
