import React, { useState, useCallback } from 'react';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import { elgamalMockEncrypt, elgamalMockDecrypt } from '../services/cryptoService';

const FileEncryption: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [key, setKey] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setFeedback(`File selected: ${e.target.files[0].name}`);
        }
    };

    const processFile = useCallback((operation: 'encrypt' | 'decrypt') => {
        if (!file) {
            setFeedback('Please select a file first.');
            return;
        }
        if (!key) {
            setFeedback('Please provide an encryption key.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            if (!arrayBuffer) {
                setFeedback('Could not read file content.');
                return;
            }
            
            const contentBytes = new Uint8Array(arrayBuffer);
            const isEncrypt = operation === 'encrypt';
            
            if (!isEncrypt && !file.name.toLowerCase().endsWith('.elgamal')) {
                 setFeedback('Error: This does not appear to be an ElGamal encrypted file. Decryption aborted.');
                 return;
            }

            const resultBytes = isEncrypt ? elgamalMockEncrypt(contentBytes, key) : elgamalMockDecrypt(contentBytes, key);

            const blob = new Blob([resultBytes], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            const downloadName = isEncrypt
                ? `${file.name}.elgamal`
                : file.name.toLowerCase().endsWith('.elgamal')
                    ? file.name.slice(0, -'.elgamal'.length)
                    : `decrypted_${file.name}`;
            a.download = downloadName;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setFeedback(`File successfully ${operation}ed and downloaded as ${downloadName}.`);
        };
        reader.onerror = () => {
            setFeedback('Failed to read file.');
        };
        reader.readAsArrayBuffer(file);
    }, [file, key]);

    return (
        <Card title="File Obfuscation" description="Disguise and secure any file using a simulated ElGamal implementation. Ideal for securing files before transmission.">
            <div className="p-6 space-y-4">
                <div>
                    <label htmlFor="file-upload" className="block text-sm font-medium text-text-secondary mb-2">Select a Document</label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border-color border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-border-color">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            </div>
                            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div> 
                </div>

                <Input
                    id="elgamal-key"
                    label="Encryption Key"
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Enter your secret key"
                    required
                />

                {feedback && <p className="text-sm text-accent break-words">{feedback}</p>}

                <div className="flex flex-wrap gap-4">
                    <Button onClick={() => processFile('encrypt')} disabled={!file}>Encrypt Document</Button>
                    <Button onClick={() => processFile('decrypt')} disabled={!file} variant="secondary">Decrypt Document</Button>
                </div>
            </div>
        </Card>
    );
};

export default FileEncryption;