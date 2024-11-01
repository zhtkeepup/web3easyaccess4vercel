"use client";

import * as libsolana from "@/app/lib/client/solana/libsolana";

import * as funNewTrans from "@/app/dashboard/newtransaction/funNewTrans";

import { MutableRefObject, useEffect, useRef, useState } from "react";
import {
    accountAddrCreated,
    readAccountAddr,
    readFactoryAddr,
    readOwnerId,
    UserProperty,
} from "../../storage/userPropertyStore";
import { Button, Progress } from "@nextui-org/react";
import { getChainObj } from "../../lib/myChain";
import { ChainCode } from "../../lib/myTypes";
import {
    encodeAbiParameters,
    keccak256,
    hashMessage,
    hexToBigInt,
    parseEther,
    parseUnits,
} from "viem";
import {
    signAuth,
    signPersonalMessage,
} from "../../lib/client/signAuthTypedData";
import {
    getOwnerIdLittleBrother,
    getPasswdAccount,
    PrivateInfoType,
} from "../../lib/client/keyTools";
import { testIsValidSignature } from "../../lib/chainQuery";
import { PrivateInfo } from "../newtransaction/privateinfo";
import { executeTransaction } from "../newtransaction/sendtransaction";
import ChannelInMain, {
    connect2WcHost,
    getWalletConnectHost,
    Message,
    sendMsgUntilSuccess,
    setMainHost,
    setWalletConnectHost,
    TransactionRequest,
} from "./channelInMain";

const piInit: PrivateInfoType = {
    email: "",
    pin: "",
    question1answer: "",
    question2answer: "",
    firstQuestionNo: "01",
    secondQuestionNo: "01",
    confirmedSecondary: true,
};

let getPrivateInfo = () => {
    return piInit;
};
export let getAccountAddr = () => {
    return "";
};
let getFactoryAddr = () => {
    return "";
};
let getOwnerId = () => {
    return "";
};
export let getChainObject = () => {
    return getChainObj(ChainCode.UNKNOW);
};

let setPreparedPriceRef: (pp: {
    preparedMaxFeePerGas: bigint | undefined;
    preparedGasPrice: bigint | undefined;
}) => void;

let getPreparedPriceRef: () => MutableRefObject<{
    preparedMaxFeePerGas: undefined;
    preparedGasPrice: undefined;
}>;

export default function Connect2Dapps({
    userProp,
}: {
    userProp: UserProperty;
}) {
    /////

    const currentPriInfoRef = useRef(piInit);
    const oldPriInfoRef = useRef(piInit);

    getPrivateInfo = () => {
        return currentPriInfoRef.current;
    };
    getAccountAddr = () => {
        return readAccountAddr(userProp);
    };
    getFactoryAddr = () => {
        return readFactoryAddr(userProp);
    };
    getOwnerId = () => {
        return readOwnerId(userProp);
    };
    getChainObject = () => {
        return getChainObj(userProp.selectedChainCode);
    };

    const lastEffectPropJson = useRef("");
    useEffect(() => {
        const propJson = JSON.stringify(userProp);
        if (propJson == lastEffectPropJson.current) {
            console.log("MainHost:same prop effected, skip:", userProp);
            return;
        } else {
            console.log("MainHost:new prop effecting...", userProp);
            lastEffectPropJson.current = propJson;
        }

        if (
            userProp.bigBrotherOwnerId != undefined &&
            userProp.bigBrotherOwnerId != ""
        ) {
            setMainHost(userProp.myselfHost);
            setWalletConnectHost(userProp.walletconnectHost);

            connect2WcHost(getChainObject().id, getAccountAddr());
        }
    }, [userProp]);

    const preparedPriceRef = useRef({
        preparedMaxFeePerGas: undefined,
        preparedGasPrice: undefined,
    });
    getPreparedPriceRef = () => {
        return preparedPriceRef;
    };
    setPreparedPriceRef = (pp: {
        preparedMaxFeePerGas: undefined;
        preparedGasPrice: undefined;
    }) => {
        preparedPriceRef.current = pp;
    };

    const [privateinfoHidden, setPrivateinfoHidden] = useState(false);
    const updatePrivateinfoHidden = (hidden: boolean) => {
        setPrivateinfoHidden(hidden);
    };
    const [privateFillInOk, setPrivateFillInOk] = useState(0);
    const updateFillInOk = () => {
        let x = privateFillInOk;
        setPrivateFillInOk(x + 1);
        updatePrivateinfoHidden(true);
    };

    return (
        <div>
            <ChannelInMain></ChannelInMain>
            {accountAddrCreated(userProp) ? (
                <>
                    <PrivateInfo
                        userProp={userProp}
                        forTransaction={true}
                        currentPriInfoRef={currentPriInfoRef}
                        oldPriInfoRef={oldPriInfoRef}
                        updateFillInOk={updateFillInOk}
                        privateinfoHidden={privateinfoHidden}
                        updatePrivateinfoHidden={updatePrivateinfoHidden}
                    ></PrivateInfo>
                    <IframeWallet
                        getWalletConnectHostFun={getWalletConnectHost}
                        privateinfoHidden={privateinfoHidden}
                    ></IframeWallet>
                    : <></>
                </>
            ) : (
                <p>
                    this account[ {readAccountAddr(userProp)} ] has not created!
                </p>
            )}
        </div>
    );
}

