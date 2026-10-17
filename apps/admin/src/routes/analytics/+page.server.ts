import type { PageServerLoad } from './$types';
import { invokeApi } from '#lib/server/gateway';

export interface Analytics {
	contentByType?: Record<string, number>;
	contentByStatus?: Record<string, number>;
	subscriptionsByStatus?: Record<string, number>;
	paymentsByProvider?: Record<string, number>;
	paymentsByStatus?: Record<string, number>;
	creatorsByStatus?: Record<string, number>;
}

export const load: PageServerLoad = async () => {
	const out = await invokeApi<Analytics>('admin_analytics_get', {});
	return { analytics: out.status === 'SUCCESS' ? out.result : null, errorCode: out.errorCode };
};
