import React, { useState, useEffect, useCallback } from 'react';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import { supabase } from '../services/supabaseClient';
import { serpentMockEncrypt, serpentMockDecrypt } from '../services/cryptoService';

interface VaultItem {
    id: number;
    title: string;
    data_type: 'text' | 'image';
    encrypted_content: string;
}

interface DataVaultProps {
    username: string;
}

const DataVault: React.FC<DataVaultProps> = ({ username }) => {
    const [items, setItems] = useState<VaultItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // State for new item form
    const [title, setTitle] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [dataType, setDataType] = useState<'text' | 'image'>('text');
    const [textContent, setTextContent] = useState('');
    const [fileContent, setFileContent] = useState<string | null>(null);
    
    // State for decryption
    const [decryptionKey, setDecryptionKey] = useState('');
    const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
    const [showModal, setShowModal] = useState(false);


    const fetchItems = useCallback(async () => {
        if (!supabase) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('vault_items')
            .select('*')
            .eq('username', username)
            .order('created_at', { ascending: false });

        if (error) {
            setError(error.message);
        } else {
            setItems(data as VaultItem[]);
        }
        setIsLoading(false);
    }, [username]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);
    
    const clearMessages = () => {
        setError('');
        setSuccess('');
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setFileContent(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        clearMessages();
        if (!title || !secretKey || (dataType === 'text' && !textContent) || (dataType === 'image' && !fileContent)) {
            setError('Please fill all fields: Title, Secret Key, and Content.');
            return;
        }
        if (!supabase) {
            setError('Supabase is not configured.');
            return;
        }
        
        setIsLoading(true);

        try {
            const contentToEncrypt = dataType === 'text' ? textContent : fileContent!;
            const encrypted_content = serpentMockEncrypt(contentToEncrypt, secretKey);

            const { error: insertError } = await supabase.from('vault_items').insert({
                username,
                title,
                data_type: dataType,
                encrypted_content,
            });

            if (insertError) throw insertError;

            // Reset form and refetch
            setTitle('');
            setSecretKey('');
            setTextContent('');
            setFileContent(null);
            if (dataType === 'image') {
                const fileInput = document.getElementById('vault-file-input') as HTMLInputElement;
                if (fileInput) {
                    fileInput.value = '';
                }
            }
            setSuccess('Item successfully encrypted and saved to the vault!');
            fetchItems();
        } catch (err: any) {
            setError(err.message || 'An error occurred while saving.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (itemId: number) => {
        if (!supabase || !window.confirm('Are you sure you want to permanently delete this item?')) return;
        setIsLoading(true);
        const { error: deleteError } = await supabase.from('vault_items').delete().eq('id', itemId);
        if (deleteError) {
            setError(deleteError.message);
        } else {
            setSuccess('Item deleted.');
            fetchItems();
        }
        setIsLoading(false);
    };

    const handleDecrypt = () => {
        clearMessages();
        if (!selectedItem || !decryptionKey) {
            setError('Please provide the secret key to decrypt.');
            return;
        }
        try {
            const decrypted = serpentMockDecrypt(selectedItem.encrypted_content, decryptionKey);
             // A simple check to see if decryption likely failed
            if (decrypted === selectedItem.encrypted_content) {
                throw new Error("Decryption failed. The key is likely incorrect.");
            }
            setDecryptedContent(decrypted);
            setShowModal(true);
        } catch (err: any) {
             setError(err.message || "Decryption failed. The key might be wrong or the data is corrupted.");
        }
    }

    const closeModal = () => {
        setShowModal(false);
        setSelectedItem(null);
        setDecryptionKey('');
        setDecryptedContent(null);
    }
    
    return (
        <Card title="Data Vault" description="Encrypt text or images with a key and save them securely to the database.">
             <div className="p-6 space-y-6">
                {/* --- Add New Item Form --- */}
                <div className="p-4 border border-border-color rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 text-white">Add New Item to Vault</h3>
                     <div className="space-y-4">
                        <Input id="vault-title" label="Title" placeholder="e.g., My Secret Note" value={title} onChange={e => setTitle(e.target.value)} />
                        <Input id="vault-key" label="Secret Key" type="password" placeholder="This key is NOT saved" value={secretKey} onChange={e => setSecretKey(e.target.value)} />
                        
                        <div className="flex items-center space-x-4">
                             <label className="text-sm font-medium text-text-secondary">Content Type:</label>
                             <div className="flex items-center space-x-2">
                                <input type="radio" id="type-text" name="dataType" value="text" checked={dataType === 'text'} onChange={() => setDataType('text')} className="form-radio h-4 w-4 text-accent bg-secondary border-border-color focus:ring-accent"/>
                                <label htmlFor="type-text">Text</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                 <input type="radio" id="type-image" name="dataType" value="image" checked={dataType === 'image'} onChange={() => setDataType('image')} className="form-radio h-4 w-4 text-accent bg-secondary border-border-color focus:ring-accent"/>
                                <label htmlFor="type-image">Image</label>
                            </div>
                        </div>

                        {dataType === 'text' ? (
                             <textarea value={textContent} onChange={e => setTextContent(e.target.value)} placeholder="Enter your secret text here" className="w-full h-24 p-2 bg-primary border border-border-color rounded-md focus:ring-accent focus:border-accent" />
                        ) : (
                            <Input id="vault-file-input" type="file" accept="image/*" onChange={handleFileChange} />
                        )}
                        <Button onClick={handleSave} disabled={isLoading}>{isLoading ? 'Saving...' : 'Encrypt & Save to Vault'}</Button>
                     </div>
                </div>

                {/* --- Messages --- */}
                {error && <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md">{error}</p>}
                {success && <p className="text-green-400 text-sm bg-green-900/20 p-3 rounded-md">{success}</p>}

                {/* --- Vault Items List --- */}
                <div>
                     <h3 className="font-semibold text-lg mb-3 text-white">My Vault Items</h3>
                     {isLoading && !items.length && <p className="text-text-secondary">Loading vault...</p>}
                     {!isLoading && !items.length && <p className="text-text-secondary">Your vault is empty. Add an item above to get started.</p>}
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map(item => (
                            <div key={item.id} className="bg-primary p-4 rounded-lg border border-border-color space-y-3 flex flex-col justify-between">
                               <div>
                                   <div className="flex items-start justify-between">
                                       <h4 className="font-bold text-text-primary break-all">{item.title}</h4>
                                       <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full capitalize">{item.data_type}</span>
                                   </div>
                               </div>

                                {selectedItem?.id === item.id ? (
                                    <div className="space-y-2">
                                        <Input id={`decrypt-key-${item.id}`} type="password" placeholder="Enter Secret Key" value={decryptionKey} onChange={e => setDecryptionKey(e.target.value)} />
                                        <div className="flex gap-2">
                                            <Button onClick={handleDecrypt} className="w-full">Decrypt</Button>
                                            <Button onClick={() => setSelectedItem(null)} variant="secondary" className="w-full">Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button onClick={() => setSelectedItem(item)} className="w-full">View</Button>
                                        <Button onClick={() => handleDelete(item.id)} variant="secondary" className="w-full !bg-red-900/50 !border-red-500/30 hover:!bg-red-900/80 text-red-300">Delete</Button>
                                    </div>
                                )}
                            </div>
                        ))}
                     </div>
                </div>

                {/* --- Decryption Modal --- */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={closeModal}>
                        <div className="bg-secondary rounded-lg border border-border-color shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-border-color flex justify-between items-center">
                               <h3 className="font-bold text-lg text-white">{selectedItem?.title}</h3>
                               <button onClick={closeModal} className="text-text-secondary hover:text-white">&times;</button>
                            </div>
                            <div className="p-4">
                                {decryptedContent && selectedItem?.data_type === 'text' && (
                                    <p className="whitespace-pre-wrap break-words text-text-primary">{decryptedContent}</p>
                                )}
                                {decryptedContent && selectedItem?.data_type === 'image' && (
                                     <img src={decryptedContent} alt="Decrypted content" className="max-w-full h-auto rounded-md" />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default DataVault;