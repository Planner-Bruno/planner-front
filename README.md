# Task Organizer (Frontend)

Aplicativo Expo/React Native pensado para organizar tarefas pessoais e profissionais com a mesma experiência em Windows (desktop), Android e iOS. O layout combina visão de cards, filtros rápidos e insights automáticos.

## Principais recursos
- Lista inteligente com estados (backlog, em progresso, concluída) e prioridades coloridas
- Estatísticas em tempo real (ativas, concluídas, atrasadas, total)
- Pesquisa, filtro por status e janela de datas (hoje, 7 dias, todas)
- Cadastro rápido via folha modal com validação simples de prazo
- Persistência local com AsyncStorage + bootstrapping de tarefas demo
- Painel de insights analíticos (aba “Insights”) abastecido pelo endpoint `/planner/insights/overview`
- Regras utilitárias testadas com Vitest e linter configurado para TypeScript/React Native

## Stack
- Expo SDK 54 + React Native 0.81
- React 19 + React Native Safe Area Context
- AsyncStorage para persistência
- TypeScript com aliases (`@/*`)
- Vitest para testes unitários
- ESLint (flat config) com plugins React/React Hooks/React Native

## Como executar
Pré-requisitos: Node 18+ e Expo CLI (ou aplicativo Expo Go) instalados.

```powershell
cd frontend
Copy-Item .env.example .env   # ajuste EXPO_PUBLIC_API_BASE_URL (ou EXPO_PUBLIC_API_URL) para o IP da sua máquina
npm install
npm run lint
npm run test
npm run start
```

Durante o `npm run start`, escolha `w` para rodar no navegador, `a` para Android ou `i` para iOS. Para build nativa utilize `expo run:android` ou `expo run:ios` após configurar os toolchains. Para garantir que dispositivos na mesma rede enxerguem o backend, mantenha o Expo em modo **LAN** (menu `?` → `LAN` ou `npx expo start --host lan`).

### Testar no celular (mesmo Wi-Fi)
1. Descubra o IP local do computador (`ipconfig` no Windows) e atualize o valor de `EXPO_PUBLIC_API_BASE_URL` (ou `EXPO_PUBLIC_API_URL`) no arquivo `.env` (ex.: `http://192.168.0.15:8000`).
2. Inicie o backend com `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` (veja README do backend para liberar o firewall e configurar `CORS_ALLOWED_ORIGINS`).
3. Rode `npm run start` e garanta que o Expo está em modo LAN. Abra o aplicativo Expo Go no celular conectado ao mesmo roteador e leia o QR code.
4. A tela de login deve consumir `http://SEU-IP:8000/auth/login`. Caso não faça login, confirme que o backend está acessível via navegador do celular (ex.: `http://192.168.0.15:8000/health`).

### Acessar o app web direto no celular
- Para usar o mesmo bundle web em outros dispositivos durante o desenvolvimento, execute `npm run web:lan`. O Expo iniciará o servidor web na porta `8081` ouvindo no IP local. Acesse `http://SEU-IP:8081/` pelo celular (certifique-se de que o Windows liberou o Node.js no firewall ou crie uma exceção com `New-NetFirewallRule -DisplayName "Expo Web" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow`).
- Para um preview estático estável (sem Metro/Expo abertos), utilize `npm run web:preview`, que exporta o app para `dist/` e o serve via `npx serve` na porta `4173`. Abra `http://SEU-IP:4173/` no navegador do celular.
- Em ambos os casos, backend continua ouvindo em `http://SEU-IP:8000`. Garanta que as variáveis `EXPO_PUBLIC_API_BASE_URL`/`EXPO_PUBLIC_API_URL` apontem para esse endereço antes de criar o build.

## Estrutura relevante
```
App.tsx
src/
  components/
  screens/
  state/
  storage/
  services/
  utils/
tests/
```

## Testes
```powershell
npm run test
```

## Próximos passos sugeridos
1. Implementar sincronia em nuvem (ex.: Supabase ou Firebase) para compartilhar tarefas entre dispositivos
2. Adicionar notificações locais para lembretes próximos ao prazo
3. Criar edição completa de tarefas (duplo toque no card abrindo o modal com dados preenchidos)
