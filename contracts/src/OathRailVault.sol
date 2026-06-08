// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title OathRailVault
/// @notice User-owned zkLTC vaults with bounded agent spending policies.
/// @dev The AI agent is intentionally untrusted. This contract enforces recipient,
/// amount, expiry, pause state, owner balance, and agent identity on every spend.
contract OathRailVault {
    struct Policy {
        address owner;
        address agent;
        address recipient;
        uint256 maxSpend;
        uint256 spent;
        uint64 expiresAt;
        bool paused;
        bytes32 purposeHash;
    }

    error AmountZero();
    error BadAddress();
    error InsufficientBalance();
    error NotOwner();
    error NotAgent();
    error PolicyExpired();
    error PolicyPaused();
    error PolicyNotFound();
    error SpendLimitExceeded();
    error TransferFailed();

    event Deposited(address indexed owner, uint256 amount);
    event Withdrawn(address indexed owner, uint256 amount);
    event PolicyCreated(
        uint256 indexed policyId,
        address indexed owner,
        address indexed agent,
        address recipient,
        uint256 maxSpend,
        uint64 expiresAt,
        bytes32 purposeHash
    );
    event PolicyPausedSet(uint256 indexed policyId, bool paused);
    event Spent(
        uint256 indexed policyId,
        address indexed owner,
        address indexed agent,
        address recipient,
        uint256 amount,
        bytes32 memoHash
    );

    mapping(address => uint256) public balances;
    mapping(uint256 => Policy) public policies;
    uint256 public nextPolicyId = 1;

    receive() external payable {
        deposit();
    }

    function deposit() public payable {
        if (msg.value == 0) revert AmountZero();
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        if (amount == 0) revert AmountZero();
        if (balances[msg.sender] < amount) revert InsufficientBalance();

        balances[msg.sender] -= amount;
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Withdrawn(msg.sender, amount);
    }

    function createPolicy(
        address agent,
        address recipient,
        uint256 maxSpend,
        uint64 expiresAt,
        bytes32 purposeHash
    ) external returns (uint256 policyId) {
        if (agent == address(0) || recipient == address(0)) revert BadAddress();
        if (maxSpend == 0) revert AmountZero();
        if (expiresAt <= block.timestamp) revert PolicyExpired();

        policyId = nextPolicyId++;
        policies[policyId] = Policy({
            owner: msg.sender,
            agent: agent,
            recipient: recipient,
            maxSpend: maxSpend,
            spent: 0,
            expiresAt: expiresAt,
            paused: false,
            purposeHash: purposeHash
        });

        emit PolicyCreated(policyId, msg.sender, agent, recipient, maxSpend, expiresAt, purposeHash);
    }

    function setPolicyPaused(uint256 policyId, bool paused) external {
        Policy storage policy = policies[policyId];
        if (policy.owner == address(0)) revert PolicyNotFound();
        if (msg.sender != policy.owner) revert NotOwner();

        policy.paused = paused;
        emit PolicyPausedSet(policyId, paused);
    }

    function spend(uint256 policyId, uint256 amount, bytes32 memoHash) external {
        Policy storage policy = policies[policyId];
        if (policy.owner == address(0)) revert PolicyNotFound();
        if (msg.sender != policy.agent) revert NotAgent();
        if (policy.paused) revert PolicyPaused();
        if (block.timestamp > policy.expiresAt) revert PolicyExpired();
        if (amount == 0) revert AmountZero();
        if (policy.spent + amount > policy.maxSpend) revert SpendLimitExceeded();
        if (balances[policy.owner] < amount) revert InsufficientBalance();

        policy.spent += amount;
        balances[policy.owner] -= amount;
        (bool ok,) = policy.recipient.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Spent(policyId, policy.owner, msg.sender, policy.recipient, amount, memoHash);
    }

    function remainingPolicySpend(uint256 policyId) external view returns (uint256) {
        Policy storage policy = policies[policyId];
        if (policy.owner == address(0)) revert PolicyNotFound();
        return policy.maxSpend - policy.spent;
    }
}
