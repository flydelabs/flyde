"use client";

import React, { useState, useCallback } from 'react';
import { Check, Copy, Twitter, Facebook, Linkedin, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@flyde/editor';
import { Button } from '@flyde/editor';
import { Input } from '@flyde/editor';
import { Label } from '@flyde/editor';
import { Textarea } from '@flyde/editor';

interface SaveFlowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
  defaultName: string;
  defaultDescription: string;
  newFlowSlug?: string;
  showSuccess?: boolean;
  onCloseSuccess: () => void;
}

export const SaveFlowDialog: React.FC<SaveFlowDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultName,
  defaultDescription,
  newFlowSlug,
  showSuccess = false,
  onCloseSuccess
}) => {
  const [saveName, setSaveName] = useState(defaultName);
  const [saveDescription, setSaveDescription] = useState(defaultDescription);
  const [isSaving, setIsSaving] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen && !showSuccess) {
      setSaveName(defaultName);
      setSaveDescription(defaultDescription);
    }
  }, [isOpen, showSuccess, defaultName, defaultDescription]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(saveName, saveDescription);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, saveName, saveDescription]);

  const handleCopyUrl = useCallback(async () => {
    if (!newFlowSlug) return;
    const url = `${window.location.origin}/playground/${newFlowSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [newFlowSlug]);

  const handleShareTwitter = useCallback(() => {
    if (!newFlowSlug) return;
    const url = `${window.location.origin}/playground/${newFlowSlug}`;
    const text = `Check out my visual flow: ${saveName}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=flyde,visualprogramming`;
    window.open(twitterUrl, '_blank');
  }, [newFlowSlug, saveName]);

  const handleShareFacebook = useCallback(() => {
    if (!newFlowSlug) return;
    const url = `${window.location.origin}/playground/${newFlowSlug}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank');
  }, [newFlowSlug]);

  const handleShareLinkedIn = useCallback(() => {
    if (!newFlowSlug) return;
    const url = `${window.location.origin}/playground/${newFlowSlug}`;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank');
  }, [newFlowSlug]);

  if (showSuccess && newFlowSlug) {
    return (
      <Dialog open={isOpen} onOpenChange={onCloseSuccess}>
        <DialogContent className="sm:max-w-md bg-[#2d2d30] border-[#3c3c3c] text-white">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <DialogTitle>Flow Saved Successfully!</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Your flow is now live and ready to share
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white">Your shareable URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={`${window.location.origin}/playground/${newFlowSlug}`}
                  readOnly
                  className="bg-[#1e1e1e] border-[#3c3c3c] text-white flex-1"
                />
                <Button
                  onClick={handleCopyUrl}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-[#3c3c3c] text-white hover:bg-[#3c3c3c] px-3"
                >
                  {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                URL: /playground/{newFlowSlug}
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-white">Share on social media</Label>
              <div className="flex gap-2">
                <Button
                  onClick={handleShareTwitter}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-[#3c3c3c] text-white hover:bg-[#1d9bf0]/20 hover:border-[#1d9bf0] flex items-center gap-2"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </Button>
                <Button
                  onClick={handleShareFacebook}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-[#3c3c3c] text-white hover:bg-[#1877f2]/20 hover:border-[#1877f2] flex items-center gap-2"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </Button>
                <Button
                  onClick={handleShareLinkedIn}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-[#3c3c3c] text-white hover:bg-[#0a66c2]/20 hover:border-[#0a66c2] flex items-center gap-2"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={onCloseSuccess}
              className="bg-[#0e639c] hover:bg-[#1177bb] text-white w-full"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen && !showSuccess} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#2d2d30] border-[#3c3c3c] text-white">
        <DialogHeader>
          <DialogTitle>Save Your Flow</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a shareable URL for your customized playground. This will save your current state and generate a unique link.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
            <div className="text-xs text-blue-300">
              Flows are public and should not contain any sensitive information.
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="save-name" className="text-white">Name</Label>
            <Input
              id="save-name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter a name for your playground"
              className="bg-[#1e1e1e] border-[#3c3c3c] text-white placeholder:text-gray-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="save-description" className="text-white">Description</Label>
            <Textarea
              id="save-description"
              value={saveDescription}
              onChange={(e) => setSaveDescription(e.target.value)}
              placeholder="Describe what makes this playground special..."
              className="bg-[#1e1e1e] border-[#3c3c3c] text-white placeholder:text-gray-500 min-h-[80px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-transparent border-[#3c3c3c] text-white hover:bg-[#3c3c3c]"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-[#0e639c] hover:bg-[#1177bb] text-white"
            disabled={isSaving || !saveName.trim()}
          >
            {isSaving ? 'Saving...' : 'Create Shareable URL'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};