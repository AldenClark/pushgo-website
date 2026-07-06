import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = path.join(root, 'src/content/docs');
const publicRoot = path.join(root, 'public');
const SITE = 'https://pushgo.dev';

const localeOrder = ['root', 'zh', 'zh-tw'];
const locales = {
	root: { prefix: '', lang: 'en', name: 'English' },
	zh: { prefix: '/zh', lang: 'zh', name: '简体中文' },
	'zh-tw': { prefix: '/zh-tw', lang: 'zh-TW', name: '繁體中文' },
};

const routeSlugs = [
	'ai-agent-notifications',
	'notification-api',
	'self-hosted-notification-server',
	'devops-notifications',
	'home-automation-notifications',
	'ntfy-bark-serverchan-migration',
];

const ui = {
	root: {
		fits: 'Good Fits',
		next: 'Next steps',
		model: 'How PushGo models this workflow',
		questions: 'Questions this page answers',
		example: 'Minimal example',
		mcp: 'MCP path',
		safety: 'Security and operations',
		read: 'Read next',
		modelHeaders: ['Need', 'Use', 'Why'],
	},
	zh: {
		fits: '适合场景',
		next: '下一步',
		model: 'PushGo 如何建模这个流程',
		questions: '本页直接回答的问题',
		example: '最小示例',
		mcp: 'MCP 路径',
		safety: '安全与运维',
		read: '继续阅读',
		modelHeaders: ['需求', '使用', '原因'],
	},
	'zh-tw': {
		fits: '適合場景',
		next: '下一步',
		model: 'PushGo 如何建模這個流程',
		questions: '本頁直接回答的問題',
		example: '最小範例',
		mcp: 'MCP 路徑',
		safety: '安全與維運',
		read: '繼續閱讀',
		modelHeaders: ['需求', '使用', '原因'],
	},
};

