"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatPaise, type BillingRates } from "../lib/pricing";

/** The public display of record for rates. Values always come from GET /billing/rates. */
export function PricingAuthority({ className = "" }: { className?: string }) {
   const [rates, setRates] = useState<BillingRates | null>(null);
   const [unavailable, setUnavailable] = useState(false);

   useEffect(() => {
      let active = true;
      api.get<BillingRates>("/billing/rates")
         .then(({ data }) => {
            if (active) setRates(data);
         })
         .catch(() => {
            if (active) setUnavailable(true);
         });
      return () => {
         active = false;
      };
   }, []);

   return (
      <section
         className={`rounded-xl border border-[#2A3D64] bg-indigo-500/5 p-5 ${className}`}
         aria-label="Current BlueCallio pricing"
      >
         <p className="font-semibold text-white">Authoritative pricing</p>
         <p className="mt-2 text-sm leading-6 text-slate-300">
            <strong>BlueCallio uses participant-minute billing.</strong> Audio,
            video, and screen sharing are tracked separately. Screen sharing is
            billed as its own usage category and is not automatically added as a
            surcharge to video minutes.
         </p>
         {rates ? <><div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left text-sm">
                     <thead className="border-b border-[#2A3D64] text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                           <th className="pb-2 pr-4">Usage category</th>
                           <th className="pb-2 pr-4">Current rate</th>
                           <th className="pb-2">Free allowance</th>
                        </tr>
                     </thead>
                     <tbody className="text-slate-300">
                        <tr className="border-b border-[#1A2642]">
                           <th className="py-3 pr-4 font-medium text-white">
                              Audio
                           </th>
                           <td className="py-3 pr-4">
                              {formatPaise(rates.audioPaise)} / participant-minute
                           </td>
                           <td className="py-3">
                              First {rates.freeAudioMins} participant-minutes
                              each month
                           </td>
                        </tr>
                        <tr className="border-b border-[#1A2642]">
                           <th className="py-3 pr-4 font-medium text-white">
                              Video
                           </th>
                           <td className="py-3 pr-4">
                              {formatPaise(rates.videoPaise)} / participant-minute
                           </td>
                           <td className="py-3">
                              First {rates.freeVideoMins} participant-minutes
                              each month
                           </td>
                        </tr>
                        <tr>
                           <th className="py-3 pr-4 font-medium text-white">
                              Screen sharing
                           </th>
                           <td className="py-3 pr-4">
                              {formatPaise(rates.screenSharePaise)} /
                              participant-minute
                           </td>
                           <td className="py-3">No free allowance</td>
                        </tr>
                     </tbody>
                  </table>
         </div>
         <div className="mt-5 space-y-2 text-sm leading-6 text-slate-400">
                  <p>
                     <strong className="text-slate-200">Example:</strong> 2
                     participants in a 10-minute video call use 20 video
                     participant-minutes.
                  </p>
                  <p>
                     <strong className="text-slate-200">
                        Separate screen-sharing example:
                     </strong>{" "}
                     1 participant sharing for 10 minutes uses 10 screen-sharing
                     participant-minutes, independently of video usage.
                  </p>
                  <p>GST of {rates.taxPercent}% applies to billable usage.</p>
         </div></> : <p className="mt-4 text-sm text-slate-400">{unavailable ? "Current rates are temporarily unavailable. Please check back before relying on pricing." : "Loading current rates…"}</p>}
      </section>
   );
}
