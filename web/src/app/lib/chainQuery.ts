import popularAddr from "../dashboard/privateinfo/lib/popularAddr";
import { privateKeyToAccount } from "viem/accounts";
import axios from "axios";
import { Axios, AxiosResponse, AxiosError } from "axios";

import { isMorphNet } from "./myChain";
import { Transaction } from "./myTypes";
import { getChainObj } from "./myChain";
import {
    getContract,
    formatEther,
    parseEther,
    encodeAbiParameters,
    encodeFunctionData,
} from "viem";

import { chainPublicClient } from "./chainQueryClient";
import { getOwnerIdLittleBrother } from "../dashboard/privateinfo/lib/keyTools";

import abis from "../serverside/blockchain/abi/abis";

const accountOnlyForRead = privateKeyToAccount(
    "0x1000000000000000000000000000000000000000000000000000000000000000"
);
// console.log("have a look. what is the address:", accountOnlyForRead.address);
/**
 */

export async function queryAccountList(
    chainCode: string,
    factoryAddr: string,
    baseOwnerId: string
) {
    const acctList: { addr: string; created: boolean; orderNo: number }[] = [];
    // max count supported is 10.
    for (let k = 0; k < 10; k++) {
        console.log("getOwnerIdLittleBrother before:", baseOwnerId, k);
        const realOwnerId = getOwnerIdLittleBrother(baseOwnerId, k);
        console.log("getOwnerIdLittleBrother after:", realOwnerId);
        const account = await queryAccount(chainCode, factoryAddr, realOwnerId);
        console.log(realOwnerId + "'s account: " + account);
        acctList.push({
            addr: account?.accountAddr,
            created: account?.created,
            orderNo: k,
        });
        if (account?.created == false) {
            break;
        }
    }

    return acctList;
}

export async function queryAccount(
    chainCode: string,
    factoryAddr: string,
    ownerId: `0x${string}`
) {
    try {
        const cpc = chainPublicClient(chainCode, factoryAddr);
        // console.log("rpc:", cpc.rpcUrl);
        console.log(
            "factoryAddr in queryAccount:",
            chainCode,
            factoryAddr,
            ownerId
        );
        const accountAddr = await cpc.publicClient.readContract({
            account: accountOnlyForRead,
            address: factoryAddr,
            abi: abis.queryAccount,
            functionName: "queryAccount",
            args: [ownerId],
        });

        if (accountAddr == popularAddr.ZERO_ADDR) {
            const predictAddr = await cpc.publicClient.readContract({
                account: accountOnlyForRead,
                address: factoryAddr,
                abi: abis.predictAccountAddress,
                functionName: "predictAccountAddress",
                args: [ownerId],
            });
            return { accountAddr: predictAddr, created: false };
        } else {
            return { accountAddr: accountAddr, created: true };
        }
    } catch (e) {
        console.log(
            "==================queryAccount error======================, ownerId=" +
                ownerId,
            e
        );
        throw new Error("queryAccount error!");
    }
}

export async function queryQuestionIdsEnc(
    chainCode: string,
    factoryAddr: string,
    accountAddr: string
) {
    try {
        const cpc = chainPublicClient(chainCode, factoryAddr);
        // console.log("rpc:", cpc.rpcUrl);
        console.log("factoryAddr in queryAccount:", chainCode, factoryAddr);
        const questionIdsEnc = await cpc.publicClient.readContract({
            account: accountOnlyForRead,
            address: accountAddr,
            abi: abis.questionNos,
            functionName: "questionNos",
            args: [],
        });

        return questionIdsEnc;
    } catch (e) {
        console.log(
            "==================queryQuestionIdsEnc error======================, accountAddr=" +
                accountAddr,
            e
        );
        throw new Error("queryQuestionIdsEnc error!");
    }
}

export async function queryEthBalance(
    chainCode: string,
    factoryAddr: string,
    addr: string
) {
    if (addr == undefined || addr == popularAddr.ZERO_ADDR) {
        return "0.0";
    }
    // const blockNumber = await client.getBlockNumber();
    var addrWithout0x = addr;
    if (addr.substring(0, 2) == "0x" || addr.substring(0, 2) == "0X") {
        addrWithout0x = addr.substring(2);
    }
    const cpc = chainPublicClient(chainCode, factoryAddr);

    const balance = await cpc.publicClient.getBalance({
        address: `0x${addrWithout0x}`,
    });

    const balanceAsEther = formatEther(balance);
    return balanceAsEther;
}

const getW3eapAddr = async (cpc, chainCode: string, factoryAddr: string) => {
    console.log(`factoryAddr ${factoryAddr} called.`);
    const addr = await cpc.publicClient.readContract({
        account: accountOnlyForRead,
        address: factoryAddr,
        abi: abis.w3eaPoint,
        functionName: "w3eaPoint",
        args: [],
    });

    console.log(
        `++++++====factoryAddr ${factoryAddr} called.getW3eapAddr=${addr}`
    );

    return addr;
};

