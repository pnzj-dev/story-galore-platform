import type { PageServerLoad } from './$types';
import { invokeApi } from '#lib/server/gateway';

export interface ChartPoint {
	date: string;
	value: number;
}

export interface Overview {
	kpis?: Record<string, number>;
	charts?: {
		revenueTrend: ChartPoint[];
		newSubscriberTrend: ChartPoint[];
		churnTrend: ChartPoint[];
	};
}

export const load: PageServerLoad = async () => {
	const out = await invokeApi<Overview>('admin_overview_get', {});
	return {
		overview: out.status === 'SUCCESS' ? out.result : null,
		errorCode: out.errorCode
	};
};
