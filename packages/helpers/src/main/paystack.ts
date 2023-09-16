import ServiceAdapter from './serviceAdapter';
import { Request } from 'express';
import {
  PaystackInitializeResponse,
  PaystackSubscriptionResponse,
  type Plan,
  BankInterface,
  AccountDetails,
  CreateRecipient,
  CreateRecipientResponse,
  TransferData,
  TransferResponse,
  VerifyTransactionResponse,
} from '../interfaces/Paystack.Interface';
import { logger, lazySingleton } from '@yumm/utils';
import { v4 as uuid4 } from 'uuid';

class Paystack {
  private paystackService;
  private plans = {
    monthly: 'code',
    yearly: 'code',
  } as const;
  private options = {
    headers: {
      // authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
  };

  constructor(paystackSecret: string) {
    Object.assign(this.options, { authorization: `Bearer ${paystackSecret}` });
    this.paystackService = new ServiceAdapter('https://api.paystack.co').baseService;
  }
  initialize(plan: Plan, email: string, metaData?: object) {
    // eslint-disable-next-line object-curly-newline
    const data = { email, amount: '500000', plan: this.plans[plan], metaData };
    return <Promise<PaystackInitializeResponse>>this.paystackService('post', '/initialize', data, this.options);
  }
  // subscribe(plan: Plan, user: Request['user']) {
  //   const data = {
  //     customer: (<any>user).subscription.paystackId, // "CUS_xxxxxxxxxx",
  //     plan: this.plans[plan], // "PLN_xxxxxxxxxx",
  //     // start_date: date,
  //     metadata: {
  //       userId: user!._id,
  //       plan,
  //     },
  //   };
  //   return <Promise<PaystackSubscriptionResponse>>this.paystackService('post', '/subscription', data, this.options);
  // }

  // disableSubscription(plan: Plan, user: Request['user']) {
  //   const data = {
  //     code: (<any>user).subscription.subscriptionCode,
  //     token: (<any>user).subscription.emailToken,
  //   };
  //   return this.paystackService('post', '/subscription/disable', data, this.options);
  // }
  getBanks() {
    return <Promise<BankInterface[]>>this.paystackService('get', '/bank?currency=NGN', this.options);
  }

  confirmAccount(accountNumber: string, bankCode: string) {
    return <Promise<AccountDetails>>(
      this.paystackService('get', `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, this.options)
    );
  }

  createRecipient(data: Omit<CreateRecipient, 'currency' | 'type'>) {
    (<CreateRecipient>data).currency = 'NGN';
    (<CreateRecipient>data).type = 'nuban';
    return <Promise<CreateRecipientResponse>>this.paystackService('post', '/transferrecipient', data, this.options);
  }

  // Verify the account number
  // Create a transfer recipient
  // Initiate a transfer
  // Listen for transfer status
  transfer(data: Omit<TransferData, 'source' | 'reference'>) {
    (<TransferData>data).reference = uuid4();
    (<TransferData>data).source = 'balance';
    return <Promise<TransferResponse>>this.paystackService('post', '/transfer', <TransferData>data, this.options);
  }
  verifyTransaction(reference: string) {
    return <Promise<VerifyTransactionResponse>>(
      this.paystackService('get', `/transaction/verify/${reference}`, this.options)
    );
  }
}

export const paystackService = lazySingleton(Paystack);
