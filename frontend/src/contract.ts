
import { Contract, type Provider, type Signer } from "ethers";
import votingAbi from "./abi/Voting.json";

export const VOTING_CONTRACT_ADDRESS =
  "0x214309d66dB8c04DB72da0BFD21aA7c75c3c1833";

export function getVotingContract(connection: Provider | Signer) {
  return new Contract(
    VOTING_CONTRACT_ADDRESS,
    votingAbi,
    connection
  );
}
