
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { superEncrypt, elgamalEncrypt, dctSteganographyHide, bytesToBase64 } from '../services/cryptoService';
import Button from './Button';
import Input from './Input';

interface Props {
    username: string;
    onComplete: () => void;
}

const EvidenceIngestion: React.FC<Props> = ({ username, onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form Data
    const [title, setTitle] = useState('');
    const [classification, setClassification] = useState('CONFIDENTIAL');
    
    // Step 1: Text
    const [description, setDescription] = useState('');
    const [textKey, setTextKey] = useState(''); // Used for SuperEncrypt, then hidden in Stego
    
    // Step 2: File
    const [file, setFile] = useState<File | null>(null);
    const [railKey, setRailKey] = useState(''); // Numeric key for Rail Fence
    
    // Step 3: Stego
    const [coverImage, setCoverImage] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setCoverImage(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!supabase) return;
        if (!coverImage) {
            setError("Cover image required for key transport.");
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Encrypt Text Description (Super Encrypt)
            const encryptedDesc = await superEncrypt(description, textKey);

            // 2. Encrypt File (Rail Fence)
            let encryptedFileB64: string | null = null;
            if (file && railKey) {
                const buffer = await file.arrayBuffer();
                const encryptedBytes = await elgamalEncrypt(new Uint8Array(buffer), railKey);
                encryptedFileB64 = bytesToBase64(encryptedBytes);
            }

            // 3. Hide Text Key inside Cover Image (Steganography)
            // We hide the 'textKey' so the receiver can unlock the description if they have the image.
            const stegoImageB64 = await dctSteganographyHide(coverImage, textKey);

            // 4. Upload to Supabase
            // Note: We still store the stego image in DB as an "Archive Copy", 
            // but the user workflow requires them to have the downloaded file to unlock it manually.
            const { error: dbError } = await supabase.from('evidence_archives').insert({
                agent_id: username,
                case_title: title,
                classification_level: classification,
                encrypted_description: encryptedDesc,
                encrypted_file_b64: encryptedFileB64,
                file_name: file?.name || null,
                file_rail_key_hint: railKey ? `Rail Fence Offset: ${railKey.length}` : null,
                stego_image_b64: stegoImageB64
            });

            if (dbError) throw dbError;

            // 5. AUTO-DOWNLOAD THE KEY IMAGE
            const link = document.createElement('a');
            link.href = stegoImageB64;
            link.download = `KEY_CARRIER_${title.replace(/\s+/g, '_')}_SECURE.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            onComplete();
        } catch (err: any) {
            setError(err.message || 'INGESTION FAILURE');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <header className="mb-8">
                <h2 className="text-2xl text-white font-bold">SUBMIT EVIDENCE PACKAGE</h2>
                <div className="flex items-center gap-2 mt-2">
                    <div className={`h-1 flex-1 ${step >= 1 ? 'bg-terminal-green' : 'bg-agency-border'}`}></div>
                    <div className={`h-1 flex-1 ${step >= 2 ? 'bg-terminal-green' : 'bg-agency-border'}`}></div>
                    <div className={`h-1 flex-1 ${step >= 3 ? 'bg-terminal-green' : 'bg-agency-border'}`}></div>
                </div>
                <p className="text-xs text-muted-text mt-2 text-right">STEP {step} OF 3</p>
            </header>

            {error && <div className="bg-red-900/20 text-alert-red border border-alert-red p-4 mb-6 text-sm font-mono">{error}</div>}

            <div className="bg-agency-gray border border-agency-border p-8 shadow-2xl relative">
                {/* Step 1: Basic Info & Intel */}
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-lg text-white font-bold border-b border-agency-border pb-2">CASE INTELLIGENCE</h3>
                        <Input id="title" label="CASE OPERATION TITLE" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. PROJECT NIGHTFALL" className="uppercase" />
                        
                        <div>
                            <label className="block text-sm font-medium text-muted-text mb-1">CLASSIFICATION LEVEL</label>
                            <select value={classification} onChange={e => setClassification(e.target.value)} className="w-full bg-agency-black border border-agency-border text-white px-3 py-2 focus:outline-none focus:border-terminal-green">
                                <option>CONFIDENTIAL</option>
                                <option>SECRET</option>
                                <option>TOP SECRET</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-text mb-1">INTEL REPORT (PLAINTEXT)</label>
                            <textarea 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full h-32 bg-agency-black border border-agency-border text-white p-2 focus:border-terminal-green font-mono text-sm"
                                placeholder="Enter sensitive findings..."
                            />
                        </div>

                        <Input 
                            id="textKey" 
                            label="REPORT ENCRYPTION KEY (PASSPHRASE)" 
                            type="password" 
                            value={textKey} 
                            onChange={e => setTextKey(e.target.value)} 
                            placeholder="This key will be hidden in the cover image later."
                        />

                        <div className="flex justify-end pt-4">
                            <Button onClick={() => { if(title && description && textKey) setStep(2) }} disabled={!title || !description || !textKey}>PROCEED TO ASSET UPLOAD</Button>
                        </div>
                    </div>
                )}

                {/* Step 2: File Asset */}
                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-lg text-white font-bold border-b border-agency-border pb-2">DIGITAL ASSET ATTACHMENT</h3>
                        
                        <div className="p-8 border-2 border-dashed border-agency-border text-center hover:border-terminal-green transition-colors cursor-pointer relative">
                            <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                            {file ? (
                                <p className="text-terminal-green font-bold">{file.name}</p>
                            ) : (
                                <p className="text-muted-text text-sm">DROP CLASSIFIED DOCUMENT HERE</p>
                            )}
                        </div>

                        {file && (
                            <Input 
                                id="railKey" 
                                label="RAIL FENCE CIPHER OFFSET (NUMERIC PIN)" 
                                type="number" 
                                value={railKey} 
                                onChange={e => setRailKey(e.target.value)} 
                                placeholder="e.g. 3, 5, 12"
                            />
                        )}
                        
                        <div className="flex justify-between pt-4">
                            <Button variant="secondary" onClick={() => setStep(1)}>BACK</Button>
                            <Button onClick={() => setStep(3)}>PROCEED TO STEGANOGRAPHY</Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Steganography & Finalize */}
                {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-lg text-white font-bold border-b border-agency-border pb-2">COVERT TRANSPORT LAYER</h3>
                        <p className="text-xs text-muted-text">
                            Upload a harmless "Cover Image". The system will embed your 
                            <span className="text-white"> Report Encryption Key</span> inside this image's pixels. 
                        </p>
                        <div className="p-3 bg-terminal-green/10 border border-terminal-green text-xs text-terminal-green font-bold">
                            IMPORTANT: UPON SUBMISSION, THE KEY-IMAGE WILL AUTOMATICALLY DOWNLOAD. YOU MUST KEEP THIS FILE TO UNLOCK THE RECORD LATER.
                        </div>

                        <div className="flex gap-4 items-start">
                             <div className="flex-1">
                                <label className="block text-sm font-medium text-muted-text mb-1">COVER IMAGE (PNG/JPG)</label>
                                <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-agency-black file:text-white hover:file:bg-gray-900"/>
                            </div>
                            {coverImage && (
                                <div className="w-24 h-24 border border-agency-border overflow-hidden bg-black">
                                    <img src={coverImage} alt="Cover" className="w-full h-full object-cover opacity-80" />
                                </div>
                            )}
                        </div>

                        <div className="bg-agency-black p-4 border border-agency-border mt-4">
                            <h4 className="text-white text-xs font-bold mb-2">SUMMARY OF OPERATIONS:</h4>
                            <ul className="text-xs text-muted-text space-y-1 font-mono">
                                <li>1. CASE TITLE: <span className="text-white">{title}</span></li>
                                <li>2. INTEL: <span className="text-terminal-green">ENCRYPTING WITH SUPER-CIPHER...</span></li>
                                <li>3. FILE: {file ? <span className="text-terminal-green">ENCRYPTING WITH RAIL FENCE ({railKey})</span> : <span className="text-gray-600">NONE</span>}</li>
                                <li>4. KEY TRANSFER: <span className="text-terminal-green">EMBEDDING KEY INTO IMAGE...</span></li>
                            </ul>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="secondary" onClick={() => setStep(2)}>BACK</Button>
                            <Button onClick={handleSubmit} disabled={loading || !coverImage}>
                                {loading ? 'ENCRYPTING & GENERATING KEY...' : 'FINALIZE & DOWNLOAD KEY'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EvidenceIngestion;
