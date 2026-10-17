import type { PageServerLoad } from './$types';
import { loadAdminList } from '#lib/server/list';

export const load: PageServerLoad = () => loadAdminList('ad_campaign_list');
