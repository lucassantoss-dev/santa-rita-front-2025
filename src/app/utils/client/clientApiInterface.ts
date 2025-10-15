import ClientInterface from "./clientInterface";

export default interface ClientApiInterface {
  status: number;
  message: string;
  data: {
    clients: ClientInterface[];
    total: number;
    totalPages: number;
    currentPage: number;
  };
}
