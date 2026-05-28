import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = path.join(root, 'src/content/docs');
const publicRoot = path.join(root, 'public');
const SITE = 'https://pushgo.dev';

const localeOrder = ['root', 'zh', 'zh-tw', 'de', 'fr', 'ja', 'ko', 'es'];
const locales = {
	root: { prefix: '', lang: 'en', name: 'English' },
	zh: { prefix: '/zh', lang: 'zh', name: '简体中文' },
	'zh-tw': { prefix: '/zh-tw', lang: 'zh-TW', name: '繁體中文' },
	de: { prefix: '/de', lang: 'de', name: 'Deutsch' },
	fr: { prefix: '/fr', lang: 'fr', name: 'Français' },
	ja: { prefix: '/ja', lang: 'ja', name: '日本語' },
	ko: { prefix: '/ko', lang: 'ko', name: '한국어' },
	es: { prefix: '/es', lang: 'es', name: 'Español' },
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
	de: {
		fits: 'Geeignete Szenarien',
		next: 'Nächste Schritte',
		model: 'Wie PushGo diesen Workflow modelliert',
		questions: 'Fragen, die diese Seite beantwortet',
		example: 'Minimales Beispiel',
		mcp: 'MCP-Pfad',
		safety: 'Sicherheit und Betrieb',
		read: 'Weiterlesen',
		modelHeaders: ['Bedarf', 'Nutzung', 'Warum'],
	},
	fr: {
		fits: 'Cas adaptés',
		next: 'Étapes suivantes',
		model: 'Comment PushGo modélise ce flux',
		questions: 'Questions auxquelles cette page répond',
		example: 'Exemple minimal',
		mcp: 'Parcours MCP',
		safety: 'Sécurité et exploitation',
		read: 'Lire ensuite',
		modelHeaders: ['Besoin', 'Utiliser', 'Pourquoi'],
	},
	ja: {
		fits: '適した場面',
		next: '次のステップ',
		model: 'PushGo でこのワークフローを表す方法',
		questions: 'このページで答える質問',
		example: '最小例',
		mcp: 'MCP 経路',
		safety: 'セキュリティと運用',
		read: '次に読む',
		modelHeaders: ['目的', '使うモデル', '理由'],
	},
	ko: {
		fits: '적합한 시나리오',
		next: '다음 단계',
		model: 'PushGo가 이 워크플로를 모델링하는 방식',
		questions: '이 페이지가 답하는 질문',
		example: '최소 예시',
		mcp: 'MCP 경로',
		safety: '보안 및 운영',
		read: '다음 읽기',
		modelHeaders: ['요구', '사용', '이유'],
	},
	es: {
		fits: 'Casos adecuados',
		next: 'Siguientes pasos',
		model: 'Cómo PushGo modela este flujo',
		questions: 'Preguntas que responde esta página',
		example: 'Ejemplo mínimo',
		mcp: 'Ruta MCP',
		safety: 'Seguridad y operación',
		read: 'Leer a continuación',
		modelHeaders: ['Necesidad', 'Usar', 'Por qué'],
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
	de: {
		'ai-agent-notifications': {
			title: 'KI-Agent-Benachrichtigungen mit MCP',
			description: 'Senden Sie PushGo-Benachrichtigungen, Events und Statusupdates aus KI-Agenten und Chatbots über MCP und OAuth.',
			intro: 'PushGo eignet sich, wenn ein KI-Agent, Chatbot oder MCP-Client Benutzer benachrichtigen, längere Aufgaben melden oder Objektstatus aktualisieren soll, ohne Channel-Passwörter an das Modell weiterzugeben.',
			fits: ['Benutzer nach Abschluss einer Agent-Aufgabe benachrichtigen.', 'Agent-Fortschritt als aktualisierbares Event verfolgen.', 'Service-, Geräte- oder Aufgabenstatus als Thing aktualisieren.', 'MCP-Clients über OAuth mit begrenzten Channel-Rechten ausstatten.'],
			questions: [['Kann ein KI-Agent eine Push-Benachrichtigung senden?', 'Ja. Autorisierte MCP-Clients können über PushGo Message-Benachrichtigungen senden.'], ['Sollte ein Chatbot Channel-Passwörter kennen?', 'Nein. Für Produktion sollte MCP OAuth genutzt werden, damit Benutzer Channels im Browser binden.'], ['Wie meldet ein Agent Fortschritt?', 'Für lange Aufgaben ist Event passend, weil es wiederholt aktualisiert und geschlossen werden kann.']],
		},
	},
	fr: {
		'ai-agent-notifications': {
			title: 'Notifications pour agents IA avec MCP',
			description: 'Envoyer des notifications, événements et mises à jour d’état depuis des agents IA et chatbots via PushGo MCP et OAuth.',
			intro: 'PushGo convient lorsqu’un agent IA, un chatbot ou un client MCP doit prévenir un utilisateur, suivre une tâche longue ou mettre à jour l’état d’un objet sans exposer le mot de passe du Channel au modèle.',
			fits: ['Prévenir un utilisateur quand une tâche d’agent se termine.', 'Suivre la progression comme un Event actualisable.', 'Mettre à jour un service, appareil ou tâche comme Thing.', 'Accorder un accès limité aux clients MCP via OAuth.'],
			questions: [['Un agent IA peut-il envoyer une notification mobile ?', 'Oui. Les outils MCP de PushGo permettent aux agents autorisés d’envoyer des Messages.'], ['Un chatbot doit-il connaître le mot de passe du Channel ?', 'Non. En production, utilisez MCP OAuth pour lier le Channel dans le navigateur.'], ['Comment suivre la progression ?', 'Utilisez Event pour les tâches longues, car il peut être mis à jour puis fermé.']],
		},
	},
	ja: {
		'ai-agent-notifications': {
			title: 'MCP による AI Agent 通知',
			description: 'PushGo MCP と OAuth を使い、AI agent やチャットボットから通知、Event、状態更新を送信します。',
			intro: 'AI agent、チャットボット、MCP クライアントがユーザーへ通知したり、長いタスクの進捗を報告したり、サービスやデバイスの状態を更新したりする場合に PushGo を使えます。モデルへ Channel パスワードを渡す必要はありません。',
			fits: ['Agent の長いタスク完了をユーザーへ通知する。', 'Agent の進捗を更新可能な Event として扱う。', 'サービス、デバイス、タスクの状態を Thing として更新する。', 'OAuth の Channel バインドで MCP クライアントに限定権限を付与する。'],
			questions: [['AI agent はスマートフォンへ通知できますか？', 'はい。認可された MCP ツールから PushGo Gateway 経由で Message を送信できます。'], ['チャットボットに Channel パスワードを持たせるべきですか？', 'いいえ。本番では MCP OAuth を使い、ユーザーがブラウザで Channel をバインドします。'], ['進捗報告には何を使いますか？', '長いタスクには Event が適しています。作成、反復更新、クローズができます。']],
		},
	},
	ko: {
		'ai-agent-notifications': {
			title: 'MCP 기반 AI Agent 알림',
			description: 'PushGo MCP와 OAuth로 AI agent와 챗봇이 알림, Event, 상태 업데이트를 보낼 수 있습니다.',
			intro: 'AI agent, 챗봇, MCP 클라이언트가 사용자에게 알림을 보내거나 긴 작업 진행 상황을 보고하거나 서비스/기기/작업 상태를 갱신해야 할 때 PushGo를 사용할 수 있습니다. 모델이 Channel 비밀번호를 직접 보관할 필요가 없습니다.',
			fits: ['Agent의 긴 작업 완료를 사용자에게 알립니다.', 'Agent 진행 상황을 업데이트 가능한 Event로 추적합니다.', '서비스, 기기, 작업 상태를 Thing으로 갱신합니다.', 'OAuth Channel 바인딩으로 MCP 클라이언트에 제한된 권한을 제공합니다.'],
			questions: [['AI agent가 휴대폰으로 푸시 알림을 보낼 수 있나요?', '예. 권한을 받은 MCP 도구가 PushGo Gateway를 통해 Message를 보낼 수 있습니다.'], ['챗봇이 Channel 비밀번호를 가져야 하나요?', '아니요. 운영 환경에서는 MCP OAuth로 사용자가 브라우저에서 Channel을 바인딩해야 합니다.'], ['진행 상황은 어떻게 보고해야 하나요?', '긴 작업은 Event가 적합합니다. 생성, 반복 업데이트, 종료가 가능합니다.']],
		},
	},
	es: {
		'ai-agent-notifications': {
			title: 'Notificaciones de agentes de IA con MCP',
			description: 'Envíe notificaciones, eventos y actualizaciones de estado desde agentes de IA y chatbots mediante PushGo MCP y OAuth.',
			intro: 'Use PushGo cuando un agente de IA, chatbot o cliente MCP necesite avisar a un usuario, informar progreso de tareas largas o actualizar un objeto sin entregar contraseñas de Channel al modelo.',
			fits: ['Avisar al usuario cuando termina una tarea del agente.', 'Seguir el progreso como un Event actualizable.', 'Actualizar un servicio, dispositivo o tarea como Thing.', 'Dar acceso limitado a clientes MCP mediante OAuth.'],
			questions: [['¿Puede un agente de IA enviar una notificación móvil?', 'Sí. Las herramientas MCP autorizadas pueden enviar Messages a través de PushGo Gateway.'], ['¿Debe un chatbot guardar la contraseña del Channel?', 'No. En producción use MCP OAuth para que el usuario vincule el Channel en el navegador.'], ['¿Cómo reporta progreso un agente?', 'Use Event para tareas largas porque se puede actualizar varias veces y cerrar al terminar.']],
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

Object.assign(localizedOverrides.de, {
	'notification-api': {
		title: 'Push Notification API für Skripte und Dienste',
		description: 'Nutzen Sie PushGo als HTTP-Benachrichtigungs-API für curl, Webhooks, cron, CI/CD, NAS-Alarme und Automatisierungsskripte.',
		intro: 'PushGo bietet eine direkt aufrufbare HTTP-API für Skripte und Dienste, die sichtbare Benachrichtigungen und strukturierte Ereignis- oder Zustandsmodelle benötigen.',
		fits: ['Benachrichtigungen aus curl, cron, Shell-Skripten oder Webhooks senden.', 'Jobabschluss, Preisalarme, Bild-Snapshots oder Monitoring-Ergebnisse melden.', 'Event und Thing nutzen, statt alle Informationen als Textstrom zu senden.', 'Kompatibilitätsendpunkte nutzen und schrittweise auf native PushGo-APIs umstellen.'],
		rows: [['Ein Skriptalarm', 'Message', 'Einfach, flüchtig und gut mit curl testbar.'], ['Aufgabe mit Fortschritt', 'Event', 'Dasselbe Event kann bis zum Abschluss aktualisiert werden.'], ['Aktueller Geräte- oder Dienststatus', 'Thing', 'Clients sehen den neuesten Zustand statt veralteter Meldungen.']],
		example: 'Der native Endpunkt `/message` akzeptiert JSON und meldet, ob der Gateway die Anfrage in die Verteilung aufgenommen hat.',
		questions: [['Kann ich mit curl eine Benachrichtigung senden?', 'Ja. Die Message API ist für curl, Skripte und einfache HTTP-Clients geeignet.'], ['Ist PushGo nur eine Handy-Benachrichtigungs-API?', 'Nein. PushGo modelliert auch Event-Lebenszyklen und aktuellen Thing-Zustand.'], ['Kann ich die API selbst hosten?', 'Ja. Sie können Ihren eigenen Gateway mit eigener Authentifizierung, Speicherung, Transporten und MCP/OAuth betreiben.']],
	},
	'self-hosted-notification-server': {
		title: 'Selbst gehosteter Open-Source-Benachrichtigungsserver',
		description: 'Betreiben Sie PushGo Gateway als selbst gehosteten Benachrichtigungsserver mit privaten Transporten, persistentem Zustand, E2EE und MCP/OAuth.',
		intro: 'Hosten Sie PushGo selbst, wenn Benachrichtigungspfad, Datenspeicher, Gateway-Authentifizierung, Transportregeln und MCP/OAuth-Endpunkt unter Ihrer Kontrolle bleiben sollen.',
		fits: ['Einen privaten Gateway für persönliche oder Team-Automatisierung betreiben.', 'Benachrichtigungen, Events und Entitätszustand von öffentlichen Gateways fernhalten.', 'Einen eigenen HTTPS-Endpunkt `/mcp` für KI-Assistenten bereitstellen.', 'Backups, Reverse Proxies, Logs und Observability in den Betrieb einbeziehen.'],
		rows: [['Privater Zustellpfad', 'Gateway', 'Ihre Infrastruktur kontrolliert HTTP-API und Transport-Listener.'], ['Sensible Felder', 'E2EE', 'Clients entschlüsseln sensible Felder lokal.'], ['KI-Assistenten', 'MCP OAuth', 'Benutzer binden Channels über Ihre öffentliche Gateway-URL.']],
		example: 'Setzen Sie `PUSHGO_PUBLIC_BASE_URL` auf den extern erreichbaren HTTPS-Ursprung, bevor Sie MCP/OAuth aktivieren.',
		questions: [['Kann PushGo als selbst gehosteter Benachrichtigungsserver laufen?', 'Ja. Der Gateway ist für private Bereitstellung mit persistentem Speicher und konfigurierbaren Transporten ausgelegt.'], ['Aktiviert Selbsthosting MCP?', 'Ja. Ein privater Gateway kann `/mcp` und OAuth-Routen bereitstellen, wenn eine öffentliche HTTPS-Basisadresse gesetzt ist.'], ['Sind Backups nötig?', 'Ja. Channels, Geräte, MCP-Grants, Events und Things hängen von persistentem Speicher ab.']],
	},
	'devops-notifications': {
		title: 'DevOps- und CI/CD-Benachrichtigungen',
		description: 'Nutzen Sie PushGo für CI/CD-, Deployment-, Incident-, Server- und Monitoring-Benachrichtigungen mit Message, Event und Thing.',
		intro: 'DevOps-Benachrichtigungen bleiben verständlicher, wenn einzelne Alarme, Incident-Lebenszyklen und Dienstzustand getrennt modelliert werden.',
		fits: ['Build-, Deployment- und Release-Benachrichtigungen senden.', 'Incident-Fortschritt als aktualisierbares Event verfolgen.', 'Aktuellen Status eines Dienstes, einer Queue, eines Backups oder Hosts als Thing zeigen.', 'Alarme über öffentlichen oder eigenen Gateway an Apple- und Android-Clients zustellen.'],
		rows: [['Build beendet', 'Message', 'Eine sichtbare Meldung reicht aus.'], ['Deployment läuft', 'Event', 'Der Lebenszyklus kann von gestartet bis fehlgeschlagen oder abgeschlossen aktualisiert werden.'], ['Service Health', 'Thing', 'Das Objekt hat einen aktuellen Zustand, der sich ändert.']],
		example: 'Nutzen Sie Message für einfache Pipeline-Abschlüsse, Event für Deployments mit mehreren Updates und Thing für aktuellen Dienstzustand.',
		questions: [['Eignet sich PushGo für CI/CD?', 'Ja. CI/CD-Systeme können die HTTP-API direkt aus Shell-Schritten oder Webhooks aufrufen.'], ['Wie sollten Incidents dargestellt werden?', 'Als Event, damit derselbe Incident aktualisiert und geschlossen werden kann.'], ['Können Teams DevOps-Benachrichtigungen selbst hosten?', 'Ja. Ein privater Gateway kontrolliert Datenpfade, Authentifizierung und Betriebspolitik.']],
	},
	'home-automation-notifications': {
		title: 'NAS-, IoT- und Home-Assistant-Benachrichtigungen',
		description: 'Nutzen Sie PushGo für NAS-Alarme, IoT-Geräte, Home-Assistant-Automationen und langlebige Gerätezustände.',
		intro: 'Home Automation und Gerätemonitoring brauchen oft mehr als eine einmalige Meldung. PushGo sendet Benachrichtigungen, verfolgt Events und hält aktuellen Zustand fest.',
		fits: ['NAS-Platten-, Backup- und Dienstalarme senden.', 'Home Assistant über HTTP- oder Webhook-Aktionen anbinden.', 'Geräte, Sensoren, Backup-Jobs oder Medienserver als Thing darstellen.', 'Einen privaten Gateway nutzen, wenn Heimdaten unter eigener Kontrolle bleiben sollen.'],
		rows: [['Türkamera oder Plattenalarm', 'Message', 'Der Inhalt ist ein einzelner Alarm.'], ['Backup- oder Medienscan-Fortschritt', 'Event', 'Fortschritt kann bis zum Abschluss aktualisiert werden.'], ['Sensor- oder Gerätestatus', 'Thing', 'Der neueste Zustand ist wichtiger als jede historische Meldung.']],
		example: 'Ein NAS-Skript kann `/message` für Plattenalarme aufrufen; ein Backup-Job kann ein Event erstellen und bis Erfolg oder Fehler aktualisieren.',
		questions: [['Kann PushGo Home-Assistant-Webhooks empfangen?', 'Ja. Home Assistant kann PushGo über Webhook- oder REST-Aktionen aufrufen.'], ['Wie vermeide ich veraltete Gerätemeldungen?', 'Nutzen Sie Thing, damit Clients den aktuellen Zustand desselben Objekts zeigen.'], ['Kann das privat laufen?', 'Ja. Hosten Sie den Gateway selbst, wenn Datenpfad oder Transportregeln privat bleiben sollen.']],
	},
	'ntfy-bark-serverchan-migration': {
		title: 'Von ntfy, Bark oder ServerChan migrieren',
		description: 'Migrieren Sie bestehende ntfy-, Bark-, ServerChan- oder Webhook-Skripte mit Kompatibilitätsendpunkten und nativen PushGo-Modellen.',
		intro: 'PushGo kann bestehende Benachrichtigungs-Workflows aufnehmen, während wichtige Pfade schrittweise auf Message, Event und Thing umgestellt werden.',
		fits: ['Einfache Skripte während der Evaluation weiter betreiben.', 'Einen Alarmweg nach dem anderen migrieren.', 'Textmeldungen bei Bedarf in strukturierte Lebenszyklen oder Zustand überführen.', 'Für sensible Workflows E2EE und Selbsthosting kombinieren.'],
		rows: [['Einfacher migrierter Alarm', 'Message', 'Die alte Meldung bleibt eine einmalige Message.'], ['Workflow mit Statuswechseln', 'Event', 'Wiederholte Updates gehören zu einem Lebenszyklus.'], ['Langlebiges Objekt', 'Thing', 'Dieselbe Entität kann fortlaufend aktualisiert werden.']],
		example: 'Starten Sie mit Kompatibilitätsendpunkten für risikoarme Skripte und migrieren Sie reichere Workflows später zu `/message`, `/event/*` oder `/thing/*`.',
		questions: [['Muss ich sofort alle Skripte umschreiben?', 'Nein. Nutzen Sie Kompatibilität und migrieren Sie zuerst wertvolle Workflows.'], ['Wann reicht Text nicht mehr?', 'Wenn Fortschritt, Abschluss, aktueller Zustand, Bilder, Metadaten oder Sicherheitsanforderungen wichtig werden.'], ['Ist das ein direkter Feature-Vergleich?', 'Nein. Migration ist eine Modellierungsentscheidung.']],
	},
});

Object.assign(localizedOverrides.fr, {
	'notification-api': {
		title: 'API de notification push pour scripts et services',
		description: 'Utiliser PushGo comme API HTTP de notification pour curl, webhooks, cron, CI/CD, alertes NAS et scripts d’automatisation.',
		intro: 'PushGo fournit une API HTTP directe pour les scripts et services qui doivent envoyer des notifications visibles tout en gardant des modèles structurés pour événements et états.',
		fits: ['Envoyer depuis curl, cron, un script shell ou un webhook.', 'Signaler fin de tâche, alerte de prix, image ou résultat de monitoring.', 'Utiliser Event et Thing au lieu d’un flux de texte désordonné.', 'Commencer par les endpoints compatibles puis migrer vers les APIs natives.'],
		rows: [['Alerte unique', 'Message', 'Simple, transitoire et facile à tester avec curl.'], ['Tâche avec progression', 'Event', 'Le même événement peut être mis à jour jusqu’à la fin.'], ['État actuel d’un service ou appareil', 'Thing', 'Les clients voient le dernier état plutôt que des alertes périmées.']],
		example: 'L’endpoint natif `/message` accepte du JSON et indique si le Gateway a accepté la demande dans le flux de distribution.',
		questions: [['Puis-je envoyer une notification avec curl ?', 'Oui. Message API est faite pour curl, les scripts et les clients HTTP simples.'], ['PushGo est-il seulement une API mobile ?', 'Non. PushGo modélise aussi les cycles Event et l’état actuel Thing.'], ['Puis-je auto-héberger cette API ?', 'Oui. Vous pouvez exploiter votre propre Gateway avec authentification, stockage, transports et MCP/OAuth.']],
	},
	'self-hosted-notification-server': {
		title: 'Serveur de notification open source auto-hébergé',
		description: 'Déployer PushGo Gateway comme serveur de notification auto-hébergé avec transports privés, état persistant, E2EE et MCP/OAuth.',
		intro: 'Auto-hébergez PushGo quand le chemin de notification, le stockage, l’authentification, les transports privés et MCP/OAuth doivent rester sous votre contrôle.',
		fits: ['Exploiter un Gateway privé pour automatisations personnelles ou d’équipe.', 'Éviter que notifications, événements et états passent par un Gateway public.', 'Exposer votre propre endpoint HTTPS `/mcp` pour les assistants IA.', 'Intégrer sauvegardes, reverse proxy, journaux et observabilité.'],
		rows: [['Chemin privé', 'Gateway', 'Votre infrastructure contrôle l’API HTTP et les listeners.'], ['Champs sensibles', 'E2EE', 'Les clients déchiffrent localement.'], ['Accès assistant IA', 'MCP OAuth', 'Les utilisateurs lient les Channels via votre URL publique.']],
		example: 'Définissez `PUSHGO_PUBLIC_BASE_URL` sur l’origine HTTPS publique avant d’activer MCP/OAuth.',
		questions: [['PushGo peut-il être un serveur auto-hébergé ?', 'Oui. Le Gateway est conçu pour un déploiement privé avec stockage persistant.'], ['L’auto-hébergement permet-il MCP ?', 'Oui. Un Gateway privé peut exposer `/mcp` et OAuth avec une base HTTPS publique.'], ['Faut-il des sauvegardes ?', 'Oui. Channels, appareils, autorisations MCP, Events et Things dépendent du stockage persistant.']],
	},
	'devops-notifications': {
		title: 'Notifications DevOps et CI/CD',
		description: 'Utiliser PushGo pour CI/CD, déploiements, incidents, serveurs et monitoring avec Message, Event et Thing.',
		intro: 'Les notifications DevOps restent lisibles quand les alertes uniques, cycles d’incident et états de service sont modélisés séparément.',
		fits: ['Envoyer notifications de build, déploiement et release.', 'Suivre un incident comme Event actualisable.', 'Montrer l’état actuel d’un service, job de sauvegarde, queue ou host comme Thing.', 'Acheminer les alertes vers les clients Apple et Android.'],
		rows: [['Build terminé', 'Message', 'Une notification visible suffit.'], ['Déploiement en cours', 'Event', 'Le cycle peut évoluer de démarré à échoué ou terminé.'], ['Santé service', 'Thing', 'L’objet a un état courant qui change.']],
		example: 'Utilisez Message pour une fin de pipeline, Event pour un déploiement à plusieurs étapes, Thing pour l’état courant d’un service.',
		questions: [['PushGo convient-il au CI/CD ?', 'Oui. Les systèmes CI/CD peuvent appeler l’API HTTP depuis des étapes shell ou webhooks.'], ['Comment représenter un incident ?', 'Comme Event, pour le mettre à jour puis le fermer.'], ['Une équipe peut-elle auto-héberger ces alertes ?', 'Oui. Un Gateway privé contrôle données, authentification et exploitation.']],
	},
	'home-automation-notifications': {
		title: 'Notifications NAS, IoT et Home Assistant',
		description: 'Utiliser PushGo pour alertes NAS, appareils IoT, automatisations Home Assistant et états durables.',
		intro: 'La domotique et le monitoring d’appareils demandent souvent plus qu’une alerte unique. PushGo envoie des notifications, suit des événements et maintient l’état courant.',
		fits: ['Envoyer alertes disque, sauvegarde et services NAS.', 'Relier Home Assistant par requête HTTP ou webhook.', 'Modéliser appareil, capteur, sauvegarde ou service média comme Thing.', 'Utiliser un Gateway privé quand les données domestiques doivent rester contrôlées.'],
		rows: [['Snapshot ou alerte disque', 'Message', 'Le contenu est une alerte unique.'], ['Progression sauvegarde ou scan', 'Event', 'La progression peut être mise à jour jusqu’à la fin.'], ['État capteur ou appareil', 'Thing', 'Le dernier état compte plus que chaque historique.']],
		example: 'Un script NAS peut appeler `/message` pour un disque; un job de sauvegarde peut créer un Event et le mettre à jour.',
		questions: [['PushGo peut-il recevoir des webhooks Home Assistant ?', 'Oui. Home Assistant peut appeler PushGo via webhook ou action REST.'], ['Comment éviter les notifications obsolètes ?', 'Utilisez Thing pour afficher l’état courant du même objet.'], ['Cela peut-il tourner en privé ?', 'Oui. Auto-hébergez le Gateway pour garder le chemin de données privé.']],
	},
	'ntfy-bark-serverchan-migration': {
		title: 'Migrer depuis ntfy, Bark ou ServerChan',
		description: 'Migrer des scripts ntfy, Bark, ServerChan ou webhook vers PushGo avec endpoints compatibles et modèles natifs.',
		intro: 'PushGo peut accueillir des workflows existants pendant que les chemins importants migrent vers Message, Event et Thing.',
		fits: ['Garder les scripts simples pendant l’évaluation.', 'Migrer un chemin d’alerte à la fois.', 'Remplacer le texte brut par cycles ou états structurés quand utile.', 'Associer E2EE et auto-hébergement pour les flux sensibles.'],
		rows: [['Alerte simple migrée', 'Message', 'L’ancienne notification reste un message ponctuel.'], ['Workflow avec changements', 'Event', 'Les mises à jour répétées appartiennent au même cycle.'], ['Objet durable surveillé', 'Thing', 'La même entité peut être mise à jour.']],
		example: 'Commencez par les endpoints compatibles pour scripts peu risqués, puis migrez vers `/message`, `/event/*` ou `/thing/*`.',
		questions: [['Dois-je tout réécrire ?', 'Non. Utilisez la compatibilité et migrez d’abord les flux à forte valeur.'], ['Quand le texte brut ne suffit-il plus ?', 'Quand progression, clôture, état actuel, images, métadonnées ou sécurité comptent.'], ['Est-ce une comparaison directe ?', 'Non. La migration est une décision de modélisation.']],
	},
});

Object.assign(localizedOverrides.ja, {
	'notification-api': {
		title: 'スクリプトとサービス向け Push Notification API',
		description: 'curl、Webhook、cron、CI/CD、NAS アラート、自動化スクリプトから PushGo を HTTP 通知 API として利用します。',
		intro: 'PushGo は、スクリプトやサービスの結果をユーザーへ確実に届けつつ、Event と Thing による構造化された状態表現も扱える HTTP API を提供します。',
		fits: ['curl、cron、シェルスクリプト、Webhook から通知する。', 'ジョブ完了、価格通知、画像スナップショット、監視結果を送る。', '単なるテキストの連続ではなく Event と Thing で表現する。', '互換エンドポイントから始め、徐々に PushGo ネイティブ API へ移行する。'],
		rows: [['一度きりのスクリプト通知', 'Message', '単純で一時的、curl で検証しやすい。'], ['進捗を持つタスク', 'Event', '同じ Event を完了まで更新できる。'], ['デバイスやサービスの現在状態', 'Thing', '古い通知の列ではなく最新状態を見せる。']],
		example: 'ネイティブ `/message` エンドポイントは JSON を受け取り、Gateway が分配処理に受理したかを返します。',
		questions: [['curl で通知できますか？', 'はい。Message API は curl、スクリプト、単純な HTTP クライアントから呼び出せます。'], ['PushGo はスマートフォン通知 API だけですか？', 'いいえ。Event のライフサイクルと Thing の現在状態も扱えます。'], ['API をセルフホストできますか？', 'はい。自分の Gateway で認証、保存、トランスポート、MCP/OAuth を制御できます。']],
	},
	'self-hosted-notification-server': {
		title: 'セルフホスト可能なオープンソース通知サーバー',
		description: 'PushGo Gateway を、private transport、永続状態、E2EE、MCP/OAuth 対応の通知サーバーとして運用します。',
		intro: '通知経路、データ保存、Gateway 認証、private transport、MCP/OAuth エンドポイントを自分で管理したい場合は PushGo をセルフホストします。',
		fits: ['個人またはチームの自動化用に private Gateway を運用する。', '通知、Event、Thing 状態を public Gateway に通さない。', 'AI アシスタント向けに独自 HTTPS `/mcp` エンドポイントを公開する。', 'バックアップ、リバースプロキシ、ログ、監視を運用に組み込む。'],
		rows: [['プライベートな配送経路', 'Gateway', 'HTTP API と transport listener を自分の基盤で管理する。'], ['機密フィールド', 'E2EE', 'クライアントがローカルで復号する。'], ['AI アシスタント連携', 'MCP OAuth', '公開 Gateway URL 経由でユーザーが Channel をバインドする。']],
		example: 'MCP/OAuth を有効にする前に、`PUSHGO_PUBLIC_BASE_URL` を外部到達可能な HTTPS ルートに設定します。',
		questions: [['PushGo はセルフホスト通知サーバーになりますか？', 'はい。Gateway は永続ストレージと設定可能なトランスポートを持つ private deployment 向けです。'], ['セルフホストで MCP を使えますか？', 'はい。公開 HTTPS ベース URL を設定すれば `/mcp` と OAuth ルートを提供できます。'], ['バックアップは必要ですか？', 'はい。Channel、デバイス、MCP grant、Event、Thing は永続ストレージに依存します。']],
	},
	'devops-notifications': {
		title: 'DevOps と CI/CD 通知',
		description: 'PushGo で CI/CD、デプロイ、インシデント、サーバー、監視通知を Message、Event、Thing として扱います。',
		intro: 'DevOps 通知は、一度きりのアラート、インシデントのライフサイクル、サービスの現在状態を分けて表現すると読みやすくなります。',
		fits: ['ビルド、デプロイ、リリース通知を送る。', 'インシデント対応の進捗を更新可能な Event として追跡する。', 'サービス、キュー、バックアップ、ホスト状態を Thing として表示する。', 'public Gateway または private Gateway から Apple/Android クライアントへ届ける。'],
		rows: [['ビルド完了', 'Message', '一つの見える通知で足りる。'], ['デプロイ中', 'Event', '開始から失敗または完了まで同じライフサイクルで更新できる。'], ['サービスヘルス', 'Thing', 'オブジェクトの現在状態が変化する。']],
		example: '単純なパイプライン完了は Message、複数ステップのデプロイは Event、サービスの現在状態は Thing を使います。',
		questions: [['PushGo は CI/CD 通知に向いていますか？', 'はい。CI/CD からシェルステップや Webhook で HTTP API を直接呼び出せます。'], ['インシデントはどう表現しますか？', 'Event を使うと同じインシデントを更新し、最後に閉じられます。'], ['チームでセルフホストできますか？', 'はい。private Gateway でデータ経路、認証、運用ポリシーを制御できます。']],
	},
	'home-automation-notifications': {
		title: 'NAS、IoT、Home Assistant 通知',
		description: 'PushGo を NAS アラート、IoT デバイス、Home Assistant 自動化、長期的なデバイス状態更新に使います。',
		intro: 'ホームオートメーションやデバイス監視では一度きりの通知だけでは足りないことがあります。PushGo は通知、Event、現在状態をまとめて扱えます。',
		fits: ['NAS のディスク、バックアップ、サービスアラートを送る。', 'Home Assistant から HTTP または Webhook で連携する。', 'デバイス、センサー、バックアップジョブ、メディアサービスを Thing として扱う。', '家庭内データを自分で管理したい場合は private Gateway を使う。'],
		rows: [['ドアベル画像やディスク警告', 'Message', '内容は単発のアラート。'], ['バックアップやメディアスキャン進捗', 'Event', '完了まで進捗を更新できる。'], ['センサーやデバイス状態', 'Thing', '履歴より現在状態が重要。']],
		example: 'NAS スクリプトは `/message` でディスク警告を送り、バックアップジョブは Event を作成して成功または失敗まで更新できます。',
		questions: [['Home Assistant webhook を受けられますか？', 'はい。Home Assistant の webhook または REST action から PushGo HTTP API を呼び出せます。'], ['古いデバイス通知を増やさない方法は？', 'Thing を使い、同じオブジェクトの現在状態を表示します。'], ['プライベートネットワークで動かせますか？', 'はい。データ経路や transport policy を管理したい場合は Gateway をセルフホストします。']],
	},
	'ntfy-bark-serverchan-migration': {
		title: 'ntfy、Bark、ServerChan からの移行',
		description: '既存の ntfy、Bark、ServerChan、Webhook 通知スクリプトを互換エンドポイントとネイティブモデルで PushGo へ移行します。',
		intro: 'PushGo は既存の通知ワークフローを受け止めながら、重要な経路を Message、Event、Thing へ段階的に移行できます。',
		fits: ['評価中も単純なスクリプトを動かし続ける。', 'すべてを書き換えず、通知経路ごとに移行する。', '必要な箇所だけテキスト通知を構造化されたライフサイクルや状態へ置き換える。', '機密ワークフローでは E2EE とセルフホストを組み合わせる。'],
		rows: [['単純な移行通知', 'Message', '従来の通知は一度きりの Message として扱う。'], ['状態変化のあるワークフロー', 'Event', '繰り返し更新は一つのライフサイクルに属する。'], ['長期監視対象', 'Thing', '同じエンティティを更新し続けられる。']],
		example: 'まず低リスクのスクリプトを互換エンドポイントへ移し、より豊かな意味が必要なものを `/message`、`/event/*`、`/thing/*` へ移行します。',
		questions: [['すべてのスクリプトをすぐ書き換える必要がありますか？', 'いいえ。互換エンドポイントを使い、価値の高いワークフローから移行できます。'], ['単なるテキスト通知で足りないのはいつですか？', '進捗、終了、現在状態、画像、メタデータ、セキュリティ要件があるときです。'], ['これは直接比較ですか？', 'いいえ。移行はモデリングの判断です。']],
	},
});

Object.assign(localizedOverrides.ko, {
	'notification-api': {
		title: '스크립트와 서비스를 위한 푸시 알림 API',
		description: 'curl, Webhook, cron, CI/CD, NAS 알림, 자동화 스크립트에서 PushGo를 HTTP 알림 API로 사용합니다.',
		intro: 'PushGo는 스크립트와 서비스 결과를 사용자에게 전달하면서 Event와 Thing 기반의 구조화된 상태도 유지할 수 있는 HTTP API를 제공합니다.',
		fits: ['curl, cron, 셸 스크립트, Webhook에서 알림을 보냅니다.', '작업 완료, 가격 알림, 이미지 스냅샷, 모니터링 결과를 전달합니다.', '모든 것을 텍스트로 쌓지 않고 Event와 Thing으로 모델링합니다.', '호환 엔드포인트에서 시작해 네이티브 PushGo API로 이전합니다.'],
		rows: [['단일 스크립트 알림', 'Message', '간단하고 일시적이며 curl로 테스트하기 쉽습니다.'], ['진행 상황이 있는 작업', 'Event', '같은 Event를 완료까지 업데이트할 수 있습니다.'], ['기기 또는 서비스 현재 상태', 'Thing', '오래된 알림 목록 대신 최신 상태를 보여줍니다.']],
		example: '네이티브 `/message` 엔드포인트는 JSON을 받고 Gateway가 요청을 dispatch 흐름에 수락했는지 반환합니다.',
		questions: [['curl로 알림을 보낼 수 있나요?', '예. Message API는 curl, 스크립트, 간단한 HTTP 클라이언트에서 호출하기 좋습니다.'], ['PushGo는 휴대폰 알림 API뿐인가요?', '아닙니다. Event lifecycle과 Thing 현재 상태도 모델링합니다.'], ['API를 셀프 호스팅할 수 있나요?', '예. 자체 Gateway로 인증, 저장소, transport, MCP/OAuth를 제어할 수 있습니다.']],
	},
	'self-hosted-notification-server': {
		title: '셀프 호스팅 오픈소스 알림 서버',
		description: 'PushGo Gateway를 private transport, persistent state, E2EE, MCP/OAuth를 갖춘 셀프 호스팅 알림 서버로 배포합니다.',
		intro: '알림 경로, 데이터 저장, Gateway 인증, private transport 정책, MCP/OAuth 엔드포인트를 직접 제어하려면 PushGo를 셀프 호스팅합니다.',
		fits: ['개인 또는 팀 자동화를 위한 private Gateway를 운영합니다.', '알림, Event, Thing 상태가 public Gateway를 지나지 않게 합니다.', 'AI assistant를 위한 자체 HTTPS `/mcp` 엔드포인트를 제공합니다.', '백업, reverse proxy, 로그, observability를 운영에 포함합니다.'],
		rows: [['비공개 전달 경로', 'Gateway', 'HTTP API와 transport listener를 자체 인프라에서 제어합니다.'], ['민감한 필드', 'E2EE', '클라이언트가 로컬에서 복호화합니다.'], ['AI assistant 접근', 'MCP OAuth', '사용자가 공개 Gateway URL에서 Channel을 바인딩합니다.']],
		example: 'MCP/OAuth를 켜기 전에 `PUSHGO_PUBLIC_BASE_URL`을 외부에서 접근 가능한 HTTPS root로 설정해야 합니다.',
		questions: [['PushGo를 셀프 호스팅 알림 서버로 실행할 수 있나요?', '예. Gateway는 persistent storage와 configurable transport를 갖춘 private deployment에 맞게 설계되었습니다.'], ['셀프 호스팅으로 MCP를 쓸 수 있나요?', '예. 공개 HTTPS base URL을 설정하면 `/mcp`와 OAuth route를 제공할 수 있습니다.'], ['백업이 필요한가요?', '예. Channel, device, MCP grant, Event, Thing은 persistent storage에 의존합니다.']],
	},
	'devops-notifications': {
		title: 'DevOps 및 CI/CD 알림',
		description: 'PushGo로 CI/CD, 배포, incident, 서버, 모니터링 알림을 Message, Event, Thing으로 모델링합니다.',
		intro: 'DevOps 알림은 단일 alert, incident lifecycle, service state를 분리해 모델링할 때 훨씬 읽기 쉽습니다.',
		fits: ['빌드, 배포, 릴리스 알림을 보냅니다.', 'incident 진행 상황을 업데이트 가능한 Event로 추적합니다.', '서비스, 큐, 백업 작업, 호스트 상태를 Thing으로 보여줍니다.', 'public Gateway 또는 private Gateway로 Apple/Android 클라이언트에 전달합니다.'],
		rows: [['빌드 완료', 'Message', '하나의 보이는 알림이면 충분합니다.'], ['배포 진행 중', 'Event', '시작에서 실패 또는 완료까지 같은 lifecycle을 업데이트합니다.'], ['서비스 health', 'Thing', '객체의 현재 상태가 시간에 따라 바뀝니다.']],
		example: '간단한 pipeline 완료는 Message, 여러 단계 배포는 Event, 현재 service state는 Thing을 사용합니다.',
		questions: [['PushGo는 CI/CD 알림에 적합한가요?', '예. CI/CD 시스템은 shell step 또는 webhook action에서 HTTP API를 직접 호출할 수 있습니다.'], ['incident는 어떻게 표현해야 하나요?', 'Event를 사용하면 같은 incident를 업데이트하고 닫을 수 있습니다.'], ['팀이 DevOps 알림을 셀프 호스팅할 수 있나요?', '예. private Gateway로 데이터 경로, 인증, 운영 정책을 제어할 수 있습니다.']],
	},
	'home-automation-notifications': {
		title: 'NAS, IoT, Home Assistant 알림',
		description: 'PushGo를 NAS alert, IoT device, Home Assistant automation, 장기 device state 업데이트에 사용합니다.',
		intro: '홈 자동화와 기기 모니터링은 단일 알림만으로 부족할 때가 많습니다. PushGo는 알림, Event, current state를 함께 다룹니다.',
		fits: ['NAS 디스크, 백업, 서비스 alert를 보냅니다.', 'Home Assistant를 HTTP 또는 Webhook 방식으로 연결합니다.', '기기, 센서, 백업 작업, 미디어 서비스를 Thing으로 모델링합니다.', '홈 데이터를 직접 제어해야 할 때 private Gateway를 사용합니다.'],
		rows: [['도어벨 이미지 또는 디스크 경고', 'Message', '내용은 단일 alert입니다.'], ['백업 또는 미디어 스캔 진행', 'Event', '완료까지 진행 상황을 업데이트할 수 있습니다.'], ['센서 또는 기기 상태', 'Thing', '각 과거 알림보다 최신 상태가 중요합니다.']],
		example: 'NAS 스크립트는 `/message`로 디스크 경고를 보내고, 백업 작업은 Event를 생성해 성공 또는 실패까지 업데이트할 수 있습니다.',
		questions: [['PushGo가 Home Assistant webhook을 받을 수 있나요?', '예. Home Assistant automation은 webhook 또는 REST action으로 PushGo HTTP API를 호출할 수 있습니다.'], ['오래된 기기 알림을 줄이는 방법은?', 'Thing을 사용해 같은 객체의 현재 상태를 표시합니다.'], ['private network에서 실행할 수 있나요?', '예. 데이터 경로 또는 transport policy를 제어하려면 Gateway를 셀프 호스팅합니다.']],
	},
	'ntfy-bark-serverchan-migration': {
		title: 'ntfy, Bark, ServerChan에서 이전',
		description: '기존 ntfy, Bark, ServerChan, Webhook 알림 스크립트를 호환 엔드포인트와 네이티브 모델로 PushGo에 이전합니다.',
		intro: 'PushGo는 기존 알림 워크플로를 먼저 수용하고, 중요한 경로를 Message, Event, Thing 모델로 단계적으로 이전할 수 있습니다.',
		fits: ['평가 중에도 간단한 스크립트를 계속 동작시킵니다.', '전체 자동화를 한 번에 다시 쓰지 않고 alert 경로별로 이전합니다.', '필요한 경우 텍스트 알림을 구조화된 lifecycle 또는 state로 바꿉니다.', '민감한 워크플로에는 E2EE와 셀프 호스팅을 함께 사용합니다.'],
		rows: [['단순 이전 알림', 'Message', '기존 알림은 일회성 Message로 유지합니다.'], ['상태 변화가 있는 워크플로', 'Event', '반복 업데이트는 하나의 lifecycle에 속합니다.'], ['장기 모니터링 객체', 'Thing', '같은 entity를 계속 업데이트할 수 있습니다.']],
		example: '낮은 위험의 스크립트는 호환 엔드포인트로 시작하고, 더 풍부한 의미가 필요한 흐름은 `/message`, `/event/*`, `/thing/*`로 이전합니다.',
		questions: [['모든 스크립트를 즉시 다시 써야 하나요?', '아니요. 호환 엔드포인트를 사용하고 가치가 높은 워크플로부터 이전합니다.'], ['언제 텍스트 알림만으로 부족한가요?', '진행, 종료, 현재 상태, 이미지, metadata, 보안 요구사항이 있을 때입니다.'], ['직접적인 기능 비교인가요?', '아닙니다. 이전은 모델링 결정입니다.']],
	},
});

Object.assign(localizedOverrides.es, {
	'notification-api': {
		title: 'API de notificaciones push para scripts y servicios',
		description: 'Use PushGo como API HTTP de notificaciones para curl, webhooks, cron, CI/CD, alertas NAS y automatización.',
		intro: 'PushGo ofrece una API HTTP directa para scripts y servicios que necesitan notificaciones visibles y modelos estructurados de eventos y estado.',
		fits: ['Enviar desde curl, cron, scripts shell o webhooks.', 'Reportar tareas terminadas, alertas de precio, imágenes o resultados de monitoreo.', 'Usar Event y Thing en lugar de acumular texto sin estructura.', 'Empezar con endpoints compatibles y migrar a APIs nativas.'],
		rows: [['Alerta única', 'Message', 'Simple, transitoria y fácil de probar con curl.'], ['Tarea con progreso', 'Event', 'El mismo evento puede actualizarse hasta terminar.'], ['Estado actual de servicio o dispositivo', 'Thing', 'Los clientes ven el estado más reciente, no alertas obsoletas.']],
		example: 'El endpoint nativo `/message` acepta JSON e indica si el Gateway aceptó la solicitud para despacho.',
		questions: [['¿Puedo enviar una notificación con curl?', 'Sí. Message API está diseñada para curl, scripts y clientes HTTP simples.'], ['¿PushGo es solo una API móvil?', 'No. PushGo también modela ciclos Event y estado actual Thing.'], ['¿Puedo autoalojar la API?', 'Sí. Puede operar su propio Gateway con autenticación, almacenamiento, transportes y MCP/OAuth.']],
	},
	'self-hosted-notification-server': {
		title: 'Servidor de notificaciones open source autoalojado',
		description: 'Despliegue PushGo Gateway como servidor autoalojado con transportes privados, estado persistente, E2EE y MCP/OAuth.',
		intro: 'Autoaloje PushGo cuando el camino de notificación, almacenamiento, autenticación, transportes privados y endpoint MCP/OAuth deban estar bajo su control.',
		fits: ['Operar un Gateway privado para automatización personal o de equipo.', 'Evitar que notificaciones, eventos y estado pasen por un Gateway público.', 'Exponer su propio endpoint HTTPS `/mcp` para asistentes de IA.', 'Incluir copias de seguridad, reverse proxy, logs y observabilidad.'],
		rows: [['Ruta privada', 'Gateway', 'Su infraestructura controla la API HTTP y listeners.'], ['Campos sensibles', 'E2EE', 'Los clientes descifran localmente.'], ['Acceso IA', 'MCP OAuth', 'Los usuarios vinculan Channels mediante su URL pública.']],
		example: 'Configure `PUSHGO_PUBLIC_BASE_URL` como origen HTTPS público antes de habilitar MCP/OAuth.',
		questions: [['¿PushGo puede ser un servidor autoalojado?', 'Sí. Gateway está diseñado para despliegues privados con almacenamiento persistente.'], ['¿El autoalojamiento permite MCP?', 'Sí. Un Gateway privado puede exponer `/mcp` y OAuth con una base HTTPS pública.'], ['¿Necesito copias de seguridad?', 'Sí. Channels, dispositivos, grants MCP, Events y Things dependen de almacenamiento persistente.']],
	},
	'devops-notifications': {
		title: 'Notificaciones DevOps y CI/CD',
		description: 'Use PushGo para notificaciones de CI/CD, despliegues, incidentes, servidores y monitoreo con Message, Event y Thing.',
		intro: 'Las notificaciones DevOps son más claras cuando alertas únicas, ciclos de incidentes y estado de servicios se modelan por separado.',
		fits: ['Enviar notificaciones de build, despliegue y release.', 'Seguir incidentes como Event actualizable.', 'Mostrar estado actual de servicio, cola, backup o host como Thing.', 'Entregar alertas a clientes Apple y Android mediante Gateway público o privado.'],
		rows: [['Build terminado', 'Message', 'Una notificación visible es suficiente.'], ['Despliegue en progreso', 'Event', 'El ciclo pasa de iniciado a fallido o completado.'], ['Salud de servicio', 'Thing', 'El objeto tiene un estado actual que cambia.']],
		example: 'Use Message para final de pipeline, Event para despliegues con varios pasos y Thing para estado actual de servicios.',
		questions: [['¿PushGo sirve para CI/CD?', 'Sí. Los sistemas CI/CD pueden llamar la API HTTP desde shell steps o webhooks.'], ['¿Cómo representar incidentes?', 'Como Event, para actualizarlos y cerrarlos.'], ['¿Un equipo puede autoalojar estas alertas?', 'Sí. Un Gateway privado controla datos, autenticación y operación.']],
	},
	'home-automation-notifications': {
		title: 'Notificaciones NAS, IoT y Home Assistant',
		description: 'Use PushGo para alertas NAS, dispositivos IoT, automatizaciones Home Assistant y estados duraderos.',
		intro: 'La automatización del hogar y el monitoreo de dispositivos suelen requerir más que una alerta única. PushGo envía notificaciones, sigue eventos y mantiene estado actual.',
		fits: ['Enviar alertas de disco, backup y servicios NAS.', 'Conectar Home Assistant por HTTP o webhook.', 'Modelar dispositivos, sensores, backups o servicios multimedia como Thing.', 'Usar Gateway privado cuando los datos del hogar deben mantenerse bajo control.'],
		rows: [['Imagen o alerta de disco', 'Message', 'El contenido es una alerta única.'], ['Progreso de backup o escaneo', 'Event', 'El progreso se actualiza hasta terminar.'], ['Estado de sensor o dispositivo', 'Thing', 'El último estado importa más que cada alerta histórica.']],
		example: 'Un script NAS puede llamar `/message` para alertas de disco; un backup puede crear un Event y actualizarlo hasta éxito o fallo.',
		questions: [['¿PushGo puede recibir webhooks de Home Assistant?', 'Sí. Home Assistant puede llamar PushGo mediante webhook o acción REST.'], ['¿Cómo evitar notificaciones obsoletas?', 'Use Thing para mostrar el estado actual del mismo objeto.'], ['¿Puede ejecutarse en privado?', 'Sí. Autoaloje Gateway para controlar ruta de datos o políticas de transporte.']],
	},
	'ntfy-bark-serverchan-migration': {
		title: 'Migrar desde ntfy, Bark o ServerChan',
		description: 'Migre scripts ntfy, Bark, ServerChan o webhook a PushGo con endpoints compatibles y modelos nativos.',
		intro: 'PushGo puede recibir workflows existentes mientras migra rutas importantes a Message, Event y Thing.',
		fits: ['Mantener scripts simples durante la evaluación.', 'Migrar una ruta de alerta por vez.', 'Reemplazar texto plano por ciclos o estado estructurado cuando aporte valor.', 'Combinar E2EE y autoalojamiento para flujos sensibles.'],
		rows: [['Alerta simple migrada', 'Message', 'La notificación antigua queda como mensaje puntual.'], ['Workflow con cambios de estado', 'Event', 'Las actualizaciones repetidas pertenecen a un ciclo.'], ['Objeto duradero monitoreado', 'Thing', 'La misma entidad puede actualizarse con el tiempo.']],
		example: 'Empiece con endpoints compatibles para scripts de bajo riesgo y migre flujos más ricos a `/message`, `/event/*` o `/thing/*`.',
		questions: [['¿Debo reescribir todo de inmediato?', 'No. Use compatibilidad y migre primero los flujos de más valor.'], ['¿Cuándo no basta el texto plano?', 'Cuando importan progreso, cierre, estado actual, imágenes, metadatos o seguridad.'], ['¿Es una comparación directa?', 'No. La migración es una decisión de modelado.']],
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

Object.assign(localizedOverrides.de['ai-agent-notifications'], {
	rows: [['Eine Abschlussmeldung', 'Message', 'Der Benutzer braucht eine sichtbare Benachrichtigung.'], ['Lange Agent-Aufgabe', 'Event', 'Dieselbe Aufgabe kann aktualisiert und geschlossen werden.'], ['Aktueller Dienst- oder Aufgabenstatus', 'Thing', 'Der Agent aktualisiert ein dauerhaftes Objekt.'], ['Assistenten-Autorisierung', 'MCP OAuth', 'Das Modell braucht kein Channel-Passwort in Tool-Aufrufen.']],
	example: 'Ein MCP-Client verbindet sich mit `/mcp`, startet `pushgo.channel.bind.start`, der Benutzer autorisiert einen Channel im Browser, danach kann der Assistent innerhalb dieses Bereichs `pushgo.message.send`, `pushgo.event.update` oder `pushgo.thing.update` aufrufen.',
});

Object.assign(localizedOverrides.fr['ai-agent-notifications'], {
	rows: [['Alerte de fin unique', 'Message', 'L’utilisateur a besoin d’une notification visible.'], ['Tâche longue d’agent', 'Event', 'La même tâche peut être mise à jour puis fermée.'], ['État actuel d’un service ou d’une tâche', 'Thing', 'L’agent met à jour un objet persistant.'], ['Autorisation assistant', 'MCP OAuth', 'Le modèle n’a pas besoin du mot de passe Channel dans les appels d’outil.']],
	example: 'Un client MCP se connecte à `/mcp`, lance `pushgo.channel.bind.start`, l’utilisateur autorise un Channel dans le navigateur, puis l’assistant peut appeler `pushgo.message.send`, `pushgo.event.update` ou `pushgo.thing.update` dans ce périmètre.',
});

Object.assign(localizedOverrides.ja['ai-agent-notifications'], {
	rows: [['一度きりの完了通知', 'Message', 'ユーザーには一つの見える通知が必要です。'], ['長時間の Agent タスク', 'Event', '同じタスクを更新し、最後に閉じられます。'], ['サービスやタスクの現在状態', 'Thing', 'Agent が一つの永続オブジェクトを更新します。'], ['アシスタント認可', 'MCP OAuth', 'モデルが tool call 内で Channel パスワードを持つ必要はありません。']],
	example: 'MCP クライアントが `/mcp` に接続し、`pushgo.channel.bind.start` を開始します。ユーザーがブラウザで Channel を認可すると、アシスタントはその範囲内で `pushgo.message.send`、`pushgo.event.update`、`pushgo.thing.update` を呼び出せます。',
});

Object.assign(localizedOverrides.ko['ai-agent-notifications'], {
	rows: [['완료 알림 1건', 'Message', '사용자에게 보이는 알림 하나가 필요합니다.'], ['오래 실행되는 Agent 작업', 'Event', '같은 작업을 업데이트하고 종료할 수 있습니다.'], ['서비스 또는 작업의 현재 상태', 'Thing', 'Agent가 하나의 persistent object를 업데이트합니다.'], ['assistant 권한 부여', 'MCP OAuth', '모델이 tool call 안에서 Channel 비밀번호를 가질 필요가 없습니다.']],
	example: 'MCP 클라이언트가 `/mcp`에 연결하고 `pushgo.channel.bind.start`를 시작합니다. 사용자가 브라우저에서 Channel을 승인하면 assistant는 해당 범위 안에서 `pushgo.message.send`, `pushgo.event.update`, `pushgo.thing.update`를 호출할 수 있습니다.',
});

Object.assign(localizedOverrides.es['ai-agent-notifications'], {
	rows: [['Alerta única de finalización', 'Message', 'El usuario necesita una notificación visible.'], ['Tarea larga del agente', 'Event', 'La misma tarea puede actualizarse y cerrarse.'], ['Estado actual de servicio o tarea', 'Thing', 'El agente actualiza un objeto persistente.'], ['Autorización del asistente', 'MCP OAuth', 'El modelo no necesita la contraseña del Channel en llamadas de herramienta.']],
	example: 'Un cliente MCP se conecta a `/mcp`, inicia `pushgo.channel.bind.start`, el usuario autoriza un Channel en el navegador y el asistente puede llamar `pushgo.message.send`, `pushgo.event.update` o `pushgo.thing.update` dentro de ese alcance.',
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
		de: 'Hallo von PushGo',
		fr: 'Bonjour depuis PushGo',
		ja: 'PushGo からの通知',
		ko: 'PushGo 알림',
		es: 'Hola desde PushGo',
	};
	const bodies = {
		root: 'The automation path is working.',
		zh: '自动化通知路径已经打通。',
		'zh-tw': '自動化通知路徑已經打通。',
		de: 'Der Automatisierungspfad funktioniert.',
		fr: 'Le parcours d’automatisation fonctionne.',
		ja: '自動化通知の経路が動作しています。',
		ko: '자동화 알림 경로가 동작합니다.',
		es: 'La ruta de automatización funciona.',
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
		de: [
			'Nutzen Sie getrennte Channels und begrenzte Zugangsdaten für riskante Automatisierung.',
			'Verwenden Sie MCP OAuth für KI-Assistenten, damit Modelle keine Channel-Passwörter halten.',
			'Nutzen Sie Selbsthosting, wenn Datenpfad, Transportregeln oder Compliance-Grenzen kontrolliert werden müssen.',
			'Nutzen Sie E2EE für sensible Felder, die nur Clients entschlüsseln sollen.',
		],
		fr: [
			'Utilisez des Channels séparés et des identifiants limités pour les automatisations à risque.',
			'Préférez MCP OAuth pour les assistants IA afin que les modèles ne détiennent pas les mots de passe Channel.',
			'Auto-hébergez lorsque le chemin de données, les transports ou les contraintes de conformité doivent rester sous contrôle.',
			'Utilisez E2EE pour les champs sensibles à déchiffrer uniquement côté client.',
		],
		ja: [
			'リスクの高い自動化には、分離した Channel と限定された認証情報を使います。',
			'AI アシスタントでは MCP OAuth を優先し、モデルに Channel パスワードを持たせません。',
			'データ経路、transport policy、コンプライアンス境界を管理する必要がある場合はセルフホストします。',
			'機密フィールドは E2EE を使い、クライアントだけが復号します。',
		],
		ko: [
			'위험도가 높은 자동화에는 별도 Channel과 제한된 credential을 사용합니다.',
			'AI assistant에는 MCP OAuth를 우선 사용해 모델이 Channel 비밀번호를 직접 보관하지 않게 합니다.',
			'데이터 경로, transport policy, compliance 경계를 직접 제어해야 하면 셀프 호스팅합니다.',
			'민감한 필드는 E2EE를 사용해 클라이언트만 복호화하게 합니다.',
		],
		es: [
			'Use Channels separados y credenciales limitadas para automatización de alto riesgo.',
			'Prefiera MCP OAuth para asistentes de IA, de modo que los modelos no tengan contraseñas de Channel.',
			'Use autoalojamiento cuando ruta de datos, transporte o cumplimiento deban estar bajo su control.',
			'Use E2EE para campos sensibles que solo los clientes deben descifrar.',
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
			de: 'Erste Schritte',
			fr: 'Bien démarrer',
			ja: 'はじめる',
			ko: '시작하기',
			es: 'Empezar',
		},
		'guides/data-models': {
			root: 'Data Models',
			zh: '数据模型',
			'zh-tw': '資料模型',
			de: 'Datenmodelle',
			fr: 'Modèles de données',
			ja: 'データモデル',
			ko: '데이터 모델',
			es: 'Modelos de datos',
		},
		'guides/self-hosting': {
			root: 'Self-Hosting',
			zh: '私有部署',
			'zh-tw': '私人部署',
			de: 'Selbsthosting',
			fr: 'Auto-hébergement',
			ja: 'セルフホスティング',
			ko: '셀프 호스팅',
			es: 'Autoalojamiento',
		},
		'guides/use-cases': {
			root: 'Use Cases',
			zh: '典型场景',
			'zh-tw': '典型場景',
			de: 'Anwendungsfälle',
			fr: 'Cas d’usage',
			ja: 'ユースケース',
			ko: '사용 사례',
			es: 'Casos de uso',
		},
		'guides/migration': {
			root: 'Migration Guide',
			zh: '迁移指南',
			'zh-tw': '遷移指南',
			de: 'Migrationsleitfaden',
			fr: 'Guide de migration',
			ja: '移行ガイド',
			ko: '마이그레이션 가이드',
			es: 'Guía de migración',
		},
		'reference/mcp': {
			root: 'MCP Reference',
			zh: 'MCP 参考',
			'zh-tw': 'MCP 參考',
			de: 'MCP-Referenz',
			fr: 'Référence MCP',
			ja: 'MCP リファレンス',
			ko: 'MCP 참조',
			es: 'Referencia MCP',
		},
		'reference/auth': {
			root: 'Authentication',
			zh: '身份验证',
			'zh-tw': '身分驗證',
			de: 'Authentifizierung',
			fr: 'Authentification',
			ja: '認証',
			ko: '인증',
			es: 'Autenticación',
		},
		'reference/api-message': {
			root: 'Message API',
			zh: '消息 API',
			'zh-tw': '訊息 API',
			de: 'Message API',
			fr: 'API Message',
			ja: 'Message API',
			ko: 'Message API',
			es: 'API de mensajes',
		},
		'reference/api-event': {
			root: 'Event API',
			zh: '事件 API',
			'zh-tw': '事件 API',
			de: 'Event API',
			fr: 'API Event',
			ja: 'Event API',
			ko: 'Event API',
			es: 'API de eventos',
		},
		'reference/api-thing': {
			root: 'Thing API',
			zh: '实体 API',
			'zh-tw': '實體 API',
			de: 'Thing API',
			fr: 'API Thing',
			ja: 'Thing API',
			ko: 'Thing API',
			es: 'API de Thing',
		},
		'reference/e2ee': {
			root: 'End-to-End Encryption',
			zh: '端到端加密',
			'zh-tw': '端對端加密',
			de: 'Ende-zu-Ende-Verschlüsselung',
			fr: 'Chiffrement de bout en bout',
			ja: 'エンドツーエンド暗号化',
			ko: '종단 간 암호화',
			es: 'Cifrado de extremo a extremo',
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
		de: [
			['KI-Agent-Pfad', 'KI-Agent-Benachrichtigungen', 'MCP und OAuth verbinden Agenten und Chatbots mit Message, Event und Thing.'],
			['HTTP-Einstieg', 'Notification API', 'Benachrichtigungen aus curl, Skripten, Webhooks, CI/CD, NAS und Automatisierung senden.'],
		],
		fr: [
			['Parcours agent IA', 'Notifications agents IA', 'Utiliser MCP et OAuth pour relier agents et chatbots à Message, Event et Thing.'],
			['Entrée HTTP', 'API de notification', 'Envoyer des notifications depuis curl, scripts, webhooks, CI/CD, NAS et automatisations.'],
		],
		ja: [
			['AI agent 経路', 'AI Agent 通知', 'MCP と OAuth で agent やチャットボットから Message、Event、Thing を扱います。'],
			['HTTP 入口', '通知 API', 'curl、スクリプト、Webhook、CI/CD、NAS、自動化サービスから通知します。'],
		],
		ko: [
			['AI agent 경로', 'AI Agent 알림', 'MCP와 OAuth로 agent와 챗봇이 Message, Event, Thing을 다룹니다.'],
			['HTTP 진입점', '알림 API', 'curl, 스크립트, Webhook, CI/CD, NAS, 자동화 서비스에서 알림을 보냅니다.'],
		],
		es: [
			['Ruta agente IA', 'Notificaciones de agentes IA', 'Use MCP y OAuth para que agentes y chatbots envíen Message, Event y Thing.'],
			['Entrada HTTP', 'API de notificación', 'Envíe notificaciones desde curl, scripts, webhooks, CI/CD, NAS y automatización.'],
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
