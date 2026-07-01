import { supabase } from '../lib/supabase';

const AD_BUCKET = 'advertisements';

// Convert snake_case to camelCase
function toCamelCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj?.map(toCamelCase);
  return Object.keys(obj)?.reduce((acc, key) => {
    const camelKey = key?.replace(/_([a-z])/g, (_, letter) => letter?.toUpperCase());
    acc[camelKey] = typeof obj?.[key] === 'object' && obj?.[key] !== null ? toCamelCase(obj?.[key]) : obj?.[key];
    return acc;
  }, {});
}

// Convert camelCase to snake_case
function toSnakeCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.keys(obj)?.reduce((acc, key) => {
    const snakeKey = key?.replace(/([A-Z])/g, (letter) => `_${letter?.toLowerCase()}`);
    acc[snakeKey] = obj?.[key];
    return acc;
  }, {});
}

export const getAdvertisements = async () => {
  try {
    const { data, error } = await supabase?.from('advertisements')?.select('*')?.order('display_order', { ascending: true });
    if (error) throw error;
    return toCamelCase(data || []);
  } catch (error) {
    console.error('Get advertisements error:', error);
    return [];
  }
};

export const getActiveAdvertisements = async () => {
  try {
    const { data, error } = await supabase?.from('advertisements')?.select('*')?.eq('is_active', true)?.order('display_order', { ascending: true });
    if (error) throw error;
    return toCamelCase(data || []);
  } catch (error) {
    console.error('Get active advertisements error:', error);
    return [];
  }
};

export const uploadAdvertisementImage = async (file) => {
  try {
    const fileExt = file?.name?.split('.')?.pop() || 'jpg';
    const fileName = `ad_${Date.now()}_${Math.random()?.toString(36)?.slice(2)}.${fileExt}`;
    const { data, error } = await supabase?.storage?.from(AD_BUCKET)?.upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
    if (error) throw error;
    const { data: urlData } = supabase?.storage?.from(AD_BUCKET)?.getPublicUrl(data?.path);
    return urlData?.publicUrl || '';
  } catch (error) {
    console.error('Upload advertisement image error:', error);
    throw error;
  }
};

export const createAdvertisement = async (data) => {
  try {
    const insertData = {
      title: data?.title || '',
      description: data?.description || '',
      image_url: data?.image_url || '',
      bg_color: data?.bg_color || '#c0392b',
      duration: parseInt(data?.duration) || 10,
      is_active: data?.is_active ?? true,
      display_order: parseInt(data?.display_order) || 1,
      view_count: 0,
      skip_count: 0,
      total_engagement_time: 0,
      engagement_count: 0
    };
    // Only include video_url if it has a value (column may not exist in older schema)
    if (data?.video_url) {
      insertData.video_url = data?.video_url;
    }
    const { data: created, error } = await supabase?.from('advertisements')?.insert(insertData)?.select()?.single();
    if (error) throw error;
    return toCamelCase(created);
  } catch (error) {
    console.error('Create advertisement error:', error);
    throw error;
  }
};

export const updateAdvertisement = async (id, data) => {
  try {
    const updateData = {};
    if (data?.title !== undefined) updateData.title = data?.title;
    if (data?.description !== undefined) updateData.description = data?.description;
    if (data?.image_url !== undefined) updateData.image_url = data?.image_url;
    if (data?.bg_color !== undefined) updateData.bg_color = data?.bg_color;
    if (data?.duration !== undefined) updateData.duration = parseInt(data?.duration);
    if (data?.is_active !== undefined) updateData.is_active = data?.is_active;
    if (data?.display_order !== undefined) updateData.display_order = parseInt(data?.display_order);
    // Only include video_url if explicitly provided
    if (data?.video_url !== undefined) updateData.video_url = data?.video_url;

    const { data: updated, error } = await supabase?.from('advertisements')?.update(updateData)?.eq('id', id)?.select()?.single();
    if (error) throw error;
    return toCamelCase(updated);
  } catch (error) {
    console.error('Update advertisement error:', error);
    throw error;
  }
};

export const deleteAdvertisement = async (id) => {
  try {
    const { error } = await supabase?.from('advertisements')?.delete()?.eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error('Delete advertisement error:', error);
    throw error;
  }
};

export const toggleAdvertisementStatus = async (id, isActive) => {
  return updateAdvertisement(id, { is_active: isActive });
};

export const trackAdView = async (id) => {
  try {
    // Increment view_count on the advertisement
    const { error: updateError } = await supabase?.rpc('increment_ad_view', { ad_id: id });
    if (updateError) {
      // Fallback: direct update if RPC not available
      const { data: current } = await supabase?.from('advertisements')?.select('view_count')?.eq('id', id)?.single();
      await supabase?.from('advertisements')?.update({ view_count: (current?.view_count || 0) + 1 })?.eq('id', id);
    }
    // Log analytics event
    await supabase?.from('advertisement_analytics')?.insert({
      advertisement_id: id,
      event_type: 'view',
      engagement_seconds: 0
    });
  } catch (error) {
    console.error('Track ad view error:', error);
  }
};

export const trackAdSkip = async (id) => {
  try {
    const { data: current } = await supabase?.from('advertisements')?.select('skip_count')?.eq('id', id)?.single();
    await supabase?.from('advertisements')?.update({ skip_count: (current?.skip_count || 0) + 1 })?.eq('id', id);
    // Log analytics event
    await supabase?.from('advertisement_analytics')?.insert({
      advertisement_id: id,
      event_type: 'skip',
      engagement_seconds: 0
    });
  } catch (error) {
    console.error('Track ad skip error:', error);
  }
};

// Track engagement time in seconds
export const trackAdEngagement = async (id, engagementSeconds) => {
  try {
    const { data: current } = await supabase?.from('advertisements')?.select('total_engagement_time, engagement_count')?.eq('id', id)?.single();
    await supabase?.from('advertisements')?.update({
        total_engagement_time: (current?.total_engagement_time || 0) + (engagementSeconds || 0),
        engagement_count: (current?.engagement_count || 0) + 1
      })?.eq('id', id);
    // Log analytics event
    await supabase?.from('advertisement_analytics')?.insert({
      advertisement_id: id,
      event_type: 'engagement',
      engagement_seconds: engagementSeconds || 0
    });
  } catch (error) {
    console.error('Track ad engagement error:', error);
  }
};
