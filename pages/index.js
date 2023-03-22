import Head from 'next/head'
import styles from '../styles/Home.module.css'
import React, { useEffect, useState } from 'react';
import slayAbi from '../data/slayABI.json'
import stakeAbi from '../data/stakeABI.json'
import { Network, Alchemy } from 'alchemy-sdk';
import { useConnectWallet } from '@web3-onboard/react'
import { ethers } from 'ethers'
import Web3 from 'web3'
const web3j = new Web3(Web3.givenProvider)


const KNIGHTS_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
const ARTIFACT_ADDRESS = process.env.NEXT_PUBLIC_ARTIFACT_CONTRACT_ADDRESS
const STAKE_ADDRESS = process.env.NEXT_PUBLIC_STAKE_CONTRACT_ADDRESS
const SLAY_ADDRESS = process.env.NEXT_PUBLIC_SLAY_CONTRACT_ADDRESS

function Home() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()
  const [ownedKnights, setOwnedKnights] = useState([]);
  const [ownedKnightsAssets, setOwnedKnightsAssets] = useState([]);
  const [ownedArtifactAssets, setOwnedArtifactAssets] = useState([null]);
  const [powerTotal, setPowerTotal] = useState(0);
  const [playWin, setPlayWin] = useState(false);
  const [playLose, setPlayLose] = useState(false);
  const [stakeClick, setStakeClick] = useState(false);



  const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
  const web3 = createAlchemyWeb3(process.env.NEXT_PUBLIC_ALCHEMY_KEY);
  const settings = {
    apiKey: "f4PTT-IH68w6XLWVZ3ffk4awpO9-FIQU", // Replace with your Alchemy API Key.
    network: Network.ETH_MAINNET, // Replace with your network.
  };
  const alchemy = new Alchemy(settings);
  const slayContract = new web3.eth.Contract(slayAbi, SLAY_ADDRESS);
  const stakeContract = new web3.eth.Contract(stakeAbi, STAKE_ADDRESS);


  // create an ethers provider
  let ethersProvider

  if (wallet) {
    ethersProvider = new ethers.providers.Web3Provider(wallet.provider, 'any')
  }


//we want to fetch NFT's when the wallet is loaded.
  useEffect(() => {
  
    const fetchNFTsOwned = async () => {
      console.log('Checking for NFTs on address:', wallet.accounts[0].address);
  
      //
      const ownedKnightsTokens = await alchemy.nft
          .getNftsForOwner(wallet.accounts[0].address, {contractAddresses: [KNIGHTS_ADDRESS]})
          let testknights = [];
  
          for (const nft of ownedKnightsTokens.ownedNfts) {
            testknights.push(nft.tokenId)
          }
          //token_ids only, not sure if neccessary?
          setOwnedKnights(testknights);
          
  
          //this includes their metadata now
          setOwnedKnightsAssets([...ownedKnightsTokens.ownedNfts]);
  
          const ownedArtifactTokens = await alchemy.nft
          .getNftsForOwner(wallet.accounts[0].address, {
              contractAddresses: [ARTIFACT_ADDRESS],
          })
           
          setOwnedArtifactAssets([...ownedArtifactTokens.ownedNfts])
          
    };
  
   if (wallet) {
    fetchNFTsOwned()
    }
  }, [wallet]);

//using knightsassets as a callback because want this to run once we know we have knights.
// Will run on any change to knights 
useEffect(() => {
  checkPower();
}, [ownedKnightsAssets])

//calculates the power of the knights and artifacts in the wallet
const checkPower = async function () {
  if(ownedKnights.length >= 1) {

    let knightsPower = 0;
    let artifactPower = 0;
    let stakinglevel = 0;
    // count the knights, and artifacts, and get their power total
    for(const nft of ownedKnightsAssets)
    {
      //grab staking level from staking contract,
      stakinglevel = 0;
      stakinglevel = await stakeContract.methods.getStakingLevel(nft.tokenId).call()

      knightsPower = knightsPower + parseInt(stakinglevel)
      //power starts at 0. each knight has a default staking level of 1, so 0.5 + staking level = percentage to slay per warrior
      //knightsPower = knightsPower + 0.5 + stakinglevel;
  
    }
    
    if(ownedArtifactAssets.length >= 1 && ownedArtifactAssets[0] !== null)
    {
      for(const nft of ownedArtifactAssets)
      {
        let raritylevel = nft.rawMetadata.raritylevel;

        if(raritylevel == "Common")
        {
          raritylevel += 2.5;
        }
        else if(raritylevel == "Uncommon")
        {
          raritylevel += 5;
        }
        else if(raritylevel == "Rare")
        {
          raritylevel += 10;
        }
        else if(raritylevel == "Epic")
        {
          raritylevel += 20;
        }
        else if(raritylevel == "Legendary")
        {
          raritylevel += 100;
        }
        else if(raritylevel == "Ashigaru")
        {
          raritylevel += 35;
        }
        artifactPower += raritylevel;
      } 
    }
        setPowerTotal((knightsPower + artifactPower));
        
      }

};

