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
			// simple in-memory mock dataset (mirror of public/HKDSE/app.js)
			const hkdseData = [
				{ range: '35/34/33', dayCount: 283, dayPercentage: '0.7%', allCount: 296, allPercentage: '0.6%' },
				{ range: '32/31/30', dayCount: 643, dayPercentage: '1.6%', allCount: 671, allPercentage: '1.4%' },
				{ range: '29/28/27', dayCount: 1253, dayPercentage: '3.1%', allCount: 1306, allPercentage: '2.7%' },
				{ range: '26/25/24', dayCount: 2138, dayPercentage: '5.3%', allCount: 2256, allPercentage: '4.6%' },
				{ range: '23/22/21', dayCount: 3648, dayPercentage: '9.0%', allCount: 3801, allPercentage: '7.8%' },
				{ range: '20/19/18', dayCount: 4887, dayPercentage: '12.0%', allCount: 5109, allPercentage: '10.4%' },
				{ range: '17/16/15', dayCount: 4011, dayPercentage: '9.9%', allCount: 4187, allPercentage: '8.5%' },
				{ range: '14/13/12', dayCount: 1164, dayPercentage: '2.9%', allCount: 1224, allPercentage: '2.5%' }
			];

			if (url.pathname === '/api/stats') {
				return new Response(JSON.stringify({ data: hkdseData }), {
					headers: { 'Content-Type': 'application/json' },
				});
			}

			if (url.pathname === '/api/raw') {
				// return CSV-like raw rows for download or inspection
				return new Response(JSON.stringify({ rows: hkdseData }), {
					headers: { 'Content-Type': 'application/json' },
				});
			}

			// Simple Todos API using KV binding TODOS (optional)
			if (url.pathname.startsWith('/api/todos')) {
				// /api/todos            GET -> list
				// /api/todos            POST -> create {text}
				// /api/todos/:id        PATCH -> toggle
				// /api/todos/:id        DELETE -> remove
				if (!(env as any).TODOS) {
					return new Response(JSON.stringify({ error: 'KV TODOS not bound' }), { status: 501, headers: { 'Content-Type': 'application/json' } });
				}

				const parts = url.pathname.split('/').filter(Boolean);
				const id = parts[2];
				if (request.method === 'GET' && parts.length === 2) {
					// list all keys (note: list is paginated in real KV; this is a light demo)
					const list = await (env as any).TODOS.list({ prefix: '' });
					const items = await Promise.all(list.keys.map(async (k: any) => {
						const body = await (env as any).TODOS.get(k.name);
						try { return JSON.parse(body || 'null'); } catch { return null }
					}));
					return new Response(JSON.stringify(items.filter(Boolean)), { headers: { 'Content-Type': 'application/json' } });
				}

				if (request.method === 'POST' && parts.length === 2) {
					const payload = await request.json().catch(() => ({} as any)) as any;
					const newId = Date.now().toString(36) + Math.random().toString(36).slice(2,8);
					const item = { id: newId, text: String(payload.text || ''), done: false };
					await (env as any).TODOS.put(newId, JSON.stringify(item));
					return new Response(JSON.stringify(item), { status: 201, headers: { 'Content-Type': 'application/json' } });
				}

				if (id && request.method === 'DELETE') {
					await (env as any).TODOS.delete(id);
					return new Response(null, { status: 204 });
				}

				if (id && request.method === 'PATCH') {
					const raw = await (env as any).TODOS.get(id);
					if (!raw) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
					const obj = JSON.parse(raw);
					obj.done = !obj.done;
					await (env as any).TODOS.put(id, JSON.stringify(obj));
					return new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' } });
				}
			}

			// Example score endpoint using KV SCORES if bound
			if (url.pathname.startsWith('/api/score')) {
				if (!(env as any).SCORES) {
					return new Response(JSON.stringify({ error: 'KV SCORES not bound' }), { status: 501, headers: { 'Content-Type': 'application/json' } });
				}
				if (request.method === 'POST') {
					const p = await request.json().catch(()=>({} as any)) as any;
					const id = p.user||'anon';
					await (env as any).SCORES.put(id, JSON.stringify({ score: p.score||0, at: Date.now() }));
					return new Response(null, { status: 204 });
				}
				if (request.method === 'GET') {
					const keys = await (env as any).SCORES.list();
					const rows = await Promise.all(keys.keys.map(async (k: any) => ({ key: k.name, val: JSON.parse(await (env as any).SCORES.get(k.name) || 'null') })));
					return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
				}
			}
		}

		// If the request is for a .html file, try the no-extension path first to avoid redirects
		if (url.pathname.endsWith('.html')) {
			const altPath = url.pathname.replace(/\.html$/, '');
			const origin = new URL(request.url).origin;
			const altAbsolute = origin + altPath;
			try {
				const altReq = new Request(altAbsolute, { method: 'GET', headers: {} as HeadersInit });
				const altResp = await env.ASSETS.fetch(altReq);
				if (altResp && altResp.status === 200) return altResp;
			} catch (e) {
				// ignore and fall through to normal asset fetch
			}
		}
		// Try to serve static assets by default; if ASSETS returns a redirect, follow it server-side
		// Follow server-side redirects for assets (avoid returning 3xx to clients)
		let assetResp = await env.ASSETS.fetch(request);
		let hops = 0;
		while (assetResp.status >= 300 && assetResp.status < 400 && hops < 2) {
			const loc = assetResp.headers.get('Location');
			if (!loc) break;
			// resolve relative locations against the original request URL
			const newUrl = new URL(loc, request.url).toString();
			// perform a simple GET to the resolved asset path (don't forward client body)
			const followReq = new Request(newUrl, { method: 'GET', headers: {} as HeadersInit });
			assetResp = await env.ASSETS.fetch(followReq);
			hops++;
		}
		return assetResp;
	},
} satisfies ExportedHandler<Env>;
