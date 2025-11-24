
import React, { useState } from 'react';
import { EvidenceRecord } from '../types';
import { dctSteganographyReveal, superDecrypt, elgamalDecrypt, base64ToBytes } from '../services/cryptoService';
import Button from './Button';
import Input from './Input';

interface Props {
    record: EvidenceRecord;
    onBack: () => void;
}

const EvidenceViewer: React.FC<Props> = ({ record, onBack }) => {
    const [extractedKey, setExtractedKey] = useState<string | null>(null);
    const [decryptedDescription, setDecryptedDescription] = useState<string | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [uploadError, setUploadError] = useState('');
    
    // File Decryption
    const [railKeyInput, setRailKeyInput] = useState('');
    const [isDecryptingFile, setIsDecryptingFile] = useState(false);

    const handleKeyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadError('');
        setIsExtracting(true);
        setDecryptedDescription(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
             const imageDataUrl = event.target?.result as string;
             try {
                 // 1. Reveal Key from Uploaded Image
                 const key = await dctSteganographyReveal(imageDataUrl);
                 if (!key || key === "No hidden message found.") {
                     throw new Error("INVALID KEY IMAGE: No data found.");
                 }
                 setExtractedKey(key);

                 // 2. Decrypt Text
                 const text = await superDecrypt(record.encrypted_description, key);
                 setDecryptedDescription(text);
             } catch (err: any) {
                 setUploadError("ACCESS DENIED: The uploaded image does not contain the correct key.");
                 setExtractedKey(null);
             } finally {
                 setIsExtracting(false);
             }
        }
        reader.readAsDataURL(file);
    };

    const handleDownloadDecryptedFile = async () => {
        if (!record.encrypted_file_b64 || !railKeyInput) return;
        setIsDecryptingFile(true);
        try {
            const encryptedBytes = base64ToBytes(record.encrypted_file_b64);
            const decryptedBytes = await elgamalDecrypt(encryptedBytes, railKeyInput);
            
            const blob = new Blob([decryptedBytes], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DECRYPTED_${record.file_name || 'Asset'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            alert("Decryption Failed: Invalid Rail Key or Corrupt Data");
        } finally {
            setIsDecryptingFile(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button onClick={onBack} className="text-xs text-muted-text hover:text-white mb-4 flex items-center gap-1">
                &lt; RETURN TO DIRECTORY
            </button>

            <div className="border border-agency-border bg-agency-gray p-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase">{record.case_title}</h1>
                    <p className="text-sm text-terminal-amber mt-1">CLASSIFICATION: {record.classification_level}</p>
                    <p className="text-xs text-muted-text mt-2 font-mono">ID: {record.id} // AGENT: {record.agent_id} // DATE: {new Date(record.created_at).toLocaleDateString()}</p>
                </div>
                <div className="w-32 h-32 border border-agency-border bg-black relative group">
                     {record.stego_image_b64 ? (
                        <>
                            <img src={record.stego_image_b64} className="w-full h-full object-cover opacity-30 grayscale" alt="Evidence" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] text-white bg-black/80 px-2 py-1 border border-white">ARCHIVED COPY</span>
                            </div>
                        </>
                     ) : (
                         <div className="flex items-center justify-center h-full text-[10px] text-gray-600">NO VISUAL</div>
                     )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Col: Intel Report */}
                <div className="bg-agency-black border border-agency-border p-6 flex flex-col">
                    <h3 className="text-white font-bold border-b border-agency-border pb-2 mb-4 flex justify-between items-center">
                        <span>INTEL REPORT</span>
                        {!decryptedDescription ? 
                            <span className="text-[10px] text-alert-red animate-pulse">LOCKED</span> : 
                            <span className="text-[10px] text-terminal-green">UNLOCKED</span>
                        }
                    </h3>

                    {!decryptedDescription ? (
                        <div className="space-y-4 flex-1 flex flex-col justify-between">
                            <p className="font-mono text-xs break-all text-gray-700 opacity-50 blur-[2px] select-none">
                                {record.encrypted_description.substring(0, 200)}...
                            </p>
                            
                            <div className="bg-agency-gray p-4 border border-agency-border">
                                <p className="text-[10px] text-terminal-amber font-bold mb-2 uppercase tracking-wider">
                                    Security Protocol: Physical Key Required
                                </p>
                                <p className="text-xs text-muted-text mb-4">
                                    Upload the "Key Carrier" image associated with this file to unlock the encrypted content.
                                </p>
                                
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        accept="image/png"
                                        onChange={handleKeyImageUpload}
                                        disabled={isExtracting}
                                        className="block w-full text-xs text-gray-400
                                          file:mr-4 file:py-2 file:px-4
                                          file:rounded-none file:border-0
                                          file:text-xs file:font-semibold
                                          file:bg-agency-black file:text-terminal-green
                                          file:border-terminal-green file:border
                                          hover:file:bg-terminal-green hover:file:text-black
                                          cursor-pointer"
                                    />
                                </div>
                                {isExtracting && <p className="text-xs text-terminal-green mt-2 animate-pulse">ANALYZING IMAGE DATA...</p>}
                                {uploadError && <p className="text-xs text-alert-red mt-2 font-bold">{uploadError}</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in flex-1">
                            <div className="bg-terminal-green/10 border-l-2 border-terminal-green p-2 mb-4">
                                <p className="text-[10px] text-terminal-green">IDENTITY VERIFIED. KEY EXTRACTED SUCCESSFULLY.</p>
                            </div>
                            <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
                                <p className="text-sm font-mono whitespace-pre-wrap text-white">
                                    {decryptedDescription}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Col: Asset */}
                <div className="bg-agency-black border border-agency-border p-6">
                    <h3 className="text-white font-bold border-b border-agency-border pb-2 mb-4">DIGITAL ASSET</h3>
                    {record.encrypted_file_b64 ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-agency-gray border border-agency-border">
                                <svg className="w-8 h-8 text-terminal-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                <div className="overflow-hidden">
                                    <p className="text-sm text-white truncate">{record.file_name}</p>
                                    <p className="text-[10px] text-alert-red">STATUS: ENCRYPTED (RAIL FENCE)</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-agency-border/50">
                                <Input 
                                    id="railInput" 
                                    label="ENTER NUMERIC PIN (RAIL OFFSET)" 
                                    type="number" 
                                    value={railKeyInput} 
                                    onChange={e => setRailKeyInput(e.target.value)} 
                                    placeholder="Enter pin..."
                                />
                                <Button onClick={handleDownloadDecryptedFile} disabled={isDecryptingFile || !railKeyInput} className="w-full mt-2">
                                    {isDecryptingFile ? 'PROCESSING...' : 'DECRYPT & DOWNLOAD'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-32 flex items-center justify-center text-xs text-muted-text border border-dashed border-agency-border">
                            NO ATTACHED ASSETS
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EvidenceViewer;
