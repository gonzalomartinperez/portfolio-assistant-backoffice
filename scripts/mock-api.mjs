import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
export function startMockApi(port = 8107) {
	const sessions = new Map();
	const runs = new Map();
	const server = createServer(async (req, res) => {
		res.setHeader("Access-Control-Allow-Origin", "http://localhost:3107");
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader(
			"Access-Control-Allow-Headers",
			"Content-Type, X-CSRF-Token, X-Session-Bootstrap, Idempotency-Key",
		);
		res.setHeader(
			"Access-Control-Allow-Methods",
			"GET, POST, PATCH, DELETE, OPTIONS",
		);
		res.setHeader("Access-Control-Expose-Headers", "X-Run-ID");
		if (req.method === "OPTIONS") {
			res.writeHead(204);
			res.end();
			return;
		}
		const json = (data, status = 200) => {
			res.writeHead(status, { "content-type": "application/json" });
			res.end(JSON.stringify(data));
		};
		const url = new URL(req.url, "http://localhost");
		const parts = url.pathname.split("/");
		let data = {};
		let body = "";
		for await (const chunk of req) body += chunk;
		if (body) data = JSON.parse(body);
		let id = req.headers.cookie?.match(/fixture=([^;]+)/)?.[1];
		let session = sessions.get(id);
		if (url.pathname === "/api/v1/session") {
			if (req.method === "POST" && req.headers["x-session-bootstrap"] === "1") {
				id = randomUUID();
				session = { items: [], messages: new Map() };
				sessions.set(id, session);
				res.setHeader(
					"Set-Cookie",
					`fixture=${id}; HttpOnly; SameSite=Lax; Path=/`,
				);
			}
			return session
				? json({
						csrf_token: id,
						retention_days: 7,
						expires_at: "2030-01-01T00:00:00Z",
					})
				: json({ code: "unauthorized" }, 401);
		}
		if (!session) return json({ code: "unauthorized" }, 401);
		if (req.method !== "GET" && req.headers["x-csrf-token"] !== id)
			return json({ code: "csrf" }, 403);
		if (url.pathname === "/api/v1/conversations") {
			if (req.method === "GET")
				return json({ items: session.items, next_cursor: null });
			const item = {
				id: randomUUID(),
				title: "New conversation",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};
			session.items.unshift(item);
			session.messages.set(item.id, []);
			return json(item, 201);
		}
		if (parts[3] === "runs" && parts[5] === "cancel") {
			runs.get(parts[4])?.();
			return json({});
		}
		if (parts[3] === "messages" && parts[5] === "feedback") return json({});
		const conversation = parts[4];
		const history = session.messages.get(conversation);
		if (!history) return json({}, 404);
		if (parts.length === 5) {
			if (req.method === "DELETE") {
				session.items = session.items.filter(
					(item) => item.id !== conversation,
				);
				session.messages.delete(conversation);
				res.writeHead(204);
				return res.end();
			}
			if (req.method === "PATCH") {
				const item = session.items.find((item) => item.id === conversation);
				item.title = data.title;
				return json(item);
			}
		}
		if (parts[5] === "messages" && parts.length === 6)
			return json({ items: [...history].reverse(), next_cursor: null });
		if (parts[6] === "stream") {
			if (data.content === "expired") return json({ code: "expired" }, 401);
			if (data.content === "reject") return json({ code: "rejected" }, 422);
			const run = randomUUID();
			let seq = 0;
			let cancelled = false;
			const timers = [];
			res.writeHead(200, {
				"content-type": "text/event-stream",
				"X-Run-ID": run,
				"cache-control": "no-cache",
			});
			res.flushHeaders();
			const event = (type, payload) => {
				if (!res.destroyed)
					res.write(
						`event: ${type}\r\ndata: ${JSON.stringify({ type, schema_version: "1", run_id: run, conversation_id: conversation, sequence: seq++, timestamp: new Date().toISOString(), payload })}\r\n\r\n`,
					);
			};
			const finish = () => {
				for (const timer of timers) clearTimeout(timer);
				runs.delete(run);
			};
			req.on("close", () => {});
			res.on("close", finish);
			runs.set(run, () => {
				cancelled = true;
				event("run.cancelled", {});
				res.end();
				finish();
			});
			const message = (role, content, citations = []) => ({
				id: randomUUID(),
				role,
				content,
				citations,
				created_at: new Date().toISOString(),
			});
			history.push(message("user", data.content));
			event("run.started", { state: "running" });
			const citation = {
				id: "source",
				label: "Public project source",
				source_type: "code",
				url: "https://github.com/gonzalomartinperez/portfolio/blob/45d8a42faa78bfb94952639ed462832c3b4ad109/src/content/en/projects.ts",
				path: "src/content/en/projects.ts",
				start_line: 1,
				end_line: 20,
			};
			const text =
				data.content === "long"
					? "A public source provides context. ".repeat(300) +
						"\n\n```text\n" +
						"unbroken".repeat(100) +
						"\n```\n\n[Unsafe](javascript:alert(1)) <script>alert(1)</script>"
					: data.locale === "es"
						? "Esta es una respuesta de prueba basada en fuentes públicas."
						: "This is a deterministic answer based on public sources.";
			const delay = data.content === "slow" ? 100 : 15;
			const chunks = text.match(/.{1,40}/gs) ?? [];
			let index = 0;
			function next() {
				if (cancelled || res.destroyed) return;
				if (index < chunks.length) {
					event("message.delta", { text: chunks[index++] });
					if (data.content === "interrupt") {
						res.end();
						return;
					}
					if (data.content === "failed") {
						event("run.failed", { code: "provider_error" });
						res.end();
						return;
					}
					timers.push(setTimeout(next, data.content === "slow" ? 5000 : delay));
				} else {
					const answer = message("assistant", text, [citation]);
					history.push(answer);
					event("message.completed", {
						message_id: answer.id,
						content: text,
						citations: [citation],
					});
					event("run.completed", {});
					res.end();
				}
			}
			timers.push(setTimeout(next, delay));
			return;
		}
		json({}, 404);
	});
	return new Promise((resolve) =>
		server.listen(port, "127.0.0.1", () => resolve(server)),
	);
}