const pageData = {
	root: {
		'ai-agent-notifications': {
			title: 'AI Agent Notifications with MCP',
			description:
				'Send mobile notifications, lifecycle events, and state updates from AI agents and chatbots through PushGo MCP and OAuth.',
			intro:
				'Use PushGo when an AI agent, chatbot, or MCP client needs to notify a user, report long-running progress, or update an operational object without exposing channel passwords to the model.',
			fits: [
				'Notify a user when an agent finishes a long task.',
				'Track agent progress as an Event instead of sending unrelated messages.',
				'Update a Thing when an agent changes the state of a service, device, or task.',
				'Give third-party MCP clients scoped access through OAuth channel binding.',
			],
			rows: [
				['One completion alert', 'Message', 'The user needs one visible notification.'],
				['Long-running agent task', 'Event', 'The same task can be updated and closed.'],
				['Current status of a service or task', 'Thing', 'The agent updates one persistent object.'],
				['Assistant authorization', 'MCP OAuth', 'The model never needs the channel password in tool calls.'],
			],
			example:
				'An MCP client connects to `/mcp`, starts `pushgo.channel.bind.start`, the user authorizes a channel in the browser, and the assistant can call `pushgo.message.send`, `pushgo.event.update`, or `pushgo.thing.update` within that scope.',
			questions: [
				['Can an AI agent send a push notification to my phone?', 'Yes. PushGo exposes MCP tools that let authorized AI agents send Message notifications through a PushGo Gateway.'],
				['Should a chatbot hold my channel password?', 'No. Production integrations should use MCP OAuth so the user binds a channel in the browser and the model receives only scoped tool access.'],
				['How should agents report progress?', 'Use Event for long-running work because it can be created, updated repeatedly, and closed when the task finishes.'],
			],
			links: ['reference/mcp', 'reference/auth', 'guides/data-models'],
		},
		'notification-api': {
			title: 'Push Notification API for Scripts and Services',
			description:
				'Use PushGo as an HTTP notification API for curl, webhooks, cron jobs, CI/CD, NAS alerts, and automation scripts.',
			intro:
				'PushGo provides a direct HTTP API for scripts and services that need reliable user-visible notifications plus structured event and state models.',
			fits: [
				'Send a notification from curl, cron, a shell script, or a webhook.',
				'Report job completion, price alerts, image snapshots, or monitoring results.',
				'Move beyond plain text by modeling lifecycles and entity state.',
				'Keep using compatibility endpoints while migrating to native PushGo APIs.',
			],
			rows: [
				['One alert from a script', 'Message', 'It is simple, transient, and easy to test with curl.'],
				['Job with progress', 'Event', 'The same event can be updated until completion.'],
				['Current state of a device or service', 'Thing', 'Clients see the latest state instead of many stale notifications.'],
			],
			example: 'The native `/message` endpoint accepts JSON and returns whether the Gateway accepted the request into dispatch.',
			questions: [
				['Can I send a notification with curl?', 'Yes. The Message API is designed to be callable from curl, scripts, and simple HTTP clients.'],
				['Is PushGo only a phone notification API?', 'No. PushGo also models Event lifecycles and Thing state so automation history remains structured.'],
				['Can I self-host the API?', 'Yes. You can run your own Gateway and keep authentication, storage, transports, and MCP/OAuth under your control.'],
			],
			links: ['guides/getting-started', 'reference/api-message', 'guides/self-hosting'],
		},
		'self-hosted-notification-server': {
			title: 'Self-hosted Open-source Notification Server',
			description:
				'Deploy PushGo Gateway as a self-hosted open-source notification server with private transports, persistent state, E2EE, and MCP/OAuth.',
			intro:
				'Self-host PushGo when you want the notification path, data storage, Gateway authentication, private transport policy, and MCP/OAuth endpoint to stay under your control.',
			fits: [
				'Operate a private notification Gateway for personal or team automation.',
				'Keep notification, event, and entity-state data out of a public Gateway.',
				'Expose your own HTTPS `/mcp` endpoint for AI assistant workflows.',
				'Use backups, reverse proxies, logs, and observability as part of production operations.',
			],
			rows: [
				['Private delivery path', 'Gateway', 'Your infrastructure controls the HTTP API and transport listeners.'],
				['Sensitive fields', 'E2EE', 'Clients decrypt sensitive payload fields locally.'],
				['AI assistant access', 'MCP OAuth', 'Users bind channels through your public Gateway URL.'],
			],
			example:
				'Set `PUSHGO_PUBLIC_BASE_URL` to the externally reachable HTTPS origin before enabling MCP/OAuth, otherwise issuer metadata and bind links may contain internal addresses.',
			questions: [
				['Can PushGo run as a self-hosted notification server?', 'Yes. The Gateway is designed for private deployment with persistent storage and configurable transport listeners.'],
				['Does self-hosting enable MCP?', 'Yes. A private Gateway can expose `/mcp` and OAuth routes when configured with a public HTTPS base URL.'],
				['Do I still need backups?', 'Yes. Channels, devices, MCP grants, Event state, and Thing state depend on persistent storage.'],
			],
			links: ['guides/self-hosting', 'reference/e2ee', 'reference/mcp'],
		},
		'devops-notifications': {
			title: 'DevOps and CI/CD Notifications',
			description:
				'Use PushGo for CI/CD, deployment, incident, server, and monitoring notifications with Message, Event, and Thing models.',
			intro:
				'DevOps notifications are easier to understand when one-off alerts, incident lifecycles, and service state are modeled separately instead of becoming a long stream of plain text.',
			fits: [
				'Send build, deployment, and release notifications.',
				'Track incident progress as an updatable Event.',
				'Show the current status of a service, queue, backup job, or host as a Thing.',
				'Route alerts to Apple and Android clients through the public Gateway or your own Gateway.',
			],
			rows: [
				['Build finished', 'Message', 'One visible alert is enough.'],
				['Deployment in progress', 'Event', 'The same lifecycle can move from started to failed or completed.'],
				['Service health', 'Thing', 'The object has a current status that changes over time.'],
			],
			example:
				'Use Message for simple pipeline completion. Use Event when a deployment has multiple updates. Use Thing when users should see the current state of a service rather than a list of historical alerts.',
			questions: [
				['Is PushGo suitable for CI/CD notifications?', 'Yes. CI/CD systems can call the HTTP API directly from shell steps or webhook actions.'],
				['How should incidents be represented?', 'Use Event so the incident can be updated and closed instead of creating unrelated notifications.'],
				['Can teams self-host DevOps notifications?', 'Yes. A private Gateway lets teams control data paths, authentication, and operational policy.'],
			],
			links: ['guides/data-models', 'reference/api-event', 'guides/self-hosting'],
		},
		'home-automation-notifications': {
			title: 'NAS, IoT, and Home Assistant Notifications',
			description:
				'Use PushGo for NAS alerts, IoT devices, Home Assistant automations, and long-lived device state updates.',
			intro:
				'Home automation and device monitoring often need more than a one-time alert. PushGo lets automations send notifications, track events, and maintain the current state of devices or services.',
			fits: [
				'Send NAS disk, backup, and service alerts to mobile and desktop clients.',
				'Report Home Assistant automations through a webhook-style HTTP request.',
				'Represent a device, sensor, backup job, or media service as a Thing.',
				'Use private Gateway deployment when home data should stay under your control.',
			],
			rows: [
				['Doorbell snapshot or disk warning', 'Message', 'The content is a single alert.'],
				['Backup or media scan progress', 'Event', 'Progress can update until completion.'],
				['Sensor or device state', 'Thing', 'The latest state matters more than every past update.'],
			],
			example:
				'A NAS script can call `/message` for disk warnings, while a backup job can create an Event and update it until it succeeds or fails.',
			questions: [
				['Can PushGo receive Home Assistant webhook notifications?', 'Yes. Home Assistant automations can call PushGo HTTP APIs through webhook or REST actions.'],
				['How do I avoid repeated stale device notifications?', 'Use Thing for device or service state so clients can show the current object state.'],
				['Can this run on a private network?', 'Yes. Self-host the Gateway when the data path or transport policy should remain private.'],
			],
			links: ['guides/use-cases', 'reference/api-thing', 'guides/self-hosting'],
		},
		'ntfy-bark-serverchan-migration': {
			title: 'Migrate from ntfy, Bark, or ServerChan',
			description:
				'Migrate existing ntfy, Bark, ServerChan, or webhook notification scripts to PushGo with compatibility endpoints and native models.',
			intro:
				'PushGo can receive existing notification-style workflows while you gradually move important paths to native Message, Event, and Thing models.',
			fits: [
				'Keep simple scripts working while you evaluate PushGo.',
				'Move one alert path at a time instead of rewriting every automation.',
				'Replace plain text messages with structured lifecycles or entity state where useful.',
				'Use E2EE and self-hosting when the migrated workflow carries sensitive data.',
			],
			rows: [
				['Simple migrated alert', 'Message', 'The old notification stays as a one-off message.'],
				['Workflow with status changes', 'Event', 'Repeated updates belong to one lifecycle.'],
				['Long-lived monitored object', 'Thing', 'The same entity can be updated over time.'],
			],
			example:
				'Start by migrating low-risk scripts to compatibility endpoints, then move workflows that need richer semantics to native `/message`, `/event/*`, or `/thing/*` APIs.',
			questions: [
				['Do I need to rewrite every script immediately?', 'No. Use compatibility endpoints and migrate high-value workflows first.'],
				['When should I stop using plain text notifications?', 'When the workflow has progress, closing, current state, images, metadata, or security requirements.'],
				['Is this a direct feature comparison?', 'No. Treat migration as a modeling decision: keep simple alerts simple and upgrade workflows that benefit from structure.'],
			],
			links: ['guides/migration', 'reference/api-message', 'guides/data-models'],
		},
	},
};

