// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/* 
* @title: Voting
* @author: Adams Yeswa
* @notice: Handle voting 
*/
contract Voting {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public hasVoted;

    uint256 public candidateCount;
    address public owner;

    event Voted(uint256 indexed candidateId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    constructor(string[] memory _candidateNames) {
        owner = msg.sender;
        for(uint256 i = 0; i < _candidateNames.length; i++) {
            candidates[i] = Candidate({
                name: _candidateNames[i],
                voteCount: 0
            });
            candidateCount++;
        }
    }

    function vote(uint256 _candidateId) public {
        require(!hasVoted[msg.sender], "You have already voted");
        require(_candidateId < candidateCount, "Invalid candidate ID.");

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;

        emit Voted(_candidateId);
    }

    function getCandidate(uint256 _candidateId) public view returns (string memory name, uint256 votecount) {
        require(_candidateId < candidateCount, "Invalid candidate ID.");
        Candidate memory candidate = candidates[_candidateId];
        return (candidate.name, candidate.voteCount);
    }
}