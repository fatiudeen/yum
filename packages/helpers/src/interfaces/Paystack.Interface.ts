/* eslint-disable camelcase */
export interface PaystackInitializeResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}
interface Authorization {
  authorization_code: string;
  bin: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  channel: string;
  card_type: string;
  bank: string;
  country_code: string;
  brand: string;
  reusable: boolean;
  signature: string;
  account_name: string;
}

export interface PaystackSubscriptionResponse {
  customer: number;
  plan: number;
  integration: number;
  domain: string;
  start: number;
  status: string;
  quantity: number;
  amount: number;
  authorization: Authorization;
  invoice_limit: number;
  subscription_code: string;
  email_token: string;
  id: number;
  createdAt: Date;
  updatedAt: Date;
  cron_expression: string;
  next_payment_date: Date;
}

export interface BankInterface {
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway?: any;
  pay_with_bank: boolean;
  active: boolean;
  is_deleted: boolean;
  country: string;
  currency: string;
  type: string;
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountDetails {
  account_number: string;
  account_name: string;
  bank_id: number;
}

export interface CreateRecipient {
  type: 'nuban';
  name: string;
  account_number: string;
  bank_code: string;
  currency: 'NGN';
}

export type Plan = 'monthly' | 'yearly';

export interface Details {
  authorization_code: string;
  account_number: string;
  account_name: string;
  bank_code: string;
  bank_name: string;
}

export interface CreateRecipientResponse {
  active: boolean;
  createdAt: Date;
  currency: string;
  domain: string;
  id: number;
  integration: number;
  name: string;
  recipient_code: string;
  type: string;
  updatedAt: Date;
  is_deleted: boolean;
  details: Details;
}

export interface TransferData {
  source: 'balance';
  amount: string;
  reference: string;
  recipient: string;
  reason: string;
}

export interface TransferResponse {
  reference: string;
  integration: number;
  domain: string;
  amount: number;
  currency: string;
  source: string;
  reason: string;
  recipient: number;
  status: string;
  transfer_code: string;
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  customer_code: string;
  phone: string;
  metadata: string;
  risk_action: string;
}
export interface Params {
  bearer: string;
  transaction_charge: string;
  percentage_charge: string;
}
export interface FeesSplit {
  paystack: number;
  integration: number;
  subaccount: number;
  params: Params;
}

export interface History {
  type: string;
  message: string;
  time: number;
}
export interface Log {
  start_time: number;
  time_spent: number;
  attempts: number;
  errors: number;
  success: boolean;
  mobile: boolean;
  input: any[];
  history: History[];
}

export interface PlanObject {}

export interface Subaccount {
  id: number;
  subaccount_code: string;
  business_name: string;
  description: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  metadata: string;
  percentage_charge: number;
  settlement_bank: string;
  account_number: string;
}

export interface VerifyTransactionResponse {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  message: string;
  gateway_response: string;
  paid_at: Date;
  created_at: Date;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: string;
  log: Log;
  fees: number;
  fees_split: FeesSplit;
  authorization: Authorization;
  customer: Customer;
  plan: string;
  order_id: string;
  paidAt: Date;
  createdAt: Date;
  requested_amount: number;
  transaction_date: Date;
  plan_object: PlanObject;
  subaccount: Subaccount;
}
