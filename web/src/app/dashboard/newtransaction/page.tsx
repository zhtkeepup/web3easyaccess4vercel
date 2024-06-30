"use server";
import Main from "../page";

import myCookies from "../../serverside/myCookies";

import { Menu } from "../../lib/menu";

export default async function Page() {
  const selectedMenu = Menu.SendTransaction;

  return <Main selectedMenu={selectedMenu}></Main>;
}
