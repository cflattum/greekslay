import '../styles/slaythedrag.css'
import { Web3OnboardProvider, init } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'
import coinbaseWalletModule from '@web3-onboard/coinbase'
import walletConnectModule from '@web3-onboard/walletconnect'
import knightspng from '../public/knightslogo.png'

const INFURA_KEY = '2aeb55c625a343f183eb1a79c6990d46'

const ethereumMainnet = {
  id: '0x1',
  token: 'ETH',
  label: 'Ethereum',
  rpcUrl: `https://mainnet.infura.io/v3/${INFURA_KEY}`
}
const walletConnect = walletConnectModule({})
const coinbaseWalletSdk = coinbaseWalletModule({ darkMode: true })
const chains = [ethereumMainnet]
const wallets = [injectedModule(), coinbaseWalletSdk, walletConnect]

var ThemingMap = {
  '--w3o-background-color': '#211f20',
  '--w3o-foreground-color': 'unset',
  '--w3o-text-color': '#ebb802',
  '--w3o-border-color': 'unset',
  '--w3o-action-color': '#9f2320',
  '--w3o-border-radius': 'unset'
}

const web3Onboard = init({
  wallets,
  chains,
  appMetadata: {
    name: "Slay the Dragon",
    icon: 'https://cdn.shopify.com/s/files/1/0562/9689/8695/files/Knights___LogosBlack_Favicon_4x_01bc7099-fc8c-47a8-bc08-52bd0d233754.png',
    description: "worthy knights can slay the dragon!"
  },
  theme: ThemingMap,
  accountCenter: {
    desktop: {
      position: 'topRight',
      enabled: true,
      minimal: true
    },
    mobile: {
      position: 'bottomRight',
      enabled: true,
      minimal: true
    }
  }
  
  
})

function MyApp({ Component, pageProps }) {
  return (
    <Web3OnboardProvider web3Onboard={web3Onboard}>
      <Component {...pageProps} />
    </Web3OnboardProvider>
  )
}

export default MyApp