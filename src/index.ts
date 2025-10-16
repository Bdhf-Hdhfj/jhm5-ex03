/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// Route API requests; serve static assets as fallback
		const url = new URL(request.url);
		if (url.pathname.startsWith('/api/')) {
			// helper: fetch data from D1 if binding available
			async function fetchFromD1() {
				if (!env.HKDSE_DB) return null;
				try {
					const res = await env.HKDSE_DB.prepare('SELECT line_no, item, category, day_count, day_cum_count, all_count, all_cum_count FROM hkdsedata').all();
					// map to front-end friendly shape
					return res.results.map(r => ({
						range: r.item,
						dayCount: r.day_count,
						dayPercentage: null,
						allCount: r.all_count,
						allPercentage: null
					}));
				} catch (e) {
					console.error('D1 query error', e);
					return null;
				}
			}

			// fallback mock dataset
			const mock = [
				{ range: '35/34/33', dayCount: 283, dayPercentage: '0.7%', allCount: 296, allPercentage: '0.6%' },
				{ range: '32/31/30', dayCount: 643, dayPercentage: '1.6%', allCount: 671, allPercentage: '1.4%' },
				{ range: '29/28/27', dayCount: 1253, dayPercentage: '3.1%', allCount: 1306, allPercentage: '2.7%' },
				{ range: '26/25/24', dayCount: 2138, dayPercentage: '5.3%', allCount: 2256, allPercentage: '4.6%' },
				{ range: '23/22/21', dayCount: 3648, dayPercentage: '9.0%', allCount: 3801, allPercentage: '7.8%' },
				{ range: '20/19/18', dayCount: 4887, dayPercentage: '12.0%', allCount: 5109, allPercentage: '10.4%' },
				{ range: '17/16/15', dayCount: 4011, dayPercentage: '9.9%', allCount: 4187, allPercentage: '8.5%' },
				{ range: '14/13/12', dayCount: 1164, dayPercentage: '2.9%', allCount: 1224, allPercentage: '2.5%' }
			];

			const d1Data = await fetchFromD1();
			const hkdseData = d1Data || mock;

			if (url.pathname === '/api/stats') {
				return new Response(JSON.stringify({ data: hkdseData }), {
					headers: { 'Content-Type': 'application/json' },
				});
			}

			if (url.pathname === '/api/raw') {
				return new Response(JSON.stringify({ rows: hkdseData }), {
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}

		// Try to serve static assets by default
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
