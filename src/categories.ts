// Colour and icon for each category, used by Capy's bands, charts and the quick-add bar.
// `ink` is a darker shade for text on the `soft` tint (5.3:1 contrast or better).
import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

import type { Category } from './parser';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const CATEGORY_STYLE: Record<Category, { color: string; soft: string; ink: string; icon: IconName; label: string }> = {
  Food: { color: '#E8A33D', soft: '#FBEBD2', ink: '#8A5410', icon: 'silverware-fork-knife', label: 'Food' },
  Transport: { color: '#4BA3C7', soft: '#DCEFF7', ink: '#1E5F7E', icon: 'car', label: 'Travel' },
  Shopping: { color: '#D9677B', soft: '#F8DEE3', ink: '#9B2F46', icon: 'shopping', label: 'Shop' },
  Bills: { color: '#7B6CC2', soft: '#E5E1F5', ink: '#4B3C93', icon: 'receipt', label: 'Bills' },
  Fun: { color: '#6DBE6A', soft: '#E0F2DF', ink: '#2E6E2C', icon: 'party-popper', label: 'Fun' },
  Other: { color: '#A89A8C', soft: '#EEE9E4', ink: '#5F5246', icon: 'dots-horizontal', label: 'Other' },
};