const localizedOverrides = {
	zh: {
		'ai-agent-notifications': {
			title: '面向 AI Agent 的 MCP 通知',
			description: '通过 PushGo MCP 和 OAuth，让 AI agent、聊天机器人和 MCP 客户端发送通知、更新事件和同步状态。',
			intro: '当 AI agent、聊天机器人或 MCP 客户端需要通知用户、报告长任务进度，或更新一个服务/设备/任务状态时，可以用 PushGo 建立一条清晰的通知路径，并避免让模型直接持有 Channel 密码。',
			fits: ['Agent 完成长任务后通知用户。', '把 Agent 进度记录为可更新的 Event。', '当 Agent 改变服务、设备或任务状态时更新 Thing。', '通过 OAuth Channel 绑定给第三方 MCP 客户端授权。'],
			questions: [['AI agent 可以给我的手机发送推送通知吗？', '可以。PushGo 提供 MCP 工具，授权后的 AI agent 可以通过 Gateway 发送 Message 通知。'], ['聊天机器人应该保存我的 Channel 密码吗？', '不应该。生产环境应使用 MCP OAuth，由用户在浏览器里绑定 Channel，模型只获得受限工具访问权。'], ['Agent 应该如何报告进度？', '长任务使用 Event，因为它可以创建、反复更新，并在任务结束时关闭。']],
		},
		'notification-api': {
			title: '面向脚本和服务的推送通知 API',
			description: '把 PushGo 用作 curl、Webhook、cron、CI/CD、NAS 告警和自动化脚本的 HTTP 通知 API。',
			intro: 'PushGo 提供直接可调用的 HTTP API，适合需要把脚本、服务和自动化结果可靠送达用户的场景，同时也支持结构化的事件和状态模型。',
			fits: ['从 curl、cron、Shell 脚本或 Webhook 发送通知。', '报告任务完成、价格提醒、图片快照或监控结果。', '用 Event 和 Thing 替代不断堆积的纯文本通知。', '先保留兼容接口，再迁移到 PushGo 原生 API。'],
			questions: [['可以用 curl 发送通知吗？', '可以。Message API 本来就适合从 curl、脚本和简单 HTTP 客户端调用。'], ['PushGo 只是手机通知 API 吗？', '不是。PushGo 还可以表达 Event 生命周期和 Thing 当前状态。'], ['这个 API 可以私有部署吗？', '可以。你可以运行自己的 Gateway，并控制鉴权、存储、通道和 MCP/OAuth。']],
		},
		'self-hosted-notification-server': {
			title: '开源自托管通知服务器',
			description: '将 PushGo Gateway 部署为自托管通知服务器，支持私有通道、持久状态、E2EE 和 MCP/OAuth。',
			intro: '当你希望通知路径、数据存储、Gateway 鉴权、私有通道策略和 MCP/OAuth 入口都由自己控制时，可以私有部署 PushGo。',
			fits: ['为个人或团队自动化运行私有通知 Gateway。', '避免通知、事件和实体状态经过公共 Gateway。', '在自己的域名下暴露 HTTPS `/mcp` 端点。', '把备份、反向代理、日志和可观测性纳入生产运维。'],
			questions: [['PushGo 可以作为自托管通知服务器运行吗？', '可以。Gateway 面向私有部署设计，支持持久存储和可配置通道。'], ['自托管后可以启用 MCP 吗？', '可以。配置外部 HTTPS 根地址后，私有 Gateway 可以开放 `/mcp` 和 OAuth 路由。'], ['还需要备份吗？', '需要。Channel、设备、MCP 授权、Event 和 Thing 状态都依赖持久化存储。']],
		},
	},
	'zh-tw': {
		'ai-agent-notifications': {
			title: '面向 AI Agent 的 MCP 通知',
			description: '透過 PushGo MCP 和 OAuth，讓 AI agent、聊天機器人和 MCP 用戶端傳送通知、更新事件並同步狀態。',
			intro: '當 AI agent、聊天機器人或 MCP 用戶端需要通知使用者、回報長任務進度，或更新服務/裝置/任務狀態時，可以用 PushGo 建立清楚的通知路徑，並避免讓模型直接持有 Channel 密碼。',
			fits: ['Agent 完成長任務後通知使用者。', '把 Agent 進度記錄為可更新的 Event。', '當 Agent 改變服務、裝置或任務狀態時更新 Thing。', '透過 OAuth Channel 綁定授權第三方 MCP 用戶端。'],
			questions: [['AI agent 可以向我的手機傳送推播通知嗎？', '可以。PushGo 提供 MCP 工具，授權後的 AI agent 可以透過 Gateway 傳送 Message 通知。'], ['聊天機器人應該保存我的 Channel 密碼嗎？', '不應該。生產環境應使用 MCP OAuth，由使用者在瀏覽器中綁定 Channel。'], ['Agent 應該如何回報進度？', '長任務使用 Event，因為它可以建立、反覆更新，並在任務結束時關閉。']],
		},
	},
};

