import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

@Injectable({ providedIn: 'root' })
export class DocumentGeneratorService {
  gerarCarteirinha(cliente: any) {
    const documento = new jsPDF('landscape');
    this.left(documento, cliente);
    this.right(documento, cliente);
    documento.autoPrint();
    window.open(documento.output('bloburl'), '_blank');
  }

  gerarCertificado(cliente: any) {
    const documento = new jsPDF('landscape');
    this.teste(documento, cliente);
    documento.autoPrint();
    window.open(documento.output('bloburl'), '_blank');
  }

  private left(documento: any, cliente: any) {
    documento.setDrawColor(0);
    documento.setFillColor(255, 255, 255);
    documento.roundedRect(4, 4, 135, 95, 3, 3, 'FD');
    this.input(documento, 10, 10, 125, 8, 'ENDERECO', 12, 15);
    this.inputText(documento, 14, cliente.endereco, 33, 15);
    this.input(documento, 10, 20, 40, 8, 'CIDADE', 12, 25);
    this.inputText(documento, 14, cliente.cidade, 27, 25);
    this.input(documento, 52, 20, 15, 8, 'UF', 53, 25);
    this.inputText(documento, 14, cliente.estado, 58, 25);
    this.input(documento, 70, 20, 60, 6, 'BAIRRO/DISTRITO', 73, 23);
    this.inputText(documento, 12, cliente.bairro, 84, 27);
    this.input(documento, 10, 30, 60, 6, 'CEP', 12, 33);
    this.inputText(documento, 12, cliente.CEP === null || cliente.CEP === undefined ? '--' : cliente.CEP.toString(), 30, 36);
    this.input(documento, 72, 30, 60, 6, 'FONE', 75, 33);
    this.inputText(documento, 12, cliente.contato === null || cliente.contato === undefined ? '--' : cliente.contato.toString(), 78, 36);
    this.inputText(documento, 13, 'Ao portado desta carteira de identidade, serão', 22, 55);
    this.inputText(documento, 13, 'concedidos os direitos e deveres ao qual lhe', 22, 59);
    this.inputText(documento, 13, 'confere a Associação Filantrópica do Cemirério', 22, 63);
    this.inputText(documento, 13, 'Santa Rita', 22, 67);
  }

  private right(documento: any, cliente: any) {
    documento.setDrawColor(0);
    documento.setFillColor(255, 255, 255);
    documento.roundedRect(140, 4, 135, 95, 3, 3, 'FD');
    this.header(documento);
    this.inputText(documento, 20, 'SÓCIO CONTRIBUINTE', 175, 50);
    this.input(documento, 145, 55, 125, 8, 'TITULAR', 150, 60);
    this.inputText(documento, 18, cliente.nome, 165, 62);
    this.input(documento, 145, 65, 25, 8, 'QUADRA', 150, 70);
    this.inputText(documento, 16, cliente.quadra ? String(cliente.quadra).toUpperCase() : '', 163, 71);
    this.input(documento, 171, 65, 40, 8, 'TIPO', 172, 70);
    this.inputText(documento, 16, cliente.tipo, 181, 71);
    this.input(documento, 212, 65, 57, 8, 'Nº CONTRIBUINTE', 214, 70);
    this.inputText(documento, 16, (cliente.quadra ? String(cliente.quadra).toUpperCase() : '') + '0' + (cliente.numero ?? ''), 243, 71);
    documento.addImage('assets/Assinaturas.png', 'PNG', 185, 80, 40, 20);
    this.inputText(documento, 8, 'Assinatura do Presidente', 185, 95);
  }

  private header(documento: any) {
    documento.setFont('Courier', 'bold');
    documento.setFontSize(14);
    documento.text('Associação Filantrópica do', 189, 10);
    documento.text('   Cemitério Santa Rita', 189, 19);
    documento.addImage('assets/nova-logo.jpeg', 'JPEG', 145, 13, 50, 30);
    documento.setFontSize(8);
    documento.text('Fundada em 14/11/2009', 200, 25);
    documento.text('CPNJ 11.347.229/0001-13', 200, 29);
    documento.text('Av. Sargento Herminio, 1628', 200, 33);
  }

  private teste(documento: any, cliente: any) {
    documento.setDrawColor(0);
    documento.setFillColor(255, 255, 255);
    documento.addImage('assets/moldura.jpg', 'JPEG', 6, 6, 285, 200, 6, 8);
    this.header1(documento);
    this.header2(documento);
    this.inputText(documento, 35, 'TÍTULO', 130, 70);
    this.inputText(documento, 22, cliente.nome, 110, 83);
    this.inputText(documento, 14, 'QUADRA: ', 70, 130);
    this.inputText(documento, 16, cliente.quadra ? String(cliente.quadra).toUpperCase() : '', 95, 130);
    this.inputText(documento, 16, 'NÚMERO: ', 125, 130);
    this.inputText(documento, 16, cliente.quadra ? String(cliente.quadra).toUpperCase() : '' + '0' + (cliente.numero ?? ''), 155, 130);
    this.inputText(documento, 16, 'TIPO: ', 185, 130);
    this.inputText(documento, 16, cliente.tipo, 205, 130);
    documento.addImage('assets/Assinaturas.png', 'PNG', 55, 157, 40, 20);
    documento.addImage('assets/linha.png', 'PNG', 35, 170, 80, 5);
    this.inputText(documento, 14, 'PRESIDENTE', 60, 180);
    documento.addImage('assets/Tesoureiro.png', 'PNG', 190, 155, 42, 17);
    documento.addImage('assets/linha.png', 'PNG', 170, 170, 80, 5);
    this.inputText(documento, 14, 'TESOUREIRO', 193, 180);
  }

  private header1(documento: any) {
    documento.setFont('Courier', 'bold');
    documento.setFontSize(15);
    documento.text('Associação Filantrópica do Cemitério Santa Rita', 100, 30);
    documento.addImage('assets/nova-logo.jpeg', 'JPEG', 35, 25, 50, 40);
    documento.setFontSize(15);
    documento.text('Fundada em 14/11/2009', 100, 36);
    documento.text('CPNJ 11.347.229/0001-13', 100, 42);
    documento.text('Av. Sargento Herminio, 1628', 100, 47);
    documento.text('Crateús, CE', 100, 52);
  }

  private header2(documento: any) {
    documento.setFont('Arial', 'bold');
    documento.setFontSize(17);
    documento.text('possuidor do direito representativo de sua contribuição como sócio-proprietário para formação', 23, 100);
    documento.text('da Associação Filantrópica do Cemitério Santa Rita, são assegurados os direitos que a lei', 30, 110);
    documento.text('e o Estatuto da Associação lhe conferir.', 100, 120);
  }

  private input(documento: any, a: number, b: number, c: number, fontSize: number, text: string, x: number, y: number) {
    documento.setDrawColor(0);
    documento.setFillColor(255, 255, 255);
    documento.roundedRect(a, b, c, 9, 3, 3, 'FD');
    this.inputText(documento, fontSize, text, x, y);
  }

  private inputText(documento: any, fontSize: number, text: any, x: number, y: number) {
    documento.setFontSize(fontSize);
    documento.text(String(text ?? ''), x, y);
  }
}
