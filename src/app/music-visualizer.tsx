'use client';

import React, { useEffect, useRef } from 'react';

export default function MusicCharacter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let rafId: number;
    const canvas = canvasRef.current;
    
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);
    
    // Animation parameters
    let time = 0;
    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;
    
    // Track mouse for 3D perspective
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    const animate = () => {
      time += 0.01;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 3D perspective based on mouse position
      const perspectiveX = (mouseX - canvas.width / 2) / canvas.width * 20;
      const perspectiveY = (mouseY - canvas.height / 2) / canvas.height * 10;
      
      // Draw multiple music elements with 3D effects
      drawMusicVisualization(ctx, time, perspectiveX, perspectiveY, canvas.width, canvas.height);
      
      // Request next frame
      rafId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);
  
  const drawMusicVisualization = (
    ctx: CanvasRenderingContext2D, 
    time: number, 
    perspectiveX: number, 
    perspectiveY: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Center point for the visualization
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // Draw the main vinyl record
    drawVinyl(ctx, centerX, centerY, time, perspectiveX, perspectiveY);
    
    // Draw floating music notes
    drawMusicNotes(ctx, time, centerX, centerY, perspectiveX, perspectiveY);
    
    // Draw audio waves
    drawAudioWaves(ctx, time, centerX, centerY, canvasWidth, perspectiveX);
    
    // Draw 3D speaker
    drawSpeaker(ctx, centerX - 300 + perspectiveX * 10, centerY + 50 - perspectiveY * 5, time, perspectiveX, perspectiveY);
    
    // Draw 3D speaker on the other side
    drawSpeaker(ctx, centerX + 300 - perspectiveX * 10, centerY + 50 - perspectiveY * 5, time, -perspectiveX, perspectiveY);
    
    // Draw holographic NFT frame
    drawNFTFrame(ctx, centerX, centerY - 100, time, perspectiveX, perspectiveY);
  };
  
  const drawVinyl = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    time: number, 
    perspectiveX: number, 
    perspectiveY: number
  ) => {
    const rotation = time * 0.2; // Steady rotation
    const scale = 1 + Math.sin(time * 0.5) * 0.03; // Pulsing effect
    
    // Apply 3D perspective
    ctx.save();
    ctx.translate(x, y);
    
    // Create 3D perspective effect
    ctx.transform(
      1, perspectiveY * 0.01,
      perspectiveX * -0.01, 1,
      0, 0
    );
    
    // Apply scale and rotation
    ctx.scale(scale, scale * (0.85 - perspectiveY * 0.01));
    ctx.rotate(rotation);
    
    // Draw vinyl record
    const radius = 150;
    
    // Outer edge shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = perspectiveX * 0.5;
    ctx.shadowOffsetY = perspectiveY * 0.5;
    
    // Vinyl base
    const vinylGradient = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
    vinylGradient.addColorStop(0, '#333');
    vinylGradient.addColorStop(0.6, '#111');
    vinylGradient.addColorStop(1, '#000');
    
    ctx.fillStyle = vinylGradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Vinyl grooves
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.6)';
    ctx.lineWidth = 0.5;
    
    for (let i = 10; i < radius; i += 5) {
      ctx.beginPath();
      ctx.arc(0, 0, i, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Vinyl label in the center
    const labelRadius = radius * 0.25;
    const labelGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, labelRadius);
    labelGradient.addColorStop(0, '#9333ea');
    labelGradient.addColorStop(0.7, '#7e22ce');
    labelGradient.addColorStop(1, '#6b21a8');
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = labelGradient;
    ctx.beginPath();
    ctx.arc(0, 0, labelRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add label shine based on perspective
    const shineOpacity = 0.2 + Math.max(0, perspectiveX * 0.01);
    ctx.fillStyle = `rgba(255, 255, 255, ${shineOpacity})`;
    ctx.beginPath();
    ctx.ellipse(
      -5 + perspectiveX * 0.1, 
      -5 + perspectiveY * 0.1, 
      labelRadius * 0.6, 
      labelRadius * 0.3, 
      Math.PI / 4, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Add center hole
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw "SOLANA MUSIC NFT" text in a circle
    ctx.font = '10px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const textX = Math.cos(angle) * (labelRadius * 0.7);
      const textY = Math.sin(angle) * (labelRadius * 0.7);
      const charIndex = i % 16;
      const chars = "SOLANA MUSIC NFT";
      
      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillText(chars[charIndex], 0, 0);
      ctx.restore();
    }
    
    ctx.restore();
  };
  
  const drawMusicNotes = (
    ctx: CanvasRenderingContext2D, 
    time: number, 
    centerX: number, 
    centerY: number,
    perspectiveX: number,
    perspectiveY: number
  ) => {
    const noteSymbols = ['♪', '♫', '♩', '♬'];
    const noteColors = [
      'rgba(168, 85, 247, 0.9)',
      'rgba(255, 255, 255, 0.8)',
      'rgba(192, 132, 252, 0.85)',
      'rgba(216, 180, 254, 0.8)'
    ];
    
    // Create multiple notes in a circular pattern
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + time * 0.3;
      const distance = 250 + Math.sin(time * 0.5 + i) * 50;
      const noteTime = (time * 0.5 + i * 0.25) % 4;
      const opacity = Math.max(0, Math.min(1, 2 - noteTime * 0.5));
      
      if (opacity > 0.1) {
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance * 0.6;
        
        // Z-coordinate for 3D effect (further notes are smaller)
        const z = Math.sin(time + i) * 0.5 + 0.5;
        const size = 30 + z * 20;
        const adjustedX = x + perspectiveX * z * 15;
        const adjustedY = y + perspectiveY * z * 10;
        
        ctx.save();
        
        // Apply 3D transformations
        ctx.translate(adjustedX, adjustedY);
        ctx.rotate(time * 0.2 + i * 0.5);
        ctx.scale(1 + perspectiveX * 0.01, 1 + perspectiveY * 0.01);
        
        // Add glow effect
        ctx.shadowColor = noteColors[i % noteColors.length];
        ctx.shadowBlur = 15 * z;
        
        // Draw the note
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(noteSymbols[i % noteSymbols.length], 0, 0);
        
        // Add color overlay
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = noteColors[i % noteColors.length];
        ctx.fillText(noteSymbols[i % noteSymbols.length], 0, 0);
        
        ctx.restore();
      }
    }
  };
  
  const drawAudioWaves = (
    ctx: CanvasRenderingContext2D, 
    time: number, 
    centerX: number, 
    centerY: number,
    canvasWidth: number,
    perspectiveX: number
  ) => {
    ctx.save();
    
    // Apply 3D transform
    const waveY = centerY + 180;
    ctx.translate(centerX, waveY);
    ctx.scale(1 + perspectiveX * 0.002, 1);
    
    // Create wave gradient
    const waveGradient = ctx.createLinearGradient(0, -50, 0, 50);
    waveGradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)');
    waveGradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.9)');
    waveGradient.addColorStop(1, 'rgba(126, 34, 206, 0.7)');
    
    ctx.strokeStyle = waveGradient;
    ctx.lineWidth = 2;
    
    // Draw audio wave visualization
    const waveWidth = canvasWidth * 0.5;
    
    ctx.beginPath();
    
    // Create a complex audio waveform
    for (let x = -waveWidth / 2; x < waveWidth / 2; x += 5) {
      // Create multiple wave components for a more realistic audio wave
      const wave1 = Math.sin(x * 0.01 + time * 2) * 15;
      const wave2 = Math.sin(x * 0.02 - time * 3) * 10;
      const wave3 = Math.sin(x * 0.005 + time) * 20;
      
      // Combine waves and add some randomness for authenticity
      const y = wave1 + wave2 + wave3 * Math.sin(time + x * 0.01);
      
      if (x === -waveWidth / 2) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Add glow effect
    ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    
    ctx.restore();
  };
  
  const drawSpeaker = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    time: number, 
    perspectiveX: number, 
    perspectiveY: number
  ) => {
    ctx.save();
    
    // Apply 3D transforms
    ctx.translate(x, y);
    
    // Create skew transform for 3D perspective
    ctx.transform(
      1, perspectiveY * 0.02,
      perspectiveX * 0.02, 1,
      0, 0
    );
    
    // Calculate scale for breathing effect (like it's pumping with the sound)
    const bassImpact = Math.sin(time * 4) * Math.sin(time * 0.5) * 0.05;
    const scale = 1 + bassImpact;
    ctx.scale(scale, scale);
    
    // Draw speaker box
    const width = 100;
    const height = 150;
    
    // Speaker shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = perspectiveX;
    ctx.shadowOffsetY = perspectiveY;
    
    // Speaker body
    const speakerGradient = ctx.createLinearGradient(
      -width/2, -height/2, 
      width/2, height/2
    );
    speakerGradient.addColorStop(0, '#333');
    speakerGradient.addColorStop(0.5, '#222');
    speakerGradient.addColorStop(1, '#111');
    
    ctx.fillStyle = speakerGradient;
    
    // Draw 3D box with perspective
    ctx.beginPath();
    ctx.roundRect(-width/2, -height/2, width, height, 5);
    ctx.fill();
    
    // Speaker edge highlight
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add speaker membrane effect
    ctx.shadowBlur = 0;
    
    // Main speaker cone
    const coneGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 35);
    coneGradient.addColorStop(0, '#555');
    coneGradient.addColorStop(0.7, '#333');
    coneGradient.addColorStop(1, '#222');
    
    // Cone vibrates with bass
    const vibrationX = Math.sin(time * 5) * 2 * Math.abs(bassImpact) * 20;
    const vibrationY = Math.cos(time * 5) * 2 * Math.abs(bassImpact) * 20;
    
    ctx.fillStyle = coneGradient;
    ctx.beginPath();
    ctx.ellipse(
      0 + vibrationX * 0.2, 
      -20 + vibrationY * 0.2, 
      35 * (1 + bassImpact), 
      35 * (1 - bassImpact), 
      0, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Speaker rim
    ctx.strokeStyle = 'rgba(30, 30, 30, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Speaker cone center
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(0 + vibrationX * 0.3, -20 + vibrationY * 0.3, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Secondary bass speaker
    ctx.fillStyle = coneGradient;
    ctx.beginPath();
    ctx.ellipse(
      0 + vibrationX * 0.1, 
      40 + vibrationY * 0.1, 
      25 * (1 + bassImpact * 1.5), 
      25 * (1 - bassImpact * 1.5), 
      0, 0, Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();
    
    // Secondary cone center
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(0 + vibrationX * 0.2, 40 + vibrationY * 0.2, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Add purple glow for active state
    if (time % 1 < 0.5) {
      ctx.fillStyle = 'rgba(168, 85, 247, 0.1)';
      ctx.beginPath();
      ctx.roundRect(-width/2 - 5, -height/2 - 5, width + 10, height + 10, 10);
      ctx.fill();
    }
    
    ctx.restore();
  };
  
  const drawNFTFrame = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    time: number, 
    perspectiveX: number, 
    perspectiveY: number
  ) => {
    ctx.save();
    
    // Apply 3D transformations
    ctx.translate(x, y);
    
    // Create perspective effect
    ctx.transform(
      1 + perspectiveX * 0.001, perspectiveY * 0.01,
      perspectiveX * -0.01, 1 - perspectiveY * 0.001,
      0, 0
    );
    
    // Floating animation
    const floatY = Math.sin(time * 0.7) * 10;
    ctx.translate(0, floatY);
    
    const width = 200;
    const height = 200;
    
    // Draw holographic frame with glow effect
    ctx.shadowColor = 'rgba(168, 85, 247, 0.7)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Create animated gradient
    const gradientAngle = time * 0.5;
    const gradientX1 = Math.cos(gradientAngle) * width;
    const gradientY1 = Math.sin(gradientAngle) * height;
    
    const frameGradient = ctx.createLinearGradient(
      -width/2 + gradientX1/2, -height/2 + gradientY1/2,
      width/2 - gradientX1/2, height/2 - gradientY1/2
    );
    
    // Holographic color effect
    frameGradient.addColorStop(0, 'rgba(139, 92, 246, 0.7)');
    frameGradient.addColorStop(0.2, 'rgba(168, 85, 247, 0.7)');
    frameGradient.addColorStop(0.4, 'rgba(192, 132, 252, 0.7)');
    frameGradient.addColorStop(0.6, 'rgba(139, 92, 246, 0.7)');
    frameGradient.addColorStop(0.8, 'rgba(168, 85, 247, 0.7)');
    frameGradient.addColorStop(1, 'rgba(192, 132, 252, 0.7)');
    
    ctx.strokeStyle = frameGradient;
    ctx.lineWidth = 5;
    
    // Draw frame with rounded corners
    ctx.beginPath();
    ctx.roundRect(-width/2, -height/2, width, height, 10);
    ctx.stroke();
    
    // Add holographic scanning effect
    const scanLine = (time * 100) % (height * 2) - height;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.rect(-width/2, -height/2 + scanLine, width, 10);
    ctx.fill();
    
    // Draw music NFT inside frame
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.roundRect(-width/2 + 10, -height/2 + 10, width - 20, height - 20, 5);
    ctx.fill();
    
    // Draw stylized music note logo
    ctx.save();
    const noteScale = 1 + Math.sin(time * 2) * 0.05;
    ctx.scale(noteScale, noteScale);
    
    // Note stem
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.9)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.lineTo(0, 20);
    ctx.stroke();
    
    // Note head
    const noteGradient = ctx.createRadialGradient(0, 20, 0, 0, 20, 25);
    noteGradient.addColorStop(0, 'rgba(168, 85, 247, 0.9)');
    noteGradient.addColorStop(0.7, 'rgba(139, 92, 246, 0.9)');
    noteGradient.addColorStop(1, 'rgba(126, 34, 206, 0.9)');
    
    ctx.fillStyle = noteGradient;
    ctx.beginPath();
    ctx.ellipse(0, 20, 20, 15, Math.PI/4, 0, Math.PI * 2);
    ctx.fill();
    
    // Add glow
    ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
    ctx.shadowBlur = 15;
    ctx.stroke();
    
    ctx.restore();
    
    // Draw verification badge / Solana logo
    ctx.save();
    ctx.translate(width/2 - 30, -height/2 + 30);
    
    // Badge background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Simplified Solana logo (three lines)
    ctx.strokeStyle = '#14F195';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;
    
    // First line
    ctx.beginPath();
    ctx.moveTo(-8, -3);
    ctx.lineTo(8, -3);
    ctx.stroke();
    
    // Second line
    ctx.beginPath();
    ctx.moveTo(-8, 1);
    ctx.lineTo(8, 1);
    ctx.stroke();
    
    // Third line
    ctx.beginPath();
    ctx.moveTo(-8, 5);
    ctx.lineTo(8, 5);
    ctx.stroke();
    
    ctx.restore();
    
    // Add "VERIFIED NFT" text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('VERIFIED NFT', 0, height/2 - 15);
    
    // Add value text that pulses
    const pulseOpacity = 0.6 + Math.sin(time * 3) * 0.2;
    ctx.fillStyle = `rgba(214, 188, 250, ${pulseOpacity})`;
    ctx.font = 'bold 20px Arial';
    ctx.fillText('100 SOL', 0, height/2 - 35);
    
    ctx.restore();
  };
  
  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      <style jsx>{`
        canvas {
          width: 100%;
          height: 100%;
          opacity: 0.9;
        }
      `}</style>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
} 