Object.assign(localizedOverrides.zh, {
	'notification-api': {
		title: '面向脚本和服务的推送通知 API',
		description: '把 PushGo 用作 curl、Webhook、cron、CI/CD、NAS 告警和自动化脚本的 HTTP 通知 API。',
		intro: 'PushGo 提供直接可调用的 HTTP API，适合把脚本、服务和自动化结果可靠送达用户，同时保留事件和状态的结构化语义。',
		fits: ['从 curl、cron、Shell 脚本或 Webhook 发送通知。', '报告任务完成、价格提醒、图片快照或监控结果。', '用 Event 和 Thing 替代不断堆积的纯文本通知。', '先使用兼容接口，再逐步迁移到 PushGo 原生 API。'],
		rows: [['一次脚本告警', 'Message', '简单、瞬时，适合用 curl 测试。'], ['带进度的任务', 'Event', '同一个事件可以持续更新到完成。'], ['设备或服务当前状态', 'Thing', '客户端看到最新状态，而不是一串过期通知。']],
		example: '原生 `/message` 端点接收 JSON，并返回 Gateway 是否已经把请求受理进分发流程。',
		questions: [['可以用 curl 发送通知吗？', '可以。Message API 适合从 curl、脚本和简单 HTTP 客户端调用。'], ['PushGo 只是手机通知 API 吗？', '不是。PushGo 还可以表达 Event 生命周期和 Thing 当前状态。'], ['这个 API 可以私有部署吗？', '可以。你可以运行自己的 Gateway，并控制鉴权、存储、通道和 MCP/OAuth。']],
	},
	'self-hosted-notification-server': {
		title: '开源自托管通知服务器',
		description: '将 PushGo Gateway 部署为自托管通知服务器，支持私有通道、持久状态、E2EE 和 MCP/OAuth。',
		intro: '当你希望通知路径、数据存储、Gateway 鉴权、私有通道策略和 MCP/OAuth 入口都由自己控制时，可以私有部署 PushGo。',
		fits: ['为个人或团队自动化运行私有通知 Gateway。', '避免通知、事件和实体状态经过公共 Gateway。', '在自己的域名下暴露 HTTPS `/mcp` 端点。', '把备份、反向代理、日志和可观测性纳入生产运维。'],
		rows: [['私有投递路径', 'Gateway', '你的基础设施控制 HTTP API 和通道监听。'], ['敏感字段', 'E2EE', '客户端在本地解密敏感字段。'], ['AI 助手访问', 'MCP OAuth', '用户通过公开 Gateway URL 绑定 Channel。']],
		example: '启用 MCP/OAuth 前，先把 `PUSHGO_PUBLIC_BASE_URL` 设置为外部可访问的 HTTPS 根地址，否则 issuer 元数据和绑定链接可能包含内部地址。',
		questions: [['PushGo 可以作为自托管通知服务器运行吗？', '可以。Gateway 面向私有部署设计，支持持久存储和可配置通道。'], ['自托管后可以启用 MCP 吗？', '可以。配置外部 HTTPS 根地址后，私有 Gateway 可以开放 `/mcp` 和 OAuth 路由。'], ['还需要备份吗？', '需要。Channel、设备、MCP 授权、Event 和 Thing 状态都依赖持久化存储。']],
	},
	'devops-notifications': {
		title: 'DevOps 与 CI/CD 通知',
		description: '用 PushGo 处理 CI/CD、部署、故障、服务器和监控通知，并用 Message、Event、Thing 建模。',
		intro: 'DevOps 通知如果全部写成纯文本，很容易变成不可读的信息流。PushGo 把一次性告警、故障生命周期和服务当前状态分开建模。',
		fits: ['发送构建、部署和发布通知。', '把故障处理过程记录为可更新的 Event。', '把服务、队列、备份任务或主机状态展示为 Thing。', '通过公共 Gateway 或私有 Gateway 投递到 Apple 和 Android 客户端。'],
		rows: [['构建完成', 'Message', '只需要一条可见提醒。'], ['部署进行中', 'Event', '同一个生命周期可以从开始更新到失败或完成。'], ['服务健康状态', 'Thing', '对象有随时间变化的当前状态。']],
		example: '流水线完成用 Message；部署过程有多次状态变化时用 Event；用户更关心服务当前状态时用 Thing。',
		questions: [['PushGo 适合 CI/CD 通知吗？', '适合。CI/CD 系统可以在 shell step 或 webhook action 中直接调用 HTTP API。'], ['故障应该如何表达？', '用 Event，让同一故障可以持续更新并关闭，而不是产生很多无关通知。'], ['团队可以私有部署 DevOps 通知吗？', '可以。私有 Gateway 可以控制数据路径、鉴权和运维策略。']],
	},
	'home-automation-notifications': {
		title: 'NAS、IoT 与 Home Assistant 通知',
		description: '用 PushGo 处理 NAS 告警、IoT 设备、Home Assistant 自动化和长期设备状态更新。',
		intro: '家庭自动化和设备监控通常不只是一次提醒。PushGo 可以发送通知、跟踪事件，并维护设备或服务的当前状态。',
		fits: ['把 NAS 磁盘、备份和服务告警发送到手机和桌面端。', '通过 webhook 风格的 HTTP 请求接入 Home Assistant 自动化。', '把设备、传感器、备份任务或媒体服务建模为 Thing。', '当家庭数据需要自己掌控时使用私有 Gateway。'],
		rows: [['门铃快照或磁盘告警', 'Message', '内容是一条单次提醒。'], ['备份或媒体扫描进度', 'Event', '进度可以持续更新到完成。'], ['传感器或设备状态', 'Thing', '最新状态比每次历史更新更重要。']],
		example: 'NAS 脚本可以用 `/message` 发送磁盘告警；备份任务可以创建 Event，并持续更新到成功或失败。',
		questions: [['PushGo 可以接收 Home Assistant webhook 通知吗？', '可以。Home Assistant 自动化可以通过 webhook 或 REST action 调用 PushGo HTTP API。'], ['如何避免重复的过期设备通知？', '用 Thing 表达设备或服务状态，让客户端显示同一个对象的当前状态。'], ['可以在私有网络里运行吗？', '可以。需要控制数据路径或通道策略时，可以私有部署 Gateway。']],
	},
	'ntfy-bark-serverchan-migration': {
		title: '从 ntfy、Bark 或 ServerChan 迁移',
		description: '通过兼容接口和原生模型，把现有 ntfy、Bark、ServerChan 或 Webhook 通知脚本迁移到 PushGo。',
		intro: 'PushGo 可以先接住现有通知式流程，再逐步把重要路径迁移到原生 Message、Event 和 Thing 模型。',
		fits: ['评估 PushGo 时先保持简单脚本继续工作。', '一次迁移一条告警路径，而不是重写所有自动化。', '把纯文本消息升级为结构化生命周期或实体状态。', '在敏感流程中结合 E2EE 和私有部署。'],
		rows: [['简单迁移告警', 'Message', '旧通知保持为一次性消息。'], ['有状态变化的流程', 'Event', '多次更新应属于同一个生命周期。'], ['长期监控对象', 'Thing', '同一个实体可以随时间更新。']],
		example: '先把低风险脚本迁移到兼容接口；需要更强语义的流程，再迁移到原生 `/message`、`/event/*` 或 `/thing/*` API。',
		questions: [['必须马上重写所有脚本吗？', '不需要。可以先使用兼容接口，优先迁移高价值流程。'], ['什么时候不该继续用纯文本通知？', '当流程有进度、关闭、当前状态、图片、元数据或安全要求时，应升级到原生模型。'], ['这是直接功能对比吗？', '不是。迁移应按建模需求判断：简单提醒保持简单，需要结构的流程再升级。']],
	},
});

