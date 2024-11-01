"use client";

import React, { MutableRefObject, useRef } from "react";
import { useState, useEffect } from "react";

import Navbar from "../navbar/navbar";

import { Avatar, AvatarGroup, AvatarIcon } from "@nextui-org/avatar";
import { Divider, Card, CardHeader, CardBody } from "@nextui-org/react";

import OpMenu from "./opMenu";
import { ShowMain } from "./opMenu";

import {
    Menu,
    UserInfo,
    uiToString,
    ChainCode,
    chainCodeFromString,
} from "../lib/myTypes";
import { UpdateUserProperty, UserProperty } from "../storage/userPropertyStore";
import * as userPropertyStore from "../storage/userPropertyStore";

// export function getSessionData(req) {
//   const encryptedSessionData = cookies().get("session")?.value;
//   return encryptedSessionData
//     ? JSON.parse(decrypt(encryptedSessionData))
//     : null;
// }

export default function Dashboard({
    userProp,
    updateUserProp,
    loadUserData,
}: {
    userProp: UserProperty;
    updateUserProp: UpdateUserProperty;
    loadUserData: (myProp: UserProperty) => Promise<void>;
}) {
    console.log("dashborad,ui:", userProp);

    const [selectedMenu, setSelectedMenu] = useState(Menu.OOOO);
    const updateSelectedMenu = (menu: Menu) => {
        setSelectedMenu(menu);
        userPropertyStore.setMenu(menu);
    };

    useEffect(() => {
        const oldMenu: Menu = userPropertyStore.getMenu();
        setSelectedMenu(oldMenu);
    }, []);

    return (
        <>
            <Navbar
                userProp={userProp}
                updateUserProp={updateUserProp}
                loadUserData={loadUserData}
            ></Navbar>
            <Divider
                orientation="horizontal"
                style={{ backgroundColor: "grey", height: "5px" }}
            ></Divider>
            <div
                style={{
                    display: "flex",
                    marginLeft: "10px",
                    marginRight: "10px",
                }}
            >
                <Card className="max-w-full">
                    <OpMenu
                        email={userProp.email}
                        selectedMenu={selectedMenu}
                        updateSelectedMenu={updateSelectedMenu}
                    />
                </Card>

                <Card
                    className="max-w-full w-full"
                    style={{ marginLeft: "5px" }}
                >
                    <CardBody>
                        <ShowMain
                            selectedMenu={selectedMenu}
                            userProp={userProp}
                            loadUserData={loadUserData}
                        />
                    </CardBody>
                </Card>
            </div>
        </>
    );
}
