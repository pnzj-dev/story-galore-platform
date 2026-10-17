import type { PageServerLoad } from './$types';
import { invokeApi } from '#lib/server/gateway';

export interface Retention {
	totalActors?: number;
	returnedActors?: number;
	returnRate?: number;
}

export const load: PageServerLoad = async () => {
	const out = await invokeApi<Retention>('admin_analytics_retention_get', {});
	return { retention: out.status === 'SUCCESS' ? out.result : null, errorCode: out.errorCode };
};
