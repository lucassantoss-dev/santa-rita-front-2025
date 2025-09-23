import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { DocumentGeneratorService } from './document-generator.service';
import { Router } from '@angular/router';
import { ClientService } from '../../../../core/client.service';
import { animate, state, style, transition, trigger } from '@angular/animations';

interface ClientData {
  _id: string;
  nome: string;
  endereco: string;
  quadra: string;
  numero: string;
  tipo: string;
  status?: string;
}

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0px',
        minHeight: '0',
        overflow: 'hidden',
        opacity: 0
      })),
      state('expanded', style({
        height: '*',
        opacity: 1
      })),
      transition('expanded <=> collapsed', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class ClientsComponent implements OnInit {
  // Configurações da tabela
  displayedColumns: string[] = ['avatar', 'client-info', 'location', 'type', 'actions'];
  dataSource!: MatTableDataSource<ClientData>;
  loading: boolean = false;

  // Filtros
  nameFilter: string = '';
  blockFilter: string = '';
  typeFilter: string = '';
  statusFilter: string = '';
  filtersExpanded: boolean = true;

  // Paginação
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  pagedData: ClientData[] = [];

  // Estatísticas
  totalClients: number = 0;
  newClientsThisMonth: number = 0;
  activeCards: number = 0;
  certificatesGenerated: number = 0;

  // Contadores
  totalCount: number = 0;
  filteredCount: number = 0;

  // Dados mockados para demonstração
  private mockClients: ClientData[] = [
    {
      _id: '1',
      nome: 'Maria Santos Silva',
      endereco: 'Rua das Flores, 123 - Centro',
      quadra: 'A',
      numero: '15',
      tipo: 'Individual',
      status: 'Ativo'
    },
    {
      _id: '2',
      nome: 'João Oliveira Costa',
      endereco: 'Av. Principal, 456 - Vila Nova',
      quadra: 'B',
      numero: '22',
      tipo: 'Familiar',
      status: 'Ativo'
    },
    {
      _id: '3',
      nome: 'Ana Paula Rodrigues',
      endereco: 'Rua do Campo, 789 - Jardim',
      quadra: 'C',
      numero: '08',
      tipo: 'Perpétuo',
      status: 'Ativo'
    },
    {
      _id: '4',
      nome: 'Carlos Mendes Souza',
      endereco: 'Rua Nova, 321 - Centro',
      quadra: 'A',
      numero: '33',
      tipo: 'Individual',
      status: 'Pendente'
    },
    {
      _id: '5',
      nome: 'Helena Ferreira Lima',
      endereco: 'Av. das Palmeiras, 654 - Parque',
      quadra: 'D',
      numero: '12',
      tipo: 'Familiar',
      status: 'Ativo'
    }
  ];

  constructor(
    private http: HttpClient,
    private docGen: DocumentGeneratorService,
    private router: Router,
    private clientService: ClientService
  ) { }

  async ngOnInit(): Promise<void> {
    await this.initializeComponent();
  }

  private async initializeComponent(): Promise<void> {
    this.loading = true;

    try {
      // Tentar carregar dados reais da API
      await this.getClients();
    } catch (error) {
      console.error('Erro ao carregar dados da API, usando dados mockados:', error);
      this.loadMockData();
    } finally {
      this.loading = false;
    }
  }

  private loadMockData(): void {
    this.dataSource = new MatTableDataSource(this.mockClients);
    this.setupDataSource();
  }

  private async getClients(): Promise<void> {
    try {
      // Para demonstração, usar dados mockados
      // Em produção, descomente o código abaixo para usar a API

      /*
      this.clientService.getAllClients().subscribe({
        next: (response) => {
          if (response && response.data) {
            const mappedData: ClientData[] = response.data.map((client: any) => ({
              _id: client._id || client.id,
              nome: client.nome || client.name,
              endereco: client.endereco || client.address,
              quadra: client.quadra || 'A',
              numero: client.numero || '1',
              tipo: client.tipo || 'Individual',
              status: client.status || 'Ativo'
            }));

            this.dataSource = new MatTableDataSource<ClientData>(mappedData);
            this.setupDataSource();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar clientes:', error);
          this.loadMockData();
          this.loading = false;
        }
      });
      */

      // Usar dados mockados para demonstração
      this.loadMockData();

    } catch (error) {
      this.loadMockData();
    }
  }

  private setupDataSource(): void {
    if (this.dataSource) {
      // Configurar filtro personalizado
      this.dataSource.filterPredicate = this.createFilter();

      // Calcular estatísticas
      this.updateStatistics();

      // Aplicar paginação inicial
      this.onFilterChange();
    }
  }

  private createFilter(): (data: ClientData, filter: string) => boolean {
    return (data: ClientData, filter: string): boolean => {
      const searchString = JSON.parse(filter);

      const nameMatch = !searchString.name ||
        data.nome.toLowerCase().includes(searchString.name.toLowerCase());

      const blockMatch = !searchString.block ||
        data.quadra.toLowerCase().includes(searchString.block.toLowerCase());

      const typeMatch = !searchString.type ||
        data.tipo.toLowerCase() === searchString.type.toLowerCase();

      const statusMatch = !searchString.status ||
        (data.status || 'Ativo').toLowerCase() === searchString.status.toLowerCase();

      return nameMatch && blockMatch && typeMatch && statusMatch;
    };
  }

  private updateStatistics(): void {
    if (this.dataSource) {
      const data = this.dataSource.data;
      this.totalClients = data.length;
      this.totalCount = data.length;
      this.filteredCount = this.dataSource.filteredData?.length || data.length;

      // Calcular estatísticas reais
      this.newClientsThisMonth = Math.floor(data.length * 0.15);
      this.activeCards = data.filter(c => c.status === 'Ativo').length;
      this.certificatesGenerated = Math.floor(data.length * 0.60);
    }
  }

  // Métodos de filtro e busca
  onFilterChange(): void {
    if (this.dataSource) {
      const filters = {
        name: this.nameFilter || '',
        block: this.blockFilter || '',
        type: this.typeFilter || '',
        status: this.statusFilter || ''
      };

      this.dataSource.filter = JSON.stringify(filters);
      this.filteredCount = this.dataSource.filteredData.length;
      this.pageIndex = 0; // Reset para primeira página
      this.applyPagination();
    }
  }

  onSearch(): void {
    this.onFilterChange();
  }

  clearFilters(): void {
    this.nameFilter = '';
    this.blockFilter = '';
    this.typeFilter = '';
    this.statusFilter = '';
    this.onFilterChange();
  }

  toggleFilters(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  // Métodos de paginação
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyPagination();
  }

  private applyPagination(): void {
    if (this.dataSource) {
      const data = this.dataSource.filteredData || this.dataSource.data;
      const startIndex = this.pageIndex * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      this.pagedData = data.slice(startIndex, endIndex);
    }
  }

  // Métodos de ação
  onCreate(): void {
    this.router.navigate(['/dashboard/client-create']);
  }

  onEdit(id: string): void {
    this.router.navigate([`/dashboard/client-edit/${id}`]);
  }

  onDelete(id: string): void {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      // Implementar lógica de exclusão
      console.log('Deletando cliente:', id);
      // this.clientService.delete(id).then(() => this.getClients());
    }
  }

  downloadCard(clienteId: string): void {
    try {
      const cliente = this.pagedData.find(c => c._id === clienteId);
      if (cliente) {
        this.docGen.gerarCarteirinha(cliente);
      }
    } catch (error) {
      console.error('Erro ao gerar carteirinha:', error);
    }
  }

  downloadCertificate(clienteId: string): void {
    try {
      const cliente = this.pagedData.find(c => c._id === clienteId);
      if (cliente) {
        this.docGen.gerarCertificado(cliente);
      }
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
    }
  }

  exportClients(): void {
    if (this.dataSource && this.dataSource.filteredData) {
      const data = this.dataSource.filteredData;
      const csvContent = this.convertToCSV(data);
      this.downloadCSV(csvContent, 'clientes.csv');
    }
  }

  private convertToCSV(data: ClientData[]): string {
    const headers = ['Nome', 'Endereço', 'Quadra', 'Número', 'Tipo', 'Status'];
    const csvData = data.map(row => [
      row.nome,
      row.endereco,
      row.quadra,
      row.numero,
      row.tipo,
      row.status || 'Ativo'
    ]);

    return [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }

  private downloadCSV(csvContent: string, fileName: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Métodos auxiliares para CSS classes e ícones
  getStatusClass(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'ativo': return 'active';
      case 'inativo': return 'inactive';
      case 'pendente': return 'pending';
      default: return 'active';
    }
  }

  getTypeClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'individual': return 'individual';
      case 'familiar': return 'familiar';
      case 'perpétuo': return 'perpetuo';
      default: return 'individual';
    }
  }

  getTypeIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'individual': return 'person';
      case 'familiar': return 'family_restroom';
      case 'perpétuo': return 'all_inclusive';
      default: return 'person';
    }
  }
}
