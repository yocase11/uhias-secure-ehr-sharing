import { expect } from "chai";
import { ethers } from "hardhat";

describe("UH_Consent", function () {
  it("should deploy", async function () {
    const Consent = await ethers.getContractFactory("UH_Consent");
    const consent = await Consent.deploy();
    await consent.waitForDeployment?.();
    const address = consent.target ?? consent.address;
    expect(address).to.be.a("string");
    expect(address).to.match(/^0x[a-fA-F0-9]{40}$/);
  });
});
