
// --- IMPORTANT ---
// These functions are for educational and demonstration purposes only.
// The mock functions are NOT cryptographically secure and should NOT be used in production.
// The implementations are functional demonstrations but lack production-grade features.

/**
 * MOCK Scrypt: Simulates a Scrypt key derivation function.
 * In a real app, use a library like 'scrypt-js'.
 * @param password The user's password.
 * @param salt A random salt.
 * @returns A deterministic "hash" of the password and salt.
 */
export const scryptMock = async (password: string, salt: string): Promise<string> => {
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-384', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Atbash Cipher: A simple substitution cipher where letters are reversed.
 * @param text The text to encrypt/decrypt.
 * @returns The transformed text.
 */
export const atbashCipher = (text: string): string => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const reversed = 'ZYXWVUTSRQPONMLKJIHGFEDCBAzyxwvutsrqponmlkjihgfedcba';
    return text.split('').map(char => {
        const index = alphabet.indexOf(char);
        return index !== -1 ? reversed[index] : char;
    }).join('');
};

/**
 * MOCK Serpent Encryption: Replaced with Vigenère Cipher.
 * This is a simple byte-wise Vigenère cipher for demonstration.
 * @param text The text to encrypt.
 * @param key The secret key (keyword).
 * @returns The encrypted text as a hex string.
 */
export const serpentMockEncrypt = async (text: string, key: string): Promise<string> => {
    if (!key) return text;
    let hexOutput = '';
    for (let i = 0; i < text.length; i++) {
        const textCharCode = text.charCodeAt(i);
        const keyCharCode = key.charCodeAt(i % key.length);
        const encryptedCharCode = (textCharCode + keyCharCode) % 256;
        hexOutput += encryptedCharCode.toString(16).padStart(2, '0');
    }
    return hexOutput;
};

/**
 * MOCK Serpent Decryption: Replaced with Vigenère Cipher decryption.
 * @param hexInput The encrypted hex string.
 * @param key The secret key (keyword).
 * @returns The decrypted text.
 */
export const serpentMockDecrypt = async (hexInput: string, key: string): Promise<string> => {
    if (!key) return hexInput;
    // Return early if not a valid hex string (e.g. attempting to decrypt unencrypted data)
    if (/[^0-9a-fA-F]/.test(hexInput) || hexInput.length % 2 !== 0) {
        return hexInput;
    }
    let textOutput = '';
    for (let i = 0; i < hexInput.length; i += 2) {
        const hex = hexInput.substring(i, i + 2);
        const encryptedCharCode = parseInt(hex, 16);
        const keyCharCode = key.charCodeAt((i / 2) % key.length);
        const originalCharCode = (encryptedCharCode - keyCharCode + 256) % 256;
        textOutput += String.fromCharCode(originalCharCode);
    }
    return textOutput;
};


/**
 * Super Encryption: Combines Atbash and Vigenère ciphers.
 * @param text The plaintext.
 * @param key The Vigenère key.
 * @returns The ciphertext (hex string from Vigenère).
 */
export const superEncrypt = async (text: string, key: string): Promise<string> => {
    const atbashResult = atbashCipher(text);
    return await serpentMockEncrypt(atbashResult, key);
};

/**
 * Super Decryption: Reverses the super encryption process.
 * @param ciphertext The hex ciphertext.
 * @param key The Vigenère key.
 * @returns The plaintext.
 */
export const superDecrypt = async (ciphertext: string, key: string): Promise<string> => {
    const serpentResult = await serpentMockDecrypt(ciphertext, key);
    return atbashCipher(serpentResult);
};

// --- Rail Fence Cipher (Byte-wise) ---

/**
 * Rail Fence Encryption: Encrypts file data using a byte-wise Rail Fence cipher.
 * Replaces the original ElGamal implementation.
 * @param fileBytes The content of the file as a Uint8Array.
 * @param key The number of rails, as a string.
 * @returns The encrypted file content as a Uint8Array.
 */
export const elgamalEncrypt = async (fileBytes: Uint8Array, key: string): Promise<Uint8Array> => {
    const rails = parseInt(key, 10);
    if (!key || isNaN(rails) || rails <= 1) {
        return fileBytes;
    }

    const fence: number[][] = Array.from({ length: rails }, () => []);
    let rail = 0;
    let direction = 1;

    for (const byte of fileBytes) {
        fence[rail].push(byte);
        rail += direction;
        if (rail === rails - 1 || rail === 0) {
            direction *= -1;
        }
    }

    const encryptedBytesList = fence.flat();
    return new Uint8Array(encryptedBytesList);
};

/**
 * Rail Fence Decryption: Decrypts file data from a byte-wise Rail Fence cipher.
 * Replaces the original ElGamal implementation.
 * @param encryptedBytes The encrypted file content as a Uint8Array.
 * @param key The number of rails, as a string.
 * @returns The original file content as a Uint8Array.
 */
