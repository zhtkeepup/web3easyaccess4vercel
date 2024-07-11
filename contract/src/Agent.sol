// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "./Account.sol";

import "./W3EAPoint.sol";

import {Address} from "../lib/openzeppelin-contracts/contracts/utils/Address.sol";
import "../lib/openzeppelin-contracts/contracts/proxy/Clones.sol";

contract Agent {
    using Address for address;

    uint256 constant NEW_REWARDS = 100 * 1e18;
    uint256 constant TRANS_REWARDS = 10 * 1e18;

    mapping(uint256 => address) accounts;

    address[4] public owners;

    W3EAPoint point;

    address public accountImpl;

    constructor() {
        owners[0] = msg.sender;
        owners[1] = msg.sender;
        owners[2] = msg.sender;
        owners[3] = msg.sender;
        accountImpl = address(new Account());
        Account(payable(accountImpl)).initPasswdAddr(address(0xdead), "");
    }

    function initPoint(address pointAddress) external onlyOwner {
        if (address(point) == address(0)) {
            point = W3EAPoint(pointAddress);
        }
    }

    modifier onlyOwner() {
        uint256 k = 0;
        for (; k < owners.length; k++) {
            if (msg.sender == owners[k]) {
                break;
            }
        }
        require(k < owners.length, "only owner!");
        _;
    }

    // function chgOwner(uint256 idx, address _newOwner) external onlyOwner {
    //     owners[idx] = _newOwner;
    // }

    function queryAccount(
        uint256 _ownerId
    ) external view onlyOwner returns (address) {
        return accounts[_ownerId];
    }

    function newAccount(
        uint256 _ownerId,
        address _passwdAddr,
        string calldata _questionNos
    ) external onlyOwner {
        require(accounts[_ownerId] == address(0), "user exists!");

        address acct = Clones.cloneDeterministic(
            accountImpl,
            bytes32(_ownerId)
        );

        Account(payable(acct)).initAgent();
        Account(payable(acct)).initPasswdAddr(_passwdAddr, _questionNos);

        accounts[_ownerId] = address(acct);

        point.mint(address(acct), NEW_REWARDS);
    }

    bool private lock;
    /**
     */
    function execute(
        uint256 _ownerId,
        bytes calldata data,
        uint256 _preGasFee
    ) external payable onlyOwner {
        if (!lock) {
            lock = true;
            require(accounts[_ownerId] != address(0), "user not exists!");

            accounts[_ownerId].functionCall(data);
            point.mint(accounts[_ownerId], TRANS_REWARDS);
            Account(payable(accounts[_ownerId])).transferGasToAgent(
                owners[0],
                _preGasFee
            );
            lock = false;
        }
    }
}