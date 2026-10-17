import type { PageServerLoad } from './$types';
import { invokeApi } from '#lib/server/gateway';

export const load: PageServerLoad = async () => {
	const out = await invokeApi<{ series?: Array<{ date: string; newActors: number }> }>(
		'admin_analytics_acquisition_get',
		{}
	);
	return { series: out.status === 'SUCCESS' ? (out.result?.series ?? []) : [], errorCode: out.errorCode };
};
