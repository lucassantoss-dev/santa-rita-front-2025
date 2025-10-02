import { PaymentData, PaymentPlan, PaymentPlanCreate } from "./paymentInterface";

export interface PaymentApiInterface {
  data: PaymentData[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PaymentPlanApiInterface {
  data: PaymentPlanCreate[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PaymentPlanListApiInterface {
  data: PaymentPlan[];
  page: number;
  pageSize: number;
  total: number;
}
