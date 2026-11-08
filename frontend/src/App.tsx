
import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import { getVotingContract } from "./contract";
import "./App.css";

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;

      request: (args: {
        method: string;
        params?: unknown[];
      }) => Promise<unknown>;

      on?: (
        eventName: string,
        listener: (...args: any[]) => void
      ) => void;

      removeListener?: (
        eventName: string,
        listener: (...args: any[]) => void
      ) => void;
    };
  }
}

const SEPOLIA_CHAIN_ID = 11155111n;

type Candidate = {
  id: number;
  name: string;
  voteCount: string;
};

function App() {
  const [account, setAccount] = useState("");
  const [status, setStatus] = useState("Wallet not connected");
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [votingId, setVotingId] = useState<number | null>(null);

  // --------------------------------
  // DERIVED VOTING STATISTICS
  // --------------------------------

  const totalVotes = candidates.reduce(
    (total, candidate) => total + Number(candidate.voteCount),
    0
  );

  const highestVotes = Math.max(
    0,
    ...candidates.map((candidate) => Number(candidate.voteCount))
  );

  // --------------------------------
  // LOAD BLOCKCHAIN DATA
  // --------------------------------

  async function loadData(
    provider: BrowserProvider,
    address: string
  ) {
    console.log("[Voting] Loading contract data...");

    const voting = getVotingContract(provider);

    const count = await voting.candidateCount();
    const loadedCandidates: Candidate[] = [];

    for (let i = 0; i < Number(count); i++) {
      const [name, voteCount] = await voting.getCandidate(i);

      loadedCandidates.push({
        id: i,
        name,
        voteCount: voteCount.toString(),
      });
    }

    const alreadyVoted = await voting.hasVoted(address);

    setCandidates(loadedCandidates);
    setHasVoted(alreadyVoted);

    console.log("[Voting] Candidates loaded:", loadedCandidates);
    console.log("[Voting] Has voted:", alreadyVoted);
  }

  // --------------------------------
  // METAMASK EVENT LISTENERS
  // --------------------------------

  useEffect(() => {
    const ethereum = window.ethereum;

    console.log("--------------------------------");
    console.log("[Wallet Debug] Initializing listeners");
    console.log("[Wallet Debug] Provider detected:", Boolean(ethereum));
    console.log("[Wallet Debug] Is MetaMask:", ethereum?.isMetaMask);
    console.log("[Wallet Debug] on() type:", typeof ethereum?.on);
    console.log("[Wallet Debug] Current account:", account);
    console.log("--------------------------------");

    if (!ethereum?.on) {
      console.error("[Wallet Debug] Event listener API unavailable.");
      return;
    }

    async function handleAccountsChanged(accounts: unknown) {
      console.log("[Wallet Event] accountsChanged:", accounts);

      if (!Array.isArray(accounts) || accounts.length === 0) {
        setAccount("");
        setCandidates([]);
        setHasVoted(false);
        setStatus("Wallet disconnected.");
        console.log("[Wallet Event] Account disconnected.");
        return;
      }

      const newAccount = accounts[0];

      if (typeof newAccount !== "string") {
        console.error("[Wallet Event] Invalid account received.");
        return;
      }

      setAccount(newAccount);

      try {
        const provider = new BrowserProvider(ethereum as any);
        const network = await provider.getNetwork();

        console.log(
          "[Wallet Event] Account changed. Current chain:",
          network.chainId.toString()
        );

        if (network.chainId !== SEPOLIA_CHAIN_ID) {
          setCandidates([]);
          setHasVoted(false);
          setStatus("Wrong network. Please switch to Sepolia.");
          return;
        }

        await loadData(provider, newAccount);

        setStatus("Wallet account updated successfully.");
      } catch (error) {
        console.error("[Wallet Event] Account update failed:", error);
        setStatus("Could not load the new wallet account.");
      }
    }

    async function handleChainChanged(chainId: unknown) {
      console.log("================================");
      console.log("[Wallet Event] chainChanged RECEIVED!");
      console.log("[Wallet Event] New chain ID:", chainId);
      console.log("================================");

      if (typeof chainId !== "string") {
        console.error("[Wallet Event] Invalid chain ID format.");
        return;
      }

      let parsedChainId: bigint;

      try {
        parsedChainId = BigInt(chainId);
      } catch (error) {
        console.error("[Wallet Event] Could not parse chain ID:", error);
        return;
      }

      if (parsedChainId !== SEPOLIA_CHAIN_ID) {
        setCandidates([]);
        setHasVoted(false);
        setStatus(
          `Wrong network detected (Chain ID: ${parsedChainId}). Please switch to Sepolia.`
        );

        console.warn("[Wallet Event] Wrong network. Voting data cleared.");
        return;
      }

      console.log("[Wallet Event] Sepolia network detected.");

      if (account) {
        try {
          const provider = new BrowserProvider(ethereum as any);

          await loadData(provider, account);

          setStatus("Connected to Sepolia successfully.");
        } catch (error) {
          console.error("[Wallet Event] Reload failed:", error);
          setStatus("Could not reload voting data.");
        }
      }
    }

    try {
      ethereum.on("accountsChanged", handleAccountsChanged);
      console.log("[Wallet Debug] Accounts listener attached.");

      ethereum.on("chainChanged", handleChainChanged);
      console.log("[Wallet Debug] Chain listener attached.");

      console.log("[Wallet Debug] All listeners registered successfully.");
    } catch (error) {
      console.error("[Wallet Debug] Listener registration failed:", error);
    }

    return () => {
      console.log("[Wallet Debug] Cleaning up event listeners.");

      ethereum.removeListener?.(
        "accountsChanged",
        handleAccountsChanged
      );

      ethereum.removeListener?.(
        "chainChanged",
        handleChainChanged
      );
    };
  }, [account]);

  // --------------------------------
  // CONNECT WALLET
  // --------------------------------

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        setStatus("MetaMask is not installed.");
        return;
      }

      setLoading(true);
      setStatus("Connecting to MetaMask...");

      const provider = new BrowserProvider(window.ethereum as any);

      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const network = await provider.getNetwork();

      console.log(
        "[Connect] Connected chain ID:",
        network.chainId.toString()
      );

      if (network.chainId !== SEPOLIA_CHAIN_ID) {
        setAccount("");
        setCandidates([]);
        setHasVoted(false);
        setStatus("Please switch MetaMask to Sepolia.");
        return;
      }

      setAccount(address);

      await loadData(provider, address);

      setStatus("Connected! Voting data loaded.");
    } catch (error) {
      console.error("[Connect] Wallet connection failed:", error);
      setStatus("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------
  // REFRESH RESULTS
  // --------------------------------

  async function refreshResults() {
    try {
      if (!window.ethereum || !account) {
        setStatus("Connect your wallet first.");
        return;
      }

      setLoading(true);
      setStatus("Refreshing voting results...");

      const provider = new BrowserProvider(window.ethereum as any);
      const network = await provider.getNetwork();

      if (network.chainId !== SEPOLIA_CHAIN_ID) {
        setCandidates([]);
        setHasVoted(false);
        setStatus("Please switch MetaMask to Sepolia.");
        return;
      }

      await loadData(provider, account);

      setStatus("Voting results successfully refreshed!");
    } catch (error) {
      console.error("[Refresh] Failed:", error);
      setStatus("Could not refresh results. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------
  // CAST VOTE
  // --------------------------------

  async function castVote(candidateId: number) {
    try {
      if (!window.ethereum || !account) {
        setStatus("Please connect your wallet first.");
        return;
      }

      setVotingId(candidateId);
      setStatus("Waiting for MetaMask approval...");

      const provider = new BrowserProvider(window.ethereum as any);
      const network = await provider.getNetwork();

      if (network.chainId !== SEPOLIA_CHAIN_ID) {
        setCandidates([]);
        setHasVoted(false);
        setStatus("Please switch MetaMask to Sepolia.");
        return;
      }

      const signer = await provider.getSigner();
      const voting = getVotingContract(signer);

      const transaction = await voting.vote(candidateId);

      setStatus("Transaction submitted. Waiting for confirmation...");

      await transaction.wait();

      await loadData(provider, account);

      setStatus("Vote successfully recorded on Sepolia!");
    } catch (error: any) {
      console.error("[Voting] Transaction failed:", error);

      if (error?.code === "ACTION_REJECTED") {
        setStatus("You cancelled the transaction.");
      } else {
        setStatus(
          error?.reason ||
          error?.shortMessage ||
          "Voting failed. Check the console for details."
        );
      }
    } finally {
      setVotingId(null);
    }
  }

  // --------------------------------
  // USER INTERFACE
  // --------------------------------

  return (
    <div className="app">
      <nav className="navbar">
        <div className="brand">
          <span className="brand-icon">✓</span>
          <span>VOTECHAIN</span>
        </div>

        <span className="network">● Ethereum Sepolia</span>
      </nav>

      <header className="hero">
        <h1>Your voice matters.</h1>
        <p>
          Participate in a transparent blockchain-powered voting
          demonstration. Every confirmed vote is recorded on Ethereum Sepolia.
        </p>
      </header>

      <main className="dashboard">
        <section className="stats">
          <span className="stats-label">TOTAL VOTES CAST</span>
          <div className="stats-number">{totalVotes}</div>
          <span className="stats-label">
            Recorded on Ethereum Sepolia
          </span>
        </section>

        <section>
          <div className="section-heading">
            <div>
              <h2>Meet the candidates</h2>
              <p>Choose your preferred candidate below.</p>
            </div>

            {!account ? (
              <button
                className="connect-button"
                onClick={connectWallet}
                disabled={loading}
              >
                {loading ? "Connecting..." : "Connect MetaMask"}
              </button>
            ) : (
              <button
                className="connect-button"
                onClick={refreshResults}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "↻ Refresh Results"}
              </button>
            )}
          </div>

          <div className="status">{status}</div>

          {account && (
            <div className="wallet">
              <strong>Connected wallet</strong>
              <p>{account}</p>
              <span className="network">Sepolia connected</span>
            </div>
          )}

          <div className="candidate-grid">
            {candidates.map((candidate) => {
              const votes = Number(candidate.voteCount);

              const percentage =
                totalVotes > 0
                  ? (votes / totalVotes) * 100
                  : 0;

              const isLeading =
                highestVotes > 0 && votes === highestVotes;

              return (
                <article
                  className="candidate-card"
                  key={candidate.id}
                >
                  <h3>{candidate.name}</h3>

                  {isLeading && (
                    <span className="leader-badge">
                      Leading candidate
                    </span>
                  )}

                  <p className="vote-count">
                    {votes} {votes === 1 ? "vote" : "votes"}
                  </p>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <p className="vote-count">
                    {percentage.toFixed(1)}% of total votes
                  </p>

                  <button
                    className="vote-button"
                    onClick={() => castVote(candidate.id)}
                    disabled={
                      !account ||
                      hasVoted ||
                      votingId !== null
                    }
                  >
                    {votingId === candidate.id
                      ? "Processing..."
                      : hasVoted
                      ? "Already voted"
                      : "Vote for " + candidate.name}
                  </button>
                </article>
              );
            })}
          </div>

          {hasVoted && (
            <div className="status">
              ✓ Your vote has been recorded. Thank you for participating!
            </div>
          )}

          {!account && candidates.length === 0 && (
            <p>Connect your wallet to load the candidates.</p>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>VOTECHAIN · Blockchain Voting Demonstration</p>
        <p>Powered by Ethereum Sepolia and MetaMask</p>
      </footer>
    </div>
  );
}

export default App;