export async function queryW3eapBalance(
    chainCode: string,
    factoryAddr: string,
    addr: string
) {
    if (addr == undefined || addr == popularAddr.ZERO_ADDR) {
        return "0.0";
    }
    try {
        const cpc = chainPublicClient(chainCode, factoryAddr);
        // console.log("rpc:", cpc.rpcUrl);
        console.log(
            "factoryAddr in queryW3eapBalance:",
            chainCode,
            factoryAddr
        );
        const w3eapAddr = await getW3eapAddr(cpc, chainCode, factoryAddr);
        console.log("W3EAP address in queryW3eapBalance x:", w3eapAddr);
        console.log("my address in queryW3eapBalance:", addr);
        const pBalance = await cpc.publicClient.readContract({
            account: accountOnlyForRead,
            address: w3eapAddr,
            abi: abis.balanceOf,
            functionName: "balanceOf",
            args: [addr],
        });

        const bb = formatEther(pBalance);
        return bb;
    } catch (e) {
        console.log(
            "==================queryW3eapBalance error======================, accountAddr=" +
                addr,
            e
        );
        throw new Error("queryW3eapBalance error!");
    }
}

export async function queryfreeGasFeeAmount(
    chainCode: string,
    factoryAddr: string,
    addr: string
) {
    if (addr == undefined || addr == popularAddr.ZERO_ADDR) {
        return "0.0";
    }
    try {
        const cpc = chainPublicClient(chainCode, factoryAddr);
        // console.log("rpc:", cpc.rpcUrl);
        console.log("factoryAddr:", factoryAddr);
        const w3eapBalance = await cpc.publicClient.readContract({
            account: accountOnlyForRead,
            address: addr,
            abi: abis.gasFreeAmount,
            functionName: "gasFreeAmount",
            args: [],
        });
        console.log(
            "queryfreeGasFeeAmount,gasFreeAmount,raw w3eapBalance:",
            w3eapBalance
        );
        const bb = formatEther(w3eapBalance);
        return bb;
    } catch (e) {
        console.log(
            "==================queryW3eapBalance error======================, accountAddr=" +
                addr,
            e
        );
        throw new Error("queryW3eapBalance error!");
    }
}

export async function queryAssets(
    chainCode: string,
    factoryAddr: string,
    addr: string
) {
    let tokenList = [];
    try {
        const cpc = chainPublicClient(chainCode, factoryAddr);
        // console.log("rpc:", cpc.rpcUrl);
        console.log("queryAssets factoryAddr xxxx::", factoryAddr);
        const w3eapAddr = await getW3eapAddr(cpc, chainCode, factoryAddr);
        tokenList.push(w3eapAddr);

        const ethBalance = queryEthBalance(chainCode, factoryAddr, addr);

        const myETH = {
            token_address: "",
            token_symbol: "ETH",
            balance: ethBalance,
        };

        const result = [];

        if (isMorphNet(chainCode)) {
            const w3eapIncluded = { addr: w3eapAddr, included: false };
            const res = await _queryMorphTokens(chainCode, addr, w3eapIncluded);
            console.log("result.length==000==", res.length, result.length);
            if (res.length > 0) {
                result.unshift(res);
            }
            console.log("result.length==111==", res.length, result.length);
            if (!w3eapIncluded.included) {
                tokenList = [w3eapAddr];
            } else {
                tokenList = [];
            }
        }

        for (let k = 0; k < tokenList.length; k++) {
            const tknAddr = tokenList[k];
            const symbol = await cpc.publicClient.readContract({
                account: accountOnlyForRead,
                address: tknAddr,
                abi: abis.symbol,
                functionName: "symbol",
                args: [],
            });

            const decimals = await cpc.publicClient.readContract({
                account: accountOnlyForRead,
                address: tknAddr,
                abi: abis.decimals,
                functionName: "decimals",
                args: [],
            });
            let balance = await cpc.publicClient.readContract({
                account: accountOnlyForRead,
                address: tknAddr,
                abi: abis.balanceOf,
                functionName: "balanceOf",
                args: [addr],
            });

            balance = formatEther(balance);

            if (decimals != 18) {
                balance =
                    Number(balance) * 10 ** (18 - Number(decimals.toString()));
            }

            result.push({
                token_address: tknAddr,
                token_symbol: symbol,
                balance: balance,
            });
        }

        result.unshift(myETH);
        console.log("result.length====", result.length);
        return result;
    } catch (e) {
        console.log(
            "==================queryAssets error======================, accountAddr=" +
                addr,
            e
        );
        throw new Error("queryAssets error!");
    }
}

export async function queryTransactions(
    chainCode: string,
    addr: string
): Promise<Transaction[]> {
    if (isMorphNet(chainCode)) {
        const res = await _queryMorphTransactions(chainCode, addr);
        return res;
    } else {
        return [];
    }
}

