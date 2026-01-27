import { createNotificationsPresenter } from './notificationsPresenter';

export const notificationsPresenter = createNotificationsPresenter({
	fetcher: fetch
});
