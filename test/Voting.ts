import { expect } from "chai";
import { network } from "hardhat";

describe("Voting Contract", function () {
  let ethers: any;
  let voting: any;
  let owner: any;
  let addr1: any;

  beforeEach(async function () {
    // Pull ethers and signers from Hardhat 3 network context
    const context = (await network.create()) as any;
    ethers = context.ethers;

    const signers = await ethers.getSigners();
    owner = signers[0];
    addr1 = signers[1];

    // Deploy the contract with initial candidates
    const candidateNames = ["Alice", "Bob", "Charlie"];
    voting = await ethers.deployContract("Voting", [candidateNames]);
    await voting.waitForDeployment();
  });

  it("Should initialize candidates correctly", async function () {
    const candidate0 = await voting.getCandidate(0);
    expect(candidate0.name).to.equal("Alice");
    expect(candidate0.votecount).to.equal(0n);

    const count = await voting.candidateCount();
    expect(count).to.equal(3n);
  });

  it("Should allow a user to vote and increment vote count", async function () {
    // Vote for Alice (ID 0) using addr1
    await voting.connect(addr1).vote(0);

    const candidate0 = await voting.getCandidate(0);
    expect(candidate0.votecount).to.equal(1n);
    expect(await voting.hasVoted(addr1.address)).to.be.true;
  });

  it("Should prevent a user from voting twice", async function () {
    await voting.connect(addr1).vote(0);

    // Attempt to vote again should revert
    await expect(voting.connect(addr1).vote(1)).to.be.revertedWith(
      "You have already voted",
    );
  });

  it("Should fail if voting for an invalid candidate ID", async function () {
    await expect(voting.connect(addr1).vote(99)).to.be.revertedWith(
      "Invalid candidate ID.",
    );
  });
});
