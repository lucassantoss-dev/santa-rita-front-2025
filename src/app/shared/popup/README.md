# Sistema de Popup Profissional

Este é um sistema de popup/modal profissional compartilhado que mantém a identidade visual do projeto.

## Características

- **Design Profissional**: Segue o design system do projeto com cores verde suave
- **Tipos de Popup**: success, warning, error, info, confirm
- **Tamanhos**: small, medium, large
- **Animações**: Efeitos suaves de entrada e saída
- **Responsivo**: Adaptável para mobile
- **Acessibilidade**: Suporte a fechamento via ESC e click no backdrop

## Como Usar

### 1. Injetar o serviço no componente

```typescript
import { PopupService } from '../shared/popup/popup.service';

constructor(private popupService: PopupService) { }
```

### 2. Métodos Básicos

#### Mensagens Simples
```typescript
// Sucesso
this.popupService.showSuccessMessage('Operação realizada com sucesso!');

// Erro
this.popupService.showErrorMessage('Ocorreu um erro ao processar a solicitação.');

// Informação
this.popupService.showInfoMessage('Esta é uma mensagem informativa.');

// Aviso
this.popupService.showWarningMessage('Atenção: Esta ação requer cuidado.');
```

#### Popups Personalizados
```typescript
// Sucesso com título personalizado
this.popupService.success('Cliente Cadastrado', 'O cliente foi cadastrado com sucesso no sistema.');

// Erro com configurações adicionais
this.popupService.error('Erro de Validação', 'Verifique os campos obrigatórios.', {
  size: 'large',
  showCloseButton: false
});
```

#### Confirmações
```typescript
// Confirmação simples
this.popupService.confirmDialog(
  'Confirmar Ação',
  'Deseja realmente executar esta ação?',
  () => {
    console.log('Confirmado!');
    // Lógica de confirmação
  },
  () => {
    console.log('Cancelado!');
    // Lógica de cancelamento (opcional)
  }
);

// Confirmação de exclusão
this.popupService.confirmDelete('Cliente João Silva', () => {
  this.deleteClient(clientId);
});

// Confirmação com texto personalizado
this.popupService.confirmWithCustomText(
  'Finalizar Pedido',
  'Deseja finalizar o pedido no valor de R$ 250,00?',
  () => this.finalizeOrder(),
  'Finalizar'
);
```

### 3. Configurações Avançadas

```typescript
this.popupService.show({
  type: 'info',
  size: 'large',
  title: 'Informações Detalhadas',
  message: 'Aqui estão as informações completas...',
  showCloseButton: true,
  showConfirmButton: true,
  showCancelButton: false,
  confirmText: 'Entendi',
  closeOnBackdropClick: false,
  icon: 'info_outline',
  customClass: 'my-custom-popup',
  onConfirm: () => {
    // Lógica personalizada de confirmação
  },
  onClose: () => {
    // Lógica personalizada de fechamento
  }
});
```

## Tipos Disponíveis

- **success**: Verde, ícone check_circle
- **error**: Vermelho, ícone error
- **warning**: Amarelo, ícone warning
- **info**: Azul, ícone info
- **confirm**: Verde, ícone help_outline

## Tamanhos

- **small**: 320px de largura
- **medium**: 480px de largura (padrão)
- **large**: 640px de largura

## Personalização

Você pode adicionar classes CSS customizadas usando o parâmetro `customClass`:

```scss
.my-custom-popup {
  .popup-content {
    font-size: 16px;
  }
  
  .popup-title {
    color: #custom-color;
  }
}
```

## Instalação já realizada

O popup já está configurado no `app.module.ts` e no `app.component.html`. Basta injetar o `PopupService` nos seus componentes e usar!
