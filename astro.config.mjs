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
				de: {
					label: 'Deutsch',
					lang: 'de',
				},
				fr: {
					label: 'Français',
					lang: 'fr',
				},
				ja: {
					label: '日本語',
					lang: 'ja',
				},
				ko: {
					label: '한국어',
					lang: 'ko',
				},
				es: {
					label: 'Español',
					lang: 'es',
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
						de: 'Benutzerhandbuch',
						es: 'Guías de usuario',
						fr: 'Guides utilisateur',
							ja: 'ユーザーガイド',
							ko: '사용자 가이드',
							zh: '用户指南',
							'zh-tw': '使用者指南',
							'zh-TW': '使用者指南',
					},
					items: [
						{
							label: 'Introduction',
							link: '/guides/introduction/',
							translations: {
								de: 'Einführung',
								es: 'Introducción',
								fr: 'Introduction',
									ja: '概要',
									ko: '소개',
									zh: '简介',
									'zh-tw': '簡介',
									'zh-TW': '簡介',
							},
						},
						{
							label: 'Getting Started',
							link: '/guides/getting-started/',
							translations: {
								de: 'Erste Schritte',
								es: 'Primeros pasos',
								fr: 'Bien démarrer',
									ja: 'はじめに',
									ko: '시작하기',
									zh: '快速上手',
									'zh-tw': '快速上手',
									'zh-TW': '快速上手',
							},
						},
						{
							label: 'Core Concepts',
							link: '/guides/concepts/',
							translations: {
								de: 'Kernkonzepte',
								es: 'Conceptos clave',
								fr: 'Concepts clés',
									ja: 'コア概念',
									ko: '핵심 개념',
									zh: '核心概念',
									'zh-tw': '核心概念',
									'zh-TW': '核心概念',
							},
						},
						{
							label: 'Data Models',
							link: '/guides/data-models/',
							translations: {
								de: 'Datenmodelle',
								es: 'Modelos de datos',
								fr: 'Modèles de données',
									ja: 'データモデル',
									ko: '데이터 모델',
									zh: '数据模型',
									'zh-tw': '資料模型',
									'zh-TW': '資料模型',
							},
						},
						{
							label: 'Apps',
							link: '/guides/apps/',
							translations: {
								de: 'Apps',
								es: 'Apps',
								fr: 'Apps',
									ja: 'アプリ',
									ko: '앱',
									zh: 'App 介绍',
									'zh-tw': 'App 介紹',
									'zh-TW': 'App 介紹',
							},
						},
						{
							label: 'Use Cases',
							link: '/guides/use-cases/',
							translations: {
								de: 'Anwendungsfälle',
								es: 'Casos de uso',
								fr: 'Cas d’usage',
									ja: 'ユースケース',
									ko: '사용 사례',
									zh: '典型场景',
									'zh-tw': '典型場景',
									'zh-TW': '典型場景',
							},
						},
						{
							label: 'Migration',
							link: '/guides/migration/',
							translations: {
								de: 'Migration',
								es: 'Migración',
								fr: 'Migration',
									ja: '移行',
									ko: '마이그레이션',
									zh: '迁移指南',
									'zh-tw': '遷移指南',
									'zh-TW': '遷移指南',
							},
						},
					],
				},
				{
					label: 'Solutions',
					translations: {
						de: 'Lösungen',
						es: 'Soluciones',
						fr: 'Solutions',
							ja: 'ソリューション',
							ko: '솔루션',
							zh: '解决方案',
							'zh-tw': '解決方案',
							'zh-TW': '解決方案',
					},
					items: [
						{
							label: 'AI Agent Notifications',
							link: '/guides/ai-agent-notifications/',
							translations: {
								de: 'KI-Agent-Benachrichtigungen',
								es: 'Notificaciones de agentes IA',
								fr: 'Notifications agents IA',
									ja: 'AI Agent 通知',
									ko: 'AI Agent 알림',
									zh: 'AI Agent 通知',
									'zh-tw': 'AI Agent 通知',
									'zh-TW': 'AI Agent 通知',
							},
						},
						{
							label: 'Notification API',
							link: '/guides/notification-api/',
							translations: {
								de: 'Notification API',
								es: 'API de notificación',
								fr: 'API de notification',
									ja: '通知 API',
									ko: '알림 API',
									zh: '通知 API',
									'zh-tw': '通知 API',
									'zh-TW': '通知 API',
							},
						},
						{
							label: 'Self-hosted Notification Server',
							link: '/guides/self-hosted-notification-server/',
							translations: {
								de: 'Selbst gehosteter Server',
								es: 'Servidor autoalojado',
								fr: 'Serveur auto-hébergé',
									ja: 'セルフホスト通知サーバー',
									ko: '셀프 호스팅 알림 서버',
									zh: '自托管通知服务器',
									'zh-tw': '自託管通知伺服器',
									'zh-TW': '自託管通知伺服器',
							},
						},
						{
							label: 'DevOps and CI/CD',
							link: '/guides/devops-notifications/',
							translations: {
								de: 'DevOps und CI/CD',
								es: 'DevOps y CI/CD',
								fr: 'DevOps et CI/CD',
									ja: 'DevOps と CI/CD',
									ko: 'DevOps 및 CI/CD',
									zh: 'DevOps 与 CI/CD',
									'zh-tw': 'DevOps 與 CI/CD',
									'zh-TW': 'DevOps 與 CI/CD',
							},
						},
						{
							label: 'NAS, IoT, Home Assistant',
							link: '/guides/home-automation-notifications/',
							translations: {
								de: 'NAS, IoT, Home Assistant',
								es: 'NAS, IoT, Home Assistant',
								fr: 'NAS, IoT, Home Assistant',
									ja: 'NAS、IoT、Home Assistant',
									ko: 'NAS, IoT, Home Assistant',
									zh: 'NAS、IoT、Home Assistant',
									'zh-tw': 'NAS、IoT、Home Assistant',
									'zh-TW': 'NAS、IoT、Home Assistant',
							},
						},
						{
							label: 'ntfy, Bark, ServerChan Migration',
							link: '/guides/ntfy-bark-serverchan-migration/',
							translations: {
								de: 'Migration von ntfy, Bark, ServerChan',
								es: 'Migración desde ntfy, Bark, ServerChan',
								fr: 'Migration depuis ntfy, Bark, ServerChan',
									ja: 'ntfy、Bark、ServerChan 移行',
									ko: 'ntfy, Bark, ServerChan 이전',
									zh: 'ntfy、Bark、ServerChan 迁移',
									'zh-tw': 'ntfy、Bark、ServerChan 遷移',
									'zh-TW': 'ntfy、Bark、ServerChan 遷移',
							},
						},
					],
				},
				{
					label: 'Developer API',
					translations: {
						de: 'Entwickler-API',
						es: 'API para desarrolladores',
						fr: 'API développeur',
							ja: '開発者 API',
							ko: '개발자 API',
							zh: '开发者 API',
							'zh-tw': '開發者 API',
							'zh-TW': '開發者 API',
					},
					items: [
						{
							label: 'Authentication',
							link: '/reference/auth/',
							translations: {
								de: 'Authentifizierung',
								es: 'Autenticación',
								fr: 'Authentification',
									ja: '認証',
									ko: '인증',
									zh: '身份验证',
									'zh-tw': '身分驗證',
									'zh-TW': '身分驗證',
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
								de: 'Ende-zu-Ende-Verschlüsselung',
								es: 'Cifrado de extremo a extremo',
								fr: 'Chiffrement de bout en bout',
									ja: 'エンドツーエンド暗号化',
									ko: '종단 간 암호화',
									zh: '端到端加密 (E2EE)',
									'zh-tw': '端對端加密 (E2EE)',
									'zh-TW': '端對端加密 (E2EE)',
							},
						},
						{
							label: 'Model Context Protocol (MCP)',
							link: '/reference/mcp/',
							translations: {
								de: 'Model Context Protocol (MCP)',
								es: 'Model Context Protocol (MCP)',
								fr: 'Model Context Protocol (MCP)',
									ja: 'Model Context Protocol (MCP)',
									ko: 'Model Context Protocol (MCP)',
									zh: 'AI 模型上下文协议 (MCP)',
									'zh-tw': 'AI 模型上下文協定 (MCP)',
									'zh-TW': 'AI 模型上下文協定 (MCP)',
							},
						},
						{
							label: 'Limits & Errors',
							link: '/reference/limits-errors/',
							translations: {
								de: 'Limits & Fehler',
								es: 'Límites y errores',
								fr: 'Limites et erreurs',
									ja: '制限とエラー',
									ko: '제한 및 오류',
									zh: '限制与错误',
									'zh-tw': '限制與錯誤',
									'zh-TW': '限制與錯誤',
							},
						},
					],
				},
				{
					label: 'Self-Hosting',
					link: '/guides/self-hosting/',
					translations: {
						de: 'Self-Hosting',
						es: 'Autoalojamiento',
						fr: 'Auto-hébergement',
							ja: 'セルフホスティング',
							ko: '셀프 호스팅',
							zh: '私有部署',
							'zh-tw': '私有部署',
							'zh-TW': '私有部署',
					},
				},
				{
					label: 'Changelog',
					translations: {
						de: 'Änderungsprotokoll',
						es: 'Registro de cambios',
						fr: 'Journal des modifications',
							ja: '変更履歴',
							ko: '변경 로그',
							zh: '更新记录',
							'zh-tw': '更新紀錄',
							'zh-TW': '更新紀錄',
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
