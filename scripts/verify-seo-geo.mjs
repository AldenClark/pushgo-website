import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = path.join(root, 'src/content/docs');
const distRoot = path.join(root, 'dist');
const publicRoot = path.join(root, 'public');

const locales = ['root', 'zh', 'zh-tw', 'de', 'fr', 'ja', 'ko', 'es'];
const localizedLocales = locales.filter((locale) => locale !== 'root');
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

function stripFrontmatter(content) {
	return content.replace(/^---[\s\S]*?---\s*/, '');
}

function structureSignature(content) {
	const body = stripFrontmatter(content);
	return {
		headingLevels: [...body.matchAll(/^(#{2,4})\s+(.+)$/gm)].map((match) => match[1].length),
		versionHeadings: [...body.matchAll(/^##\s+(v\d+\.\d+\.\d+)/gm)].map((match) => match[1]),
		codeFences: [...body.matchAll(/^```(\w*)/gm)].map((match) => match[1] || ''),
		cardCount: [...body.matchAll(/<Card\b/g)].length,
		cardGridCount: [...body.matchAll(/<CardGrid\b/g)].length,
		pathCardCount: [...body.matchAll(/class="path-card"/g)].length,
		tableLineCount: [...body.matchAll(/^\|.*\|$/gm)].length,
	};
}

async function docsFilesFor(locale) {
	const base = locale === 'root' ? docsRoot : path.join(docsRoot, locale);
	const files = await walk(base);
	return files
		.filter((file) => /\.(md|mdx)$/.test(file))
		.map((file) => path.relative(base, file))
		.filter((file) => locale !== 'root' || !localizedLocales.some((candidate) => file.startsWith(`${candidate}/`)))
		.sort();
}

function assertSameStructure(baseFile, localeFile, baseSignature, localeSignature) {
	for (const key of Object.keys(baseSignature)) {
		if (JSON.stringify(baseSignature[key]) !== JSON.stringify(localeSignature[key])) {
			fail(`${localeFile} structure differs from ${baseFile}: ${key}`);
		}
	}
}

for (const locale of locales) {
	const supportFile =
		locale === 'root'
			? path.join(docsRoot, 'support.md')
			: path.join(docsRoot, locale, 'support.md');
	if (!existsSync(supportFile)) fail(`Missing support page: ${supportFile}`);

	const indexFile =
		locale === 'root'
			? path.join(docsRoot, 'index.mdx')
			: path.join(docsRoot, locale, 'index.mdx');
	if (!existsSync(indexFile)) {
		fail(`Missing localized homepage: ${indexFile}`);
	} else {
		const indexContent = await read(indexFile);
		const prefix = locale === 'root' ? '' : `/${locale}`;
		const pathCardCount = [...indexContent.matchAll(/class="path-card"/g)].length;
		const whyCardCount = [...indexContent.matchAll(/<Card title=/g)].length;
		for (const token of [
			"import { Card, CardGrid } from '@astrojs/starlight/components';",
			'<div class="hero-columns">',
			'<CardGrid stagger>',
			`${prefix}/guides/ai-agent-notifications/`,
			`${prefix}/guides/notification-api/`,
		]) {
			if (!indexContent.includes(token)) fail(`${indexFile} missing homepage layout token: ${token}`);
		}
		if (pathCardCount !== 8) fail(`${indexFile} should contain 8 path cards, found ${pathCardCount}`);
		if (whyCardCount !== 6) fail(`${indexFile} should contain 6 Why PushGo cards, found ${whyCardCount}`);
	}

	for (const slug of slugs) {
		const file =
			locale === 'root'
				? path.join(docsRoot, 'guides', `${slug}.md`)
				: path.join(docsRoot, locale, 'guides', `${slug}.md`);
		if (!existsSync(file)) fail(`Missing SEO/GEO page: ${file}`);
	}
}

const rootDocsFiles = await docsFilesFor('root');
for (const locale of localizedLocales) {
	const localeDocsFiles = await docsFilesFor(locale);
	if (JSON.stringify(localeDocsFiles) !== JSON.stringify(rootDocsFiles)) {
		fail(`${locale} docs file set differs from root locale`);
		continue;
	}
	for (const relativeFile of rootDocsFiles) {
		const rootFile = path.join(docsRoot, relativeFile);
		const localeFile = path.join(docsRoot, locale, relativeFile);
		assertSameStructure(
			rootFile,
			localeFile,
			structureSignature(await read(rootFile)),
			structureSignature(await read(localeFile)),
		);
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
