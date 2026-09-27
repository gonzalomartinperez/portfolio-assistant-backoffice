import { createServer } from "node:http";
let completed = false;
createServer((req, res) => {
	if (req.url === "/status") {
		res.end(JSON.stringify({ completed }));
		return;
	}
	completed = false;
	res.writeHead(200, { "Content-Type": "text/event-stream" });
	res.write("data: first\n\n");
	const timer = setTimeout(() => {
		completed = true;
		res.end("data: done\n\n");
	}, 2000);
	res.on("close", () => clearTimeout(timer));
}).listen(3000, "0.0.0.0");
