import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair } from '@solana/web3.js'
import { Mywalletapp } from '../target/types/mywalletapp'

describe('mywalletapp', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Mywalletapp as Program<Mywalletapp>

  const mywalletappKeypair = Keypair.generate()

  it('Initialize Mywalletapp', async () => {
    await program.methods
      .initialize()
      .accounts({
        mywalletapp: mywalletappKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([mywalletappKeypair])
      .rpc()

    const currentCount = await program.account.mywalletapp.fetch(mywalletappKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment Mywalletapp', async () => {
    await program.methods.increment().accounts({ mywalletapp: mywalletappKeypair.publicKey }).rpc()

    const currentCount = await program.account.mywalletapp.fetch(mywalletappKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment Mywalletapp Again', async () => {
    await program.methods.increment().accounts({ mywalletapp: mywalletappKeypair.publicKey }).rpc()

    const currentCount = await program.account.mywalletapp.fetch(mywalletappKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement Mywalletapp', async () => {
    await program.methods.decrement().accounts({ mywalletapp: mywalletappKeypair.publicKey }).rpc()

    const currentCount = await program.account.mywalletapp.fetch(mywalletappKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set mywalletapp value', async () => {
    await program.methods.set(42).accounts({ mywalletapp: mywalletappKeypair.publicKey }).rpc()

    const currentCount = await program.account.mywalletapp.fetch(mywalletappKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the mywalletapp account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        mywalletapp: mywalletappKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.mywalletapp.fetchNullable(mywalletappKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})
