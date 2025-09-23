import ClientInterface from "./clientInterface";

export default interface ClientApiInterface {
  data: ClientInterface[];
  page: number;
  pageSize: number;
  total: number;
}
