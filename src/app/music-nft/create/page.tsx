'use client';

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { IconUpload, IconMusic, IconPhoto, IconCoin, IconPlayerPlay, IconPlayerPause, IconCircleCheck } from '@tabler/icons-react';
import { AppHero, AppLayout, LoadingSpinner, ErrorMessage } from '@/components/ui/ui-layout';
import { uploadToIPFS, PinataMetadata, createCombinedNFT } from '@/services/pinata';
import { v4 as uuidv4 } from 'uuid';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';

interface FormData {
  title: string;
  description: string;
  audioFile: File | null;
  coverImage: File | null;
  genre: string;
  price: number;
  artist: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  audioFile: null,
  coverImage: null,
  genre: 'electronic',
  price: 0.5, // Default price in SOL
  artist: '',
};

// Constants
const genres = ['electronic', 'hip-hop', 'pop', 'rock', 'jazz', 'ambient', 'classical', 'other'];
const MINT_FEE = 0.01; // 0.01 SOL mint fee

const FileInfoDisplay = ({ file, type }: { file: File | null; type: 'audio' | 'image' }) => {
  if (!file) return null;
  
  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
  const maxSize = type === 'audio' ? 15 : 5;
  const isOversized = parseFloat(fileSizeMB) > maxSize;
  
  return (
    <div className={`text-xs mt-1 ${isOversized ? 'text-red-500' : 'text-muted-foreground'}`}>
      {file.name} ({fileSizeMB} MB)
      {isOversized && 
        <div className="font-medium">
          File exceeds {maxSize}MB limit! Please compress before uploading.
        </div>
      }
    </div>
  );
};