const mintWin = async () => {
  let address = wallet.accounts[0].address;
                //need to check on this web3j vs web3; web3alchemy vs web3
            const signer = web3j.eth.accounts.privateKeyToAccount('' + process.env.NEXT_PUBLIC_SIGNER_KEY + '');
          
          
            let message = `0x000000000000000000000000${address.substring(2)}`;
              console.log(`Signing ${address} :: ${message}`);
          
              // Sign the message, update the `signedMessages` dict
              // storing only the `signature` value returned from .sign()
              let { signature } = signer.sign(message);


            //encode method using signature generated above
            const method1 = slayContract.methods.mintReward(address,1,signature).encodeABI();
            const transactionParameters = {
              to: SLAY_ADDRESS, // Required except during contract publications.
              from: window.ethereum.selectedAddress, // must match user's active address.
              data: method1,
              chainId: '0x1', // change to 0x1 on PROD !!
              value: 0,
            };
            
            const txHash = await window.ethereum.request({
              method: 'eth_sendTransaction',
              params: [transactionParameters],
            });
}

const attemptPlay = async () => {
  //const { ethereum } = window;
  //var method;

  //need to check the last time they have attempted to play
  var letsplay = await slayContract.methods.checkBeforePlaying(wallet.accounts[0].address,1).call();
  console.log("letsplay" + letsplay)

  if(letsplay)
  {       
          //compute winner based upon power + random chance
          //can use total power + a random number, and if add up
          //to above certain number, winner winner chicken dinner
          let win = false;
          let rand = Math.random();
          
          rand = rand * 100;
          

          if(rand < powerTotal)
          {
            win = true;
          }
          
          if(win)
          {
            winStart();
          }
          //this is if they do not win 
          //should tell them they dont win maybe?
          else
          {
            loseStart();
            
          }
  }
  else
  {
    alert("You have already defeated the dragon!");
  }
}

function winStart() {
  console.log("win");
  return setPlayWin(true);
}

function loseStart() {
  return setPlayLose(true);
}

