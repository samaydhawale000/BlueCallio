export type BillingRates = {
   audioPaise: number;
   videoPaise: number;
   screenSharePaise: number;
   freeAudioMins: number;
   freeVideoMins: number;
   taxPercent: number;
};

export const formatPaise = (paise: number) =>
   `₹${(paise / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
   })}`;