async function _queryMorphTransactions(
    chainCode: string,
    addr: string
): Promise<Transaction[]> {
    const apiUrl = getChainObj(chainCode).explorerApiUrl; // process.env.MORPH_EXPLORER_API_URL
    const url =
        apiUrl +
        "/addresses/" +
        // "0x3d078713797d3a9B39a95681538A1A535C3Cd6f6" + //
        addr +
        "/transactions";
    console.log("query morph trans:", url);
    const url2 =
        apiUrl +
        "/addresses/" +
        // "0x3d078713797d3a9B39a95681538A1A535C3Cd6f6" +
        addr +
        "/internal-transactions";
    const resultData: Transaction[] = [];
    try {
        const response: AxiosResponse = await axios.get(url);
        response.data.items.forEach((e: any) => {
            const aRow: Transaction = {
                timestamp: e.timestamp,
                block_number: e.block,
                result: e.status,
                to: e.to.hash,
                hash: e.hash,
                gas_price: formatEther(BigInt(e.gas_price)),
                gas_used: e.gas_used,
                gas_limit: e.gas_limit,
                l1_fee: e.l1_fee / 1e18,
                from: e.from.hash,
                value: formatEther(BigInt(e.value)),
            };
            resultData.push(aRow);
        });
    } catch (error) {
        console.error(
            `_queryMorphTransactions error url=${url}:`,
            error.toString().indexOf("status code 404") >= 0
                ? "ERROR 404"
                : error
        );
        // throw error; // Or handle the error differently
    }

    try {
        const response: AxiosResponse = await axios.get(url2);
        response.data.items.forEach((e: any) => {
            const aRow: Transaction = {
                timestamp: e.timestamp,
                block_number: e.block,
                result: e.success ? "ok" : "error",
                to: e.to == null ? "" : e.to.hash,
                hash: e.transaction_hash + "::" + e.index + "::" + e.type,

                gas_price: "0",
                gas_used: e.gas_used,
                gas_limit: e.gas_limit,
                l1_fee: 0,
                from: e.from == null ? "" : e.from.hash,
                value: formatEther(BigInt(e.value)),
            };
            resultData.push(aRow);
        });
    } catch (error) {
        console.error(
            `_queryMorphTransactions error url2=${url2}:`,
            error.toString().indexOf("status code 404") >= 0
                ? "ERROR 404"
                : error
        );
        // throw error; // Or handle the error differently
    }
    return resultData;
}

//
// XXXXXXXXXXXX ---------------------------------------------------

export async function queryQuestionIds(addr: string) {
    if (
        addr == undefined ||
        addr == null ||
        addr == popularAddr.ZERO_ADDR ||
        addr == popularAddr.ZERO_ADDRError
    ) {
        return "00";
    }
    const qids = await chainClient().publicClient.readContract({
        account: chainClient().account,
        address: addr,
        abi: abis.questionNos,
        functionName: "questionNos",
        args: [],
    });

    return qids;
}

/// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

export async function queryLatestBlockNumber() {
    const blockNumber = await chainPublicClient().publicClient.getBlockNumber();
    return blockNumber;
}

export async function queryBlock(blockNumber: bigint) {
    const block = await chainPublicClient().publicClient.getBlock({
        blockNumber: blockNumber,
    });
    return block;
}

export async function queryAssetsXXXX(addr: string) {
    if (addr == undefined || addr == null) {
        return [];
    }
    const balance = await queryEthBalance(addr);
    const myETH = {
        token_address: "-",
        token_name: "ETH",
        token_symbol: "ETH",
        token_type: "-",
        balance: balance,
    };
    if (isMorphNet()) {
        const res = await _queryMorphTokens(addr);
        res.unshift(myETH);
        return res;
    } else {
        return [myETH];
    }
}

function formatBalance(value, decimals) {
    var x = Number(value);
    var y = 1;
    for (var k = 0; k < decimals; k++) {
        y = y * 10;
    }

    // console.log("xxxyyy:", x, y);
    return x / y;
}

async function _queryMorphTokens(
    chainCode: string,
    addr: string,
    w3eapIncluded: { addr: string; included: boolean }
) {
    const apiUrl = getChainObj(chainCode).explorerApiUrl;
    const url =
        apiUrl +
        "/addresses/" +
        // "0x3d078713797d3a9B39a95681538A1A535C3Cd6f6" + //
        addr +
        "/token-balances";
    console.log("_queryMorphTokens, query morph trans:", url);

    const resultData: {
        token_address: any;
        // token_decimals: any;
        token_name: any;
        token_symbol: any;
        token_type: any;
        balance: any;
    }[] = [];
    try {
        const response: AxiosResponse = await axios.get(url);
        response.data.forEach((e) => {
            const aRow = {
                token_address: e.token.address,
                token_name: e.token.name,
                token_symbol: e.token.symbol,
                token_type: e.token.type,
                balance: formatBalance(e.value, e.token.decimals), // BigInt(e.value) / BigInt(e.token.decimals),
            };
            if (w3eapIncluded.addr == e.token.address) {
                w3eapIncluded.included = true;
            }
            resultData.push(aRow);
        });
    } catch (error) {
        console.error(
            "_queryMorphTokens error:url=" + url,
            error.toString().indexOf("status code 404") >= 0
                ? "ERROR 404"
                : error
        );
        // throw error; // Or handle the error differently
    }
    return resultData;
}