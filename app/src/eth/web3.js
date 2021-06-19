import Web3 from 'web3'

const web3 = new Web3(window.web3.currentProvider)


window.addEventListener("load", async () => { 
    if (window.ethereum) { 
      window.web3 = new Web3(window.ethereum) 
      try {  
        await window.ethereum.enable()
      } catch (error) {
        // User denied account access...
      }
    } 
    else if (window.web3) { 
      window.web3 = new Web3(web3.currentProvider);
    }
    // Non-dapp browsers...
    else { 
      console.log("Non-Ethereum browser detected. You should consider trying MetaMask!");
    }
  });

  
export default web3