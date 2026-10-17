import { invokeApi } from '#lib/server/gateway';

export interface AdminListResult {
	rows: Array<Record<string, unknown>>;
	errorCode: string | null;
}

/** Load an admin-only list operation (server-side, admin-gated). */
export async function loadAdminList(operation: string): Promise<AdminListResult> {
	const out = await invokeApi<{ items?: Array<Record<string, unknown>> }>(operation, {});
	return {
		rows: out.status === 'SUCCESS' ? (out.result?.items ?? []) : [],
		errorCode: out.errorCode
	};
}
