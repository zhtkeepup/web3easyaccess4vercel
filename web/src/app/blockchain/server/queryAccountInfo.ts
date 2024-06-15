"use server";

import popularAddr from "../client/popularAddr";

import axios from "axios";
import { Axios, AxiosResponse, AxiosError } from "axios";

import { isMorphNet } from "./myChain";
import {
  getContract,
  formatEther,
  parseEther,
  encodeAbiParameters,
  encodeFunctionData,
} from "viem";

import {
  publicClient,
  account,
  walletClient,
  adminAddr,
} from "./chainClientOnServer";

import abi from "./abi/administratorAbi";

export async function queryLatestBlockNumber() {
  const blockNumber = await publicClient.getBlockNumber();
  return blockNumber;
}

export async function queryBlock(blockNumber: bigint) {
  const block = await publicClient.getBlock({ blockNumber: blockNumber });
  return block;
}

export async function queryEthBalance(addr: string) {
  // const blockNumber = await client.getBlockNumber();
  var addrWithout0x = addr;
  if (addr.substring(0, 2) == "0x" || addr.substring(0, 2) == "0X") {
    addrWithout0x = addr.substring(2);
  }
  const balance = await publicClient.getBalance({
    address: `0x${addrWithout0x}`,
  });
  const balanceAsEther = formatEther(balance);
  return balanceAsEther;
}

export async function queryTransactions(addr: string) {
  if (isMorphNet()) {
    return _queryMorphTransactions(addr);
  } else {
    return [];
  }
}

export async function queryAssets(addr: string) {
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

async function _queryMorphTransactions(addr: string) {
  const url =
    process.env.MORPH_EXPLORER_API_URL + "/addresses/" + addr + "/transactions";
  console.log("query morph trans:", url);
  const url2 =
    process.env.MORPH_EXPLORER_API_URL +
    "/addresses/" +
    addr +
    "/internal-transactions";
  const resultData: {
    timestamp: any;
    block_number: any;
    result: any;
    to: any;
    hash: any;
    gas_price: any;
    gas_used: any;
    gas_limit: any;
    l1_fee: any;
    from: any;
    value: any;
  }[] = [];
  try {
    const response: AxiosResponse = await axios.get(url);
    response.data.items.forEach((e) => {
      const aRow = {
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
    console.error("111:", error);
    throw error; // Or handle the error differently
  }

  try {
    const response: AxiosResponse = await axios.get(url2);
    response.data.items.forEach((e) => {
      const aRow = {
        timestamp: e.timestamp,
        block_number: e.block,
        result: e.success ? "ok" : "error",
        to: e.to == null ? "" : e.to.hash,
        hash: e.transaction_hash + "::" + e.index + "::" + e.type,

        gas_price: 0,
        gas_used: e.gas_used,
        gas_limit: e.gas_limit,
        l1_fee: 0,
        from: e.from == null ? "" : e.from.hash,
        value: formatEther(BigInt(e.value)),
      };
      resultData.push(aRow);
    });
  } catch (error) {
    console.error("222:", error);
    throw error; // Or handle the error differently
  }
  return resultData;
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

async function _queryMorphTokens(addr: string) {
  const url =
    process.env.MORPH_EXPLORER_API_URL +
    "/addresses/" +
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
      resultData.push(aRow);
    });
  } catch (error) {
    console.error("333:", error);
    throw error; // Or handle the error differently
  }
  return resultData;
}