import { ethers } from "hardhat";

async function main() {
  const Consent = await ethers.getContractFactory("UH_Consent");
  const consent = await Consent.deploy();
  await consent.waitForDeployment?.();
  console.log("Consent deployed to:", consent.target ?? consent.address);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
