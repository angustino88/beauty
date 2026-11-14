import React from 'react';
import { LogoutOutlined, MenuOutlined } from '@ant-design/icons';

export const isDev =
  typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).has('dev');

export interface SlashCommand {
  command: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export interface QuickAction {
  label: string;
  prompt: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/menu',
    label: 'Menu',
    description: 'Go back to the main menu',
    icon: <MenuOutlined />,
  },
  {
    command: '/exit',
    label: 'Exit',
    description: 'End the current chat session and start fresh',
    icon: <LogoutOutlined />,
  },
];

export const FALLBACK_QUICK_ACTIONS: QuickAction[] = [
  { label: 'Booking lab', prompt: 'Book a lab for me' },
  { label: 'My bookings', prompt: 'Show my upcoming bookings' },
  { label: 'Update booking', prompt: 'I want to update a booking' },
  { label: 'Cancel booking', prompt: 'I want to cancel a booking' },
];
