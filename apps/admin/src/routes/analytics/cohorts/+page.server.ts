import type { PageServerLoad } from './$types';
import { invokeApi } from '#lib/server/gateway';

export const load: PageServerLoad = async () => {
	const out = await invokeApi<{
		cohorts?: Array<{ date: string; size: number; d1: number; d3: number; d7: number }>;
	}>('admin_analytics_cohorts_get', {});
	return { cohorts: out.status === 'SUCCESS' ? (out.result?.cohorts ?? []) : [], errorCode: out.errorCode };
};
