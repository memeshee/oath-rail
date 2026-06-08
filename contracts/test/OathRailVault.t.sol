// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/OathRailVault.sol";

contract OathRailVaultTest is Test {
    OathRailVault private vault;

    address private owner = address(0xA11CE);
    address private agent = address(0xA9E17);
    address private recipient = address(0xB0B);
    address private attacker = address(0xBAD);

    function setUp() public {
        vault = new OathRailVault();
        vm.deal(owner, 10 ether);
        vm.deal(agent, 1 ether);
        vm.deal(attacker, 1 ether);
    }

    function testDepositAndWithdraw() public {
        vm.startPrank(owner);
        vault.deposit{value: 3 ether}();
        assertEq(vault.balances(owner), 3 ether);

        vault.withdraw(1 ether);
        assertEq(vault.balances(owner), 2 ether);
        vm.stopPrank();
    }

    function testAgentCanSpendWithinPolicy() public {
        uint256 policyId = _fundAndCreatePolicy(2 ether);

        vm.prank(agent);
        vault.spend(policyId, 1 ether, keccak256("invoice-1"));

        assertEq(vault.balances(owner), 4 ether);
        assertEq(recipient.balance, 1 ether);
        (,,,, uint256 spent,,,) = vault.policies(policyId);
        assertEq(spent, 1 ether);
    }

    function testRejectsNonAgentSpend() public {
        uint256 policyId = _fundAndCreatePolicy(2 ether);

        vm.prank(attacker);
        vm.expectRevert(OathRailVault.NotAgent.selector);
        vault.spend(policyId, 1 ether, keccak256("attack"));
    }

    function testRejectsOverspend() public {
        uint256 policyId = _fundAndCreatePolicy(2 ether);

        vm.prank(agent);
        vm.expectRevert(OathRailVault.SpendLimitExceeded.selector);
        vault.spend(policyId, 3 ether, keccak256("too-much"));
    }

    function testRejectsPausedPolicy() public {
        uint256 policyId = _fundAndCreatePolicy(2 ether);

        vm.prank(owner);
        vault.setPolicyPaused(policyId, true);

        vm.prank(agent);
        vm.expectRevert(OathRailVault.PolicyPaused.selector);
        vault.spend(policyId, 1 ether, keccak256("paused"));
    }

    function testRejectsExpiredPolicy() public {
        uint256 policyId = _fundAndCreatePolicy(2 ether);

        vm.warp(block.timestamp + 2 days);
        vm.prank(agent);
        vm.expectRevert(OathRailVault.PolicyExpired.selector);
        vault.spend(policyId, 1 ether, keccak256("expired"));
    }

    function testOnlyOwnerCanPause() public {
        uint256 policyId = _fundAndCreatePolicy(2 ether);

        vm.prank(attacker);
        vm.expectRevert(OathRailVault.NotOwner.selector);
        vault.setPolicyPaused(policyId, true);
    }

    function _fundAndCreatePolicy(uint256 maxSpend) private returns (uint256 policyId) {
        vm.startPrank(owner);
        vault.deposit{value: 5 ether}();
        policyId = vault.createPolicy(agent, recipient, maxSpend, uint64(block.timestamp + 1 days), keccak256("demo vendor"));
        vm.stopPrank();
    }
}
