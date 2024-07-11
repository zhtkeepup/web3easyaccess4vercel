import {
  Autocomplete,
  AutocompleteItem,
  Avatar,
  Tooltip,
  Badge,
} from "@nextui-org/react";
import { useState, useRef, useEffect } from "react";

import { useFormState, useFormStatus } from "react-dom";

import { saveChainCode } from "../serverside/serverActions";
import CallServerByForm from "../lib/callServerByForm";

export const ChainIcons = ({ chainCodeState, handleNewChainCodeState }) => {
  console.log("navbar, input param[chainCode]:", chainCodeState);

  const initChainRef = useRef("[init]");

  const [morphl2testState, setMorphl2testState] = useState({
    size: "sm",
    bordered: false,
  });
  const [defaultAnvilState, setDefaultAnvilState] = useState({
    size: "sm",
    bordered: false,
  });
  const [ethereumMainnetState, setEthereumMainnetState] = useState({
    size: "sm",
    bordered: false,
  });

  const setChainCodeHere = (cc) => {
    setMorphl2testState({
      size: "sm",
      bordered: false,
    });
    setDefaultAnvilState({
      size: "sm",
      bordered: false,
    });
    setEthereumMainnetState({
      size: "sm",
      bordered: false,
    });
    if (cc == "MORPH_TEST_CHAIN") {
      setMorphl2testState({
        size: "md",
        bordered: true,
      });
    } else if (cc == "DEFAULT_ANVIL_CHAIN") {
      setDefaultAnvilState({
        size: "md",
        bordered: true,
      });
    } else if (cc == "ETHEREUM_MAIN_NET") {
      setEthereumMainnetState({
        size: "md",
        bordered: true,
      });
    }
  };

  if (initChainRef.current == "[init]") {
    setChainCodeHere(chainCodeState);
    initChainRef.current = chainCodeState;
  }
  //
  // // // ////////////////////

  const handleClick = (chainCode) => {
    console.log(chainCode);
    handleNewChainCodeState(chainCode);
    // // //
    setChainCodeHere(chainCode);
    console.log("id_setChainForm_button click before..");
    document.getElementById("id_setChainForm_code").value = chainCode;
    document.getElementById("id_setChainForm_button").click();
    console.log("id_setChainForm_button click afetr!");
  };

  function SetChainForm({}) {
    const [message, formAction] = useFormState(saveChainCode, null);
    return (
      <form action={formAction} style={{ display: "none" }}>
        <input
          id="id_setChainForm_code"
          name="newChainCode"
          defaultValue={chainCodeState}
        />
        <button id="id_setChainForm_button" type="submit">
          Set Chain Code
        </button>
        {message}
      </form>
    );
  }

  return (
    <div className="flex gap-3 items-center" style={{ cursor: "pointer" }}>
      <SetChainForm />
      {/* <Badge content="" color="secondary"> */}
      <Tooltip content="MorphL2 testnet">
        <Avatar
          src="/chain/morphl2test.png"
          size={morphl2testState.size}
          isBordered={morphl2testState.bordered}
          onClick={() => {
            handleClick("MORPH_TEST_CHAIN");
          }}
          color="primary"
          radius="sm"
        />
      </Tooltip>
      {/* </Badge> */}

      <Tooltip content="anvil testnet">
        <Avatar
          src="/chain/anvil.png"
          size={defaultAnvilState.size}
          isBordered={defaultAnvilState.bordered}
          onClick={() => {
            handleClick("DEFAULT_ANVIL_CHAIN");
          }}
          color="primary"
          radius="sm"
        />
      </Tooltip>

      <Tooltip content="Ethereum">
        <Avatar
          src="/chain/ethereum.png"
          size={ethereumMainnetState.size}
          isBordered={ethereumMainnetState.bordered}
          onClick={() => {
            handleClick("ETHEREUM_MAIN_NET");
          }}
          color="primary"
          radius="sm"
        />
      </Tooltip>
    </div>
  );
};

export const SelectedChainIcon = ({ chainCodeState }) => {
  console.log("SelectedChainIcon,chainCode:", chainCodeState);
  if (chainCodeState == "DEFAULT_ANVIL_CHAIN") {
    return (
      <div className="flex gap-3 items-center">
        <Badge content="" color="secondary">
          <Tooltip content="anvil testnet">
            <Avatar
              src="/chain/anvil.png"
              size="sm"
              color="primary"
              radius="sm"
            />
          </Tooltip>
        </Badge>
      </div>
    );
  } else if (chainCodeState == "MORPH_TEST_CHAIN") {
    return (
      <div className="flex gap-3 items-center">
        <Badge content="" color="secondary">
          <Tooltip content="MorphL2 testnet">
            <Avatar
              src="/chain/morphl2test.png"
              size="sm"
              color="primary"
              radius="sm"
            />
          </Tooltip>
        </Badge>
      </div>
    );
  } else if (chainCodeState == "ETHEREUM_MAIN_NET") {
    return (
      <div className="flex gap-3 items-center">
        <Badge content="" color="secondary">
          <Tooltip content="Ethereum">
            <Avatar
              src="/chain/ethereum.png"
              size="sm"
              color="primary"
              radius="sm"
            />
          </Tooltip>
        </Badge>
      </div>
    );
  } else {
    return (
      <div className="flex gap-3 items-center">
        <Badge content="" color="secondary">
          <Tooltip content="unknow">
            <Avatar
              src="/chain/unknow.png"
              size="sm"
              color="primary"
              radius="sm"
            />
          </Tooltip>
        </Badge>
      </div>
    );
  }
};