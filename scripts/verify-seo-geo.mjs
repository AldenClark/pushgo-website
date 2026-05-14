import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = path.join(root, 'src/content/docs');
const distRoot = path.join(root, 'dist');
const publicRoot = path.join(root, 'public');

const locales = ['root', 'zh', 'zh-tw', 'de', 'fr', 'ja', 'ko', 'es'];
const slugs = [
	'ai-agent-notifications',
	'notification-api',
	'self-hosted-notification-server',
	'devops-notifications',
	'home-automation-notifications',
	'ntfy-bark-serverchan-migration',
];
const blockedPatterns = [
	/pushgo-windows/i,
	/\bWindows\b/,
	/\bComing soon\b/i,
	/\bTBD\b/,
	/\bTODO\b/,
	/\bFIXME\b/,
];

const failures = [];

function fail(message) {
	failures.push(message);
}

async function walk(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		if (entry.name === 'node_modules' || entry.name === 'dist') continue;
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) files.push(...(await walk(fullPath)));
		else files.push(fullPath);
	}
	return files;
}

async function read(file) {
	return readFile(file, 'utf8');
}

for (const locale of locales) {
	const supportFile =
		locale === 'root'
			? path.join(docsRoot, 'support.md')
			: path.join(docsRoot, locale, 'support.md');
	if (!existsSync(supportFile)) fail(`Missing support page: ${supportFile}`);
	for (const slug of slugs) {
		const file =
			locale === 'root'
				? path.join(docsRoot, 'guides', `${slug}.md`)
				: path.join(docsRoot, locale, 'guides', `${slug}.md`);
		if (!existsSync(file)) fail(`Missing SEO/GEO page: ${file}`);
	}
}

for (const file of ['robots.txt', 'llms.txt', 'llms-full.txt', 'og-image.svg', 'og-image.png']) {
	if (!existsSync(path.join(publicRoot, file))) fail(`Missing public SEO asset: ${file}`);
}

if (existsSync(path.join(publicRoot, 'robots.txt'))) {
	const robots = await read(path.join(publicRoot, 'robots.txt'));
	for (const token of ['Sitemap:', 'OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'PerplexityBot', 'ClaudeBot']) {
		if (!robots.includes(token)) fail(`robots.txt missing ${token}`);
	}
}

if (existsSync(path.join(publicRoot, 'llms.txt'))) {
	const llms = await read(path.join(publicRoot, 'llms.txt'));
	const linkCount = [...llms.matchAll(/\]\(https:\/\/pushgo\.dev\//g)].length;
	if (!llms.startsWith('# PushGo')) fail('llms.txt must start with # PushGo');
	if (linkCount < 12 || linkCount > 35) fail(`llms.txt link count looks wrong: ${linkCount}`);
}

for (const file of await walk(path.join(root, 'src'))) {
	const content = await read(file);
	if (blockedPatterns.some((pattern) => pattern.test(content))) fail(`Blocked term found in source: ${file}`);
}
for (const file of await walk(publicRoot)) {
	const content = await read(file);
	if (blockedPatterns.some((pattern) => pattern.test(content))) fail(`Blocked term found in public asset: ${file}`);
}

if (existsSync(distRoot) && (await stat(distRoot)).isDirectory()) {
	const samples = [
		'index.html',
		'support/index.html',
		'guides/ai-agent-notifications/index.html',
		'guides/notification-api/index.html',
		'reference/mcp/index.html',
		'zh/support/index.html',
		'zh/guides/ai-agent-notifications/index.html',
		'de/guides/self-hosted-notification-server/index.html',
	];
	for (const sample of samples) {
		const file = path.join(distRoot, sample);
		if (!existsSync(file)) {
			fail(`Missing built page: ${sample}`);
			continue;
		}
		const html = await read(file);
		for (const token of ['hreflang="x-default"', 'application/ld+json', 'og:image']) {
			if (!html.includes(token)) fail(`${sample} missing ${token}`);
		}
	}
	for (const locale of locales) {
		const supportFile =
			locale === 'root'
				? path.join(distRoot, 'support', 'index.html')
				: path.join(distRoot, locale, 'support', 'index.html');
		if (!existsSync(supportFile)) fail(`Missing built support route: ${supportFile}`);
		for (const slug of slugs) {
			const file =
				locale === 'root'
					? path.join(distRoot, 'guides', slug, 'index.html')
					: path.join(distRoot, locale, 'guides', slug, 'index.html');
			if (!existsSync(file)) fail(`Missing built SEO/GEO route: ${file}`);
		}
	}
}

if (failures.length) {
	console.error(failures.map((message) => `- ${message}`).join('\n'));
	process.exit(1);
}

console.log('SEO/GEO checks passed');
