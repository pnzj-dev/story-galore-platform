export interface GatewayOutput<T = unknown> {
	status: 'SUCCESS' | 'FAILED';
	operationId: string | null;
	result: T;
	errorCode: string | null;
	retryable: boolean;
}

const endpoint = process.env.APPWRITE_ENDPOINT ?? '';
const projectId = process.env.APPWRITE_PROJECT_ID ?? '';
const apiKey = process.env.APPWRITE_API_KEY ?? '';
const adminActorId = process.env.ADMIN_ACTOR_ID ?? '';

/**
 * Invoke the `api` gateway function synchronously (server-side only), with the
 * narrowly-scoped server API key and the admin service-account actor. This must
 * never run in the browser — no browser API key exists in this app.
 */
export async function invokeApi<T>(operation: string, input: unknown): Promise<GatewayOutput<T>> {
	if (!endpoint || !projectId || !apiKey || !adminActorId) {
		return {
			status: 'FAILED',
			operationId: null,
			result: null as T,
			errorCode: 'GATEWAY_UNCONFIGURED',
			retryable: false
		};
	}

	const gatewayInput = {
		requestId: crypto.randomUUID(),
		correlationId: crypto.randomUUID(),
		actorId: adminActorId,
		payload: { operation, input }
	};

	const res = await fetch(`${endpoint}/functions/api/executions`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Appwrite-Project': projectId,
			'X-Appwrite-Key': apiKey
		},
		body: JSON.stringify({ body: JSON.stringify(gatewayInput), async: false })
	});

	if (!res.ok) {
		return {
			status: 'FAILED',
			operationId: null,
			result: null as T,
			errorCode: `GATEWAY_HTTP_${res.status}`,
			retryable: res.status >= 500
		};
	}

	const execution = (await res.json()) as { responseBody?: string };
	try {
		return JSON.parse(execution.responseBody ?? '{}') as GatewayOutput<T>;
	} catch {
		return {
			status: 'FAILED',
			operationId: null,
			result: null as T,
			errorCode: 'GATEWAY_INVALID_RESPONSE',
			retryable: false
		};
	}
}
