pragma solidity ^0.4.17;
/**
 * The Patron contract does this and that...
 */

import 'zeppelin/contracts/token/StandardToken.sol';
import 'zeppelin/contracts/ownership/Ownable.sol';
import 'oraclize/contracts/usingOraclize.sol';

contract Patron is StandardToken, usingOraclize, Ownable {
  string public name ;
  string public symbol;
  uint8 public constant decimals = 18;
  uint256 public constant INITIAL_SUPPLY = 0;

  StandardToken public baseToken;

  uint256 public graphType;
  uint256 public graphMultiplyer;

  uint256 public oraclizeGasLimit = 200000;
  uint256 public oraclizeGasPrice = 4000000000;

  mapping (address => Subscription) subscriptions;
  address[] subscriptionKeys;
  struct Subscription {
    bool exists;
    bool active;
    bytes32 lastQueryId;
    uint256 amount;
    uint256 total;
    uint256 interval;
    uint256 start;
    uint256 last;
  }
  mapping (bytes32 => address) oraclizeIds;

  event LogUint(uint number);
  event Paid(address patron, uint256 amount);
  event AlertEmptyPledge(address patron);
  event AlertEmptyOracle(address patron);

  function Patron (string _name, string _symbol, address _baseToken, uint256 _graphType, uint256 _graphMultiplyer) payable {
    name = _name;
    symbol = _symbol;

    baseToken = StandardToken(_baseToken);

    graphType = _graphType;
    graphMultiplyer =_graphMultiplyer;
    OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
  }


  // buy
  function mint (address patron, uint256 amount) returns(bool success){
    if (msg.sender != patron && msg.sender != oraclize_cbAddress()) revert();
    if (!baseToken.transferFrom(patron, address(this), amount)) revert();
    balances[patron] = balances[patron].add(amount);
    return true;
  }

  // sell
  function unmint (address patron, uint256 amount) returns(bool success){
    if (msg.sender != patron && msg.sender != oraclize_cbAddress()) revert();
    if (!baseToken.transfer(patron, amount)) revert();
    balances[patron] = balances[patron].sub(amount);
    return true;
  }

  // subscribe
  function subscribe (address patron, uint256 amount, uint256 interval) public payable {
    if (amount == 0) revert();
    if (msg.value == 0) revert();
    if (patron != msg.sender) revert();
    if (interval > 4 weeks) revert();
    if (subscriptions[patron].exists) {
      recurring(patron);
    } else {
      if (!mint(patron, amount)) revert();
      subscriptions[patron].exists = true;
      subscriptions[patron].amount = amount;
      subscriptions[patron].total = amount;
      subscriptions[patron].interval = interval;
      subscriptions[patron].start = now;
      subscriptions[patron].last = now;
      subscriptions[patron].active = true;
      Paid(patron, amount);
      oracle(patron);
    }
  }

  function editSubscription (address patron, uint256 amount, uint256 interval) public payable {
    if (!subscriptions[patron].exists) revert();
    if (amount == 0) {
      subscriptions[patron].amount = 0;
      subscriptions[patron].active = false;
    } else {
      subscriptions[patron].amount = amount;
      subscriptions[patron].interval = interval;
    }
  }

  function oracle (address patron) private {
    LogUint(oraclize_getPrice("URL"));
    if (oraclize_getPrice("URL") > this.balance) {
      subscriptions[patron].active = false;
      AlertEmptyOracle(patron);
    } else {
      uint256 interval = subscriptions[patron].interval;
      bytes32 queryId = oraclize_query(interval, "URL", "", oraclizeGasLimit);
      oraclizeIds[queryId] = patron;

    }
  }

  function updateOracleGasPrice (uint newPrice) onlyOwner {
    oraclizeGasPrice = newPrice;
    oraclize_setCustomGasPrice(oraclizeGasPrice);
  }
  function updateOracleGasLimit (uint newPrice) onlyOwner {
    oraclizeGasLimit = newPrice;
  }

  function recurring (address patron) private {
    uint256 amount = subscriptions[patron].amount;
    if (amount == 0) revert();
    if (baseToken.allowance(patron, address(this)) < amount) {
      subscriptions[patron].active = false;
      AlertEmptyPledge(patron);
    } else {
      if (!mint(patron, amount)) revert();
      subscriptions[patron].total += amount;
      subscriptions[patron].last = now;
      subscriptions[patron].active = true;
      Paid(patron, amount);
      oracle(patron);
    }
  }

  function __callback(bytes32 queryId) public {
    if (msg.sender != oraclize_cbAddress()) revert();
    address patron = oraclizeIds[queryId];
    recurring(patron);
  }

}
