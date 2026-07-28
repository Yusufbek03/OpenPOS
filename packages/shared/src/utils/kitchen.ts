import { KITCHEN_TICKET_STATUSES } from '../constants/index';
import type { KitchenTicketStatus } from '../types/index';

export function getOrderPriorityColor(status: KitchenTicketStatus, elapsedMinutes: number): string {
  if (status === KITCHEN_TICKET_STATUSES.READY) return 'green';
  if (status === KITCHEN_TICKET_STATUSES.CANCELLED) return 'gray';

  if (elapsedMinutes < 10) return 'blue';
  if (elapsedMinutes < 15) return 'green';
  if (elapsedMinutes < 20) return 'yellow';
  if (elapsedMinutes < 30) return 'orange';
  return 'red';
}

export function getOrderPriorityBgClass(status: KitchenTicketStatus, elapsedMinutes: number): string {
  const color = getOrderPriorityColor(status, elapsedMinutes);
  const classMap: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500',
    green: 'bg-green-500/10 border-green-500',
    yellow: 'bg-yellow-500/10 border-yellow-500',
    orange: 'bg-orange-500/10 border-orange-500',
    red: 'bg-red-500/10 border-red-500',
    gray: 'bg-gray-500/10 border-gray-500',
  };
  return classMap[color] ?? 'bg-gray-500/10 border-gray-500';
}

export function getOrderPriorityTextClass(status: KitchenTicketStatus, elapsedMinutes: number): string {
  const color = getOrderPriorityColor(status, elapsedMinutes);
  const classMap: Record<string, string> = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    orange: 'text-orange-500',
    red: 'text-red-500',
    gray: 'text-gray-500',
  };
  return classMap[color] ?? 'text-gray-500';
}

export function formatElapsed(startAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - startAt.getTime();
  const totalSec = Math.floor(diffMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export function getElapsedMinutes(startAt: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - startAt.getTime();
  return Math.floor(diffMs / 60000);
}
