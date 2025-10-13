export default interface ClientObjectInterface {
  data: ClientInterfaceObject
};

interface ClientInterfaceObject {
  _id?: string;
  quadra: string;
  numero: string;
  complemento: string;
  tipo: string;
  nome: string;
  cpf: string;
  cep: string;
  endereco: string;
  numeroRua: string;
  bairro: string;
  cidade: string;
  estado: string;
  contato: string;
  email: string;
  customerId: string;
  situacao: string;
  createdAt: string;
  updatedAt: string;
  sobrenome: string;
  numeroEndereco: string;
}
