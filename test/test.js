var Patron = artifacts.require("Patron");
var SimpleToken = artifacts.require("zeppelin/contracts/examples/SimpleToken");

var utils = require('web3-utils')
contract('Patron', function(accounts) {
  let simpleToken, patron;

  beforeEach(async function() { 
    simpleToken = await SimpleToken.new();
    patron = await Patron.new('Test Project', 'ASDF', simpleToken.address, 0, 2);
  });

  describe("Deploying token", function() {
    it("should result in owning 10000 tokens", async function () {
      const shouldEqual = 10000
      const balanceOf = await simpleToken.balanceOf(accounts[0])
      assert.equal(balanceOf.toString(10), utils.toWei(utils.toBN(shouldEqual)).toString());
    });
    it(" and approving should result approved tokens", async function () {
      const approve = utils.toBN(10000)
      const approveTX = await simpleToken.approve(patron.address, approve.toString())
      const allowance = await simpleToken.allowance(accounts[0], patron.address);
      assert.equal(allowance.toString(10), approve.toString());
    });
  })
  describe("Subscribing", function() {
    it("should work", async function () {
        const amount = utils.toWei(utils.toBN(10))
        const intervals = utils.toBN(10)
        const approve = amount.mul(intervals)
        const tokenTx = await simpleToken.approve(patron.address, approve.toString());
        // console.log(tokenTx)
        const interval = utils.toBN(5 * 60) // 5 minutes
        // console.log(accounts[0], amount, interval)
        const tx = await patron.subscribe(accounts[0], amount.toString(), interval.toString(), {from: accounts[0], value: 1000000000});
        console.log(tx)
    });

    // it("and reverting 10 tokens should result in net 0 (w 1 contributor)", async function () {
    //   const gasPrice = utils.toBN(100000000000)
    //   const minted = 10

    //   const priceNeeded = await totalCost(10)
    //   const balance = await web3.eth.getBalance(accounts[0])

    //   const tx = await continuousToken.mint(minted, {value: Math.floor(priceNeeded)})

    //   const gasUsed = utils.toBN(tx.receipt.gasUsed)
    //   const gasTotal = gasUsed.mul(gasPrice)
    //   const newBalance = await web3.eth.getBalance(accounts[0])
    //   const amountPaid = balance.minus(gasTotal).minus(newBalance)

    //   const tx2 = await continuousToken.withdraw(minted)

    //   const gasUsed2 = utils.toBN(tx2.receipt.gasUsed)
    //   const gasTotal2 = gasUsed2.mul(gasPrice)
    //   const finalBalance = await web3.eth.getBalance(accounts[0])
    //   const amountPaid2 = newBalance.minus(gasTotal2).minus(finalBalance)

    //   assert.equal(amountPaid.add(amountPaid2).toNumber(), 0);

    // })

    // it("and reverting 10 tokens should result in net 0 (w 2 contributors)", async function () {
    //   const gasPrice = utils.toBN(100000000000)
    //   const minted = 10

    //   const priceNeeded0 = await totalCost(10)
    //   const tx0 = await continuousToken.mint(minted, {from: accounts[1], value: Math.floor(priceNeeded0)})

    //   const balance = await web3.eth.getBalance(accounts[0])

    //   const priceNeeded = await totalCost(10)
    //   const tx = await continuousToken.mint(minted, {value: Math.floor(priceNeeded)})

    //   const gasUsed = utils.toBN(tx.receipt.gasUsed)
    //   const gasTotal = gasUsed.mul(gasPrice)
    //   const newBalance = await web3.eth.getBalance(accounts[0])
    //   const amountPaid = balance.minus(gasTotal).minus(newBalance)

    //   const tx2 = await continuousToken.withdraw(minted)

    //   const gasUsed2 = utils.toBN(tx2.receipt.gasUsed)
    //   const gasTotal2 = gasUsed2.mul(gasPrice)
    //   const finalBalance = await web3.eth.getBalance(accounts[0])
    //   const amountPaid2 = newBalance.minus(gasTotal2).minus(finalBalance)

    //   assert.equal(amountPaid.add(amountPaid2).toNumber(), 0);

    // })
  });


  async function totalCost (amount) {
    let totalSupply = await continuousToken.totalSupply()

    let totalCost = 0
    for (let i = 0; i < amount; i++) {
      let foo = totalSupply.add(i).toNumber()
      var newCost = await costPerToken(foo)
      totalCost += newCost
    }
    return totalCost
  }
  async function costPerToken (_supply) {
    let baseCost = await continuousToken.baseCost()
    baseCost = baseCost.toNumber()
    return baseCost + fracExp(baseCost, 618046, _supply, 2) + baseCost * _supply / 1000;
  }

  function fracExp(k, q, n, p) {
    let s = 0
    let N = 1
    let B = 1
    for (let i = 0; i < p; ++i) {
      s += k * N / B / (q ** i)
      N = N * (n - i)
      B = B * (i + 1)
    }
    return s;
  }
});
