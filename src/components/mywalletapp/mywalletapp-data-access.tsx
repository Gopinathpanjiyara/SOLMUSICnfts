'use client'

import { getMywalletappProgram, getMywalletappProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

export function useMywalletappProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getMywalletappProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getMywalletappProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['mywalletapp', 'all', { cluster }],
    queryFn: () => program.account.mywalletapp.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['mywalletapp', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods.initialize().accounts({ mywalletapp: keypair.publicKey }).signers([keypair]).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useMywalletappProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useMywalletappProgram()

  const accountQuery = useQuery({
    queryKey: ['mywalletapp', 'fetch', { cluster, account }],
    queryFn: () => program.account.mywalletapp.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['mywalletapp', 'close', { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ mywalletapp: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['mywalletapp', 'decrement', { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ mywalletapp: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['mywalletapp', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ mywalletapp: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['mywalletapp', 'set', { cluster, account }],
    mutationFn: (value: number) => program.methods.set(value).accounts({ mywalletapp: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
