// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract UH_Consent {
    struct Policy { address owner; string policyHash; uint256 expiry; bool exists; }
    struct RecordMeta { address uploader; string cid; string hash; uint256 timestamp; string policyId; }
    struct Audit { address requester; string recordCid; uint256 timestamp; bool granted; string reason; }

    mapping(string => Policy) public policies;
    mapping(string => RecordMeta) public records;
    Audit[] public audits;

    event PolicyCreated(string policyId, address owner);
    event RecordRegistered(string recordId, string cid);
    event AccessLogged(address requester, string recordCid, bool granted, string reason);

    function setPolicy(string calldata policyId, string calldata policyHash, uint256 expiry) external {
        policies[policyId] = Policy({ owner: msg.sender, policyHash: policyHash, expiry: expiry, exists: true });
        emit PolicyCreated(policyId, msg.sender);
    }

    function registerRecord(string calldata recordId, string calldata cid, string calldata fileHash, string calldata policyId) external {
        require(policies[policyId].exists, "Policy not found");
        records[recordId] = RecordMeta({ uploader: msg.sender, cid: cid, hash: fileHash, timestamp: block.timestamp, policyId: policyId });
        emit RecordRegistered(recordId, cid);
    }

    function logAccess(address requester, string calldata recordId, bool granted, string calldata reason) external {
        RecordMeta memory meta = records[recordId];
        audits.push(Audit({ requester: requester, recordCid: meta.cid, timestamp: block.timestamp, granted: granted, reason: reason }));
        emit AccessLogged(requester, meta.cid, granted, reason);
    }

    function getAuditCount() external view returns (uint256) { return audits.length; }
}
