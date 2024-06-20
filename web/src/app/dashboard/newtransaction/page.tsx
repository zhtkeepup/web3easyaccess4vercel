"use server";
import Main from "../page";

import myCookies from "../../lib/myCookies";

export default async function Page() {
  const selectedMenu = "newtransactions";
  const acctId = myCookies.loadData().accountId;

  return <Main selectedMenu={selectedMenu} txList={undefined}></Main>;
}
