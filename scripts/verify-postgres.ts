/** Verify only task-owned IAM fixtures; never consume a caller's DATABASE_URL. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const appImage = process.argv[2] ?? "portfolio-assistant-backoffice:rc";
const databaseImage = process.argv[3] ?? "portfolio-backoffice-postgres:rc";
for (const value of [appImage, databaseImage])
	assert.match(value, /^[a-z0-9][a-z0-9/_.-]*:[a-z0-9_.-]+$/);
const prefix = `portfolio-iam-${randomUUID()}`;
const database = `${prefix}-database`;
const network = `${prefix}-network`;
const volume = `${prefix}-data`;
const password = "disposable-iam-verification-only";
const receipt = `.artifacts/postgres/${prefix}`;
mkdirSync(receipt, { recursive: true, mode: 0o700 });
function docker(...args: string[]): Buffer {
	return execFileSync("docker", args, {
		timeout: 120_000,
		stdio: ["pipe", "pipe", "pipe"],
	});
}
function query(sql: string, name = "fixture"): string {
	return docker(
		"exec",
		database,
		"psql",
		"-X",
		"-v",
		"ON_ERROR_STOP=1",
		"-U",
		"fixture",
		"-d",
		name,
		"-Atc",
		sql,
	)
		.toString()
		.trim();
}
const configuration = [
	"-e",
	"BACKOFFICE_ORIGIN=https://iam.fixture.invalid",
	"-e",
	`BACKOFFICE_DATABASE_URL=postgres://fixture:${password}@${database}:5432/fixture`,
	"-e",
	"BETTER_AUTH_SECRET=disposable-fixture-auth-secret-32-characters",
	"-e",
	"BACKOFFICE_OWNER_EMAIL=owner@example.invalid",
	"-e",
	"GOOGLE_CLIENT_ID=fixture",
	"-e",
	"GOOGLE_CLIENT_SECRET=fixture",
	"-e",
	"GITHUB_CLIENT_ID=fixture",
	"-e",
	"GITHUB_CLIENT_SECRET=fixture",
];
function migrate(): void {
	docker(
		"run",
		"--rm",
		"--network",
		network,
		"--read-only",
		"--tmpfs",
		"/tmp:uid=65532,gid=65532,mode=0700,size=32m",
		"--cap-drop",
		"ALL",
		"--security-opt",
		"no-new-privileges",
		...configuration,
		appImage,
		"node",
		"scripts/auth-migrate.ts",
	);
}
try {
	docker("network", "create", "--internal", network);
	docker("volume", "create", volume);
	// Initialize this NEW fixture's ownership; this helper cannot name an existing user volume.
	docker(
		"run",
		"--rm",
		"--network",
		"none",
		"--user",
		"0:0",
		"--cap-drop",
		"ALL",
		"--cap-add",
		"CHOWN",
		"-v",
		`${volume}:/var/lib/postgresql`,
		"--entrypoint",
		"sh",
		databaseImage,
		"-c",
		"chown 999:999 /var/lib/postgresql",
	);
	docker(
		"run",
		"-d",
		"--name",
		database,
		"--network",
		network,
		"--user",
		"999:999",
		"--read-only",
		"--cap-drop",
		"ALL",
		"--security-opt",
		"no-new-privileges",
		"--tmpfs",
		"/tmp:uid=999,gid=999,size=16m",
		"--tmpfs",
		"/var/run/postgresql:uid=999,gid=999,size=16m",
		"-v",
		`${volume}:/var/lib/postgresql`,
		"--memory",
		"256m",
		"--memory-swap",
		"256m",
		"--cpus",
		"0.5",
		"--pids-limit",
		"128",
		"--shm-size",
		"32m",
		"--log-driver",
		"local",
		"--log-opt",
		"max-size=5m",
		"--log-opt",
		"max-file=2",
		"-e",
		"POSTGRES_USER=fixture",
		"-e",
		`POSTGRES_PASSWORD=${password}`,
		"-e",
		"POSTGRES_DB=fixture",
		"-e",
		"PGDATA=/var/lib/postgresql/18/docker",
		databaseImage,
		"postgres",
		"-c",
		"shared_buffers=32MB",
		"-c",
		"max_connections=20",
	);
	let ready = false;
	for (let attempt = 0; attempt < 60; attempt++) {
		try {
			docker("exec", database, "pg_isready", "-U", "fixture");
			ready = true;
			break;
		} catch {
			await sleep(1000);
		}
	}
	assert.ok(ready, "Owned IAM fixture readiness failed");
	assert.equal(query("SHOW server_version_num"), "180006");
	assert.equal(query("SHOW fsync"), "on");
	migrate();
	migrate();
	query(
		`INSERT INTO "user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ('synthetic-owner','Synthetic owner','owner@example.invalid',true,now(),now()); INSERT INTO backoffice_member(user_id,role) VALUES ('synthetic-owner','owner'); INSERT INTO backoffice_access_audit(actor_id,action,subject_id) VALUES ('synthetic-owner','invite','synthetic-subject');`,
	);
	const fingerprint = `SELECT md5(string_agg(user_id||':'||role,',' ORDER BY user_id)) FROM backoffice_member; SELECT count(*) FROM backoffice_access_audit;`;
	const before = query(fingerprint);
	const dump = docker(
		"exec",
		database,
		"pg_dump",
		"-U",
		"fixture",
		"-d",
		"fixture",
		"-Fc",
	);
	writeFileSync(`${receipt}/synthetic.dump`, dump, { mode: 0o600 });
	docker("exec", database, "createdb", "-U", "fixture", "restored");
	execFileSync(
		"docker",
		[
			"exec",
			"-i",
			database,
			"pg_restore",
			"-U",
			"fixture",
			"-d",
			"restored",
			"--exit-on-error",
		],
		{ input: dump, timeout: 120_000, stdio: ["pipe", "pipe", "pipe"] },
	);
	assert.equal(query(fingerprint, "restored"), before);
	docker("stop", "--time", "20", database);
	assert.equal(
		docker(
			"inspect",
			database,
			"--format",
			"{{.State.ExitCode}}/{{.State.OOMKilled}}",
		)
			.toString()
			.trim(),
		"0/false",
	);
	docker("start", database);
	for (let attempt = 0; attempt < 60; attempt++) {
		try {
			assert.equal(query(fingerprint, "restored"), before);
			break;
		} catch {
			if (attempt === 59) throw new Error("Owned restarted IAM fixture failed");
			await sleep(1000);
		}
	}
	writeFileSync(
		`${receipt}/verification.json`,
		JSON.stringify({
			synthetic: true,
			server_version: "18.6",
			consistent_logical_restore: true,
			persistent_restart: true,
			migrations_idempotent: true,
			database_image: databaseImage,
			application_image: appImage,
			dump_bytes: dump.length,
		}) + "\n",
		{ mode: 0o600 },
	);
	console.log(
		"Owned PostgreSQL18.6 IAM fixture passed migration, logical restore and persistent restart; no production target contacted.",
	);
} finally {
	for (const args of [
		["rm", "-f", database],
		["network", "rm", network],
		["volume", "rm", volume],
	]) {
		try {
			docker(...args);
		} catch {
			/* Preserve the original failure; exact owned cleanup only. */
		}
	}
}