Object.assign(localizedOverrides['zh-tw'], {
	'notification-api': {
		title: '面向指令碼和服務的推播通知 API',
		description: '把 PushGo 用作 curl、Webhook、cron、CI/CD、NAS 告警和自動化指令碼的 HTTP 通知 API。',
		intro: 'PushGo 提供可直接呼叫的 HTTP API，適合把指令碼、服務和自動化結果可靠送達使用者，同時保留事件和狀態的結構化語義。',
		fits: ['從 curl、cron、Shell 指令碼或 Webhook 傳送通知。', '回報任務完成、價格提醒、圖片快照或監控結果。', '用 Event 和 Thing 取代不斷堆積的純文字通知。', '先使用相容介面，再逐步遷移到 PushGo 原生 API。'],
		rows: [['一次指令碼告警', 'Message', '簡單、瞬時，適合用 curl 測試。'], ['帶進度的任務', 'Event', '同一個事件可以持續更新到完成。'], ['裝置或服務目前狀態', 'Thing', '用戶端看到最新狀態，而不是一串過期通知。']],
		example: '原生 `/message` 端點接收 JSON，並回傳 Gateway 是否已將請求受理進分發流程。',
		questions: [['可以用 curl 傳送通知嗎？', '可以。Message API 適合從 curl、指令碼和簡單 HTTP 用戶端呼叫。'], ['PushGo 只是手機通知 API 嗎？', '不是。PushGo 還可以表達 Event 生命週期和 Thing 目前狀態。'], ['這個 API 可以私人部署嗎？', '可以。你可以執行自己的 Gateway，並控制驗證、儲存、通道和 MCP/OAuth。']],
	},
	'self-hosted-notification-server': {
		title: '開源自託管通知伺服器',
		description: '將 PushGo Gateway 部署為自託管通知伺服器，支援私人通道、持久狀態、E2EE 和 MCP/OAuth。',
		intro: '當你希望通知路徑、資料儲存、Gateway 驗證、私人通道策略和 MCP/OAuth 入口都由自己控制時，可以私人部署 PushGo。',
		fits: ['為個人或團隊自動化執行私人通知 Gateway。', '避免通知、事件和實體狀態經過公共 Gateway。', '在自己的網域下暴露 HTTPS `/mcp` 端點。', '把備份、反向代理、日誌和可觀測性納入生產維運。'],
		rows: [['私人投遞路徑', 'Gateway', '你的基礎設施控制 HTTP API 和通道監聽。'], ['敏感欄位', 'E2EE', '用戶端在本機解密敏感欄位。'], ['AI 助理存取', 'MCP OAuth', '使用者透過公開 Gateway URL 綁定 Channel。']],
		example: '啟用 MCP/OAuth 前，先把 `PUSHGO_PUBLIC_BASE_URL` 設定為外部可存取的 HTTPS 根位址，否則 issuer 中繼資料和綁定連結可能包含內部位址。',
		questions: [['PushGo 可以作為自託管通知伺服器執行嗎？', '可以。Gateway 面向私人部署設計，支援持久儲存和可設定通道。'], ['自託管後可以啟用 MCP 嗎？', '可以。設定外部 HTTPS 根位址後，私人 Gateway 可以開放 `/mcp` 和 OAuth 路由。'], ['還需要備份嗎？', '需要。Channel、裝置、MCP 授權、Event 和 Thing 狀態都依賴持久化儲存。']],
	},
	'devops-notifications': {
		title: 'DevOps 與 CI/CD 通知',
		description: '用 PushGo 處理 CI/CD、部署、故障、伺服器和監控通知，並用 Message、Event、Thing 建模。',
		intro: 'DevOps 通知如果全部寫成純文字，很容易變成不可讀的資訊流。PushGo 把一次性告警、故障生命週期和服務目前狀態分開建模。',
		fits: ['傳送建置、部署和發佈通知。', '把故障處理過程記錄為可更新的 Event。', '把服務、佇列、備份任務或主機狀態展示為 Thing。', '透過公共 Gateway 或私人 Gateway 投遞到 Apple 和 Android 用戶端。'],
		rows: [['建置完成', 'Message', '只需要一條可見提醒。'], ['部署進行中', 'Event', '同一個生命週期可以從開始更新到失敗或完成。'], ['服務健康狀態', 'Thing', '物件有隨時間變化的目前狀態。']],
		example: '管線完成用 Message；部署過程有多次狀態變化時用 Event；使用者更關心服務目前狀態時用 Thing。',
		questions: [['PushGo 適合 CI/CD 通知嗎？', '適合。CI/CD 系統可以在 shell step 或 webhook action 中直接呼叫 HTTP API。'], ['故障應該如何表達？', '用 Event，讓同一故障可以持續更新並關閉，而不是產生很多無關通知。'], ['團隊可以私人部署 DevOps 通知嗎？', '可以。私人 Gateway 可以控制資料路徑、驗證和維運策略。']],
	},
	'home-automation-notifications': {
		title: 'NAS、IoT 與 Home Assistant 通知',
		description: '用 PushGo 處理 NAS 告警、IoT 裝置、Home Assistant 自動化和長期裝置狀態更新。',
		intro: '家庭自動化和裝置監控通常不只是一次提醒。PushGo 可以傳送通知、追蹤事件，並維護裝置或服務的目前狀態。',
		fits: ['把 NAS 磁碟、備份和服務告警傳送到手機和桌面端。', '透過 webhook 風格的 HTTP 請求接入 Home Assistant 自動化。', '把裝置、感測器、備份任務或媒體服務建模為 Thing。', '當家庭資料需要自己掌控時使用私人 Gateway。'],
		rows: [['門鈴快照或磁碟告警', 'Message', '內容是一條單次提醒。'], ['備份或媒體掃描進度', 'Event', '進度可以持續更新到完成。'], ['感測器或裝置狀態', 'Thing', '最新狀態比每次歷史更新更重要。']],
		example: 'NAS 指令碼可以用 `/message` 傳送磁碟告警；備份任務可以建立 Event，並持續更新到成功或失敗。',
		questions: [['PushGo 可以接收 Home Assistant webhook 通知嗎？', '可以。Home Assistant 自動化可以透過 webhook 或 REST action 呼叫 PushGo HTTP API。'], ['如何避免重複的過期裝置通知？', '用 Thing 表達裝置或服務狀態，讓用戶端顯示同一個物件的目前狀態。'], ['可以在私人網路裡執行嗎？', '可以。需要控制資料路徑或通道策略時，可以私人部署 Gateway。']],
	},
	'ntfy-bark-serverchan-migration': {
		title: '從 ntfy、Bark 或 ServerChan 遷移',
		description: '透過相容介面和原生模型，把現有 ntfy、Bark、ServerChan 或 Webhook 通知指令碼遷移到 PushGo。',
		intro: 'PushGo 可以先接住現有通知式流程，再逐步把重要路徑遷移到原生 Message、Event 和 Thing 模型。',
		fits: ['評估 PushGo 時先保持簡單指令碼繼續工作。', '一次遷移一條告警路徑，而不是重寫所有自動化。', '把純文字訊息升級為結構化生命週期或實體狀態。', '在敏感流程中結合 E2EE 和私人部署。'],
		rows: [['簡單遷移告警', 'Message', '舊通知保持為一次性訊息。'], ['有狀態變化的流程', 'Event', '多次更新應屬於同一個生命週期。'], ['長期監控物件', 'Thing', '同一個實體可以隨時間更新。']],
		example: '先把低風險指令碼遷移到相容介面；需要更強語義的流程，再遷移到原生 `/message`、`/event/*` 或 `/thing/*` API。',
		questions: [['必須馬上重寫所有指令碼嗎？', '不需要。可以先使用相容介面，優先遷移高價值流程。'], ['什麼時候不該繼續用純文字通知？', '當流程有進度、關閉、目前狀態、圖片、中繼資料或安全要求時，應升級到原生模型。'], ['這是直接功能比較嗎？', '不是。遷移應按建模需求判斷：簡單提醒保持簡單，需要結構的流程再升級。']],
	},
});

