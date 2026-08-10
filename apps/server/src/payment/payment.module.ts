import { Module } from '@nestjs/common';
import { PAYMENT_SERVICE } from './payment.service';
import { RazorpayPaymentServiceProvider } from './razorpay-payment.service';

@Module({
  providers: [RazorpayPaymentServiceProvider],
  exports: [PAYMENT_SERVICE],
})
export class PaymentModule {}
