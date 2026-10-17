import type { Actions, PageServerLoad } from './$types';
import { invokeApi } from '#lib/server/gateway';
import { loadAdminList } from '#lib/server/list';

const ACTION = 'ECONOMICS_RESERVES_READ';

export const load: PageServerLoad = async () => {
	const { rows, errorCode } = await loadAdminList('admin_destructive_list');
	return { requests: rows, errorCode };
};

export const actions: Actions = {
	request: async ({ request }) => {
		const data = await request.formData();
		await invokeApi('admin_destructive_request', {
			action: ACTION,
			targetId: String(data.get('targetId') ?? ''),
			reason: String(data.get('reason') ?? '')
		});
		return { ok: true };
	},
	approve: async ({ request }) => {
		const data = await request.formData();
		await invokeApi('admin_destructive_approve', { requestId: String(data.get('requestId') ?? '') });
		return { ok: true };
	},
	execute: async ({ request }) => {
		const data = await request.formData();
		await invokeApi('admin_destructive_execute', { requestId: String(data.get('requestId') ?? '') });
		return { ok: true };
	}
};
