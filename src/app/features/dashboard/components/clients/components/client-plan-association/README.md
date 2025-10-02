# Cliente-Plano Association Modal

Este componente fornece um modal para associar clientes a planos de pagamento de forma intuitiva e profissional.

## Funcionalidades

- **Seleção de Cliente**: Dropdown com todos os clientes cadastrados
- **Seleção de Plano**: Dropdown com todos os planos de pagamento disponíveis
- **Preview em Tempo Real**: Mostra detalhes do cliente e plano selecionados
- **Resumo da Associação**: Visualização clara da associação antes da confirmação
- **Validações**: Formulário reativo com validações obrigatórias
- **Design Responsivo**: Adaptado para dispositivos móveis

## Como Usar

### 1. Abrir o Modal

```typescript
openClientPlanAssociation(): void {
  const dialogRef = this.dialog.open(ClientPlanAssociationComponent, {
    width: '600px',
    maxHeight: '90vh',
    disableClose: false,
    data: { 
      clientId: 'optional-client-id', // Pré-selecionar cliente
      planId: 'optional-plan-id'      // Pré-selecionar plano
    }
  });

  dialogRef.afterClosed().subscribe((result: ClientPlanAssociationResult) => {
    if (result) {
      console.log('Associação criada:', result);
      // Implementar lógica de salvamento
    }
  });
}
```

### 2. Estrutura do Resultado

```typescript
interface ClientPlanAssociationResult {
  clientId: string;    // ID do cliente selecionado
  planId: string;      // ID do plano selecionado
  clientName: string;  // Nome do cliente para exibição
  planName: string;    // Nome do plano para exibição
}
```

## Integração

### 1. Importações Necessárias

```typescript
import { MatDialog } from '@angular/material/dialog';
import { ClientPlanAssociationComponent, ClientPlanAssociationResult } from './path/to/component';
```

### 2. Injeção de Dependência

```typescript
constructor(
  private dialog: MatDialog
) {}
```

### 3. Template HTML

```html
<button mat-raised-button color="primary" (click)="openClientPlanAssociation()">
  <mat-icon>link</mat-icon>
  Associar Cliente a Plano
</button>
```

## Características do Design

- **Material Design**: Segue as diretrizes do Angular Material
- **Cores Consistentes**: Utiliza a paleta de cores do projeto (#2196f3)
- **Animações Suaves**: Efeitos visuais para melhor UX
- **Feedback Visual**: Estados de hover, focus e loading
- **Acessibilidade**: Tooltips e navegação por teclado

## Dependencies

- Angular Material Dialog
- Reactive Forms
- ClientService (para buscar clientes)
- PaymentService (para buscar planos)
- PopupService (para notificações)

## Responsividade

O modal se adapta automaticamente a diferentes tamanhos de tela:
- **Desktop**: Layout horizontal com previews lado a lado
- **Mobile**: Layout vertical com elementos empilhados
- **Tablet**: Layout híbrido otimizado para toque
