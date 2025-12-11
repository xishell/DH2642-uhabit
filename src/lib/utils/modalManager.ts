import { getJsonCookie, setJsonCookie, deleteCookie } from '$lib/utils/cookie';

export type ModalState<T> = { open: boolean; editing: T | null };

type ModalManagerOptions = {
	browser: boolean;
	cookieKey?: string;
};

export function createModalManager<T extends { id: string }>({
	browser,
	cookieKey
}: ModalManagerOptions) {
	let state: ModalState<T> = { open: false, editing: null };

	const persist = () => {
		if (!browser || !cookieKey) return;
		if (state.open) {
			setJsonCookie(cookieKey, { open: true, id: state.editing?.id ?? null });
		} else {
			deleteCookie(cookieKey);
		}
	};

	const restore = (items: T[]): ModalState<T> => {
		if (browser && cookieKey) {
			const saved = getJsonCookie<{ open?: boolean; id?: string | null }>(cookieKey);
			if (saved?.open) {
				const match = saved.id ? items.find((i) => i.id === saved.id) ?? null : null;
				state = { open: true, editing: match ? { ...match } : null };
			}
		}
		return state;
	};

	const open = (item?: T | null): ModalState<T> => {
		state = { open: true, editing: item ? { ...item } : null };
		persist();
		return state;
	};

	const close = (): ModalState<T> => {
		state = { open: false, editing: null };
		persist();
		return state;
	};

	const sync = (items: T[]): ModalState<T> => {
		if (state.open && state.editing) {
			const match = items.find((i) => i.id === state.editing!.id);
			if (match) {
				state = { open: true, editing: { ...match } };
			} else {
				state = { open: false, editing: null };
			}
			persist();
		}
		return state;
	};

	const getState = () => state;

	return { getState, open, close, sync, restore };
}
