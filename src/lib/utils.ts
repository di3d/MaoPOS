import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, symbol = '$'): string {
	return `${symbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function formatDate(dateStr: string | null | undefined): string {
	if (!dateStr) return '—';
	const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
	return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(dateStr: string | null | undefined): string {
	if (!dateStr) return '—';
	const d = new Date(dateStr);
	return d.toLocaleString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function generateInvoiceNumber(prefix = 'INV'): string {
	const now = new Date();
	const date = now.toISOString().slice(0, 10).replace(/-/g, '');
	const rand = Math.floor(Math.random() * 9000) + 1000;
	return `${prefix}-${date}-${rand}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