Object.assign(localizedOverrides.zh['ai-agent-notifications'], {
	rows: [['一次完成提醒', 'Message', '用户只需要一条可见通知。'], ['长时间运行的 Agent 任务', 'Event', '同一个任务可以持续更新并关闭。'], ['服务或任务当前状态', 'Thing', 'Agent 更新同一个持久对象。'], ['助手授权', 'MCP OAuth', '模型不需要在工具调用中持有 Channel 密码。']],
	example: 'MCP 客户端连接 `/mcp`，启动 `pushgo.channel.bind.start`，用户在浏览器里授权 Channel，之后助手即可在该权限范围内调用 `pushgo.message.send`、`pushgo.event.update` 或 `pushgo.thing.update`。',
});

Object.assign(localizedOverrides['zh-tw']['ai-agent-notifications'], {
	rows: [['一次完成提醒', 'Message', '使用者只需要一條可見通知。'], ['長時間執行的 Agent 任務', 'Event', '同一個任務可以持續更新並關閉。'], ['服務或任務目前狀態', 'Thing', 'Agent 更新同一個持久物件。'], ['助理授權', 'MCP OAuth', '模型不需要在工具呼叫中持有 Channel 密碼。']],
	example: 'MCP 用戶端連接 `/mcp`，啟動 `pushgo.channel.bind.start`，使用者在瀏覽器裡授權 Channel，之後助理即可在該權限範圍內呼叫 `pushgo.message.send`、`pushgo.event.update` 或 `pushgo.thing.update`。',
});

function clone(value) {
	return JSON.parse(JSON.stringify(value));
}

function page(locale, slug) {
	const base = clone(pageData.root[slug]);
	const override = localizedOverrides[locale]?.[slug] ?? {};
	return { ...base, ...override };
}

function link(locale, route) {
	const prefix = locales[locale].prefix;
	return `${prefix}/${route}/`.replace('//', '/');
}

function frontmatter(data) {
	return `---\ntitle: ${data.title}\ndescription: ${data.description}\n---\n\n`;
}

function table(headers, rows) {
	return [
		`| ${headers.join(' | ')} |`,
		`| ${headers.map(() => ':---').join(' | ')} |`,
		...rows.map((row) => `| ${row.join(' | ')} |`),
	].join('\n');
}

