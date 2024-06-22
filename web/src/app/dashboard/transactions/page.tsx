"use server";
import Main from "../page";

import myCookies from "../../serverside/myCookies";
import { queryTransactions } from "../../serverside/blockchain/queryAccountInfo";

export default async function Page() {
  const selectedMenu = "transactions";
  const acctId = myCookies.loadData().accountId;
  const txList = await queryTransactions(acctId);
  console.log("========================in transactions, txList:", txList);
  return <Main selectedMenu={selectedMenu} txList={txList}></Main>;
}
