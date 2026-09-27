import React from 'react';
import {
  Home,
  ShoppingBag,
  PiggyBank,
  Utensils,
  Car,
  ShoppingCart,
  Receipt,
  Coffee,
  Film,
  Music,
  ShieldAlert,
  TrendingUp,
  Target,
  Heart,
  Plane,
  Smartphone,
  Dumbbell,
  BookOpen,
  Gift,
  Wrench,
  Wallet,
  CreditCard,
  Briefcase,
  Zap,
  Sparkles,
  Landmark,
} from 'lucide-react';

export const AVAILABLE_ICONS: { name: string; label: string; component: React.FC<{ className?: string }> }[] = [
  { name: 'Home', label: 'Home / Needs', component: Home },
  { name: 'ShoppingBag', label: 'Shopping / Wants', component: ShoppingBag },
  { name: 'PiggyBank', label: 'Savings', component: PiggyBank },
  { name: 'Utensils', label: 'Food & Dining', component: Utensils },
  { name: 'Car', label: 'Travel & Transit', component: Car },
  { name: 'ShoppingCart', label: 'Groceries', component: ShoppingCart },
  { name: 'Receipt', label: 'Bills & Utilities', component: Receipt },
  { name: 'Coffee', label: 'Cafe & Drinks', component: Coffee },
  { name: 'Film', label: 'Entertainment', component: Film },
  { name: 'Music', label: 'Nightlife & Clubbing', component: Music },
  { name: 'ShieldAlert', label: 'Emergency Fund', component: ShieldAlert },
  { name: 'TrendingUp', label: 'Investments', component: TrendingUp },
  { name: 'Target', label: 'Future Goals', component: Target },
  { name: 'Heart', label: 'Health & Wellness', component: Heart },
  { name: 'Plane', label: 'Vacations', component: Plane },
  { name: 'Smartphone', label: 'Tech & Subscriptions', component: Smartphone },
  { name: 'Dumbbell', label: 'Fitness', component: Dumbbell },
  { name: 'BookOpen', label: 'Education', component: BookOpen },
  { name: 'Gift', label: 'Gifts', component: Gift },
  { name: 'Wrench', label: 'Maintenance', component: Wrench },
  { name: 'Wallet', label: 'General Wallet', component: Wallet },
  { name: 'CreditCard', label: 'Debt / EMI', component: CreditCard },
  { name: 'Briefcase', label: 'Work & Business', component: Briefcase },
  { name: 'Zap', label: 'Utilities', component: Zap },
  { name: 'Sparkles', label: 'Lifestyle', component: Sparkles },
  { name: 'Landmark', label: 'Banking', component: Landmark },
];

export const SUBCATEGORY_ICON_MAP: Record<string, string> = {
  rent: 'Home',
  food: 'Utensils',
  travel: 'Car',
  groceries: 'ShoppingCart',
  bills: 'Receipt',
  shopping: 'ShoppingBag',
  'dining out': 'Coffee',
  entertainment: 'Film',
  clubbing: 'Music',
  'emergency fund': 'ShieldAlert',
  investments: 'TrendingUp',
  'future goals': 'Target',
};

export function DynamicIcon({
  name,
  className = 'w-5 h-5',
}: {
  name?: string;
  className?: string;
}) {
  const found = AVAILABLE_ICONS.find((i) => i.name === name);
  const IconComponent = found ? found.component : Wallet;
  return <IconComponent className={className} />;
}

export function getSubcategoryIconName(subcategoryName: string, fallbackCategoryIcon: string): string {
  const key = subcategoryName.trim().toLowerCase();
  if (SUBCATEGORY_ICON_MAP[key]) {
    return SUBCATEGORY_ICON_MAP[key];
  }
  if (key.includes('food') || key.includes('lunch') || key.includes('dinner')) return 'Utensils';
  if (key.includes('rent') || key.includes('house')) return 'Home';
  if (key.includes('travel') || key.includes('bus') || key.includes('cab') || key.includes('uber')) return 'Car';
  if (key.includes('grocer')) return 'ShoppingCart';
  if (key.includes('bill') || key.includes('electric') || key.includes('wifi')) return 'Receipt';
  if (key.includes('shop')) return 'ShoppingBag';
  if (key.includes('din') || key.includes('cafe') || key.includes('coffee')) return 'Coffee';
  if (key.includes('movie') || key.includes('entertain') || key.includes('game')) return 'Film';
  if (key.includes('club') || key.includes('party') || key.includes('music')) return 'Music';
  if (key.includes('emergenc')) return 'ShieldAlert';
  if (key.includes('invest') || key.includes('stock') || key.includes('mutual')) return 'TrendingUp';
  if (key.includes('goal') || key.includes('save')) return 'Target';
  return fallbackCategoryIcon || 'Wallet';
}
