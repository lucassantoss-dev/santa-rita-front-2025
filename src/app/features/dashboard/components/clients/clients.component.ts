import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { DocumentGeneratorService } from './document-generator.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit {
  displayedColumns: string[] = ['block', 'number', 'type', 'name', 'address', 'actions'];
  dataSource!: MatTableDataSource<any>;
  loading: boolean = false;
  nameFilter: string = '';
  ipFilter: string = '';
  macFilter: string = '';
  config: any;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  pagedData: any[] = [];

  constructor(
    private http: HttpClient,
    private docGen: DocumentGeneratorService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    // this.loading = true;
    this.http.get<any[]>('/api/clients').subscribe(clients => {
      this.dataSource = new MatTableDataSource(clients);
      this.applyPagination();
      // this.loading = false;
    });
  }

  groupFace() {
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getClients() {
  }

  applyPagination() {
    if (!this.dataSource) return;
    const data = this.dataSource.filteredData || this.dataSource.data;
    const startIndex = this.pageIndex * this.pageSize;
    this.pagedData = data.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyPagination();
  }

  clearFilters(): void {
    this.nameFilter = '';
    this.ipFilter = '';
    this.macFilter = '';
    this.dataSource.filter = JSON.stringify({ name: '', ip: '', mac: '' });
    this.pageIndex = 0;
    this.applyPagination();
  }

  onSearch(): void {
    const filterValues = {
      name: this.nameFilter || '',
      ip: this.ipFilter || '',
      mac: this.macFilter || ''
    };
    this.dataSource.filter = JSON.stringify(filterValues);
    this.pageIndex = 0;
    this.applyPagination();
  }

  onCreate() {
    const url = '/dashboard/client-create';
    this.router.navigateByUrl(url);
  };

  onEdit(id: string) {
    const url = `/dashboard/client-edit/${id}`;
    this.router.navigateByUrl(url);
  };

  onView(id: string): void {

  };

  onDelete(id: string): void {
  }

  downloadCard(clienteId: string) {
    const cliente = this.pagedData.find(c => c._id === clienteId);
    if (cliente) {
      this.docGen.gerarCarteirinha(cliente);
    }
  }

  downloadCertificate(clienteId: string) {
    const cliente = this.pagedData.find(c => c._id === clienteId);
    if (cliente) {
      this.docGen.gerarCertificado(cliente);
    }
  }
}
