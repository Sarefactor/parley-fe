import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// Legacy route: the builder now lives at /agents/config (and /workflows/config
// for standalone workflows). Preserve any query string (e.g. ?id=...).
export const load: PageLoad = ({ url }) => {
	redirect(308, `/agents/config${url.search}`);
};
