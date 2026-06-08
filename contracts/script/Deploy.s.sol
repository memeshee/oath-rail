// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/OathRailVault.sol";

contract Deploy is Script {
    function run() external returns (OathRailVault vault) {
        vm.startBroadcast();
        vault = new OathRailVault();
        vm.stopBroadcast();
    }
}
