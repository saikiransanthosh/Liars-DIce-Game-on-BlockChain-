import React, { Component } from 'react';
import Web3 from 'web3'
import './App.css';
import brain from '../brain.png'
import LiarsGame from '../abis/LiarsGame.json'
class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      account: '0x0', number: 0, numberGathered: 0, token: null, diceList:[],bidNum:0,bidQty:0, gameBidder:'0x0', gameBidNum:0,gameBidQty:0,winnerAddr:'0x0',currentTurnAddr:'0x0'
    }
  }

  async componentWillMount() {

    await this.loadWeb3()
    await this.loadBlockchainData()
  }



  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })

    // Load smart contract
    const networkId = await web3.eth.net.getId()
    const networkData = LiarsGame.networks[networkId]
    if (networkData) {
      const abi = LiarsGame.abi
      const address = networkData.address
      const token = new web3.eth.Contract(abi, address)
      this.setState({ token: token })
    } else {
      alert('Smart contract not deployed to detected network.')
    }

  }



  handleSet = async (e) => {
    e.preventDefault();
    const account = this.state.account;
    const Game = this.state.token;
    //let hexNum= this.decToHex(this.state.number);
    const gas = await Game.methods.set(this.state.number).estimateGas();
    const result = await Game.methods.set(this.state.number).send({ from: account, gas });
    //console.log(result);
  }

   bidToContract = async (e) => {
    e.preventDefault();
    this.getTotalDices();
    const account = this.state.account;
    const Game = this.state.token;
    //let hexNum= this.decToHex(this.state.number);
    const gas = await Game.methods.bid(this.state.bidNum,this.state.bidQty).estimateGas();
    const result = await Game.methods.bid(this.state.bidNum,this.state.bidQty).send({ from: account, gas });
    console.log(result);
    
  }

  handleGetRepeated = async (e) => {
    const result = await this.state.token.methods.get().call();
    const gameState = await this.state.token.methods.getGameData().call();
    //console.log(gameState);
    let dec = this.hexToDec(result);
    this.setState({ numberGathered: dec });
    //gameBidder:'0x0', gameBidNum:0,gameBidQty:0

    this.setState({gameBidNum:this.hexToDec(gameState[0])});
    this.setState({gameBidQty:this.hexToDec(gameState[1])});
    this.setState({gameBidder:gameState[2]});
    this.setState({currentTurnAddr:gameState[3]});
    

    
  }
  handleGet = async (e) => {
    e.preventDefault();
    const result = await this.state.token.methods.get().call();
    console.log(result);
    let dec = this.hexToDec(result);
    this.setState({ numberGathered: dec });
  }

  getTotalDices = async (e) => {
    //e.preventDefault();
    const result = await this.state.token.methods.totalDiceList().call();
    console.log(result);
  }

  hexToDec(hexString) {
    return parseInt(hexString, 16);
  }

  decToHex(decString) {
    return decString.toString(16);
  }

  hexArrToDecArr(result) {
    let retArr = [];
    for (let i = 0; i < result.length; i++) {
      if (this.hexToDec(result[i]) != -1)
        retArr.push(this.hexToDec(result[i]));
    }
    return retArr;
  }
  getWinnerDetails= async (e) => {
    const account = this.state.account;
    const result = await this.state.token.methods.winnerDetails().call({ from: account });
    this.setState({ winnerAddr: result });
    console.log(result);
  }
  challengeBid= async (e) => {
    this.getWinnerDetails();
    const gas = await this.state.token.methods.challenge().estimateGas();
    const account = this.state.account;
    const result = await this.state.token.methods.challenge().send({ from: account, gas });
    //console.log("Winner is : "+ this.state.winnerAddr);
    this.getDiceList();
  }
  getDiceList = async (e) => {
    const account = this.state.account;
    const result = await this.state.token.methods.showDiceList().call({ from: account });
   
    console.log(result);
    const parsedarr = this.hexArrToDecArr(result[1]);
  
    this.setState({diceList: parsedarr});
    //console.log(parsedarr);
    this.handleGetRepeated();
    setInterval(this.handleGetRepeated, 1000);
  }
  handleJoin = async (e) => {
    e.preventDefault();
    let acc=this.state.account;
    let Game = this.state.token;
    const gas = await Game.methods.joinGame().estimateGas();
    const result = await Game.methods.joinGame().send({ from: acc, gas });
    //this.getDiceList();
    //this.setState({ gameJoined:true })
    //console.log(result);
   
  }


  render() {
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand text-white col-sm-3 col-md-2 mr-0"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={brain} width="30" height="30" className="d-inline-block align-top" alt="" />
            &nbsp; Liars Dice
</a>
          <ul className="navbar-nav px-3">
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <small className="text-white"><span id="account"> Your Address: {this.state.account}</span></small>
            </li>
          </ul>
        </nav>



        <div className="center">
          <p>Your Address: {this.state.account}<br />
            <button onClick={this.handleJoin} type="button">Join Game</button>
            <button onClick={this.getDiceList} type="button">Start/Refresh Game</button>
            <br /> Your Dices:
            {this.state.diceList.map(function(item, i){
              return <li>{item}</li>
            })}
            <br />
            <br /> 
            {this.state.gameBidNum &&
            <span>
            Address {this.state.gameBidder} has bidded:  {this.state.gameBidNum} for Qty :  {this.state.gameBidQty} 
            </span>
            }
            <br /> <br /> <button onClick = {this.challengeBid} disabled={ this.state.currentTurnAddr != this.state.account}>Challenge</button> <br /> <br /></p>

          <form onSubmit={this.bidToContract} >
            <label>
              Dice Number:
            <input type="text" name="name" value={this.state.bidNum} onChange={e => this.setState({ bidNum: e.target.value })} />
            </label>
            <label>
              Qty:
            <input type="text" name="name" value={this.state.bidQty} onChange={e => this.setState({ bidQty: e.target.value })} />
            </label>
            <input type="submit" disabled={ this.state.currentTurnAddr != this.state.account} value="BID" />
          </form>
        </div>

      {/*   <div className="center">
          <form onSubmit={this.handleSet}>
            <label>
              Set Number:
            <input type="text" name="name" value={this.state.number} onChange={e => this.setState({ number: e.target.value })} />
            </label>
            <input type="submit" value="Set Number" />
          </form>
          <br />
          <button onClick={this.handleGet} type="button">Get Number</button>
          {this.state.numberGathered}
        </div> */}
      </div>
    );
  }
}

export default App;