export default function CreateNFTPage() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [nftIpfsHash, setNftIpfsHash] = useState<string | null>(null);
  
  // Calculate total cost
  const totalCost = Number((formData.price + MINT_FEE).toFixed(2));
  
  useEffect(() => {
    // Set the artist name if the user has connected their wallet
    if (connected && publicKey) {
      setFormData(prev => ({ 
        ...prev, 
        artist: prev.artist || publicKey.toBase58().slice(0, 6) + '...' 
      }));
    }
  }, [connected, publicKey]);
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      // Make sure price is a valid number
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setFormData(prev => ({ ...prev, [name]: numValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormData];
        return newErrors;
      });
    }
  };
  
  // Add a helper function for file size validation
  const validateFileSize = (file: File, maxSizeMB: number): { valid: boolean; error?: string } => {
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return { 
        valid: false, 
        error: `File size (${fileSizeMB.toFixed(2)}MB) exceeds the ${maxSizeMB}MB limit. Please compress your file.` 
      };
    }
    return { valid: true };
  };

  const handleAudioChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.startsWith('audio/')) {
        setErrors(prev => ({ ...prev, audioFile: 'Please upload an audio file' }));
        return;
      }
      
      // Validate file size (15MB max for audio)
      const MAX_AUDIO_SIZE_MB = 15;
      const sizeValidation = validateFileSize(file, MAX_AUDIO_SIZE_MB);
      if (!sizeValidation.valid) {
        setErrors(prev => ({ ...prev, audioFile: sizeValidation.error }));
        return;
      }
      
      setFormData(prev => ({ ...prev, audioFile: file }));
      
      // Create preview URL for audio
      const url = URL.createObjectURL(file);
      setAudioPreviewUrl(url);
      
      // Create audio element to check duration
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
        
        // Only validate duration for NFT format if price is set (indicating an NFT)
        if (audio.duration > 30 && formData.price > 0) {
          setErrors(prev => ({ 
            ...prev, 
            audioFile: 'For NFTs, audio must be 30 seconds or less' 
          }));
        } else {
          // Clear error if previously set
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.audioFile;
            return newErrors;
          });
        }
      };
    }
  };
  
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, coverImage: 'Please upload an image file' }));
        return;
      }
      
      // Validate file size (5MB max for images)
      const MAX_IMAGE_SIZE_MB = 5;
      const sizeValidation = validateFileSize(file, MAX_IMAGE_SIZE_MB);
      if (!sizeValidation.valid) {
        setErrors(prev => ({ ...prev, coverImage: sizeValidation.error }));
        return;
      }
      
      setFormData(prev => ({ ...prev, coverImage: file }));
      
      // Create preview URL for image
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      
      // Clear error if previously set
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.coverImage;
        return newErrors;
      });
    }
  };
  
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.artist.trim()) {
      newErrors.artist = 'Artist name is required';
    }
    
    if (!formData.genre) {
      newErrors.genre = 'Genre is required';
    }
    
    if (!formData.audioFile) {
      newErrors.audioFile = 'Audio file is required';
    } else if (audioDuration && audioDuration > 30 && formData.price > 0) {
      newErrors.audioFile = 'For NFTs, audio must be 30 seconds or less';
    }
    
    if (!formData.coverImage) {
      newErrors.coverImage = 'Cover image is required';
    }
    
    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const showNFTPreview = () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setShowPreview(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      toast.error('Please connect your wallet using the button in the header');
      return;
    }
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    
    try {
      // Generate a unique mint ID
      const mintId = uuidv4();
      
      // Check that we have both required files
      if (!formData.audioFile || !formData.coverImage) {
        toast.error('Both audio file and cover image are required');
        setLoading(false);
        return;
      }
      
      toast.loading('Creating your music NFT...', { id: 'creating-nft' });
      
      // Create a combined NFT with a single metadata record
      const result = await createCombinedNFT(
        formData.audioFile,
        formData.coverImage,
        {
          title: formData.title,
          artist: formData.artist,
          description: formData.description,
          genre: formData.genre,
          price: Number(formData.price),
          mint: mintId,
          owner: publicKey?.toBase58() || 'unknown',
        }
      );
      
      if (!result) {
        throw new Error('Failed to create NFT. Please try again.');
      }
      
      const { coverArtIpfsHash, audioIpfsHash } = result;
      
      // Save hash for preview
      setNftIpfsHash(coverArtIpfsHash);
      
      // Create a complete metadata object for the app to use
      const completeNFT = {
        title: formData.title,
        artist: formData.artist,
        description: formData.description || '',
        genre: formData.genre,
        price: Number(formData.price),
        forSale: true,
        mint: mintId,
        owner: publicKey?.toBase58() || 'unknown',
        creator: publicKey?.toBase58() || 'unknown',
        coverArt: `https://gateway.pinata.cloud/ipfs/${coverArtIpfsHash}`,
        audioUrl: `https://gateway.pinata.cloud/ipfs/${audioIpfsHash}`,
        createdAt: new Date().toISOString()
      };
      
      console.log('NFT created successfully:', completeNFT);
      
      // Clear the cache to force a refresh
      localStorage.removeItem('_nft_cache_data');
      console.log('NFT cache cleared after creation');
      
      // Success! NFT created
      toast.dismiss('creating-nft');
      toast.success('NFT created successfully!');
      setUploadComplete(true);
      
      // Wait 3 seconds then redirect to profile
      setTimeout(() => {
        router.push('/profile');
      }, 3000);
    } catch (error: any) {
      console.error('Error creating NFT:', error);
      
      // Dismiss loading toast
      toast.dismiss('creating-nft');
      
      // More specific error messages based on the error
      let errorMessage = 'Failed to create NFT. Please try again.';
      
      if (error.message.includes('File size exceeds')) {
        errorMessage = error.message;
      } else if (error.message.includes('400')) {
        errorMessage = 'Upload failed. The file size may be too large for Pinata. Try with a smaller file.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Authentication error with Pinata service. Please try again later.';
      } else if (error.message.includes('timeout') || error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">Creating your music item...</p>
        </div>
      </AppLayout>
    );
  }
  
  if (!connected) {
    return (
      <AppLayout>
        <div className="py-12 px-4">
          <div className="max-w-md mx-auto text-center">
            <ErrorMessage
              message="Please connect your wallet to create music items"
            />
          </div>
        </div>
      </AppLayout>
    );
  }
  
  if (uploadComplete) {
    return (
      <AppLayout>
        <AppHero 
          title="Media Uploaded Successfully!" 
          subtitle="Your music has been uploaded and is now available"
        />
        <div className="max-w-lg mx-auto text-center py-8">
          <div className="card bg-base-100 shadow-xl overflow-hidden">
            <figure className="relative aspect-square">
              {imagePreviewUrl && (
                <img 
                  src={imagePreviewUrl} 
                  alt={formData.title} 
                  className="w-full h-full object-cover"
                />
              )}
              <button 
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-60 hover:opacity-100 transition-opacity"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <IconPlayerPause className="w-16 h-16 text-white" />
                ) : (
                  <IconPlayerPlay className="w-16 h-16 text-white" />
                )}
              </button>
            </figure>
            <div className="card-body">
              <h2 className="card-title">{formData.title}</h2>
              <p>Artist: {formData.artist}</p>
              <p>Genre: {formData.genre}</p>
              <p>Price: {formData.price.toFixed(2)} SOL</p>
              <div className="flex justify-between mt-4">
                <Link href="/profile" className="btn btn-primary">
                  Go to Profile
                </Link>
                <Link href="/music-nft/marketplace" className="btn btn-outline">
                  View Marketplace
                </Link>
              </div>
            </div>
          </div>
          {audioPreviewUrl && (
            <audio
              ref={audioRef}
              src={audioPreviewUrl}
              className="hidden"
            />
          )}
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      {showPreview ? (
        <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto overflow-hidden mt-8">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2">
              <div className="relative aspect-square">
                {imagePreviewUrl && (
                  <img 
                    src={imagePreviewUrl} 
                    alt={formData.title} 
                    className="w-full h-full object-cover"
                  />
                )}
                <button 
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-60 hover:opacity-100 transition-opacity"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <IconPlayerPause className="w-16 h-16 text-white" />
                  ) : (
                    <IconPlayerPlay className="w-16 h-16 text-white" />
                  )}
                </button>
              </div>
            </div>
            <div className="md:w-1/2 p-6">
              <h2 className="card-title text-xl mb-2">{formData.title}</h2>
              <p className="text-sm mb-3">by {formData.artist}</p>
              <p className="text-sm text-muted-foreground mb-3">{formData.description}</p>
              
              <div className="divider my-4"></div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Genre:</span>
                  <span className="badge badge-outline">{formData.genre}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{audioDuration ? `${audioDuration.toFixed(1)} seconds` : 'Unknown'}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>List Price:</span>
                  <span>{formData.price.toFixed(2)} SOL</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Mint Fee:</span>
                  <span>{MINT_FEE.toFixed(2)} SOL</span>
                </div>
                <div className="divider my-2"></div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{totalCost.toFixed(2)} SOL</span>
                </div>
              </div>
              
              <div className="card-actions mt-6">
                <button 
                  className="btn btn-outline w-1/2"
                  onClick={() => setShowPreview(false)}
                  disabled={loading}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-primary w-1/2"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner /> : 'Create Media'}
                </button>
              </div>
            </div>
          </div>
          {audioPreviewUrl && (
            <audio
              ref={audioRef}
              src={audioPreviewUrl}
              className="hidden"
            />
          )}
        </div>
      ) : (
        <div className="max-w-5xl mx-auto pt-8">
          <div className="mb-10 p-8 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl border border-border shadow-lg">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-base-100 p-5 rounded-full shadow-lg">
                <IconMusic className="w-12 h-12 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2 text-center md:text-left">Upload Your Music</h1>
                <p className="text-muted-foreground text-center md:text-left">Share your music with the community - upload as a regular track or mint as an NFT</p>
              </div>
              <div className="hidden md:block h-16 w-px bg-border"></div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-sm">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-primary bg-primary/10 text-primary font-medium">1</span>
                  <span>Details</span>
                </div>
                <span className="text-muted-foreground">→</span>
                <div className="flex items-center gap-1 text-sm">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-muted-foreground bg-muted-foreground/10 text-muted-foreground font-medium">2</span>
                  <span className="text-muted-foreground">Preview</span>
                </div>
                <span className="text-muted-foreground">→</span>
                <div className="flex items-center gap-1 text-sm">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-muted-foreground bg-muted-foreground/10 text-muted-foreground font-medium">3</span>
                  <span className="text-muted-foreground">Create</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body p-8">
                  <form>
                    <div className="space-y-8">
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold mb-3 flex items-center">
                          <IconMusic className="w-6 h-6 mr-3 text-primary" />
                          Music Details
                        </h2>
                        <p className="text-sm text-muted-foreground">Fill in the details about your music track</p>
                      </div>
                      
                      {/* Title */}
                      <div className="form-control group">
                        <label className="label">
                          <span className="label-text font-medium flex items-center">
                            <span className="w-2 h-5 bg-primary rounded-full mr-2 group-focus-within:h-7 transition-all duration-200"></span>
                            Title
                            <span className="ml-2 opacity-0 group-focus-within:opacity-100 transition-opacity text-xs text-success">
                              {formData.title.length > 0 && !errors.title && '✓'}
                            </span>
                          </span>
                          <span className="label-text-alt text-xs text-muted-foreground">Required</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="title"
                            className={`input input-bordered w-full pl-4 h-12 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl ${errors.title ? 'input-error' : formData.title.length > 0 ? 'border-success' : ''}`}
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Enter track title"
                          />
                          {formData.title.length > 0 && !errors.title && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {errors.title && (
                          <label className="label">
                            <span className="label-text-alt text-error flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              {errors.title}
                            </span>
                          </label>
                        )}
                      </div>
                      
                      {/* Artist */}
                      <div className="form-control group">
                        <label className="label">
                          <span className="label-text font-medium flex items-center">
                            <span className="w-2 h-5 bg-primary rounded-full mr-2 group-focus-within:h-7 transition-all duration-200"></span>
                            Artist Name
                            <span className="ml-2 opacity-0 group-focus-within:opacity-100 transition-opacity text-xs text-success">
                              {formData.artist.length > 0 && !errors.artist && '✓'}
                            </span>
                          </span>
                          <span className="label-text-alt text-xs text-muted-foreground">Required</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="artist"
                            className={`input input-bordered w-full pl-4 h-12 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl ${errors.artist ? 'input-error' : formData.artist.length > 0 ? 'border-success' : ''}`}
                            value={formData.artist}
                            onChange={handleInputChange}
                            placeholder="Your artist name"
                          />
                          {formData.artist.length > 0 && !errors.artist && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {errors.artist && (
                          <label className="label">
                            <span className="label-text-alt text-error flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              {errors.artist}
                            </span>
                          </label>
                        )}
                      </div>
                      
                      {/* Description */}
                      <div className="form-control group">
                        <label className="label">
                          <span className="label-text font-medium flex items-center">
                            <span className="w-2 h-5 bg-primary rounded-full mr-2 group-focus-within:h-7 transition-all duration-200"></span>
                            Description
                          </span>
                          <span className="label-text-alt text-xs text-muted-foreground">Optional</span>
                        </label>
                        <div className="relative">
                          <textarea
                            name="description"
                            className="textarea textarea-bordered h-24 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none py-3 px-4 w-full rounded-xl"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Tell listeners about your track (optional)"
                          />
                          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                            {formData.description.length} / 500
                          </div>
                        </div>
                      </div>
                      
                      {/* Genre */}
                      <div className="form-control group">
                        <label className="label">
                          <span className="label-text font-medium flex items-center">
                            <span className="w-2 h-5 bg-primary rounded-full mr-2 group-focus-within:h-7 transition-all duration-200"></span>
                            Genre
                            <span className="ml-2 opacity-0 group-focus-within:opacity-100 transition-opacity text-xs text-success">
                              {formData.genre && !errors.genre && '✓'}
                            </span>
                          </span>
                          <span className="label-text-alt text-xs text-muted-foreground">Required</span>
                        </label>
                        <div className="relative dropdown">
                          <div className="relative">
                            <select
                              name="genre"
                              className={`select select-bordered w-full h-12 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none pl-4 rounded-xl
                                ${errors.genre ? 'select-error' : formData.genre ? 'border-success' : ''}`}
                              value={formData.genre}
                              onChange={handleInputChange}
                            >
                              {genres.map(genre => (
                                <option key={genre} value={genre} className="py-3 pl-3">
                                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-all group-focus-within:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                            {formData.genre && !errors.genre && (
                              <div className="absolute right-8 top-1/2 -translate-y-1/2 text-success">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="mt-2">
                            <div className="p-4 bg-base-200 rounded-md border border-base-300 text-xs text-muted-foreground">
                              <p className="font-medium pb-2 text-primary px-4">About genres</p>
                              <p className="leading-relaxed px-4">Selecting the right genre helps buyers discover your music NFT more easily in the marketplace.</p>
                            </div>
                          </div>
                        </div>
                        {errors.genre && (
                          <label className="label">
                            <span className="label-text-alt text-error flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              {errors.genre}
                            </span>
                          </label>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6">
                        {/* Combined Audio + Image Upload */}
                        <div className="form-control group">
                          <label className="label">
                            <span className="label-text font-medium flex items-center">
                              <span className="w-2 h-5 bg-primary rounded-full mr-2 group-focus-within:h-7 transition-all duration-200"></span>
                              Upload Media 
                              <span className="ml-2 opacity-0 group-focus-within:opacity-100 transition-opacity text-xs text-success">
                                {formData.audioFile && formData.coverImage && !errors.audioFile && !errors.coverImage && '✓'}
                              </span>
                            </span>
                            <span className="label-text-alt text-xs text-muted-foreground">Required</span>
                          </label>
                          
                          <div className="flex flex-col md:flex-row gap-4">
                            {/* Preview Area */}
                            <div className="flex-1 bg-base-200 rounded-xl overflow-hidden">
                              {imagePreviewUrl ? (
                                <div className="relative aspect-square group">
                                  <img
                                    src={imagePreviewUrl}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                  />
                                  {audioPreviewUrl && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={togglePlay}
                                        className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center"
                                      >
                                        {isPlaying ? (
                                          <IconPlayerPause className="w-8 h-8" />
                                        ) : (
                                          <IconPlayerPlay className="w-8 h-8" />
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="aspect-square flex items-center justify-center border-2 border-dashed border-base-content/20">
                                  <div className="text-center p-6">
                                    <IconPhoto className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                    <p className="text-sm text-muted-foreground">Upload image & audio together</p>
                                  </div>
                                </div>
                              )}
                              
                              {audioPreviewUrl && !imagePreviewUrl && (
                                <div className="p-4">
                                  <audio
                                    controls
                                    className="w-full"
                                    src={audioPreviewUrl}
                                  />
                                </div>
                              )}
                            </div>
                            
                            {/* Upload Controls */}
                            <div className="flex-1 flex flex-col space-y-4">
                              <div className={`border-2 border-dashed ${errors.audioFile ? 'border-error' : formData.audioFile ? 'border-success' : 'border-border'} hover:border-primary transition-colors rounded-xl p-6 text-center bg-base-200/50 group-focus-within:border-primary`}>
                                <label className={`btn ${errors.audioFile ? 'btn-error' : 'btn-primary'} w-full mb-3 h-12 shadow-md hover:shadow-lg transition-all rounded-xl`}>
                                  <IconMusic className="w-5 h-5 mr-2" />
                                  {formData.audioFile ? 'Change Audio' : 'Upload Audio'}
                                  <input
                                    type="file"
                                    accept="audio/*"
                                    className="hidden"
                                    onChange={handleAudioChange}
                                  />
                                </label>
                                <div className="text-sm truncate p-2 bg-base-100 rounded-xl">
                                  {formData.audioFile ? (
                                    <span className="text-success flex items-center justify-center">
                                      <IconCircleCheck className="w-4 h-4 mr-1 flex-shrink-0" />
                                      <span className="truncate">{formData.audioFile.name}</span>
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">No audio chosen</span>
                                  )}
                                </div>
                                {audioDuration !== null && (
                                  <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                                    <span>Duration: {audioDuration.toFixed(1)}s</span>
                                    {formData.audioFile && (
                                      <span className={formData.audioFile.size > 15 * 1024 * 1024 ? "text-error font-medium" : ""}>
                                        {(formData.audioFile.size / (1024 * 1024)).toFixed(2)} MB {formData.audioFile.size > 15 * 1024 * 1024 && "⚠️"}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div className="mt-2 text-xs text-muted-foreground">
                                  Max file size: 15MB
                                </div>
                              </div>
                              
                              <div className={`border-2 border-dashed ${errors.coverImage ? 'border-error' : formData.coverImage ? 'border-success' : 'border-border'} hover:border-primary transition-colors rounded-xl p-6 text-center bg-base-200/50 group-focus-within:border-primary`}>
                                <label className={`btn ${errors.coverImage ? 'btn-error' : 'btn-primary'} w-full mb-3 h-12 shadow-md hover:shadow-lg transition-all rounded-xl`}>
                                  <IconPhoto className="w-5 h-5 mr-2" />
                                  {formData.coverImage ? 'Change Image' : 'Upload Image'}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                  />
                                </label>
                                <div className="text-sm truncate p-2 bg-base-100 rounded-xl">
                                  {formData.coverImage ? (
                                    <span className="text-success flex items-center justify-center">
                                      <IconCircleCheck className="w-4 h-4 mr-1 flex-shrink-0" />
                                      <span className="truncate">{formData.coverImage.name}</span>
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">No image chosen</span>
                                  )}
                                </div>
                                {formData.coverImage && (
                                  <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                                    <span>Image</span>
                                    <span className={formData.coverImage.size > 5 * 1024 * 1024 ? "text-error font-medium" : ""}>
                                      {(formData.coverImage.size / (1024 * 1024)).toFixed(2)} MB {formData.coverImage.size > 5 * 1024 * 1024 && "⚠️"}
                                    </span>
                                  </div>
                                )}
                                <div className="mt-2 text-xs text-muted-foreground">
                                  Max file size: 5MB
                                </div>
                              </div>
                              
                              {(errors.audioFile || errors.coverImage) && (
                                <div className="p-2 bg-error/10 rounded-xl text-sm text-error">
                                  {errors.audioFile && (
                                    <p className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                      </svg>
                                      {errors.audioFile}
                                    </p>
                                  )}
                                  {errors.coverImage && (
                                    <p className="flex items-center mt-1">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                      </svg>
                                      {errors.coverImage}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="p-4 bg-base-200 rounded-xl border border-base-300 text-xs">
                              <p className="font-medium pb-2 text-primary px-4">Media requirements</p>
                              <p className="leading-relaxed mb-2 px-4">Your music and artwork are treated as a single entity. Square images (800x800px) work best. For NFT minting, audio must be 30 seconds or less.</p>
                              <div className="mt-3 flex flex-wrap gap-1 px-4">
                                <span className="badge badge-sm">MP3/WAV/M4A</span>
                                <span className="badge badge-sm">PNG/JPG/GIF</span>
                              </div>
                              
                              <div className="divider my-2"></div>
                              
                              <p className="font-medium pb-2 text-primary px-4">File size limits</p>
                              <p className="leading-relaxed mb-2 px-4">
                                <span className="font-medium">Audio:</span> 15MB max. <span className="font-medium">Images:</span> 5MB max. 
                                These limits are enforced by our storage provider.
                              </p>
                              
                              <div className="mt-3 px-4 bg-primary/10 p-2 rounded-lg">
                                <p className="font-medium text-primary">Having upload issues?</p>
                                <ul className="list-disc pl-4 mt-1 space-y-1">
                                  <li>Convert audio to MP3 format (lower quality setting)</li>
                                  <li>Compress images using tools like TinyPNG</li>
                                  <li>For audio, try using editing software to reduce quality</li>
                                  <li>Ensure total size is under the limits</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          {audioPreviewUrl && imagePreviewUrl && (
                            <audio
                              ref={audioRef}
                              src={audioPreviewUrl}
                              className="hidden"
                            />
                          )}
                        </div>
                        
                        {/* Price */}
                        <div className="form-control group">
                          <label className="label">
                            <span className="label-text font-medium flex items-center">
                              <span className="w-2 h-5 bg-primary rounded-full mr-2 group-focus-within:h-7 transition-all duration-200"></span>
                              Price (SOL)
                              <span className="ml-2 opacity-0 group-focus-within:opacity-100 transition-opacity text-xs text-success">
                                {formData.price >= 0 && !errors.price && '✓'}
                              </span>
                            </span>
                            <span className="label-text-alt text-xs text-muted-foreground">Required</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                              <IconCoin className="w-5 h-5 text-primary" />
                            </div>
                            <input
                              type="number"
                              name="price"
                              className={`input input-bordered w-full pl-12 h-12 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl
                                ${errors.price ? 'input-error' : formData.price >= 0 ? 'border-success' : ''}`}
                              value={formData.price}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              placeholder="0.5"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-sm font-medium text-muted-foreground">
                              SOL
                            </div>
                            {formData.price >= 0 && !errors.price && (
                              <div className="absolute right-16 top-1/2 -translate-y-1/2 text-success">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          {errors.price && (
                            <label className="label">
                              <span className="label-text-alt text-error flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {errors.price}
                              </span>
                            </label>
                          )}
                          <label className="label pt-0">
                            <span className="label-text-alt text-muted-foreground">Set to 0 to mint without listing for sale</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="mt-8">
                        <button 
                          type="button"
                          className="btn btn-primary w-full h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all overflow-hidden group relative rounded-xl"
                          onClick={showNFTPreview}
                        >
                          <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-0 bg-primary opacity-0 group-hover:opacity-30 group-hover:skew-x-12 group-hover:translate-x-64"></span>
                          Continue to Preview
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            
            {/* Right sidebar */}
            <div className="md:col-span-1">
              <div className="sticky top-24">
                <div className="card bg-base-100 shadow-xl mb-8">
                  <div className="card-body px-8 py-8">
                    <h3 className="card-title text-xl mb-4 flex items-center">
                      <IconCoin className="w-6 h-6 mr-3 text-primary" />
                      Media Overview
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-base">
                        <span>Listing Price:</span>
                        <span className="font-semibold">{formData.price.toFixed(2)} SOL</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span>Upload Fee:</span>
                        <span className="font-semibold">{MINT_FEE.toFixed(2)} SOL</span>
                      </div>
                      <div className="divider my-3"></div>
                      <div className="flex justify-between items-center text-xl">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold text-primary">{totalCost.toFixed(2)} SOL</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body px-8 py-8">
                    <h3 className="card-title text-xl mb-4">
                      <IconCircleCheck className="w-6 h-6 mr-3 text-primary" />
                      Tips
                    </h3>
                    <ul className="space-y-4 list-disc pl-10 ml-2 text-base text-muted-foreground">
                      <li className="pl-4">Your music and artwork are treated as a single unified entity.</li>
                      <li className="pl-4">For NFT minting, audio must be 30 seconds or less.</li>
                      <li className="pl-4">Square images (800x800px) create the best visual experience.</li>
                      <li className="pl-4">Add a detailed description to help potential listeners.</li>
                      <li className="pl-4">Set your price to 0 to share your music for free.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}