function codeExample(locale, slug) {
	const titles = {
		root: 'Hello from PushGo',
		zh: '来自 PushGo 的通知',
		'zh-tw': '來自 PushGo 的通知',
	};
	const bodies = {
		root: 'The automation path is working.',
		zh: '自动化通知路径已经打通。',
		'zh-tw': '自動化通知路徑已經打通。',
	};
	if (slug === 'ai-agent-notifications') {
		return '```text\npushgo.channel.bind.start -> user opens bind_url -> pushgo.message.send\n```';
	}
	return `\`\`\`bash\ncurl -X POST https://gateway.pushgo.dev/message \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "channel_id": "YOUR_CHANNEL_ID",\n    "password": "YOUR_CHANNEL_PASSWORD",\n    "title": "${titles[locale]}",\n    "body": "${bodies[locale]}"\n  }'\n\`\`\``;
}

function safetyBullets(locale) {
	const bullets = {
		root: [
			'Prefer scoped credentials and separate Channels for high-risk automation.',
			'Use MCP OAuth for AI assistants so models do not directly hold Channel passwords.',
			'Use self-hosting when the data path, transport policy, or compliance boundary must stay under your control.',
			'Use E2EE for sensitive fields that should be decrypted only by clients.',
		],
		zh: [
			'高风险自动化应使用独立 Channel 和受限凭据。',
			'AI 助手应优先使用 MCP OAuth，避免模型直接持有 Channel 密码。',
			'当数据路径、通道策略或合规边界必须自行控制时，使用私有部署。',
			'敏感字段应使用 E2EE，让客户端本地解密。',
		],
			'zh-tw': [
				'高風險自動化應使用獨立 Channel 和受限憑據。',
				'AI 助理應優先使用 MCP OAuth，避免模型直接持有 Channel 密碼。',
				'當資料路徑、通道策略或合規邊界必須自行控制時，使用私人部署。',
				'敏感欄位應使用 E2EE，讓用戶端本機解密。',
			],
		};
	return bullets[locale].map((item) => `- ${item}`).join('\n');
}