const IframeWallet = ({
    getWalletConnectHostFun,
    privateinfoHidden,
}: {
    getWalletConnectHostFun: () => string;
    privateinfoHidden: boolean;
}) => {
    let src = "";
    if (getWalletConnectHostFun != undefined) {
        src = getWalletConnectHostFun();
    }

    useEffect(() => {
        console.log("MainHost:iframeWallet,src:", src);
        if (src == null || src == undefined || src == "") {
            return;
        }

        const child = document.getElementById("w3eaWalletconnect");
        if (child == null || child == undefined) {
            const iframe = document.createElement("iframe");
            iframe.src = src + "/walletconnect";
            iframe.style.width = "800px";
            iframe.style.height = "500px";
            iframe.id = "w3eaWalletconnect";
            const container = document.getElementById("div_w3eaWalletconnect");
            container.appendChild(iframe);
        }

        // return () => {
        //     container.removeChild(iframe);
        // };
    }, [src]);

    return (
        <div
            id="div_w3eaWalletconnect"
            style={
                privateinfoHidden ? { display: "block" } : { display: "none" }
            }
        ></div>
    );
};

///////////

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const checkAddr = (msg: Message) => {
    const myChainKey = "eip155:" + getChainObject().id;
    if (msg.address != getAccountAddr() || msg.chainKey != myChainKey) {
        console.log("my addr:", myChainKey, getAccountAddr());
        console.log("target addr:", msg.chainKey, msg.address);
        throw Error(
            "chain or addr error, target chain and addr:" +
                msg.chainKey +
                "+" +
                msg.address
        );
    }
};

export const signTextMessage = async (msg: Message) => {
    const chatId = msg.msg.chatId;
    const content = msg.msg.content;
    checkAddr(msg);
    const { rtnVal, signature } = await signMessage(
        getPrivateInfo(),
        getAccountAddr(),
        content,
        getChainObject(),
        getFactoryAddr(),
        false
    );
    if ("" + rtnVal == "0x1626ba7e") {
        console.log("MainHost:signMessage x ok!");
    } else {
        console.log("MainHost:signMessage x invalid..!!!");
    }
    console.log("MainHost:signMessage x,signature:", signature);
    const signedMessage: Message = {
        msgType: "signMessage",
        chainKey: "",
        address: "",
        msgIdx: msg.msgIdx,
        msg: {
            chatId: "",
            content: signature,
        },
    };
    await sendMsgUntilSuccess(getWalletConnectHost(), signedMessage);
    // writeWalletConnectData("signMessage", chatId, signature);
};

