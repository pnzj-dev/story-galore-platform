import type { PageServerLoad } from './$types';
import { invokeApi } from '#lib/server/gateway';

export const load: PageServerLoad = async ({ params }) => {
	const out = await invokeApi<Record<string, unknown>>('admin_user_get', { userId: params.id });
	return { entity: out.status === 'SUCCESS' ? out.result : null, errorCode: out.errorCode };
};
