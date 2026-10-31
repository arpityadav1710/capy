// Colour and icon for each category, used by Capy's bands, charts and the quick-add bar.
import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

import type { Category } from './parser';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const CATEGORY_STYLE: Record<Category, { color: string; soft: string; icon: IconName; label: string }> = {
  Food: { color: '#E8A33D', soft: '#FBEBD2', icon: 'silverware-fork-knife', label: 'Food' },
  Transport: { color: '#4BA3C7', soft: '#DCEFF7', icon: 'car', label: 'Travel' },
  Shopping: { color: '#D9677B', soft: '#F8DEE3', icon: 'shopping', label: 'Shop' },
  Bills: { color: '#7B6CC2', soft: '#E5E1F5', icon: 'receipt', label: 'Bills' },
  Fun: { color: '#6DBE6A', soft: '#E0F2DF', icon: 'party-popper', label: 'Fun' },
  Other: { color: '#A89A8C', soft: '#EEE9E4', icon: 'dots-horizontal', label: 'Other' },
};