function linkTitle(locale, route) {
	const existing = {
			'guides/getting-started': {
				root: 'Getting Started',
				zh: '快速上手',
				'zh-tw': '快速上手',
			},
			'guides/data-models': {
				root: 'Data Models',
				zh: '数据模型',
				'zh-tw': '資料模型',
			},
			'guides/self-hosting': {
				root: 'Self-Hosting',
				zh: '私有部署',
				'zh-tw': '私人部署',
			},
			'guides/use-cases': {
				root: 'Use Cases',
				zh: '典型场景',
				'zh-tw': '典型場景',
			},
			'guides/migration': {
				root: 'Migration Guide',
				zh: '迁移指南',
				'zh-tw': '遷移指南',
			},
			'reference/mcp': {
				root: 'MCP Reference',
				zh: 'MCP 参考',
				'zh-tw': 'MCP 參考',
			},
			'reference/auth': {
				root: 'Authentication',
				zh: '身份验证',
				'zh-tw': '身分驗證',
			},
			'reference/api-message': {
				root: 'Message API',
				zh: '消息 API',
				'zh-tw': '訊息 API',
			},
			'reference/api-event': {
				root: 'Event API',
				zh: '事件 API',
				'zh-tw': '事件 API',
			},
			'reference/api-thing': {
				root: 'Thing API',
				zh: '实体 API',
				'zh-tw': '實體 API',
			},
			'reference/e2ee': {
				root: 'End-to-End Encryption',
				zh: '端到端加密',
				'zh-tw': '端對端加密',
			},
		};
	const generatedSlug = route.replace(/^guides\//, '');
	if (routeSlugs.includes(generatedSlug)) return page(locale, generatedSlug).title;
	return existing[route]?.[locale] ?? existing[route]?.root ?? route;
}

function renderPage(locale, slug) {
	const data = page(locale, slug);
	const labels = ui[locale];
	const relatedLinks = data.links
		.map((route) => `- [${linkTitle(locale, route)}](${link(locale, route)})`)
		.join('\n');
	const questions = data.questions
		.map(([q, a]) => `- **${q}** ${a}`)
		.join('\n');
	return `${frontmatter(data)}${data.intro}\n\n## ${labels.fits}\n\n${data.fits
		.map((item) => `- ${item}`)
		.join('\n')}\n\n## ${labels.model}\n\n${table(labels.modelHeaders, data.rows)}\n\n## ${labels.example}\n\n${data.example}\n\n${codeExample(locale, slug)}\n\n## ${labels.questions}\n\n${questions}\n\n## ${labels.safety}\n\n${safetyBullets(locale)}\n\n## ${labels.next}\n\n${relatedLinks}\n`;
}

function localizedCards(locale) {
	const cards = {
		root: [
			['AI agent path', 'AI Agent Notifications', 'Use MCP and OAuth so agents and chatbots can notify users, update Event, and sync Thing.'],
			['HTTP entry point', 'Notification API', 'Send notifications from curl, scripts, webhooks, CI/CD, NAS, and automation services.'],
		],
		zh: [
			['AI Agent 路径', 'AI Agent 通知', '用 MCP 和 OAuth 让 agent 与聊天机器人发送通知、更新 Event、同步 Thing。'],
			['HTTP 接入口', '通知 API', '从 curl、脚本、Webhook、CI/CD、NAS 和自动化服务发送通知。'],
		],
			'zh-tw': [
				['AI Agent 路徑', 'AI Agent 通知', '用 MCP 和 OAuth 讓 agent 與聊天機器人傳送通知、更新 Event、同步 Thing。'],
				['HTTP 接入口', '通知 API', '從 curl、指令碼、Webhook、CI/CD、NAS 和自動化服務傳送通知。'],
			],
		};
	const prefix = locales[locale].prefix;
	return cards[locale]
		.map(([label, title, text], index) => {
			const route = index === 0 ? 'ai-agent-notifications' : 'notification-api';
			return `  <a class="path-card" href="${prefix}/guides/${route}/">\n    <span class="path-card__label">${label}</span>\n    <strong class="path-card__title">${title}</strong>\n    <span class="path-card__text">${text}</span>\n  </a>`;
		})
		.join('\n');
}

async function ensureDir(file) {
	await mkdir(path.dirname(file), { recursive: true });
}

async function write(file, content) {
	await ensureDir(file);
	await writeFile(file, content, 'utf8');
}

async function patchIndex(locale) {
	const indexPath =
		locale === 'root'
			? path.join(docsRoot, 'index.mdx')
			: path.join(docsRoot, locale, 'index.mdx');
	if (!existsSync(indexPath)) return;
	let content = await readFile(indexPath, 'utf8');
	const prefix = locales[locale].prefix;
	if (content.includes(`${prefix}/guides/ai-agent-notifications/`)) {
		return;
	}
	const marker = '</div>\n\n## ';
	if (!content.includes(marker)) return;
	content = content.replace(marker, `${localizedCards(locale)}\n</div>\n\n## `);
	await writeFile(indexPath, content, 'utf8');
}

function robotsTxt() {
	return `User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: ChatGPT-User\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: Googlebot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: Applebot\nAllow: /\n\nSitemap: ${SITE}/sitemap-index.xml\n`;
}

function llmsTxt() {
	const links = [
		['PushGo Overview', '/', 'What PushGo is, where to start, and how Message, Event, Thing, Gateway, and MCP fit together.'],
		['AI Agent Notifications with MCP', '/guides/ai-agent-notifications/', 'How AI agents and chatbots can send PushGo notifications and state updates through MCP and OAuth.'],
		['Push Notification API', '/guides/notification-api/', 'HTTP notification API examples for curl, scripts, webhooks, CI/CD, NAS, and automation services.'],
		['Self-hosted Notification Server', '/guides/self-hosted-notification-server/', 'How to run PushGo Gateway as an open-source self-hosted notification server.'],
		['DevOps and CI/CD Notifications', '/guides/devops-notifications/', 'How to model build, deployment, incident, and service health notifications.'],
		['NAS, IoT, and Home Assistant Notifications', '/guides/home-automation-notifications/', 'How to model home automation, device, NAS, and sensor notifications.'],
		['Migration from ntfy, Bark, or ServerChan', '/guides/ntfy-bark-serverchan-migration/', 'How to migrate existing notification scripts to PushGo.'],
		['Data Models', '/guides/data-models/', 'When to use Message, Event, Thing, or a combination of them.'],
		['Self-hosting', '/guides/self-hosting/', 'Gateway deployment, reverse proxy, storage, private transports, and MCP/OAuth operations.'],
		['MCP Reference', '/reference/mcp/', 'MCP endpoint, OAuth binding, tools, operations, and troubleshooting.'],
		['Technical Support', '/support/', 'App Store technical support contact, troubleshooting details, and update guidance.'],
		['Authentication', '/reference/auth/', 'Channel credentials, gateway tokens, compatibility keys, and MCP OAuth.'],
		['Message API', '/reference/api-message/', 'One-off notification fields, responses, and compatibility endpoints.'],
		['Event API', '/reference/api-event/', 'Create, update, and close lifecycle events.'],
		['Thing API', '/reference/api-thing/', 'Create and update persistent entity state.'],
		['End-to-End Encryption', '/reference/e2ee/', 'Client-side decryption for sensitive fields.'],
	];
	return `# PushGo\n\n> Open-source notifications, events, entity-state synchronization, and MCP alerts for automation, DevOps, IoT, self-hosting, and AI agent workflows.\n\n## Core Pages\n\n${links
		.map(([title, href, desc]) => `- [${title}](${SITE}${href}): ${desc}`)
		.join('\n')}\n\n## Localized Documentation\n\n${localeOrder
		.map((locale) => `- [${locales[locale].name}](${SITE}${locales[locale].prefix || '/'})`)
		.join('\n')}\n`;
}

function llmsFullTxt() {
	const sections = [];
	for (const slug of routeSlugs) {
		const data = page('root', slug);
		sections.push(`## ${data.title}\n\nURL: ${SITE}/guides/${slug}/\n\n${data.description}\n\nBest fits:\n${data.fits
			.map((item) => `- ${item}`)
			.join('\n')}\n\nQuestions:\n${data.questions.map(([q, a]) => `- ${q} ${a}`).join('\n')}`);
	}
	sections.push(`## MCP Reference\n\nURL: ${SITE}/reference/mcp/\n\nPushGo Gateway can act as an MCP HTTP Server. MCP-capable AI assistants can send Message, manage Event, and update Thing within authorized channel scopes. OAuth2 authorization is recommended so users bind channels in a browser instead of giving channel passwords to a model.`);
	sections.push(`## Technical Support\n\nURL: ${SITE}/support/\n\nUse support@pushgo.dev for PushGo technical support, including App Store support requests for iOS, macOS, and watchOS. Include device model, operating system version, app version, platform, Gateway context, issue timing, reproduction steps, and safe logs or screenshots when useful. Do not send passwords, tokens, private keys, or other secrets by email.`);
	return `# PushGo LLM Context\n\nThis file summarizes the most important PushGo documentation for AI retrieval systems and coding agents. It is not a replacement for the canonical pages.\n\n${sections.join('\n\n')}\n`;
}

async function main() {
	for (const locale of localeOrder) {
		for (const slug of routeSlugs) {
			const base = locale === 'root' ? docsRoot : path.join(docsRoot, locale);
			await write(path.join(base, 'guides', `${slug}.md`), renderPage(locale, slug));
		}
		await patchIndex(locale);
	}

	await write(path.join(publicRoot, 'robots.txt'), robotsTxt());
	await write(path.join(publicRoot, 'llms.txt'), llmsTxt());
	await write(path.join(publicRoot, 'llms-full.txt'), llmsFullTxt());
	if (existsSync(path.join(publicRoot, 'og-image.svg'))) {
		await sharp(path.join(publicRoot, 'og-image.svg'))
			.png()
			.toFile(path.join(publicRoot, 'og-image.png'));
	}
}

await main();
