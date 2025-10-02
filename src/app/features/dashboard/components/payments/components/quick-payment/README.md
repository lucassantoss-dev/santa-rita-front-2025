# Quick Payment Modal

## Descrição
Modal para criação rápida de pagamentos com informações essenciais: cliente, valor, dia do vencimento e descrição.

## Funcionalidades

### Campos Obrigatórios
- **Cliente**: Select com todos os clientes cadastrados
- **Valor**: Campo numérico para o valor do pagamento (R$)
- **Dia do Vencimento**: Dia do mês (1-31) para vencimento recorrente
- **Descrição**: Texto livre para descrever o pagamento

### Body de Requisição
```json
{
  "socio_id": "cliente_id",
  "responsavel": "Nome do Cliente",
  "quadra": "A1",
  "numero": "123", 
  "bairro": "Centro",
  "cidade": "São Paulo",
  "estado": "SP",
  "contato": "(11) 99999-9999",
  "valor": 120.00,
  "dueDate": "2025-10-10T00:00:00.000Z",
  "descricao": "Mensalidade do jazigo",
  "status": "pending",
  "paymentType": "avulso"
}
```

### Lógica de Vencimento
- O sistema calcula automaticamente a próxima data de vencimento baseada no dia informado
- Se o dia já passou no mês atual, agenda para o próximo mês
- Formato ISO completo: `YYYY-MM-DDTHH:mm:ss.sssZ`

## Uso

### Abertura do Modal
```typescript
// Sem cliente pré-selecionado
openQuickPayment();

// Com cliente pré-selecionado
openQuickPayment('client_id_here');
```

### Integração no Template
```html
<button mat-raised-button (click)="openQuickPayment()">
  <mat-icon>flash_on</mat-icon>
  Criação Rápida
</button>
```

## Design
- Segue o padrão visual do projeto
- Header com gradiente verde
- Previews dinâmicos do cliente e pagamento
- Responsivo para mobile
- Animações suaves
- Validação em tempo real

## Validações
- Cliente obrigatório
- Valor maior que zero
- Dia entre 1 e 31
- Descrição obrigatória
- Feedback visual para erros

## Após Criação
- Mostra mensagem de sucesso
- Registra atividade no sistema
- Recarrega lista de pagamentos
- Fecha o modal automaticamente
