import type { PageServerLoad } from './$types';
import { invokeApi } from '#lib/server/gateway';

export interface FunnelStep {
	step?: string;
	actors?: number;
}

export const load: PageServerLoad = async () => {
	const out = await invokeApi<{ funnel?: FunnelStep[] }>('admin_analytics_funnel_get', {});
	return { funnel: out.status === 'SUCCESS' ? (out.result?.funnel ?? []) : [], errorCode: out.errorCode };
};
