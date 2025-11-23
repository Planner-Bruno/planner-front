# Task Organizer (Frontend)

Aplicativo Expo/React Native pensado para organizar tarefas pessoais e profissionais com a mesma experiência em Windows (desktop), Android e iOS. O layout combina visão de cards, filtros rápidos e insights automáticos.

## Principais recursos
- Lista inteligente com estados (backlog, em progresso, concluída) e prioridades coloridas
- Estatísticas em tempo real (ativas, concluídas, atrasadas, total)
- Pesquisa, filtro por status e janela de datas (hoje, 7 dias, todas)
- Cadastro rápido via folha modal com validação simples de prazo
- Persistência local com AsyncStorage + bootstrapping de tarefas demo
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
npm install
npm run lint
npm run test
npm run start
```

Durante o `npm run start`, escolha `w` para rodar no navegador, `a` para Android ou `i` para iOS. Para build nativa utilize `expo run:android` ou `expo run:ios` após configurar os toolchains.

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