export const elgamalDecrypt = async (encryptedBytes: Uint8Array, key: string): Promise<Uint8Array> => {
    const rails = parseInt(key, 10);
    if (!key || isNaN(rails) || rails <= 1) {
        return encryptedBytes;
    }

    const len = encryptedBytes.length;
    // Create a fence with null placeholders to map the structure
    const fence: (number | null)[][] = Array.from({ length: rails }, () => Array(len).fill(null));
    
    // Determine where bytes should go
    let rail = 0;
    let direction = 1;
    for (let i = 0; i < len; i++) {
        fence[rail][i] = 0; // Mark path with a placeholder
        rail += direction;
        if (rail === rails - 1 || rail === 0) {
            direction *= -1;
        }
    }

    // Fill the fence with the encrypted bytes row by row
    let index = 0;
    for (let r = 0; r < rails; r++) {
        for (let c = 0; c < len; c++) {
            if (fence[r][c] === 0) {
                fence[r][c] = encryptedBytes[index++];
            }
        }
    }
    
    // Read the fence in zig-zag order to decrypt
    const decryptedBytes: number[] = [];
    rail = 0;
    direction = 1;
    for (let i = 0; i < len; i++) {
        decryptedBytes.push(fence[rail][i]!);
        rail += direction;
        if (rail === rails - 1 || rail === 0) {
            direction *= -1;
        }
    }

    return new Uint8Array(decryptedBytes);
};


// --- Steganography (DCT Simulation using LSB) ---

// Converts a message string to a binary string.
const messageToBinary = (message: string): string => {
    return message.split('').map(char => {
        return char.charCodeAt(0).toString(2).padStart(8, '0');
    }).join('') + '1111111111111110'; // Delimiter
};

// Hides a binary message in the image data using Green and Blue channels.
const hideMessage = (imageData: ImageData, binaryMessage: string) => {
    const data = imageData.data;
    // 2 bits can be hidden per pixel (in G and B channels)
    if (binaryMessage.length > (data.length / 4) * 2) {
        throw new Error("Message is too long for this image.");
    }

    for (let i = 0; i < binaryMessage.length; i++) {
        const pixelIndex = Math.floor(i / 2) * 4;
        // i=0 -> channel=1 (G); i=1 -> channel=2 (B); i=2 -> channel=1 (G of next pixel)
        const channelIndex = 1 + (i % 2); 
        data[pixelIndex + channelIndex] = (data[pixelIndex + channelIndex] & 0xFE) | parseInt(binaryMessage[i], 2);
    }
    return imageData;
};

// Reveals a binary message from the image data using Green and Blue channels.
const revealMessage = (imageData: ImageData): string => {
    const data = imageData.data;
    let binaryMessage = '';
    for (let i = 0; i < data.length; i += 4) {
        // Extract LSB from Green channel
        binaryMessage += (data[i + 1] & 1);
        // Extract LSB from Blue channel
        binaryMessage += (data[i + 2] & 1);
    }

    const delimiterIndex = binaryMessage.indexOf('1111111111111110');
    if (delimiterIndex === -1) {
        return "No hidden message found.";
    }

    const extractedBinary = binaryMessage.substring(0, delimiterIndex);
    let message = '';
    for (let i = 0; i < extractedBinary.length; i += 8) {
        const byte = extractedBinary.substring(i, i + 8);
        if (byte.length === 8) {
            message += String.fromCharCode(parseInt(byte, 2));
        }
    }
    return message;
};

/**
 * MOCK DCT Steganography Hide: Simulates hiding a message in an image using LSB.
 * @param imageUrl The data URL of the cover image.
 * @param message The secret message to hide.
 * @returns A promise that resolves with the data URL of the stego-image.
 */
export const dctSteganographyHide = (imageUrl: string, message: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context.'));

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const binaryMessage = messageToBinary(message);

            try {
                const newImageData = hideMessage(imageData, binaryMessage);
                ctx.putImageData(newImageData, 0, 0);
                resolve(canvas.toDataURL());
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = () => reject(new Error('Failed to load image.'));
        img.src = imageUrl;
    });
};

/**
 * MOCK DCT Steganography Reveal: Simulates revealing a message from an image using LSB.
 * @param imageUrl The data URL of the stego-image.
 * @returns A promise that resolves with the hidden message.
 */
export const dctSteganographyReveal = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context.'));

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            try {
                const message = revealMessage(imageData);
                resolve(message);
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = () => reject(new Error('Failed to load image.'));
        img.src = imageUrl;
    });
};

// --- Helpers for Uint8Array <-> Base64 ---
export const bytesToBase64 = (bytes: Uint8Array): string => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

export const base64ToBytes = (base64: string): Uint8Array => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
