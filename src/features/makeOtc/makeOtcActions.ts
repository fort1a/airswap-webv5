// @ts-ignore
import * as swapDeploys from "@airswap/swap/deploys.js";
import { FullOrder, UnsignedOrder } from "@airswap/typescript";
import { createOrder, createSwapSignature } from "@airswap/utils";
import { createAsyncThunk } from "@reduxjs/toolkit";

import i18n from "i18next";

import { notifyError } from "../../components/Toasts/ToastController";
import { setErrors, setStatus, setUserOrder } from "./makeOtcSlice";

export const createOtcOrder = createAsyncThunk(
  "make-otc/createOtcOrder",
  async (
    params: {
      chainId: number;
      library: any;
    } & UnsignedOrder,
    { dispatch }
  ) => {
    dispatch(setStatus("signing"));

    try {
      const unsignedOrder = createOrder({
        expiry: params.expiry,
        nonce: Date.now().toString(),
        senderWallet: params.senderWallet,
        signerWallet: params.signerWallet,
        signerToken: params.signerToken,
        senderToken: params.senderToken,
        protocolFee: "7",
        signerAmount: params.signerAmount,
        senderAmount: params.senderAmount,
        chainId: params.chainId,
      });

      const signature = await createSwapSignature(
        unsignedOrder,
        params.library.getSigner(),
        swapDeploys[params.chainId],
        params.chainId
      );

      const fullOrder: FullOrder = {
        ...unsignedOrder,
        ...signature,
        chainId: params.chainId.toString(),
        swapContract: swapDeploys[params.chainId],
      };

      dispatch(setUserOrder(fullOrder));
    } catch (e: any) {
      dispatch(setStatus("failed"));

      if (e.code !== 4001) {
        dispatch(setErrors(["invalidInput"]));
      } else {
        notifyError({
          heading: i18n.t("orders.swapFailed"),
          cta: i18n.t("orders.swapRejectedByUser"),
        });
      }
    }
  }
);