function displayConsole() {
  //if no wallet address in, then show connect
  if(wallet == null)
  {
    return(
        <div class="box viewport wallet-viewport">
        {/*<!-- Wallet code goes here -->*/}
        <a class="knights-console-click wallet-connect-image" href="#" role='button' onClick={() => connect()}>
        
          <img class="knights-arcade-frame connect-wallet-img" src="https://cdn.shopify.com/s/files/1/0562/9689/8695/files/Connect_wallet_desktop.png?v=1669838840" alt=""/>
          <img class="knights-arcade-frame mobile" src="https://cdn.shopify.com/s/files/1/0562/9689/8695/files/Connect_wallet_mobile.png?v=1669839202" alt=""/>
         
        </a>
        </div>
    );
  }

  //if wallet address, but nothing owned, show empty console
  //TODO: Message about needing knights?
  else if((wallet !== null) && (ownedKnights.length == 0)&& (!stakeClick))
  {
    return(
    <div class="box viewport wallet-viewport">
      <div class="knights-console-click wallet-connect-image">
    <p class="wallet-connect">You must own a knight to access the console!</p>
    </div>
    </div>
    );
  }
  //if wallet address and owned knights, present stake / slay options
  //change to >= 1
  else if((wallet !== null) && (ownedKnights.length >= 1) && (!stakeClick) && (!playWin) && (!playLose))
  {
    return(
      <div class="box viewport wallet-viewport slay-stake">
    {/*<!-- Wallet code goes here - STAKE -->*/}
    <a class="knights-console-click wallet-connect-image stake-knight" href="https://mint.knightssaynah.com/battletraining">
      <img class="knights-arcade-frame stake-border" src="https://cdn.shopify.com/s/files/1/0562/9689/8695/files/stake_knight_button.png?v=1669849722" alt=""/>
      <img class="knights-arcade-frame mobile stake-border" src="https://cdn.shopify.com/s/files/1/0562/9689/8695/files/stake_knight_2x_63abebf7-a65f-47d2-a46b-7d140e674b5a.jpg?v=1669853701" alt=""/>
    </a>

    <img class="knights-arcade-frame or-seperator" src="https://cdn.shopify.com/s/files/1/0562/9689/8695/files/or.png?v=1669841884" alt=""/>
    <img class="knights-arcade-frame mobile or-seperator" src="https://cdn.shopify.com/s/files/1/0562/9689/8695/files/or.png?v=1669841884" alt=""/>

     {/*<!-- Wallet code goes here - SLAY -->*/}
    <a class="knights-console-click wallet-connect-image slay-dragon" href="#"role='button' onClick={attemptPlay}>
      <img class="knights-arcade-frame slay-border" src="https://cdn.shopify.com/s/files/1/0562/9689/8695/files/slay_button.png?v=1674762556" alt=""/>
      <img class="knights-arcade-frame mobile slay-border" src="https://cdn.shopify.com/s/files/1/0562/9689/8695/files/slay_knight_2x_33806cc0-0378-458c-b509-17cfb167a3bf.jpg?v=1669853819" alt=""/>
    </a>
  </div>
    );
  }
  else if(stakeClick)
  {
    return(
      <div class="box viewport wallet-viewport">
        <div class="knights-console-click wallet-connect-image">
      <p class="wallet-connect">Please Approve the coin into the console!</p>
      </div>
      </div>
      );
  }
  else if(playWin)
  {
    return(
    <div class="box viewport wallet-viewport">

    <video width='100%' autoPlay={true} playsInline onEnded={() => mintWin()}>
      <source src='https://res.cloudinary.com/dzx8f374h/video/upload/v1675299772/SamuraiWinWSFX_1_sflwhg.mp4' type="video/mp4"/>
      </video>
    </div>
    
    );
  }
  else if(playLose)
  {
    return(
      <div class="box viewport wallet-viewport">
      <video width='100%' autoPlay={true} playsInline onEnded={() => setPlayLose(false)}>
        <source src='https://res.cloudinary.com/dzx8f374h/video/upload/v1675316435/SamuraiLoseWSFX_1_gy9ad3.mp4' type="video/mp4"/>
        </video>
      </div>
      );
  }
}

  return(
    <main>
    <div class="knights-master-slay-frame">
 {/* <!-- viewport for wallet --> */}
  {/*<div class="box viewport">*/}
    {displayConsole()}
  {/*</div>*/}
  {/*-- End -->*/}
  <a class="knights-console-click" href="https://knightssaynah.com/">
  	<div class="box home">home</div>
  </a>
  <a class="knights-console-click" href="https://knightssaynah.com/pages/lore">
  	<div class="box knights">knights</div>
  </a>
  <a class="knights-console-click" href="https://knightssaynah.com/pages/about-project">
  	<div class="box about">about</div>
  </a>
  <a class="knights-console-click" href="https://knightssaynah.com/pages/armory">
  	<div class="box artifacts">artifacts</div>
  </a>
  <a class="knights-console-click" href="#">
  	<div class="box slay">slay</div>
  </a>
  <a class="knights-console-click" href="https://mint.knightssaynah.com/battletraining">
  	<div class="box stake">stake</div>
  </a>
  <img class="knights-arcade-frame" src="https://cdn.shopify.com/s/files/1/0562/9689/8695/files/knights-arcade-empty-viewport.png?v=1669828897" alt=""/>
  <img class="knights-arcade-frame mobile" src="https://cdn.shopify.com/s/files/1/0562/9689/8695/files/knights-arcade_console_mobile_v2_2x_4fe0a986-7c77-41fb-89bf-f3dbe67cf9de.jpg?v=1669853576" alt=""/>
</div>

<div class="knights-slay-row">
  <div class="knights-slay-column home-menu">
    <h2><a class="knights-mobile-click-slay" href="https://knightssaynah.com/">Home</a></h2>
  </div>
  <div class="knights-slay-column knights-menu">
    <h2><a class="knights-mobile-click-slay" href="https://knightssaynah.com/pages/lore">Knights</a></h2>
  </div>
  <div class="knights-slay-column artifacts-menu">
    <h2><a class="knights-mobile-click-slay" href="https://knightssaynah.com/pages/armory">Artifacts</a></h2>
  </div>
  <div class="knights-slay-column about-menu">
    <h2><a class="knights-mobile-click-slay" href="https://knightssaynah.com/pages/about-project">About Us</a></h2>
  </div>
</div>
</main>

  )
}

export default Home;