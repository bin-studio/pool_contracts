var Patron = artifacts.require("Patron");
var SimpleToken = artifacts.require("zeppelin/contracts/examples/SimpleToken");

const gasPrice = web3.toBigNumber(100000000000)

contract('Patron', function(accounts) {
  let simpleToken, patron, starter;

  beforeEach(async function() { 
    starter = web3.toWei(web3.toBigNumber(1))
    simpleToken = await SimpleToken.new();
  });

  describe("Deploying token", function() {
    it("should result in owning 10000 tokens", async function () {
      const shouldEqual = 10000
      const balanceOf = await simpleToken.balanceOf(accounts[0])
      assert.equal(balanceOf.toString(10), web3.toWei(web3.toBigNumber(shouldEqual)).toString(10));
    });
    it(" and approving should result approved tokens", async function () {
      const approve = web3.toBigNumber(10000)
      patron = await Patron.new('Test Project', 'ASDF', simpleToken.address, 18, 0, 10, {value: starter});
      const approveTX = await simpleToken.approve(patron.address, approve.toString(10))
      const allowance = await simpleToken.allowance(accounts[0], patron.address);
      assert.equal(allowance.toString(10), approve.toString(10));
    });
  })

  describe("Minting new tokens", function () {
    it("with linear should work", async function () {
      patron = await Patron.new('Test Project', 'ASDF', simpleToken.address, 18, 0, 10, {value: starter});

      const preBalance = await simpleToken.balanceOf(accounts[0])

      const approve = web3.toBigNumber(web3.toWei('1'))
      const approveTX = await simpleToken.approve(patron.address, approve)
      const gasEstimate = await patron.mint.estimateGas(accounts[0], approve)
      console.log('gas in ETH', web3.fromWei(web3.toBigNumber(gasEstimate).mul(gasPrice)).toString(10))

      const tuple = await patron.calculateMintTokenPerToken(approve)
      const totalMinted = tuple[0]
      const totalCost = tuple[1]

      console.log('totalMinted:', web3.fromWei(totalMinted.toString(10)))
      console.log('totalCost:', web3.fromWei(totalCost.toString(10)))

      const mintTX = await patron.mint(accounts[0], approve.toString(10))
      const balance = await patron.balanceOf(accounts[0])
      const postBalance = await simpleToken.balanceOf(accounts[0])

      const totalSupply = await patron.totalSupply()
      const costPerToken = await patron.costPerToken()
      console.log('totalSupply', web3.fromWei(totalSupply).toString(10))
      console.log('costPerToken', web3.fromWei(costPerToken).toString(10))

      assert.equal(totalCost.toString(10), preBalance.minus(postBalance).toString(10));
      assert.equal(web3.fromWei(totalMinted.toString(10)).toString(10), web3.fromWei(balance.toString(10)).toString(10));

    })
  })


  // describe("Subscribing", function() {
  //   it("should work", async function () {
  //       const amount = web3.toWei(web3.toBigNumber(10))
  //       const intervals = web3.toBigNumber(10)
  //       const approve = amount.mul(intervals)
  //       const tokenTx = await simpleToken.approve(patron.address, approve.toString(10));
  //       const interval = web3.toBigNumber(5 * 60) // 5 minutes
  //       const tx = await patron.subscribe(accounts[0], amount.toString(10), interval.toString(10), {from: accounts[0], value: 1000000000});
  //       assert.equal(tx.receipt.status, '0x01');
  //   });
  // });

});