export const signTypedDataMessage = async (msg: Message) => {
    const chatId = msg.msg.chatId;
    const content = msg.msg.content;
    checkAddr(msg);
    const { rtnVal, signature } = await signMessage(
        getPrivateInfo(),
        getAccountAddr(),
        content,
        getChainObject(),
        getFactoryAddr(),
        true
    );
    if ("" + rtnVal == "0x1626ba7e") {
        console.log("MainHost:signMessage x ok!");
    } else {
        console.log("MainHost:signMessage x invalid..bbb. !!!");
    }
    console.log("MainHost:signMessage y,signature:", signature);
    const signedMessage: Message = {
        msgType: "signMessage",
        chainKey: "",
        address: "",
        msgIdx: msg.msgIdx,
        msg: {
            chatId: "",
            content: signature,
        },
    };
    await sendMsgUntilSuccess(getWalletConnectHost(), signedMessage);
};

const signMessage = async (
    privateInfo: PrivateInfoType,
    accountAddr: string,
    msg: string,
    chainObj: {
        id: number;
        name: string;
        nativeCurrency: {};
        rpcUrls: {};
        blockExplorers: {};
        contracts: {};
        testnet: boolean;
        chainCode: ChainCode;
        l1ChainCode: ChainCode;
    },
    factoryAddr: string,
    isTypedData: boolean
) => {
    let sign: {
        signature: string;
        eoa: any;
        nonce: string;
        msgHash: string;
    } = { signature: "", eoa: "", nonce: "", msgHash: "" };

    const passwdAccount = getPasswdAccount(privateInfo, chainObj.chainCode);

    let argumentsHash = "";
    if (libsolana.isSolana(chainObj.chainCode)) {
        console.log("MainHost:solana useless!2");
        argumentsHash = "0x0";
        sign.signature = "solana useless!signature.22.";
    } else {
        console.log("MainHost:signPersonalMessage:", msg);
        let chainId = "" + chainObj.id;
        sign = await signPersonalMessage(
            passwdAccount,
            chainId,
            accountAddr,
            chainObj,
            msg,
            isTypedData
        );
        console.log("MainHost:signAuth,777,:", sign);

        const rtnVal = await testIsValidSignature(
            chainObj.chainCode,
            factoryAddr,
            accountAddr,
            sign.msgHash,
            sign.signature
        );

        return { rtnVal: rtnVal, signature: sign.signature };
    }
};

export const sendTransaction = async (msg: Message) => {
    const passwdAccount = getPasswdAccount(
        getPrivateInfo(),
        getChainObject().chainCode
    );

    checkAddr(msg);

    const txReq = msg.msg.content as TransactionRequest;

    setPreparedPriceRef({
        preparedMaxFeePerGas:
            txReq.maxFeePerGas == undefined || txReq.maxFeePerGas == ""
                ? undefined
                : hexToBigInt(txReq.maxFeePerGas),
        preparedGasPrice:
            txReq.gasPrice == undefined || txReq.gasPrice == ""
                ? undefined
                : hexToBigInt(txReq.gasPrice),
    });

    let txVal;
    if (txReq.value == undefined || txReq.value == "") {
        txVal = 0;
    } else {
        txVal = Number(hexToBigInt(txReq.value));
    }
    const tx = await executeTransaction(
        getOwnerId(),
        getAccountAddr(),
        passwdAccount,
        txReq.to,
        "" + txVal / 1e18,
        txReq.data,
        getChainObject(),
        true,
        "",
        getPreparedPriceRef(),
        "",
        getPrivateInfo(),
        "ETH",
        false
    );
    if (tx.toString().startsWith("ERROR")) {
        console.log("MainHost:ERROR,executeTransaction error!.", tx);
        throw Error("executeTransaction error!");
    }
    const txMsg: Message = {
        msgType: "sendTransaction",
        chainKey: "",
        address: "",
        msgIdx: msg.msgIdx,
        msg: {
            chatId: "",
            content: tx,
        },
    };
    await sendMsgUntilSuccess(getWalletConnectHost(), txMsg);
};
