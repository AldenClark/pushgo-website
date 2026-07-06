import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://pushgo.dev',
	image: {
		service: { entrypoint: 'astro/assets/services/sharp' },
	},
	integrations: [
		starlight({
			title: 'PushGo',
			components: {
				Head: './src/components/SeoHead.astro',
			},
			defaultLocale: 'root',
			locales: {
				root: {
					label: 'English',
					lang: 'en',
				},
				zh: {
					label: '简体中文',
					lang: 'zh',
				},
				'zh-tw': {
					label: '繁體中文',
					lang: 'zh-TW',
				},
			},
			social: [
				{
					icon: 'github',
					href: 'https://github.com/topics/pushgo',
					label: 'GitHub',
				},
			],
			sidebar: [
				{
					label: 'User Guides',
					translations: {
							zh: '用户指南',
							'zh-tw': '使用者指南',
					},
					items: [
						{
							label: 'Introduction',
							link: '/guides/introduction/',
							translations: {
									zh: '简介',
									'zh-tw': '簡介',
							},
						},
						{
							label: 'Getting Started',
							link: '/guides/getting-started/',
							translations: {
									zh: '快速上手',
									'zh-tw': '快速上手',
							},
						},
						{
							label: 'Core Concepts',
							link: '/guides/concepts/',
							translations: {
									zh: '核心概念',
									'zh-tw': '核心概念',
							},
						},
						{
							label: 'Data Models',
							link: '/guides/data-models/',
							translations: {
									zh: '数据模型',
									'zh-tw': '資料模型',
							},
						},
						{
							label: 'Apps',
							link: '/guides/apps/',
							translations: {
									zh: 'App 介绍',
									'zh-tw': 'App 介紹',
							},
						},
						{
							label: 'Use Cases',
							link: '/guides/use-cases/',
							translations: {
									zh: '典型场景',
									'zh-tw': '典型場景',
							},
						},
						{
							label: 'Migration',
							link: '/guides/migration/',
							translations: {
									zh: '迁移指南',
									'zh-tw': '遷移指南',
							},
						},
					],
				},
				{
					label: 'Solutions',
					translations: {
							zh: '解决方案',
							'zh-tw': '解決方案',
					},
					items: [
						{
							label: 'AI Agent Notifications',
							link: '/guides/ai-agent-notifications/',
							translations: {
									zh: 'AI Agent 通知',
									'zh-tw': 'AI Agent 通知',
							},
						},
						{
							label: 'Notification API',
							link: '/guides/notification-api/',
							translations: {
									zh: '通知 API',
									'zh-tw': '通知 API',
							},
						},
						{
							label: 'Self-hosted Notification Server',
							link: '/guides/self-hosted-notification-server/',
							translations: {
									zh: '自托管通知服务器',
									'zh-tw': '自託管通知伺服器',
							},
						},
						{
							label: 'DevOps and CI/CD',
							link: '/guides/devops-notifications/',
							translations: {
									zh: 'DevOps 与 CI/CD',
									'zh-tw': 'DevOps 與 CI/CD',
							},
						},
						{
							label: 'NAS, IoT, Home Assistant',
							link: '/guides/home-automation-notifications/',
							translations: {
									zh: 'NAS、IoT、Home Assistant',
									'zh-tw': 'NAS、IoT、Home Assistant',
							},
						},
						{
							label: 'ntfy, Bark, ServerChan Migration',
							link: '/guides/ntfy-bark-serverchan-migration/',
							translations: {
									zh: 'ntfy、Bark、ServerChan 迁移',
									'zh-tw': 'ntfy、Bark、ServerChan 遷移',
							},
						},
					],
				},
				{
					label: 'Developer API',
					translations: {
							zh: '开发者 API',
							'zh-tw': '開發者 API',
					},
					items: [
						{
							label: 'Authentication',
							link: '/reference/auth/',
							translations: {
									zh: '身份验证',
									'zh-tw': '身分驗證',
							},
						},
							{
								label: 'Message API',
								link: '/reference/api-message/',
								translations: { zh: '消息 API', 'zh-tw': '訊息 API', 'zh-TW': '訊息 API' },
							},
							{
								label: 'Event API',
								link: '/reference/api-event/',
								translations: { zh: '事件 API', 'zh-tw': '事件 API', 'zh-TW': '事件 API' },
							},
							{
								label: 'Thing API',
								link: '/reference/api-thing/',
								translations: { zh: '实体 API', 'zh-tw': '實體 API', 'zh-TW': '實體 API' },
							},
						{
							label: 'End-to-End Encryption',
							link: '/reference/e2ee/',
							translations: {
									zh: '端到端加密 (E2EE)',
									'zh-tw': '端對端加密 (E2EE)',
							},
						},
						{
							label: 'Model Context Protocol (MCP)',
							link: '/reference/mcp/',
							translations: {
									zh: 'AI 模型上下文协议 (MCP)',
									'zh-tw': 'AI 模型上下文協定 (MCP)',
							},
						},
						{
							label: 'Limits & Errors',
							link: '/reference/limits-errors/',
							translations: {
									zh: '限制与错误',
									'zh-tw': '限制與錯誤',
							},
						},
					],
				},
				{
					label: 'Self-Hosting',
					link: '/guides/self-hosting/',
					translations: {
							zh: '私有部署',
							'zh-tw': '私有部署',
					},
				},
				{
					label: 'Technical Support',
					link: '/support/',
					translations: {
							zh: '技术支持',
							'zh-tw': '技術支援',
					},
				},
				{
					label: 'Changelog',
					translations: {
							zh: '更新记录',
							'zh-tw': '更新紀錄',
					},
					items: [
						{
							label: 'Android',
							link: '/changelog/android',
						},
						{
							label: 'Apple (iOS/macOS)',
							link: '/changelog/apple',
						},
						{
							label: 'Gateway',
							link: '/changelog/gateway',
						},
					],
				},
			],
			customCss: ['./src/styles/custom.css'],
		}),
	],
	vite: {
		build: {
			rollupOptions: {
				onwarn(warning, warn) {
					if (
						warning.code === 'UNUSED_EXTERNAL_IMPORT' &&
						warning.exporter === '@astrojs/internal-helpers/remote'
					) {
						return;
					}
					warn(warning);
				},
			},
		},
	},
});
