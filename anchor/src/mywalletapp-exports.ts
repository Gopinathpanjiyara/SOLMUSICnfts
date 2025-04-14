// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import MywalletappIDL from '../target/idl/mywalletapp.json'
import type { Mywalletapp } from '../target/types/mywalletapp'

// Re-export the generated IDL and type
export { Mywalletapp, MywalletappIDL }

// The programId is imported from the program IDL.
export const MYWALLETAPP_PROGRAM_ID = new PublicKey(MywalletappIDL.address)

// This is a helper function to get the Mywalletapp Anchor program.
export function getMywalletappProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...MywalletappIDL, address: address ? address.toBase58() : MywalletappIDL.address } as Mywalletapp, provider)
}

// This is a helper function to get the program ID for the Mywalletapp program depending on the cluster.
export function getMywalletappProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Mywalletapp program on devnet and testnet.
      return new PublicKey('coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF')
    case 'mainnet-beta':
    default:
      return MYWALLETAPP_PROGRAM_ID
  }
}
