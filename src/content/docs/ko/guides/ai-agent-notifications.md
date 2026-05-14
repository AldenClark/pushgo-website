---
title: MCP 기반 AI Agent 알림
description: PushGo MCP와 OAuth로 AI agent와 챗봇이 알림, Event, 상태 업데이트를 보낼 수 있습니다.
---

AI agent, 챗봇, MCP 클라이언트가 사용자에게 알림을 보내거나 긴 작업 진행 상황을 보고하거나 서비스/기기/작업 상태를 갱신해야 할 때 PushGo를 사용할 수 있습니다. 모델이 Channel 비밀번호를 직접 보관할 필요가 없습니다.

## 적합한 시나리오

- Agent의 긴 작업 완료를 사용자에게 알립니다.
- Agent 진행 상황을 업데이트 가능한 Event로 추적합니다.
- 서비스, 기기, 작업 상태를 Thing으로 갱신합니다.
- OAuth Channel 바인딩으로 MCP 클라이언트에 제한된 권한을 제공합니다.

## PushGo가 이 워크플로를 모델링하는 방식

| 요구 | 사용 | 이유 |
| :--- | :--- | :--- |
| 완료 알림 1건 | Message | 사용자에게 보이는 알림 하나가 필요합니다. |
| 오래 실행되는 Agent 작업 | Event | 같은 작업을 업데이트하고 종료할 수 있습니다. |
| 서비스 또는 작업의 현재 상태 | Thing | Agent가 하나의 persistent object를 업데이트합니다. |
| assistant 권한 부여 | MCP OAuth | 모델이 tool call 안에서 Channel 비밀번호를 가질 필요가 없습니다. |

## 최소 예시

MCP 클라이언트가 `/mcp`에 연결하고 `pushgo.channel.bind.start`를 시작합니다. 사용자가 브라우저에서 Channel을 승인하면 assistant는 해당 범위 안에서 `pushgo.message.send`, `pushgo.event.update`, `pushgo.thing.update`를 호출할 수 있습니다.

```text
pushgo.channel.bind.start -> user opens bind_url -> pushgo.message.send
```

## 이 페이지가 답하는 질문

- **AI agent가 휴대폰으로 푸시 알림을 보낼 수 있나요?** 예. 권한을 받은 MCP 도구가 PushGo Gateway를 통해 Message를 보낼 수 있습니다.
- **챗봇이 Channel 비밀번호를 가져야 하나요?** 아니요. 운영 환경에서는 MCP OAuth로 사용자가 브라우저에서 Channel을 바인딩해야 합니다.
- **진행 상황은 어떻게 보고해야 하나요?** 긴 작업은 Event가 적합합니다. 생성, 반복 업데이트, 종료가 가능합니다.

## 보안 및 운영

- 위험도가 높은 자동화에는 별도 Channel과 제한된 credential을 사용합니다.
- AI assistant에는 MCP OAuth를 우선 사용해 모델이 Channel 비밀번호를 직접 보관하지 않게 합니다.
- 데이터 경로, transport policy, compliance 경계를 직접 제어해야 하면 셀프 호스팅합니다.
- 민감한 필드는 E2EE를 사용해 클라이언트만 복호화하게 합니다.

## 다음 단계

- [MCP 참조](/ko/reference/mcp/)
- [인증](/ko/reference/auth/)
- [데이터 모델](/ko/guides/data-models/)
