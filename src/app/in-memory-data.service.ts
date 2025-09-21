import { InMemoryDbService } from 'angular-in-memory-web-api';

export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    const clients = [
      {
        id: 2,
        block: "a",
        number: "0",
        complemento: null,
        type: "Túmulo 2 Gaveta",
        name: "Manoel Henrique Ferreira",
        CPF: null,
        address: "Rua luiz Chaves de Melo 47",
        neighborhood: "Cidade Nova",
        city: "Crateús",
        state: "Ce",
        contact: null,
        situation: null,
        created_at: "2021-11-09T10:43:48.000000Z",
        updated_at: "2021-11-09T10:47:13.000000Z"
    },
      {
        id: 3,
        block: "a",
        number: "0",
        complemento: null,
        type: "Canteiro",
        name: "Manoel da Silva",
        CPF: null,
        address: "Rua luiz Chaves de Melo 47",
        neighborhood: "Cidade Nova",
        city: "Crateús",
        state: "Ce",
        contact: null,
        situation: null,
        created_at: "2021-11-09T10:43:48.000000Z",
        updated_at: "2021-11-09T10:47:13.000000Z"
    },
      {
        id: 4,
        block: "a",
        number: "0",
        complemento: null,
        type: "Túmulo 2 Gaveta",
        name: "Joaquim Ferreira",
        CPF: null,
        address: "Rua luiz Chaves de Melo 47",
        neighborhood: "Cidade Nova",
        city: "Crateús",
        state: "Ce",
        contact: null,
        situation: null,
        created_at: "2021-11-09T10:43:48.000000Z",
        updated_at: "2021-11-09T10:47:13.000000Z"
    },
      {
        id: 5,
        block: "b",
        number: "1",
        complemento: null,
        type: "Canteiro",
        name: "Maria Ferreira",
        CPF: null,
        address: "Rua luiz Chaves de Melo 47",
        neighborhood: "Cidade Nova",
        city: "Crateús",
        state: "Ce",
        contact: null,
        situation: null,
        created_at: "2021-11-09T10:43:48.000000Z",
        updated_at: "2021-11-09T10:47:13.000000Z"
    },
    ];
    return { clients };
  }
}
